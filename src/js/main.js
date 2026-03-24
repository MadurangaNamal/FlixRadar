import { MovieSearchDashboard } from './dashboard.js';

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

if (!API_KEY) {

    console.error('API key not found! Create .env file with VITE_OMDB_API_KEY');
    document.getElementById('results').innerHTML =
        '<div class="error"> Please add your API key to .env file</div>';
} else {

    console.log('✅ API key loaded');
    const dashboard = new MovieSearchDashboard(API_KEY);
}