import os
import sys
import asyncio
import discord
from datetime import datetime, timezone
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

def init_firebase():
    """
    Initialize Firebase Admin SDK using the key file specified in .env,
    or falls back to default environment paths.
    """
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY") or "firebase-service-account.json"
    
    # Try using the key file path
    if os.path.exists(key_path):
        print(f"Initializing Firebase with service account key: {key_path}")
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credential discovery
        try:
            print("No service account key file found. Attempting Application Default Credentials...")
            firebase_admin.initialize_app()
        except Exception as e:
            print("CRITICAL ERROR: Failed to initialize Firebase Admin SDK.")
            print(f"Make sure {key_path} exists or GOOGLE_APPLICATION_CREDENTIALS is set.")
            print(f"Details: {e}")
            sys.exit(1)
            
    return firestore.client()

class UCDSDiscordBot(discord.Client):
    def __init__(self, *args, **kwargs):
        # Default intents are sufficient for sending embeds and do not require privileged portal settings.
        intents = discord.Intents.default()
        super().__init__(intents=intents, *args, **kwargs)
        self.db = None
        self.channel_id = None
        self.listener = None
        self.processed_docs = set() # Prevent double-posting in-memory

    async def on_ready(self):
        print("=========================================================")
        print(f"Logged in as {self.user} (ID: {self.user.id})")
        print("=========================================================")
        
        channel_id_env = os.getenv("DISCORD_CHANNEL_ID")
        if not channel_id_env:
            print("CRITICAL ERROR: DISCORD_CHANNEL_ID is not configured in .env.")
            await self.close()
            return
            
        try:
            self.channel_id = int(channel_id_env)
        except ValueError:
            print(f"CRITICAL ERROR: DISCORD_CHANNEL_ID '{channel_id_env}' is not a valid integer.")
            await self.close()
            return
            
        print(f"Target Discord Channel ID: {self.channel_id}")
        
        # Verify channel access
        channel = self.get_channel(self.channel_id)
        if not channel:
            try:
                channel = await self.fetch_channel(self.channel_id)
            except Exception as e:
                print(f"WARNING: Could not fetch channel {self.channel_id} during startup. Details: {e}")
                print("Make sure the bot has permissions to access this channel.")
        
        if channel:
            print(f"Verified access to channel: #{channel.name} (Guild: {channel.guild.name})")
            
        # Initialize Firestore and start listener
        self.db = firestore.client()
        self.start_firestore_listener()

    def start_firestore_listener(self):
        print("Starting Firestore real-time listener on 'posts' collection...")
        
        posts_ref = self.db.collection('posts')
        query = posts_ref.where('type', '==', 'instagram')
        
        def on_snapshot(col_snapshot, changes, read_time):
            for change in changes:
                doc = change.document
                doc_id = doc.id
                data = doc.to_dict()
                
                platforms = data.get('platforms', [])
                discord_posted = data.get('discord_posted', False)
                discord_needs_edit = data.get('discord_needs_edit', False)
                
                if 'discord' in platforms:
                    if not discord_posted:
                        # Run publishing function on the client loop thread-safely
                        asyncio.run_coroutine_threadsafe(
                            self.publish_post(doc_id, data),
                            self.loop
                        )
                    elif discord_needs_edit:
                        # Run edit function on the client loop thread-safely
                        asyncio.run_coroutine_threadsafe(
                            self.edit_post(doc_id, data),
                            self.loop
                        )
        
        try:
            self.listener = query.on_snapshot(on_snapshot)
            print("Firestore real-time listener is now ACTIVE and waiting for updates.")
        except Exception as e:
            print(f"CRITICAL ERROR starting Firestore listener: {e}")
            asyncio.run_coroutine_threadsafe(self.close(), self.loop)

    async def publish_post(self, doc_id, data):
        # Prevent double processing
        if doc_id in self.processed_docs:
            return
        self.processed_docs.add(doc_id)
        
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Detected new/pending post for Discord:")
        print(f"  Post ID: {doc_id}")
        print(f"  Caption: {data.get('caption', '')[:60]}...")
        
        try:
            # Determine channel ID to use (falls back to configured default self.channel_id)
            target_channel_id = self.channel_id
            doc_channel_id = data.get('discord_channel_id')
            if doc_channel_id:
                try:
                    target_channel_id = int(doc_channel_id)
                    print(f"  Using custom channel ID: {target_channel_id}")
                except ValueError:
                    print(f"  Warning: Custom discord_channel_id '{doc_channel_id}' is not a valid integer. Falling back to default.")
            
            channel = self.get_channel(target_channel_id)
            if not channel:
                channel = await self.fetch_channel(target_channel_id)
                
            if not channel:
                print(f"  ERROR: Target channel {target_channel_id} not found/accessible.")
                self.processed_docs.discard(doc_id)
                return
                
            title = data.get('title', '')
            caption = data.get('caption', '')
            image_urls = data.get('imageUrls', [])
            if not isinstance(image_urls, list):
                image_urls = []
            if not image_urls:
                legacy_url = data.get('imageUrl')
                if legacy_url:
                    image_urls = [legacy_url]

            # Construct native message body
            content_parts = []
            if title:
                content_parts.append(f"**{title}**\n")
            if caption:
                content_parts.append(caption)
            if image_urls:
                # Add image URLs at the end on separate lines
                content_parts.append("\n" + "\n".join(image_urls))
                
            message_body = "\n".join(content_parts)
            
            # Send native message
            message = await channel.send(content=message_body)
            print(f"  Successfully posted native message to Discord. Message ID: {message.id}")
            
            # Update Firestore
            doc_ref = self.db.collection('posts').document(doc_id)
            doc_ref.update({
                'discord_posted': True,
                'discord_post_id': str(message.id),
                'discord_posted_at': datetime.now(timezone.utc).isoformat()
            })
            print(f"  Successfully updated Firestore post {doc_id} as discord_posted=True.")
            self.processed_docs.discard(doc_id)
            
        except Exception as e:
            print(f"  ERROR processing and publishing post {doc_id}: {e}")
            self.processed_docs.discard(doc_id)

    async def edit_post(self, doc_id, data):
        # Prevent double processing in memory
        edit_key = f"edit_{doc_id}"
        if edit_key in self.processed_docs:
            return
        self.processed_docs.add(edit_key)
        
        discord_post_id = data.get('discord_post_id')
        if not discord_post_id:
            print(f"  Warning: Cannot edit post {doc_id} on Discord because discord_post_id is missing.")
            self.processed_docs.discard(edit_key)
            return

        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Detected edited post for Discord:")
        print(f"  Post ID: {doc_id}")
        print(f"  Message ID: {discord_post_id}")
        print(f"  New Caption: {data.get('caption', '')[:60]}...")
        
        try:
            # Determine channel ID
            target_channel_id = self.channel_id
            doc_channel_id = data.get('discord_channel_id')
            if doc_channel_id:
                try:
                    target_channel_id = int(doc_channel_id)
                except ValueError:
                    pass
            
            channel = self.get_channel(target_channel_id)
            if not channel:
                channel = await self.fetch_channel(target_channel_id)
                
            if not channel:
                print(f"  ERROR: Target channel {target_channel_id} not found/accessible for edit.")
                self.processed_docs.discard(edit_key)
                return
                
            # Fetch message
            try:
                message = await channel.fetch_message(int(discord_post_id))
            except Exception as e:
                print(f"  ERROR: Could not fetch message {discord_post_id} from channel. Details: {e}")
                self.processed_docs.discard(edit_key)
                return

            title = data.get('title', '')
            caption = data.get('caption', '')
            image_urls = data.get('imageUrls', [])
            if not isinstance(image_urls, list):
                image_urls = []
            if not image_urls:
                legacy_url = data.get('imageUrl')
                if legacy_url:
                    image_urls = [legacy_url]
                    
            # Construct native message body
            content_parts = []
            if title:
                content_parts.append(f"**{title}**\n")
            if caption:
                content_parts.append(caption)
            if image_urls:
                content_parts.append("\n" + "\n".join(image_urls))
                
            message_body = "\n".join(content_parts)
                    
            # Edit the message
            await message.edit(content=message_body)
            print(f"  Successfully edited native message {discord_post_id} on Discord.")
            
            # Update Firestore: reset the edit flag
            doc_ref = self.db.collection('posts').document(doc_id)
            doc_ref.update({
                'discord_needs_edit': False,
                'discord_edited_at': datetime.now(timezone.utc).isoformat()
            })
            print(f"  Successfully reset discord_needs_edit=False in Firestore.")
            self.processed_docs.discard(edit_key)
            
        except Exception as e:
            print(f"  ERROR editing post {doc_id}: {e}")
            self.processed_docs.discard(edit_key)

    async def close(self):
        if self.listener:
            try:
                print("Stopping Firestore listener...")
                self.listener.unsubscribe()
            except Exception as e:
                print(f"Error stopping listener: {e}")
        await super().close()

def main():
    # Load .env file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(script_dir, ".env"))
    
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token or token == "your_discord_bot_token_here":
        print("CRITICAL CONFIGURATION ERROR: Missing required DISCORD_BOT_TOKEN.")
        print("Please configure DISCORD_BOT_TOKEN in your '.env' file.")
        sys.exit(1)
        
    init_firebase()
    
    bot = UCDSDiscordBot()
    
    print("=========================================================")
    print("      UCDS Firestore-to-Discord Publisher Daemon         ")
    print("=========================================================")
    print("Starting bot client connection...")
    
    try:
        bot.run(token)
    except KeyboardInterrupt:
        print("\nBot daemon terminated by user. Exiting.")
    except Exception as e:
        print(f"Fatal error running bot: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
