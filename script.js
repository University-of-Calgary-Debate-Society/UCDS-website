async function renderBlogPosts() {
  const blogList = document.getElementById("blogList");
  if (!blogList) {
    return;
  }

  try {
    const response = await fetch("./data/blog-posts.json");
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
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 1rem; color: #7986cb;">Read Article</summary>
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

function initNewsletterForm() {
  const form = document.getElementById("newsletterForm");
  if (!form) {
    return;
  }

  const messageEl = document.getElementById("newsletterMessage");
  form.addEventListener("submit", event => {
    event.preventDefault();
    const email = form.elements["email"].value.trim();
    const name = form.elements["name"].value.trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      if (messageEl) {
        messageEl.textContent = "Please enter a valid email address.";
        messageEl.className = "form-message error";
      }
      return;
    }

    const signup = { email, name: name || null, date: new Date().toISOString() };
    const stored = window.localStorage.getItem("ucdsNewsletterSignups");
    const signups = stored ? JSON.parse(stored) : [];
    signups.push(signup);
    window.localStorage.setItem("ucdsNewsletterSignups", JSON.stringify(signups));

    if (messageEl) {
      messageEl.textContent = "Thank you! Your newsletter signup has been recorded locally.";
      messageEl.className = "form-message success";
    }
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("currentYear");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  renderBlogPosts();
  initNewsletterForm();
});
