// style.js - adds gentle floating animation to decorative circles and scroll behavior
(function(){
  const circles = document.querySelectorAll('.circle');

  // apply random offset animation to each circle to mimic floating dots
  circles.forEach((c, i) => {
    const speed = 6 + Math.random() * 8; // seconds
    const rangeX = 6 + Math.random() * 20; // px
    const rangeY = 6 + Math.random() * 20; // px

    c.style.transition = `transform ${speed}s ease-in-out`;

    let dir = 1;
    function animate(){
      const tx = (Math.random() * rangeX - rangeX/2) * dir;
      const ty = (Math.random() * rangeY - rangeY/2) * dir;
      c.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
      dir *= -1;
      // randomize next interval a bit
      setTimeout(animate, speed * 1000 + Math.random() * 1200);
    }

    // slight initial delay for staggered effect
    setTimeout(animate, i * 150);
  });

  // Smooth scroll when clicking the scroll-down button
  const btn = document.querySelector('.scroll-down');
  const next = document.getElementById('next');
  if(btn && next){
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      next.scrollIntoView({behavior:'smooth'});
    });
  }
})();
