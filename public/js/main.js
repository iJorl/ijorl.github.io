// ==================== Set Current Year in Footer ====================
function setCurrentYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// ==================== Navigation ====================
document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  setCurrentYear();

  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      navMenu.classList.toggle('show');
      hamburger.classList.toggle('active');
    });
  }

  // Close menu when a link is clicked
  const navLinks = document.querySelectorAll('.nav-menu a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navMenu.classList.remove('show');
      if (hamburger) {
        hamburger.classList.remove('active');
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('nav')) {
      navMenu.classList.remove('show');
      if (hamburger) {
        hamburger.classList.remove('active');
      }
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Set active nav link based on current page
  setActiveNavLink();
});

// ==================== Set Active Navigation Link ====================
function setActiveNavLink() {
  const currentLocation = location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentLocation || (currentLocation === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ==================== Bibtex Toggle ====================
function toggleBibtex(paperId) {
  const bibtexSection = document.getElementById(`bibtex-${paperId}`);
  if (bibtexSection) {
    bibtexSection.classList.toggle('show');
  }
}

// ==================== Copy to Clipboard ====================
function copyBibtex(paperId) {
  const bibtexElement = document.querySelector(`#bibtex-${paperId} .bibtex-code`);
  if (bibtexElement) {
    const text = bibtexElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
      // Show feedback
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  }
}