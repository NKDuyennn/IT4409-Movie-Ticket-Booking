/**
 * Configuration file for MyShowz Frontend
 * Defines backend API URL
 */

// Backend API Configuration
const CONFIG = {
    // API Base URL - Update this to match your backend server
    API_BASE_URL: 'http://localhost:5000',
    API_URL: 'http://localhost:5000/api',
    
    // Frontend URL
    FRONTEND_URL: 'http://localhost:3000',
    
    // Other configs can be added here
    APP_NAME: 'MyShowz',
    VERSION: '1.0.0'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
