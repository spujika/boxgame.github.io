/* TimerManager */
class TimerManager {
    constructor(game) {
        this.game = game;
        this.startTime = 0;
        this.startOffset = 0;
        this.timerInterval = null;
    }

    start(initialOffset = 0) {
        this.stop();
        this.startOffset = initialOffset;
        this.startTime = Date.now();

        // Update immediately
        this.game.uiManager.updateTimer(this.formatTime(initialOffset));

        this.timerInterval = setInterval(() => {
            const currentSessionTime = Date.now() - this.startTime;
            const totalTime = currentSessionTime + this.startOffset;
            const formatted = this.formatTime(totalTime);
            this.game.uiManager.updateTimer(formatted);

            // Constant saving for anti-cheat
            if (this.game.dailyChallengeManager && this.game.dailyChallengeManager.isActive) {
                const dateKey = this.game.dailyChallengeManager.getLocalDateKey();
                localStorage.setItem(`boxgame_daily_time_${dateKey}`, totalTime);
            }
        }, 1000);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getElapsedTime() {
        if (this.timerInterval) {
            return (Date.now() - this.startTime) + this.startOffset;
        }
        return this.startOffset;
    }

    isRunning() {
        return this.timerInterval !== null;
    }
}
