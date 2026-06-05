document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach((item, index) => {
    item.style.animationDelay = `${Math.min(index * 40, 360)}ms`;
  });
});
