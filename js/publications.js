// ==================== Load and Render Publications ====================

async function loadPublications() {
  try {
    const response = await fetch('./data/publications.json');
    if (!response.ok) {
      throw new Error('Failed to load publications');
    }
    const data = await response.json();
    return data.publications;
  } catch (error) {
    console.error('Error loading publications:', error);
    return [];
  }
}

async function renderPublications(containerId, selectedOnly = false) {
  const publications = await loadPublications();
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // Filter publications if needed
  let publicationsToRender = selectedOnly
    ? publications.filter(pub => pub.selected)
    : publications;

  // Sort by year and month (newest first)
  const monthOrder = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  publicationsToRender = publicationsToRender.sort((a, b) => {
    // First sort by year (newest first)
    if (b.date.year !== a.date.year) {
      return b.date.year - a.date.year;
    }
    // If same year, sort by month (newest first)
    const monthA = monthOrder[a.date.month] || 0;
    const monthB = monthOrder[b.date.month] || 0;
    return monthB - monthA;
  });

  if (publicationsToRender.length === 0) {
    container.innerHTML = '<p>No publications found.</p>';
    return;
  }

  // Clear container
  container.innerHTML = '';

  // Render each publication
  publicationsToRender.forEach(pub => {
    const card = createPublicationCard(pub);
    container.appendChild(card);
  });
}

function createPublicationCard(publication) {
  const card = document.createElement('div');
  card.className = 'paper-card';

  // Build the authors string with Joël Mathys highlighted
  const authorsString = publication.authors
    .map(author => {
      if (author.includes('Joël Mathys') || author.includes('Joel Mathys')) {
        return `<strong>${author}</strong>`;
      }
      return author;
    })
    .join(', ');

  // Build the links
  let linksHTML = '';
  if (publication.arxiv) {
    linksHTML += `<a href="${publication.arxiv}" target="_blank" rel="noopener noreferrer">arXiv</a>`;
  }
  linksHTML += `<a href="#" onclick="toggleBibtex('${publication.id}'); return false;">BibTeX</a>`;

  // Use actual image if available, otherwise use mockup SVG
  let imageHTML = '';
  if (publication.image) {
    imageHTML = `<img src="${publication.image}" alt="${publication.title}" />`;
  } else {
    // Fallback mockup SVG image (book/document icon)
    imageHTML = `
      <svg class="paper-mockup-image" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
        <!-- Book/Paper shape -->
        <defs>
          <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#e8eef7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d0dde8;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Main paper/book body -->
        <rect x="30" y="30" width="140" height="220" fill="url(#paperGrad)" stroke="#6b7c99" stroke-width="2" rx="4"/>

        <!-- Spine -->
        <line x1="100" y1="30" x2="100" y2="250" stroke="#6b7c99" stroke-width="2" opacity="0.3"/>

        <!-- Header bar -->
        <rect x="30" y="30" width="140" height="40" fill="#4a5fa5" rx="4"/>

        <!-- Title lines (white text simulation) -->
        <line x1="45" y1="50" x2="155" y2="50" stroke="white" stroke-width="2.5"/>
        <line x1="45" y1="60" x2="125" y2="60" stroke="white" stroke-width="2"/>

        <!-- Content lines -->
        <line x1="45" y1="90" x2="155" y2="90" stroke="#6b7c99" stroke-width="1.5" opacity="0.6"/>
        <line x1="45" y1="105" x2="155" y2="105" stroke="#6b7c99" stroke-width="1.5" opacity="0.6"/>
        <line x1="45" y1="120" x2="145" y2="120" stroke="#6b7c99" stroke-width="1.5" opacity="0.6"/>

        <line x1="45" y1="150" x2="155" y2="150" stroke="#6b7c99" stroke-width="1.5" opacity="0.6"/>
        <line x1="45" y1="165" x2="155" y2="165" stroke="#6b7c99" stroke-width="1.5" opacity="0.6"/>
        <line x1="45" y1="180" x2="135" y2="180" stroke="#6b7c99" stroke-width="1.5" opacity="0.6"/>

        <!-- Accent corner -->
        <circle cx="150" cy="220" r="8" fill="#4a5fa5" opacity="0.2"/>
      </svg>
    `;
  }

  // Build the card HTML with flex layout
  const cardHTML = `
    <div class="paper-card-image">
      ${imageHTML}
    </div>
    <div class="paper-card-content">
      <h3>${publication.title}</h3>
      <div class="paper-authors">${authorsString}</div>
      <div class="paper-tldr">
        <strong>TLDR:</strong> ${publication.tldr}
      </div>
      <div class="paper-meta">
        <span><strong>${publication.conference}</strong></span>
        <span>${publication.date.month} ${publication.date.year}</span>
      </div>
      <div class="paper-links">
        ${linksHTML}
      </div>
      <div class="bibtex-section" id="bibtex-${publication.id}">
        <div class="bibtex-code">${publication.bibtex}</div>
        <button onclick="copyBibtex('${publication.id}')" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Copy</button>
      </div>
    </div>
  `;

  card.innerHTML = cardHTML;
  return card;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // For selected papers on home page
  const selectedPapersContainer = document.getElementById('selected-papers-container');
  if (selectedPapersContainer) {
    renderPublications('selected-papers-container', true);
  }

  // For all publications on publications page
  const allPublicationsContainer = document.getElementById('all-publications-container');
  if (allPublicationsContainer) {
    renderPublications('all-publications-container', false);
  }
});