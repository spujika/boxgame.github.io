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

    setUserProperty(propertyName, propertyValue) {
        if (window.gtag) {
            window.gtag('set', 'user_properties', {
                [propertyName]: propertyValue
            });
        }
    }

    updateHighestLevel(level) {
        // Get stored highest level
        const storedHighest = localStorage.getItem('boxgame_highest_level');
        const currentHighest = storedHighest ? parseInt(storedHighest) : 0;

        // Update if this level is higher
        if (level > currentHighest) {
            localStorage.setItem('boxgame_highest_level', level);
            this.setUserProperty('highest_level_reached', level);
        }
    }

    logLevelStart(level) {
        this.logEvent('level_start', {
            level_name: `Level ${level}`,
            level_number: level
        });
    }

    logLevelComplete(level, timeMs, mistakes) {
        // Update highest level reached
        this.updateHighestLevel(level);

        this.logEvent('level_complete', {
            level_name: `Level ${level}`,
            level_number: level,
            time_spent: timeMs,
            mistakes: mistakes,
            highest_level_reached: level
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

    logDailyChallengeComplete(timeMs, mistakes, challengeDate) {
        this.logEvent('daily_challenge_complete', {
            challenge_date: challengeDate,
            time_spent: timeMs,
            mistakes: mistakes
        });
    }

    logShare() {
        this.logEvent('share_result');
    }

    syncHistoricalData() {
        // Only sync once per browser
        const syncKey = 'boxgame_analytics_synced';
        if (localStorage.getItem(syncKey) === 'true') {
            return; // Already synced
        }

        // Find all completed daily challenges
        const completedChallenges = [];
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('boxgame_daily_completed_')) {
                const dateKey = key.replace('boxgame_daily_completed_', '');
                const isCompleted = localStorage.getItem(key) === 'true';

                if (isCompleted) {
                    const time = localStorage.getItem(`boxgame_daily_time_${dateKey}`);
                    const mistakes = localStorage.getItem(`boxgame_daily_mistakes_${dateKey}`);

                    if (time && mistakes) {
                        // Format dateKey (YYYYMMDD) to readable format (YYYY-MM-DD)
                        const year = dateKey.substring(0, 4);
                        const month = dateKey.substring(4, 6);
                        const day = dateKey.substring(6, 8);
                        const formattedDate = `${year}-${month}-${day}`;

                        completedChallenges.push({
                            date: formattedDate,
                            time: parseInt(time),
                            mistakes: parseInt(mistakes)
                        });
                    }
                }
            }
        });

        // Send each completed challenge as an event
        completedChallenges.forEach(challenge => {
            this.logEvent('daily_challenge_complete', {
                challenge_date: challenge.date,
                time_spent: challenge.time,
                mistakes: challenge.mistakes,
                is_historical: true
            });
        });

        // Mark as synced
        localStorage.setItem(syncKey, 'true');

        if (completedChallenges.length > 0) {
            console.log(`Synced ${completedChallenges.length} historical daily challenges to GA4`);
        }
    }
}

// Global instance
const Analytics = new AnalyticsManager();
