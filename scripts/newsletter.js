document.addEventListener("DOMContentLoaded", () => {
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
});