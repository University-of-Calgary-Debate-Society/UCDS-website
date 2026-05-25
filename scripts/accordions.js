document.addEventListener("DOMContentLoaded", () => {
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
});