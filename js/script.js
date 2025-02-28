document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('banner');
    const numStars = 20; 
  
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('span');
      star.classList.add('star');
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      banner.appendChild(star);
    }
  });
  