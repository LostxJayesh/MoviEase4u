// Admin credentials (in a real app, this should be handled server-side)
const ADMIN_CREDENTIALS = {
    username: 'Jayesh621',
    password: '621'
};

// API Configuration
const OMDB_API_KEY = 'caeba859';
const OMDB_API_URL = 'https://www.omdbapi.com';

// Function to fetch from OMDB API with error handling
async function fetchOMDB(params) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${OMDB_API_URL}/?${queryString}&apikey=${OMDB_API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.Response === 'False') {
            throw new Error(data.Error || 'API Error');
        }
        return data;
    } catch (error) {
        console.error('OMDB API Error:', error);
        throw error;
    }
}

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const searchTitleInput = document.getElementById('searchTitle');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const addContentForm = document.getElementById('addContentForm');
const filterType = document.getElementById('filterType');
const filterQuality = document.getElementById('filterQuality');
const searchContent = document.getElementById('searchContent');
const contentList = document.getElementById('contentList');
const sidebarToggle = document.getElementById('sidebarToggle');
const logoutBtn = document.getElementById('logoutBtn');
const sidebar = document.querySelector('.sidebar');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// Initialize admin panel
function initializeAdmin() {
    checkAuth();
    setupEventListeners();
    if (localStorage.getItem('adminAuthenticated') === 'true') {
        storeLastLogin();
        loadDashboardData();
    }
}

// Authentication Functions
function checkAuth() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (isAuthenticated === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginSection.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'flex';
    loadDashboardData();
}

// Event Listeners
function setupEventListeners() {
    // Login Form
    loginForm?.addEventListener('submit', handleLogin);

    // Sidebar Navigation
    document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('a').dataset.section;
            showSection(section);
        });
    });

    // Search and Add Content
    searchBtn?.addEventListener('click', handleSearch);
    searchTitleInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    
    addContentForm?.addEventListener('submit', handleAddContent);
    filterType?.addEventListener('change', handleFilterChange);
    filterQuality?.addEventListener('change', handleFilterChange);
    searchContent?.addEventListener('input', handleContentSearch);
    
    // Logout
    logoutBtn?.addEventListener('click', handleLogout);
    
    // Sidebar Toggle
    sidebarToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('active');
    });

    // Add Category Form
    document.getElementById('addCategoryForm')?.addEventListener('submit', handleAddCategory);
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminAuthenticated', 'true');
        showToast('Login successful!', 'success');
        showDashboard();
    } else {
        showToast('Invalid credentials!', 'error');
    }
}

// Logout Handler
function handleLogout(e) {
    e?.preventDefault();
    localStorage.removeItem('adminAuthenticated');
    showLogin();
    showToast('Logged out successfully', 'success');
}

// Search Movies/Series
async function handleSearch() {
    const searchTerm = searchTitleInput.value.trim();
    if (!searchTerm) {
        showToast('Please enter a search term', 'warning');
        return;
    }

    showLoading();
    try {
        const data = await fetchOMDB({ s: searchTerm });
        if (data.Search) {
            displaySearchResults(data.Search);
            showToast(`Found ${data.Search.length} results`, 'success');
        } else {
            searchResults.innerHTML = '<p class="no-results">No results found</p>';
            showToast('No results found', 'warning');
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('Error searching: ' + error.message, 'error');
        searchResults.innerHTML = '<p class="error">Error searching. Please try again.</p>';
    } finally {
        hideLoading();
    }
}

// Display Search Results
function displaySearchResults(results) {
    searchResults.innerHTML = results
        .filter(item => item.Poster !== 'N/A')
        .map(item => `
            <div class="result-card" onclick="selectContent('${item.imdbID}')">
                <img src="${item.Poster}" 
                     alt="${item.Title}"
                     onerror="this.src='https://via.placeholder.com/150x225?text=No+Poster'">
                <div class="result-info">
                    <h3>${item.Title}</h3>
                    <p>${item.Year} | ${item.Type.toUpperCase()}</p>
                </div>
            </div>
        `).join('');
}

// Select Content from Search
async function selectContent(imdbID) {
    showLoading();
    try {
        const data = await fetchOMDB({ i: imdbID, plot: 'full' });
        fillFormWithData(data);
        searchResults.innerHTML = '';
        searchTitleInput.value = '';
        showToast('Content details loaded', 'success');
    } catch (error) {
        console.error('Error fetching details:', error);
        showToast('Error fetching details: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Fill Form with Selected Content
function fillFormWithData(data) {
    document.getElementById('title').value = data.Title || '';
    document.getElementById('year').value = data.Year || '';
    document.getElementById('type').value = data.Type === 'series' ? 'series' : 'movie';
    document.getElementById('description').value = data.Plot || '';
    document.getElementById('genre').value = data.Genre || '';
    document.getElementById('rating').value = data.imdbRating || '';
    document.getElementById('duration').value = data.Runtime || '';
    document.getElementById('releaseDate').value = formatDate(data.Released);
    
    // Set default language to English if not specified
    document.getElementById('language').value = 'English';
    
    // Set default subtitles to English
    const subtitlesSelect = document.getElementById('subtitles');
    [...subtitlesSelect.options].forEach(option => {
        option.selected = option.value === 'English';
    });
    
    // Update poster preview
    const posterPreview = document.getElementById('posterPreview');
    if (data.Poster && data.Poster !== 'N/A') {
        posterPreview.innerHTML = `
            <img src="${data.Poster}" alt="${data.Title}">
            <div class="poster-overlay">
                <i class="fas fa-image"></i>
                <p>Click to change</p>
            </div>
        `;
    } else {
        posterPreview.innerHTML = `
            <div class="poster-placeholder">
                <i class="fas fa-image"></i>
                <p>No Poster Available</p>
            </div>
        `;
    }
}

// Format date for input[type="date"]
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// Add New Content
async function handleAddContent(e) {
    e.preventDefault();
    
    // Get selected subtitles
    const subtitlesSelect = document.getElementById('subtitles');
    const selectedSubtitles = [...subtitlesSelect.selectedOptions].map(option => option.value);
    
    const formData = {
        title: document.getElementById('title').value,
        year: document.getElementById('year').value,
        type: document.getElementById('type').value.trim().toLowerCase(), // Ensure lowercase type
        quality: document.getElementById('quality').value,
        language: document.getElementById('language').value,
        subtitles: selectedSubtitles,
        description: document.getElementById('description').value,
        genre: document.getElementById('genre').value,
        rating: document.getElementById('rating').value,
        duration: document.getElementById('duration').value,
        releaseDate: document.getElementById('releaseDate').value,
        downloadLink: document.getElementById('downloadLink').value,
        status: document.getElementById('status').value,
        dateAdded: new Date().toISOString(),
        poster: document.querySelector('#posterPreview img')?.src || '',
        views: 0
    };

    // Validate required fields
    if (!formData.title || !formData.downloadLink) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        // Get existing content
        let content = JSON.parse(localStorage.getItem('content') || '[]');
        
        // Check for duplicates
        if (content.some(item => item.title === formData.title)) {
            showToast('This content already exists', 'warning');
            return;
        }

        // Add new content
        content.push(formData);
        localStorage.setItem('content', JSON.stringify(content));
        
        // Reset form and update UI
        addContentForm.reset();
        document.getElementById('posterPreview').innerHTML = `
            <div class="poster-placeholder">
                <i class="fas fa-image"></i>
                <p>Poster Preview</p>
            </div>
        `;
        searchResults.innerHTML = '';
        
        showToast('Content added successfully', 'success');
        loadContent();
        updateStats();
        addToRecentActivity('add', formData.title);
    } catch (error) {
        console.error('Error adding content:', error);
        showToast('Error adding content: ' + error.message, 'error');
    }
}

// Load and Display Content
function loadContent() {
    try {
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        const filterValue = filterType.value;
        const qualityValue = filterQuality.value;
        const searchValue = searchContent.value.toLowerCase();
        
        const filteredContent = content.filter(item => {
            const matchesFilter = filterValue === 'all' || item.type === filterValue;
            const matchesQuality = qualityValue === 'all' || item.quality === qualityValue;
            const matchesSearch = item.title.toLowerCase().includes(searchValue) ||
                                item.description.toLowerCase().includes(searchValue);
            return matchesFilter && matchesQuality && matchesSearch;
        });

        displayContent(filteredContent);
        updatePagination(filteredContent.length);
    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Error loading content: ' + error.message, 'error');
    }
}

// Display Content List
function displayContent(content) {
    contentList.innerHTML = content.length ? content.map(item => `
        <div class="content-item">
            <div class="content-thumbnail">
                <img src="${item.poster || 'https://via.placeholder.com/60x90?text=No+Poster'}" 
                     alt="${item.title}">
            </div>
            <div class="content-details">
                <h3>${item.title}</h3>
                <p class="content-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${item.year}</span>
                    <span><i class="fas fa-film"></i> ${item.type.toUpperCase()}</span>
                    <span><i class="fas fa-video"></i> ${item.quality}</span>
                    <span><i class="fas fa-language"></i> ${item.language}</span>
                </p>
                <p class="content-genre"><i class="fas fa-theater-masks"></i> ${item.genre}</p>
                <p class="content-status ${item.status === 'active' ? 'status-active' : 'status-inactive'}">
                    <i class="fas fa-circle"></i> ${item.status.toUpperCase()}
                </p>
            </div>
            <div class="content-actions">
                <button onclick="editContent('${item.title}')" class="btn-icon" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteContent('${item.title}')" class="btn-icon btn-danger" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="toggleStatus('${item.title}')" class="btn-icon ${item.status === 'active' ? 'btn-success' : 'btn-warning'}" title="Toggle Status">
                    <i class="fas fa-toggle-on"></i>
                </button>
            </div>
        </div>
    `).join('') : '<p class="no-content">No content found</p>';
}

// Edit Content
function editContent(title) {
    try {
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        const item = content.find(i => i.title === title);
        
        if (item) {
            // Switch to add content section
            showSection('addContent');
            
            // Fill form with item data
            fillFormWithData({
                Title: item.title,
                Year: item.year,
                Type: item.type,
                Plot: item.description,
                Genre: item.genre,
                imdbRating: item.rating,
                Poster: item.poster
            });
            
            // Fill additional fields
            document.getElementById('quality').value = item.quality;
            document.getElementById('downloadLink').value = item.downloadLink;
            document.getElementById('status').value = item.status;
            
            // Delete the old item
            deleteContent(title, false);
            
            showToast('Edit mode activated', 'info');
        }
    } catch (error) {
        console.error('Error editing content:', error);
        showToast('Error editing content: ' + error.message, 'error');
    }
}

// Delete Content
function deleteContent(title, showConfirm = true) {
    if (!showConfirm || confirm('Are you sure you want to delete this content?')) {
        try {
            let content = JSON.parse(localStorage.getItem('content') || '[]');
            content = content.filter(item => item.title !== title);
            localStorage.setItem('content', JSON.stringify(content));
            
            showToast('Content deleted successfully', 'success');
            loadContent();
            updateStats();
            addToRecentActivity('delete', title);
        } catch (error) {
            console.error('Error deleting content:', error);
            showToast('Error deleting content: ' + error.message, 'error');
        }
    }
}

// Update Dashboard Stats
function updateStats() {
    try {
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        
        document.getElementById('movieCount').textContent = content.filter(item => item.type === 'movie').length;
        document.getElementById('seriesCount').textContent = content.filter(item => item.type === 'series').length;
        document.getElementById('animeCount').textContent = content.filter(item => item.type === 'anime').length;
        document.getElementById('viewCount').textContent = calculateTotalViews(content);
    } catch (error) {
        console.error('Error updating stats:', error);
        showToast('Error updating statistics', 'error');
    }
}

// Calculate Total Views
function calculateTotalViews(content) {
    return content.reduce((total, item) => total + (item.views || 0), 0);
}

// Categories Management
function handleAddCategory(e) {
    e.preventDefault();
    
    const categoryName = document.getElementById('categoryName').value;
    const categoryType = document.getElementById('categoryType').value;
    
    if (!categoryName) {
        showToast('Please enter a category name', 'warning');
        return;
    }
    
    try {
        let categories = JSON.parse(localStorage.getItem('categories') || '[]');
        
        if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
            showToast('This category already exists', 'warning');
            return;
        }
        
        categories.push({
            name: categoryName,
            type: categoryType,
            dateAdded: new Date().toISOString()
        });
        
        localStorage.setItem('categories', JSON.stringify(categories));
        document.getElementById('addCategoryForm').reset();
        loadCategories();
        showToast('Category added successfully', 'success');
    } catch (error) {
        console.error('Error adding category:', error);
        showToast('Error adding category: ' + error.message, 'error');
    }
}

function loadCategories() {
    try {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const categoriesList = document.getElementById('categoriesList');
        
        categoriesList.innerHTML = categories.length ? categories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <h4>${category.name}</h4>
                    <small>${category.type}</small>
                </div>
                <button onclick="deleteCategory('${category.name}')" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('') : '<p>No categories found</p>';
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'error');
    }
}

function deleteCategory(name) {
    if (confirm('Are you sure you want to delete this category?')) {
        try {
            let categories = JSON.parse(localStorage.getItem('categories') || '[]');
            categories = categories.filter(cat => cat.name !== name);
            localStorage.setItem('categories', JSON.stringify(categories));
            loadCategories();
            showToast('Category deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Error deleting category: ' + error.message, 'error');
        }
    }
}

// Recent Activity
function addToRecentActivity(action, itemName) {
    try {
        let activities = JSON.parse(localStorage.getItem('activities') || '[]');
        
        const activity = {
            action,
            itemName,
            timestamp: new Date().toISOString(),
            type: action === 'add' ? 'success' : 'danger'
        };
        
        activities.unshift(activity);
        activities = activities.slice(0, 20); // Keep last 20 activities
        
        localStorage.setItem('activities', JSON.stringify(activities));
        loadRecentActivity();
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

function loadRecentActivity() {
    try {
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const activityList = document.getElementById('activityList');
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }
        
        activityList.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <i class="fas ${activity.action === 'add' ? 'fa-plus-circle' : 'fa-trash'}"></i>
                <div class="activity-details">
                    <p><strong>${activity.itemName}</strong> was ${activity.action}ed</p>
                    <small>${new Date(activity.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activities:', error);
        showToast('Error loading activities', 'error');
    }
}

// Show/Hide Sections
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}Section`);
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    
    if (targetSection && targetLink) {
        targetSection.classList.add('active');
        targetLink.classList.add('active');
        
        // Load section-specific data
        if (sectionId === 'dashboard') {
            loadDashboardData();
        } else if (sectionId === 'manageContent') {
            loadContent();
        } else if (sectionId === 'categories') {
            loadCategories();
        }
    }
}

// Filter and Search Handlers
function handleFilterChange() {
    loadContent();
}

function handleContentSearch() {
    loadContent();
}

// Load Dashboard Data
function loadDashboardData() {
    updateDashboardDate();
    updateStats();
    loadRecentActivity();
    loadRecentContent();
    updateQuickStats();
    updateSystemInfo();
    
    // Update date every minute
    setInterval(updateDashboardDate, 60000);
}

// Update dashboard date
function updateDashboardDate() {
    const dateElement = document.getElementById('currentDate');
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Update quick stats
function updateQuickStats() {
    try {
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        
        // Count content by quality
        const hdCount = content.filter(item => item.quality === 'HD').length;
        const fullHdCount = content.filter(item => item.quality === 'Full HD').length;
        const fourKCount = content.filter(item => item.quality === '4K').length;
        
        // Get category count
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        
        // Update DOM
        document.getElementById('hdCount').textContent = hdCount;
        document.getElementById('fullHdCount').textContent = fullHdCount;
        document.getElementById('4kCount').textContent = fourKCount;
        document.getElementById('categoryCount').textContent = categories.length;
    } catch (error) {
        console.error('Error updating quick stats:', error);
        showToast('Error updating quick stats', 'error');
    }
}

// Load recent content
function loadRecentContent() {
    try {
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        const recentContentElement = document.getElementById('recentContent');
        
        // Sort by date and get latest 5
        const recentItems = content
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 5);
            
        if (recentItems.length === 0) {
            recentContentElement.innerHTML = '<p class="no-data">No content added yet</p>';
            return;
        }
        
        recentContentElement.innerHTML = recentItems.map(item => `
            <div class="content-preview">
                <div class="preview-thumbnail">
                    <img src="${item.poster || 'https://via.placeholder.com/60x80?text=No+Poster'}" 
                         alt="${item.title}">
                </div>
                <div class="preview-info">
                    <h4>${item.title}</h4>
                    <p>${item.year} | ${item.type.toUpperCase()} | ${item.quality}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent content:', error);
        showToast('Error loading recent content', 'error');
    }
}

// Update system info
function updateSystemInfo() {
    try {
        // Get last login time
        const lastLogin = localStorage.getItem('lastLogin') || new Date().toISOString();
        const lastLoginDate = new Date(lastLogin);
        document.getElementById('lastLogin').textContent = lastLoginDate.toLocaleString();
        
        // Calculate storage used (mock data for demo)
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        const storageUsed = content.length * 5; // 5MB per item (mock data)
        document.getElementById('storageUsed').textContent = `${storageUsed} MB`;
        
        // Update last backup time (mock data)
        const lastBackup = localStorage.getItem('lastBackup');
        document.getElementById('lastBackup').textContent = lastBackup ? 
            new Date(lastBackup).toLocaleString() : 'Never';
    } catch (error) {
        console.error('Error updating system info:', error);
        showToast('Error updating system info', 'error');
    }
}

// Store last login time
function storeLastLogin() {
    localStorage.setItem('lastLogin', new Date().toISOString());
}

// Toggle Content Status
function toggleStatus(title) {
    try {
        let content = JSON.parse(localStorage.getItem('content') || '[]');
        const index = content.findIndex(item => item.title === title);
        
        if (index !== -1) {
            content[index].status = content[index].status === 'active' ? 'inactive' : 'active';
            localStorage.setItem('content', JSON.stringify(content));
            loadContent();
            showToast(`Status updated for ${title}`, 'success');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showToast('Error updating status', 'error');
    }
}

// Filter Content
function filterContent() {
    try {
        const content = JSON.parse(localStorage.getItem('content') || '[]');
        const filterValue = document.getElementById('filterType').value;
        const qualityValue = document.getElementById('filterQuality').value;
        const languageValue = document.getElementById('filterLanguage').value;
        const searchValue = document.getElementById('searchContent').value.toLowerCase();
        
        const filteredContent = content.filter(item => {
            const matchesFilter = filterValue === 'all' || item.type === filterValue;
            const matchesQuality = qualityValue === 'all' || item.quality === qualityValue;
            const matchesLanguage = languageValue === 'all' || item.language === languageValue;
            const matchesSearch = item.title.toLowerCase().includes(searchValue) ||
                                item.description.toLowerCase().includes(searchValue) ||
                                item.genre.toLowerCase().includes(searchValue);
            return matchesFilter && matchesQuality && matchesLanguage && matchesSearch;
        });

        displayContent(filteredContent);
        updatePagination(filteredContent.length);
    } catch (error) {
        console.error('Error filtering content:', error);
        showToast('Error filtering content', 'error');
    }
}

// UI Helpers
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' : 
                       'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);

    // Add show class after a small delay (for animation)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Wait for fade out animation
    }, 3000);
}

function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('show');
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('show');
}
