/**
 * Basic Analytics Service
 * Tracks key metrics for the SaaS
 */

const fs = require('fs');
const path = require('path');

const ANALYTICS_FILE = path.join(__dirname, '../analytics.json');

/**
 * Initialize analytics file if it doesn't exist
 */
function initAnalytics() {
    if (!fs.existsSync(ANALYTICS_FILE)) {
        const initialData = {
            events: [],
            daily_stats: {}
        };
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(initialData, null, 2));
    }
}

/**
 * Read analytics data
 */
function readAnalytics() {
    initAnalytics();
    try {
        const data = fs.readFileSync(ANALYTICS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading analytics:', error);
        return { events: [], daily_stats: {} };
    }
}

/**
 * Write analytics data
 */
function writeAnalytics(data) {
    try {
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing analytics:', error);
    }
}

/**
 * Track an event
 */
function trackEvent(eventType, userId, metadata = {}) {
    const analytics = readAnalytics();

    const event = {
        type: eventType,
        user_id: userId,
        timestamp: new Date().toISOString(),
        metadata
    };

    analytics.events.push(event);

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!analytics.daily_stats[today]) {
        analytics.daily_stats[today] = {
            generations: 0,
            registrations: 0,
            conversions: 0,
            revenue: 0
        };
    }

    if (eventType === 'generation') {
        analytics.daily_stats[today].generations++;
    } else if (eventType === 'registration') {
        analytics.daily_stats[today].registrations++;
    } else if (eventType === 'conversion') {
        analytics.daily_stats[today].conversions++;
        analytics.daily_stats[today].revenue += metadata.amount || 0;
    }

    // Keep only last 1000 events to prevent file from growing too large
    if (analytics.events.length > 1000) {
        analytics.events = analytics.events.slice(-1000);
    }

    writeAnalytics(analytics);
}

/**
 * Get metrics for a date range
 */
function getMetrics(startDate, endDate) {
    const analytics = readAnalytics();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const metrics = {
        total_generations: 0,
        total_registrations: 0,
        total_conversions: 0,
        total_revenue: 0,
        daily_breakdown: []
    };

    Object.entries(analytics.daily_stats).forEach(([date, stats]) => {
        const dateObj = new Date(date);
        if (dateObj >= start && dateObj <= end) {
            metrics.total_generations += stats.generations;
            metrics.total_registrations += stats.registrations;
            metrics.total_conversions += stats.conversions;
            metrics.total_revenue += stats.revenue;
            metrics.daily_breakdown.push({ date, ...stats });
        }
    });

    return metrics;
}

/**
 * Get recent events
 */
function getRecentEvents(limit = 100) {
    const analytics = readAnalytics();
    return analytics.events.slice(-limit).reverse();
}

module.exports = {
    trackEvent,
    getMetrics,
    getRecentEvents
};
