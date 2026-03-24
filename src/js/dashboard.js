export class MovieSearchDashboard {

    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://www.omdbapi.com/';
        this.currentController = null;
        this.searchCount = 0;
        this.cache = new Map();
        this.debounceTimer = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
    }

    handleSearchInput(event) {
        const query = event.target.value.trim();
        this.showTypingIndicator(true);

        // Clear previous timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer
        this.debounceTimer = setTimeout(() => {

            this.showTypingIndicator(false);

            if (query.length >= 2) {
                this.performSearch(query);
            } else {
                this.clearResults();
            }
        }, 500);
    }

    async performSearch(query) {

        if (this.currentController) {
            this.currentController.abort();
            console.log('Previous request cancelled');
        }

        // Check cache first
        if (this.cache.has(query)) {

            console.log('Serving from cache:', query);

            this.displayResults(this.cache.get(query));
            this.updateStats('cache');
            return;
        }

        // Create new abort controller for this request
        this.currentController = new AbortController();

        try {
            this.showLoading(true);

            const response = await fetch(
                `${this.baseURL}?s=${encodeURIComponent(query)}&apikey=${this.apiKey}`,
                { signal: this.currentController.signal }
            );

            const data = await response.json();

            if (data.Response === 'True') {
                this.cache.set(query, data.Search);
                this.displayResults(data.Search);
                this.updateStats('api', data.totalResults);
            } else {
                this.displayError(data.Error || 'No results found');
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was cancelled');
            } else {
                this.displayError('Network error occurred');
                console.error('Search error:', error);
            }
        } finally {
            this.showLoading(false);
            this.currentController = null;
        }
    }

    // UI Update Methods
    displayResults(movies) {
        const resultsDiv = document.getElementById('results');
        const resultCount = document.getElementById('resultCount');

        if (!movies || movies.length === 0) {
            resultsDiv.innerHTML = '<p>No movies found</p>';
            resultCount.textContent = '0 results';
            return;
        }

        resultCount.textContent = `${movies.length} results`;

        resultsDiv.innerHTML = movies.map(movie => `
                    <div class="movie-card">
                        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x445?text=No+Poster'}" 
                             alt="${movie.Title}"
                             loading="lazy">
                        <h3>${movie.Title}</h3>
                        <p>📅 ${movie.Year}</p>
                        <p>🎬 ${movie.Type}</p>
                        <small>IMDb: ${movie.imdbID}</small>
                    </div>
                `).join('');
    }

    showLoading(isLoading) {
        const resultsDiv = document.getElementById('results');
        if (isLoading) {
            resultsDiv.innerHTML = '<div class="loading">🔍 Searching...</div>';
        }
    }

    showTypingIndicator(isTyping) {
        const indicator = document.getElementById('typingIndicator');
        indicator.textContent = isTyping ? 'Typing...' : '';
    }

    displayError(message) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
    }

    clearResults() {
        document.getElementById('results').innerHTML = '';
        document.getElementById('resultCount').textContent = '';
    }

    updateStats(source, totalResults) {
        this.searchCount++;
        const statsDiv = document.getElementById('requestStats');
        statsDiv.innerHTML = `
                    Searches: ${this.searchCount} | 
                    Source: ${source} | 
                    Cache size: ${this.cache.size}
                    ${source === 'cache' ? '<span class="cache-badge">CACHED</span>' : ''}
                `;
    }
}
