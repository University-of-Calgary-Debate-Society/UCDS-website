document.addEventListener("DOMContentLoaded", () => {
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
});