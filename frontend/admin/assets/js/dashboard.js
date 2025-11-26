/**
 * Dashboard Page JavaScript
 */
(function() {
    'use strict';

    const STATS_CONFIG = [
        { title: 'Total Bookings', key: 'total_bookings', default: 4, icon: 'fa-ticket', change: '+12.5%' },
        { title: 'Total Revenue', key: 'revenue_today', default: 2140, icon: 'fa-dollar', change: '+8.2%', prefix: '$' },
        { title: 'Active Shows', key: 'total_movies', default: 43, icon: 'fa-film', change: '+3.1%' },
        { title: 'Total Users', key: 'total_users', default: 1, icon: 'fa-users', change: '+5.4%' }
    ];

    function createStatCard(config, value) {
        const template = document.getElementById('stat-card-template');
        const card = template.content.cloneNode(true);
        
        card.querySelector('.stat-card-title').textContent = config.title;
        card.querySelector('.stat-card-icon i').classList.add(config.icon);
        card.querySelector('.stat-card-value').textContent = (config.prefix || '') + value;
        card.querySelector('.stat-card-change span').textContent = config.change;
        
        return card;
    }

    function renderStats(data) {
        const container = document.getElementById('stats');
        container.innerHTML = '';
        
        STATS_CONFIG.forEach(config => {
            const value = data[config.key] || config.default;
            container.appendChild(createStatCard(config, value));
        });
    }

    function loadStats() {
        const api = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : '';
        fetch(api + '/admin/stats', { credentials: 'include' })
            .then(r => r.json())
            .then(json => renderStats(json?.success ? json.data : {}))
            .catch(() => renderStats({}));
    }

    function init() {
        loadStats();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
