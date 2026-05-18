const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const FOLDER_ID = '12Ham6E803pCxPLbzrR-HERs4pIbj7z7a';
const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_DRIVE_API_KEY environment variable is not set.");
  process.exit(1);
}

const drive = google.drive({
  version: 'v3',
  auth: API_KEY,
});

async function syncBlogPosts() {
  try {
    console.log(`Fetching files from Google Drive folder: ${FOLDER_ID}`);
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      orderBy: 'createdTime desc'
    });

    const files = res.data.files;
    if (!files || files.length === 0) {
      console.log('No blog posts found.');
      // Keep empty array
      fs.writeFileSync(path.join(__dirname, '../data/blog-posts.json'), JSON.stringify([]));
      return;
    }

    console.log(`Found ${files.length} blog posts. Fetching content...`);
    const blogPosts = [];

    for (const file of files) {
      console.log(`Exporting: ${file.name}`);
      try {
        const exportRes = await drive.files.export({
          fileId: file.id,
          mimeType: 'text/html',
        }, { responseType: 'text' });

        const html = exportRes.data;
        const $ = cheerio.load(html);

        // Google docs html usually wraps content in body -> span/p/etc.
        // We want to extract the body content, clean it up slightly, and store it.
        // We'll extract a plain text summary from the first meaningful paragraph.
        let summary = '';
        $('p').each((i, el) => {
          const text = $(el).text().trim();
          if (text.length > 20 && !summary) {
            summary = text.substring(0, 150) + '...';
          }
        });

        // Remove html/head/body tags and keep the inner HTML of body.
        // Google docs inline styles are preserved to maintain formatting.
        const bodyHtml = $('body').html();

        blogPosts.push({
          id: file.id,
          title: file.name,
          date: file.createdTime.split('T')[0], // YYYY-MM-DD format
          summary: summary || "Read more about this post...",
          content: bodyHtml
        });
      } catch (err) {
        console.error(`Failed to export file ${file.name} (${file.id}):`, err.message);
      }
    }

    // Sort by date descending
    blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const outputPath = path.join(__dirname, '../data/blog-posts.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(blogPosts, null, 2));
    
    console.log(`Successfully synced ${blogPosts.length} posts to data/blog-posts.json`);

  } catch (error) {
    console.error('Error syncing blog posts:', error.message);
    process.exit(1);
  }
}

syncBlogPosts();
