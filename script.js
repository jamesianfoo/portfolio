// Mobile menu toggle
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

navToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);

  // Animate hamburger to X
  const spans = navToggle.querySelectorAll('span');
  if (isOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    document.body.style.overflow = 'hidden';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
    document.body.style.overflow = '';
  }
});

// Scroll-based fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Apply fade-in to elements
document.querySelectorAll('.project-card, .hero-title, .hero-subtitle, .cta-title, .cta-link').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Stagger project card animations
document.querySelectorAll('.project-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.1}s`;
});

// Smooth scroll for back-to-top
document.querySelector('.back-to-top')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
