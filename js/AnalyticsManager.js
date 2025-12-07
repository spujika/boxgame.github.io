/* AnalyticsManager */
class AnalyticsManager {
    constructor() {
        this.initialized = false;
        // Check if gtag is available (it might be blocked by adblockers)
        if (typeof window.gtag === 'function') {
            this.initialized = true;
        } else {
            // Create a dummy function to prevent errors if GA is missing
            window.gtag = function () {
                // console.log('Analytics blocked or missing:', arguments);
            };
        }
    }

    logEvent(eventName, params = {}) {
        if (window.gtag) {
            window.gtag('event', eventName, params);
        }
    }

    logLevelStart(level) {
        this.logEvent('level_start', {
            level_name: `Level ${level}`
        });
    }

    logLevelComplete(level, timeMs, mistakes) {
        this.logEvent('level_complete', {
            level_name: `Level ${level}`,
            time_spent: timeMs,
            mistakes: mistakes
        });
    }

    logMistake(level) {
        this.logEvent('mistake_made', {
            level_name: `Level ${level}`
        });
    }

    logDailyChallengeStart() {
        this.logEvent('daily_challenge_start');
    }

    logDailyChallengeComplete(timeMs, mistakes) {
        this.logEvent('daily_challenge_complete', {
            time_spent: timeMs,
            mistakes: mistakes
        });
    }

    logShare() {
        this.logEvent('share_result');
    }
}

// Global instance
const Analytics = new AnalyticsManager();
