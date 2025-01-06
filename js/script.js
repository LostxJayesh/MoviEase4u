// API Configuration
const OMDB_API_KEY = 'caeba859';
const OMDB_API_URL = 'https://www.omdbapi.com/';

// DOM Elements
const searchInput = document.getElementById('search');
const latestGrid = document.getElementById('latest-grid');
const moviesGrid = document.getElementById('movies-grid');
const animeGrid = document.getElementById('anime-grid');
const seriesGrid = document.getElementById('series-grid');

// Initialize content when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAllContent();
    setupEventListeners();
});

// Fetch movie details from OMDB API
async function fetchMovieDetails(title) {
    try {
        const response = await fetch(`${OMDB_API_URL}?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
            return {
                poster: data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450',
                year: data.Year,
                rating: data.imdbRating,
                genre: data.Genre.split(', ')[0],
                plot: data.Plot
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}

// Load all content
async function loadAllContent() {
    const content = JSON.parse(localStorage.getItem('content')) || [];
    
    // Sort content by date (newest first)
    content.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    
    // Display latest content (last 6 items)
    await displayContent(latestGrid, content.slice(0, 6));
    
    // Display content by type
    await displayContent(moviesGrid, filterContent(content, 'movie'));
    await displayContent(animeGrid, filterContent(content, 'anime'));
    await displayContent(seriesGrid, filterContent(content, 'series'));
}

// Filter content by type
function filterContent(content, type) {
    return content.filter(item => item.type === type);
}

// Display content in grid
async function displayContent(grid, content) {
    // Show loading state
    grid.innerHTML = '<div class="loading">Loading content...</div>';
    
    // Process each item and fetch movie details
    const processedContent = await Promise.all(content.map(async item => {
        const movieDetails = await fetchMovieDetails(item.title);
        return {
            ...item,
            image: movieDetails ? movieDetails.poster : item.image,
            description: movieDetails ? movieDetails.plot : item.description,
            rating: movieDetails ? movieDetails.rating : 'N/A',
            year: movieDetails ? movieDetails.year : new Date(item.releaseDate).getFullYear(),
            genre: movieDetails ? movieDetails.genre : item.genre
        };
    }));
    
    // Display processed content
    grid.innerHTML = processedContent.map(item => `
        <div class="content-card">
            <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/300x450'">
            <div class="card-content">
                <div class="content-info">
                    <span class="type-badge">${item.type}</span>
                    <span class="quality-badge">${item.quality || '1080p'}</span>
                </div>
                <div class="rating-year">
                    <span class="rating"><i class="fas fa-star"></i> ${item.rating}</span>
                    <span class="year">${item.year}</span>
                </div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="genre-badge">${item.genre}</div>
                <a href="${item.downloadLink}" class="download-btn" target="_blank">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `).join('');
}

// Handle search
async function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const content = JSON.parse(localStorage.getItem('content')) || [];
    
    const filteredContent = content.filter(item => 
        item.title.toLowerCase().includes(searchTerm) || 
        item.description.toLowerCase().includes(searchTerm)
    );
    
    // Update all sections with filtered content
    await displayContent(latestGrid, filteredContent.slice(0, 6));
    await displayContent(moviesGrid, filterContent(filteredContent, 'movie'));
    await displayContent(animeGrid, filterContent(filteredContent, 'anime'));
    await displayContent(seriesGrid, filterContent(filteredContent, 'series'));
}

// Handle latest filter
async function handleLatestFilter(e) {
    const selectedType = e.target.value;
    const content = JSON.parse(localStorage.getItem('content')) || [];
    
    content.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    
    if (selectedType === 'all') {
        await displayContent(latestGrid, content.slice(0, 6));
    } else {
        const filteredContent = filterContent(content, selectedType);
        await displayContent(latestGrid, filteredContent.slice(0, 6));
    }
}

// Handle quality and genre filters
async function handleFilters(type) {
    const content = JSON.parse(localStorage.getItem('content')) || [];
    const qualityFilter = document.getElementById(`${type}-quality`);
    const genreFilter = document.getElementById(`${type}-genre`);
    const grid = document.getElementById(`${type}-grid`);
    
    let filteredContent = filterContent(content, type);
    
    if (qualityFilter && qualityFilter.value !== 'all') {
        filteredContent = filteredContent.filter(item => item.quality === qualityFilter.value);
    }
    
    if (genreFilter && genreFilter.value !== 'all') {
        filteredContent = filteredContent.filter(item => item.genre === genreFilter.value);
    }
    
    await displayContent(grid, filteredContent);
}

// Handle load more
async function handleLoadMore(e) {
    const section = e.target.closest('.content-section');
    const grid = section.querySelector('.content-grid');
    const currentItems = grid.children.length;
    const content = JSON.parse(localStorage.getItem('content')) || [];
    
    let filteredContent;
    if (section.id === 'latest') {
        const selectedType = document.getElementById('latest-filter').value;
        filteredContent = selectedType === 'all' ? content : filterContent(content, selectedType);
    } else {
        const type = section.id;
        filteredContent = filterContent(content, type);
    }
    
    const nextItems = filteredContent.slice(currentItems, currentItems + 6);
    if (nextItems.length > 0) {
        await displayContent(grid, [...Array.from(grid.children), ...nextItems]);
    } else {
        e.target.disabled = true;
        e.target.textContent = 'No More Items';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Type filters
    document.getElementById('latest-filter').addEventListener('change', handleLatestFilter);
    
    // Quality and genre filters
    ['movie', 'anime', 'series'].forEach(type => {
        const qualityFilter = document.getElementById(`${type}-quality`);
        const genreFilter = document.getElementById(`${type}-genre`);
        
        if (qualityFilter) {
            qualityFilter.addEventListener('change', () => handleFilters(type));
        }
        if (genreFilter) {
            genreFilter.addEventListener('change', () => handleFilters(type));
        }
    });
    
    // Load more buttons
    document.querySelectorAll('.load-more').forEach(button => {
        button.addEventListener('click', handleLoadMore);
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
