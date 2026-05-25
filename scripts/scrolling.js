document.addEventListener("DOMContentLoaded", () => {
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
});