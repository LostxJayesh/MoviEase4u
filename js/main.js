// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const contentGrids = {
    all: document.getElementById('allGrid'),
    movies: document.getElementById('moviesGrid'),
    series: document.getElementById('seriesGrid'),
    anime: document.getElementById('animeGrid')
};
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const navContent = document.querySelector('.nav-content');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadAndOrganizeContent();
    setupEventListeners();
    setupMobileMenu();
    // Show all section by default
    showSection('all');
});

// Setup Event Listeners
function setupEventListeners() {
    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.target.closest('a').getAttribute('href');
            const type = href.replace('#', '').replace('Section', '');
            showSection(type);
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.target.closest('a').classList.add('active');
        });
    });
}

// Setup Mobile Menu
function setupMobileMenu() {
    mobileMenuIcon?.addEventListener('click', () => {
        navContent.classList.toggle('active');
        const icon = mobileMenuIcon.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navContent.contains(e.target) && !mobileMenuIcon.contains(e.target) && navContent.classList.contains('active')) {
            navContent.classList.remove('active');
            const icon = mobileMenuIcon.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navContent.classList.remove('active');
                const icon = mobileMenuIcon.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });
}

// Load and Organize Content
function loadAndOrganizeContent() {
    try {
        const content = JSON.parse(localStorage.getItem('content')) || [];
        console.log('Raw content:', content); // Debug log

        const organizedContent = {
            all: [],
            movies: [],
            series: [],
            anime: []
        };

        // Filter and organize active content by type
        content.forEach(item => {
            if (item.status === 'active') {
                // Normalize the type
                const normalizedType = normalizeContentType(item.type);
                console.log(`Processing item: ${item.title}, Type: ${item.type}, Normalized: ${normalizedType}`); // Debug log

                // Add to all section
                organizedContent.all.push(item);
                
                // Add to specific type section
                if (organizedContent[normalizedType]) {
                    organizedContent[normalizedType].push(item);
                }
            }
        });

        // Sort each category by date added (newest first)
        Object.keys(organizedContent).forEach(type => {
            organizedContent[type].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            console.log(`${type} section has ${organizedContent[type].length} items`); // Debug log
            displayContent(type, organizedContent[type]);
        });

    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Error loading content', 'error');
    }
}

// Normalize content type
function normalizeContentType(type) {
    if (!type) return 'movies'; // Default to movies if type is missing

    const normalizedType = type.toLowerCase().trim();
    
    // Map common variations to standard types
    const typeMap = {
        'movie': 'movies',
        'movies': 'movies',
        'film': 'movies',
        'films': 'movies',
        'series': 'series',
        'tv': 'series',
        'tv series': 'series',
        'show': 'series',
        'tv show': 'series',
        'anime': 'anime',
        'animation': 'anime'
    };

    return typeMap[normalizedType] || 'movies'; // Default to movies if type is unknown
}

// Display Content
function displayContent(type, items) {
    const grid = contentGrids[type];
    if (!grid) {
        console.error(`Grid not found for type: ${type}`);
        return;
    }

    console.log(`Displaying ${items.length} items for ${type}`);

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="no-content">
                <i class="fas fa-film"></i>
                <p>No ${type} available</p>
            </div>
        `;
        return;
    }

    const contentHTML = items.map(item => {
        // Ensure poster URL uses HTTPS
        const posterUrl = item.poster ? item.poster.replace('http:', 'https:') : 'images/default-poster.jpg';
        
        return `
        <div class="content-card" data-aos="fade-up">
            <div class="card-poster">
                <img src="${posterUrl}" 
                     alt="${item.title}" 
                     onerror="this.onerror=null; this.src='images/default-poster.jpg';"
                     loading="lazy">
                <div class="card-overlay">
                    <div class="overlay-content">
                        <span class="rating">
                            <i class="fas fa-star"></i>
                            ${item.rating || 'N/A'}
                        </span>
                        <a href="${item.downloadLink}" class="download-btn" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-download"></i>
                            Download
                        </a>
                    </div>
                </div>
            </div>
            <div class="card-content">
                <div class="content-info">
                    <span class="type-badge">${item.type}</span>
                    <span class="quality-badge">${item.quality || 'HD'}</span>
                </div>
                <h3 class="title" title="${item.title}">${item.title}</h3>
                <div class="meta-info">
                    <span class="year">${item.year || 'N/A'}</span>
                    <span class="duration">${item.duration || 'N/A'}</span>
                </div>
                <div class="genre-tags">
                    ${(item.genre || '').split(',').slice(0, 2).map(genre => 
                        `<span class="genre-badge">${genre.trim()}</span>`
                    ).join('')}
                </div>
                <p class="description">${item.description || 'No description available.'}</p>
            </div>
        </div>
    `}).join('');

    grid.innerHTML = contentHTML;
}

// Show Section
function showSection(type) {
    console.log('Showing section:', type);
    
    // Hide all sections
    Object.keys(contentGrids).forEach(section => {
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.style.display = 'none';
        }
    });

    // Show selected section
    const selectedSection = document.getElementById(`${type}Section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    } else {
        console.error(`Section not found: ${type}Section`);
    }
}

// Handle Search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    try {
        const content = JSON.parse(localStorage.getItem('content')) || [];
        const organizedContent = {
            all: [],
            movies: [],
            series: [],
            anime: []
        };

        if (!searchTerm) {
            loadAndOrganizeContent();
            return;
        }

        // Filter and organize content by search term and type
        content.forEach(item => {
            if (item.status === 'active' && (
                item.title.toLowerCase().includes(searchTerm) ||
                (item.genre || '').toLowerCase().includes(searchTerm) ||
                (item.plot || item.description || '').toLowerCase().includes(searchTerm)
            )) {
                // Normalize the type
                const normalizedType = normalizeContentType(item.type);
                
                // Add to all section
                organizedContent.all.push(item);
                
                // Add to specific type section
                if (organizedContent[normalizedType]) {
                    organizedContent[normalizedType].push(item);
                }
            }
        });

        // Display filtered content for each type
        Object.keys(organizedContent).forEach(type => {
            displayContent(type, organizedContent[type]);
        });

        // Show all sections when searching
        Object.keys(contentGrids).forEach(section => {
            const sectionElement = document.getElementById(`${section}Section`);
            if (sectionElement) {
                sectionElement.style.display = 'block';
            }
        });
    } catch (error) {
        console.error('Error searching content:', error);
        showToast('Error searching content', 'error');
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' : 
                       'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
