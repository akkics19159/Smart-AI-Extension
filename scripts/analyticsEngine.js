// SmartNotes AI - Analytics Engine Module

class AnalyticsEngine {
    constructor() {
        this.events = [];
        this.userId = null;
    }

    async initialize() {
        console.log('AnalyticsEngine initialized');
        const settings = await this.getSettings();
        this.userId = settings.userId || this.generateUserId();
        this.loadExistingEvents();
        return true;
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async trackEvent(event) {
        try {
            const fullEvent = {
                ...event,
                userId: this.userId,
                sessionId: this.getSessionId(),
                timestamp: event.timestamp || Date.now()
            };

            this.events.push(fullEvent);

            // Keep only last 1000 events in memory
            if (this.events.length > 1000) {
                this.events = this.events.slice(-1000);
            }

            // Persist events
            await this.persistEvents();

        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('smartnotes_session');
        if (!sessionId) {
            sessionId = Date.now().toString();
            sessionStorage.setItem('smartnotes_session', sessionId);
        }
        return sessionId;
    }

    async persistEvents() {
        try {
            const eventsToPersist = this.events.slice(-100); // Keep last 100 events
            await this.set({ analyticsEvents: eventsToPersist });
        } catch (error) {
            console.error('Error persisting events:', error);
        }
    }

    async loadExistingEvents() {
        try {
            const result = await this.get(['analyticsEvents']);
            this.events = result.analyticsEvents || [];
        } catch (error) {
            console.error('Error loading events:', error);
            this.events = [];
        }
    }

    async generateInsights() {
        try {
            const insights = {
                totalEvents: this.events.length,
                eventsByType: this.groupEventsByType(),
                userActivity: this.calculateUserActivity(),
                studyPatterns: this.analyzeStudyPatterns(),
                generatedAt: new Date().toISOString()
            };

            return insights;
        } catch (error) {
            console.error('Error generating insights:', error);
            throw error;
        }
    }

    groupEventsByType() {
        const grouped = {};
        this.events.forEach(event => {
            grouped[event.type] = (grouped[event.type] || 0) + 1;
        });
        return grouped;
    }

    calculateUserActivity() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;

        const recentEvents = this.events.filter(event =>
            now - event.timestamp < sevenDays
        );

        return {
            totalRecentEvents: recentEvents.length,
            averageDailyEvents: recentEvents.length / 7,
            mostActiveDay: this.getMostActiveDay(recentEvents)
        };
    }

    getMostActiveDay(events) {
        const dayCounts = {};
        events.forEach(event => {
            const day = new Date(event.timestamp).toDateString();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });

        let mostActiveDay = null;
        let maxCount = 0;

        Object.entries(dayCounts).forEach(([day, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostActiveDay = day;
            }
        });

        return mostActiveDay;
    }

    analyzeStudyPatterns() {
        const studyEvents = this.events.filter(event =>
            ['context_menu_used', 'keyboard_shortcut_used', 'flashcard_created', 'quiz_generated'].includes(event.type)
        );

        const patterns = {
            totalStudyEvents: studyEvents.length,
            preferredMethods: this.groupEventsByType(studyEvents),
            studyTimes: this.getStudyTimes(studyEvents)
        };

        return patterns;
    }

    getStudyTimes(events) {
        const hourCounts = new Array(24).fill(0);

        events.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hourCounts[hour]++;
        });

        const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
        return {
            mostActiveHour: maxHour,
            hourDistribution: hourCounts
        };
    }

    async exportAnalytics() {
        try {
            return {
                userId: this.userId,
                events: this.events,
                insights: await this.generateInsights(),
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error exporting analytics:', error);
            throw error;
        }
    }

    async clearAnalytics() {
        try {
            this.events = [];
            await this.set({ analyticsEvents: [] });
        } catch (error) {
            console.error('Error clearing analytics:', error);
            throw error;
        }
    }

    async get(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }

    async set(data) {
        return new Promise((resolve, reject) => {
            chrome.storage.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings || {});
            });
        });
    }
}

// Export for ES modules
export { AnalyticsEngine };
