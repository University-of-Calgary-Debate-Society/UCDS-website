async function renderBlogPosts() {
  const blogList = document.getElementById("blogList");
  if (!blogList) {
    return;
  }

  try {
    let basePath = './';
    if (document.querySelector('script[src="../scripts/blog.js"]')) basePath = '../';
    else if (document.querySelector('script[src="../../scripts/blog.js"]')) basePath = '../../';
    
    const response = await fetch(basePath + "data/blog-posts.json");
    if (!response.ok) throw new Error("Could not fetch blog posts");
    const blogPosts = await response.json();

    if (blogPosts.length === 0) {
      blogList.innerHTML = "<p class=\"section-copy\">No blog posts are available at the moment. Check back later for updates.</p>";
      return;
    }

    blogList.innerHTML = blogPosts
      .map(
        post => `
        <article class="card blog-card" style="margin-bottom: 2rem;">
          <div class="blog-meta">
            <span class="blog-date">${post.date}</span>
          </div>
          <h3>${post.title}</h3>
          <details>
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 1rem; color: #3b82f6;">Read Article</summary>
            <div class="blog-content" style="margin-top: 1rem; line-height: 1.6;">
              ${post.content || post.summary}
            </div>
          </details>
        </article>`
      )
      .join("");
  } catch (error) {
    console.error("Error loading blog posts:", error);
    blogList.innerHTML = "<p class=\"section-copy\">Unable to load blog posts at this time.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderBlogPosts();
});
