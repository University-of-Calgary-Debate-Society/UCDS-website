const fs = require('fs');
const path = require('path');

const srcCode = fs.readFileSync('script.js', 'utf8');

const pieces = {};

pieces['blog.js'] = `async function renderBlogPosts() {
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
      blogList.innerHTML = "<p class=\\"section-copy\\">No blog posts are available at the moment. Check back later for updates.</p>";
      return;
    }

    blogList.innerHTML = blogPosts
      .map(
        post => \`
        <article class="card blog-card" style="margin-bottom: 2rem;">
          <div class="blog-meta">
            <span class="blog-date">\${post.date}</span>
          </div>
          <h3>\${post.title}</h3>
          <details>
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 1rem; color: #3b82f6;">Read Article</summary>
            <div class="blog-content" style="margin-top: 1rem; line-height: 1.6;">
              \${post.content || post.summary}
            </div>
          </details>
        </article>\`
      )
      .join("");
  } catch (error) {
    console.error("Error loading blog posts:", error);
    blogList.innerHTML = "<p class=\\"section-copy\\">Unable to load blog posts at this time.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderBlogPosts();
});
`;

pieces['utils.js'] = `document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("currentYear");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Development Warning Banner
  const devWarning = document.createElement('div');
  devWarning.className = 'dev-warning';
  devWarning.innerHTML = \`
    <div class="dev-warning-icon">!</div>
    <div class="dev-warning-text">This website is still under development, not all functions may be working.</div>
  \`;
  document.body.appendChild(devWarning);

  setTimeout(() => {
    devWarning.classList.add('fade-out');
    setTimeout(() => devWarning.remove(), 500); // Remove from DOM after transition
  }, 5000);
});
`;

pieces['animations.js'] = `document.addEventListener("DOMContentLoaded", () => {
  // Animation Toggle Logic
  const toggleAnimationsBtn = document.getElementById('toggleAnimationsBtn');
  
  function applyAnimationPreference() {
    const isAnimationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    if (isAnimationsDisabled) {
      document.body.classList.add('no-animations');
      document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
      if (toggleAnimationsBtn) toggleAnimationsBtn.textContent = 'Enable Animations';
    } else {
      document.body.classList.remove('no-animations');
      if (toggleAnimationsBtn) toggleAnimationsBtn.textContent = 'Disable Animations';
    }
  }

  applyAnimationPreference();

  if (toggleAnimationsBtn) {
    toggleAnimationsBtn.addEventListener('click', () => {
      const isAnimationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
      localStorage.setItem('animationsDisabled', !isAnimationsDisabled);
      applyAnimationPreference();
    });
  }

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observerInstance.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
});`;

pieces['scrolling.js'] = `document.addEventListener("DOMContentLoaded", () => {
  // Smoothly scroll down to section if navigating via an anchor link on page load
  const isAnimationsDisabledOnLoad = localStorage.getItem('animationsDisabled') === 'true';
  if (window.location.hash && !isAnimationsDisabledOnLoad) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      window.scrollTo(0, 0); // Start at the top during fade-in
      setTimeout(() => {
        // Temporarily disable CSS smooth scrolling to avoid jitter with custom animation
        document.documentElement.style.scrollBehavior = 'auto';
        
        const startPosition = window.scrollY;
        const targetPosition = target.getBoundingClientRect().top + startPosition;
        const distance = targetPosition - startPosition;
        const duration = 1200; // Slower scroll duration in milliseconds (1.2 seconds)
        let start = null;

        function step(timestamp) {
          if (!start) start = timestamp;
          const progress = timestamp - start;
          const percentage = Math.min(progress / duration, 1);
          
          // Ease-in-out easing function for smooth deceleration
          const ease = percentage < 0.5 ? 2 * percentage * percentage : 1 - Math.pow(-2 * percentage + 2, 2) / 2;
          
          window.scrollTo(0, startPosition + distance * ease);
          
          if (progress < duration) {
            window.requestAnimationFrame(step);
          } else {
            document.documentElement.style.scrollBehavior = ''; // Restore default
          }
        }
        
        window.requestAnimationFrame(step);
      }, 400); // Trigger scroll midway through the fade-in animation
    }
  }
});`;

pieces['newsletter.js'] = `document.addEventListener("DOMContentLoaded", () => {
  // Newsletter Modal Logic
  const modal = document.getElementById('newsletter-modal');
  const openBtn = document.getElementById('openNewsletter');
  const closeBtn = document.getElementById('closeNewsletter');

  if (modal) {
    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(); // Close if user clicks outside the modal
    });
  }
});`;

pieces['accordions.js'] = `document.addEventListener("DOMContentLoaded", () => {
  // Smooth opening/closing transitions for all accordion dropdowns
  document.addEventListener('click', function(e) {
    const summary = e.target.closest('summary');
    if (!summary) return;
    
    const details = summary.parentElement;
    if (!details || details.tagName !== 'DETAILS') return;
    
    e.preventDefault();
    
    if (details.open) {
      // Trigger close animation
      details.classList.add('closing');
      setTimeout(() => {
        details.open = false;
        details.classList.remove('closing');
      }, 400);
    } else {
      // Close other open details in the same group
      const parentGroup = details.closest('.profile-details');
      if (parentGroup) {
        const siblings = parentGroup.querySelectorAll('details');
        siblings.forEach(other => {
          if (other !== details && other.open && !other.classList.contains('closing')) {
            other.classList.add('closing');
            setTimeout(() => {
              other.open = false;
              other.classList.remove('closing');
            }, 400);
          }
        });
      }
      
      // Open this one
      details.open = true;
    }
  });
});`;

pieces['audio.js'] = `document.addEventListener("DOMContentLoaded", () => {
  // Join page background audio setup
  const backgroundAudio = document.getElementById('background-audio');
  const layerAudio = document.getElementById('layer-audio');
  const layerAudio3 = document.getElementById('layer-audio-3');
  const easterEggAudio = document.getElementById('easter-egg-audio');
  if (backgroundAudio) {
    backgroundAudio.volume = 0.05; // Very quiet and ambient
    if (layerAudio) layerAudio.volume = 0; // Start layered audio completely silent
    if (layerAudio3) layerAudio3.volume = 0; // Start third layer completely silent
    if (easterEggAudio) easterEggAudio.volume = 0;

    const playAudio = () => {
      backgroundAudio.play().catch(error => {
        console.log("Background audio playback was prevented by the browser.");
      });
      if (layerAudio) layerAudio.play().catch(e => {});
      if (layerAudio3) layerAudio3.play().catch(e => {});
      if (easterEggAudio) easterEggAudio.play().catch(e => {});
    };

    playAudio();
    ['click', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, playAudio, { once: true });
    });
  }
});`;

let specialBtnCode = srcCode.split('// Special Join Button Wobble Logic')[1].split('// Development Warning Banner')[0];

pieces['special-button.js'] = `document.addEventListener("DOMContentLoaded", () => {
  // Special Join Button Wobble Logic
  ` + specialBtnCode + `
});`;

if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts');
}

for (const [name, content] of Object.entries(pieces)) {
  fs.writeFileSync(path.join('scripts', name), content);
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = findHtmlFiles('.');
const scriptNames = Object.keys(pieces);

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  
  const regex = /<script\\s+src="([^"]*?)script\\.js"><\\/script>/g;
  
  content = content.replace(regex, (match, prefix) => {
    let tags = scriptNames.map(name => \`<script src="\${prefix}scripts/\${name}"></script>\`).join('\\n  ');
    return tags;
  });

  fs.writeFileSync(file, content);
}

// remove original script.js
if (fs.existsSync('script.js')) {
    fs.unlinkSync('script.js');
}

console.log('Successfully extracted scripts and updated HTML files.');
