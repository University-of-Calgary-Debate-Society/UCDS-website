document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("currentYear");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Development Warning Banner
  const devWarning = document.createElement('div');
  devWarning.className = 'dev-warning';
  devWarning.innerHTML = `
    <div class="dev-warning-icon">!</div>
    <div class="dev-warning-text">This website is still under development, not all functions may be working.</div>
  `;
  document.body.appendChild(devWarning);

  setTimeout(() => {
    devWarning.classList.add('fade-out');
    setTimeout(() => devWarning.remove(), 500); // Remove from DOM after transition
  }, 5000);
});
