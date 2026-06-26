import { Link } from 'react-router-dom';

export default function DiscordTermsAndPrivacy() {
  return (
    <main>
      <section className="section" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(17, 40, 84, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '1.5rem',
            padding: '3rem 2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle glow background */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: '#0ea5e9',
              filter: 'blur(60px)',
              opacity: 0.15,
              pointerEvents: 'none'
            }}></div>

            <div style={{ textAlign: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.5rem' }}>
              <span style={{ 
                fontSize: '0.85rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em', 
                color: '#60a5fa', 
                fontWeight: 700,
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Legal Documentation
              </span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Discord Bot Terms & Privacy Policy
              </h1>
              <p style={{ color: '#94a3b8', margin: '0.75rem 0 0', fontSize: '0.95rem' }}>
                Last Updated: June 25, 2026
              </p>
            </div>

            <div style={{ 
              color: '#cbd5e1', 
              fontSize: '1rem', 
              lineHeight: '1.75', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem',
              maxHeight: '55vh',
              overflowY: 'auto',
              paddingRight: '1.25rem',
              margin: '0 0 2.5rem'
            }}>
              <p>
                This document sets forth both the <strong>Terms of Service</strong> and the <strong>Privacy Policy</strong> for the <strong>University of Calgary Debate Society (UCDS) Discord Bot</strong> (the &quot;Bot&quot;). By inviting the Bot to your Discord server or utilizing its automated announcements feed, you agree to the conditions detailed below.
              </p>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1rem 0' }} />

              {/* TERMS OF SERVICE SECTION */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>Terms of Service</h2>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>1. Scope of Service</h3>
              <p>
                The Bot functions as a read-only broadcast mechanism. It monitors the UCDS Firebase Firestore database and pushes pre-approved website updates (such as tournament notifications and announcements) to a selected server channel designated by your administrator. It does not possess commands for regular members, moderation controls, or interactive user games.
              </p>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>2. Server Eligibility & Installation</h3>
              <p>
                By inviting the Bot, you confirm that you are either the server owner or hold the necessary administrative permissions (such as &quot;Manage Webhooks&quot; or &quot;Manage Channels&quot;) to integrate external app notifications.
              </p>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>3. Acceptable Use</h3>
              <p>
                You agree not to spam, intercept, spoof payloads, or exploit the Bot's communication protocols. Any attempt to send unauthorized posts, bypass editor access restrictions, or use the Bot for spam/malicious actions will result in immediate API blocking and termination of service for your guild.
              </p>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>4. Termination & Availability</h3>
              <p>
                We provide the Bot on an &quot;as-is&quot; and &quot;as-available" basis. UCDS makes no warranties regarding the uptime, speed, or reliability of the bot. We reserve the right to modify, suspend, or terminate the Bot or update these terms at any time without prior notice.
              </p>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1.5rem 0' }} />

              {/* PRIVACY POLICY SECTION */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>Privacy Policy</h2>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>1. Data We Collect</h3>
              <p>
                Our data collection principles are extremely strict. We only save configuration parameters necessary for delivery:
              </p>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Guild ID & Channel ID:</strong> The numeric Discord identifiers for your server and target text channel to deliver message payloads correctly.</li>
                <li><strong>Webhook Parameters:</strong> The secure endpoint reference utilized to post message embeds to your channel.</li>
              </ul>
              <p>
                We do **NOT** read, record, collect, or store:
              </p>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Member list databases, avatars, or usernames.</li>
                <li>Text transcripts, logs, or chat histories of channels where the Bot is present.</li>
                <li>Private user profiles or Discord account statistics.</li>
              </ul>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>2. How We Use Data</h3>
              <p>
                We use the Guild and Channel IDs solely to transmit formatting bundles (embedded announcements) when a UCDS executive hits &quot;Publish&quot; on the website portal. Data is never analyzed, sold, or shared with third parties.
              </p>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>3. Security & Access Control</h3>
              <p>
                All stored configuration items are saved in an encrypted Cloud Firestore cluster. Access to these values is restricted to authorized executive officers.
              </p>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>4. Data Deletion</h3>
              <p>
                If you kick or ban the Bot from your Discord server, or delete the target channel, your configuration data automatically becomes inactive. You can request absolute deletion of all your server IDs from our Firestore database at any time by contacting us.
              </p>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>5. Contact & Inquiries</h3>
              <p>
                For legal inquiries, terms compliance questions, or data purge requests, contact the UCDS board at <a href="mailto:ucds.debate@gmail.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>ucds.debate@gmail.com</a>.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
              <Link to="/void/discord" style={{ 
                padding: '0.85rem 2.25rem', 
                borderRadius: '999px', 
                fontWeight: 600, 
                border: '1px solid rgba(255, 255, 255, 0.12)', 
                cursor: 'pointer', 
                background: 'rgba(255, 255, 255, 0.08)', 
                color: '#ffffff', 
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}>
                Back to Invite
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
