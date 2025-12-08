/* DailyChallengeManager */
class DailyChallengeManager {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.mistakes = 0;
        this.elapsedTime = 0;
    }

    // Get local date key in YYYYMMDD format (not UTC)
    getLocalDateKey() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    isCompleted(dateKey) {
        return localStorage.getItem(`boxgame_daily_completed_${dateKey}`) === 'true';
    }

    start() {
        this.isActive = true;
        const dailyBtn = document.getElementById('daily-btn');
        if (dailyBtn) dailyBtn.classList.add('active');

        const indicator = document.getElementById('level-indicator');
        if (indicator) indicator.innerText = "Daily Challenge";

        // Generate seed from date YYYYMMDD (local timezone)
        const dateKey = this.getLocalDateKey();
        const seed = parseInt(dateKey);

        // Load saved state for this date
        const savedTime = localStorage.getItem(`boxgame_daily_time_${dateKey}`);
        const savedMistakes = localStorage.getItem(`boxgame_daily_mistakes_${dateKey}`);
        const isCompleted = this.isCompleted(dateKey);

        this.mistakes = savedMistakes ? parseInt(savedMistakes) : 0;
        this.elapsedTime = savedTime ? parseInt(savedTime) : 0;

        this.game.uiManager.toggleHud(true);
        this.game.uiManager.updateMistakes(this.mistakes);

        // Use a fixed 'level' difficulty for daily, e.g., level 100 difficulty (Consistent 4x4)
        this.game.startLevel(100, seed);

        Analytics.logDailyChallengeStart();

        if (isCompleted) {
            this.game.uiManager.updateTimer(this.game.timerManager.formatTime(this.elapsedTime));
            // Do not start timer
            this.game.uiManager.toggleHudShare(true);
            this.setupHudShare(dateKey);
        } else {
            // Resume timer
            this.game.timerManager.start(this.elapsedTime);
            this.game.uiManager.toggleHudShare(false); // Ensure hidden for new day
            // Explicitly set false as requested
            localStorage.setItem(`boxgame_daily_completed_${dateKey}`, 'false');
        }

        // Restore placed pieces if any
        if (this.game.grid) {
            // Use setTimeout to ensure grid DOM is rendered/reflowed before calculating coordinates
            setTimeout(() => {
                const savedPieces = localStorage.getItem(`boxgame_daily_pieces_${dateKey}`);
                if (savedPieces) {
                    try {
                        const piecesData = JSON.parse(savedPieces);
                        piecesData.forEach(pData => {
                            const piece = this.game.pieces.find(p => p.id === pData.id);
                            if (piece) {
                                this.game.grid.placePiece(piece, pData.c, pData.r);

                                piece.x = pData.c;
                                piece.y = pData.r;
                                piece.inBox = true;
                                // Visual update
                                document.body.appendChild(piece.element);
                                piece.element.style.position = 'absolute'; // IMPORTANT: Must be absolute
                                piece.element.classList.remove('dragging');
                                const coords = this.game.grid.getCellCoordinates(pData.c, pData.r);
                                piece.updatePosition(coords.x, coords.y);
                            }
                        });
                        // Force update positions after all are attached
                        this.game.layoutManager.updatePiecePositions();
                        this.game.uiManager.updateTrayScrollIndicators();
                        console.log("Restored Daily Challenge pieces");

                        if (isCompleted) {
                            // If completed, ensure we show the finished state
                            this.game.timerManager.stop();
                            this.game.uiManager.toggleHudShare(true);
                            this.setupHudShare(dateKey);
                        }

                    } catch (e) {
                        console.error("Failed to load saved pieces", e);
                    }
                }
            }, 50);
        }
    }

    exit() {
        // Save state before exiting (but only if not completed to avoid overwriting final time)
        if (this.isActive) {
            const dateKey = this.getLocalDateKey();
            const isCompleted = this.isCompleted(dateKey);

            // Don't save if already completed - the final state was already saved in handleWin
            if (!isCompleted) {
                this.saveProgress(false);
            }
        }

        this.isActive = false;
        const dailyBtn = document.getElementById('daily-btn');
        if (dailyBtn) dailyBtn.classList.remove('active');

        this.game.timerManager.stop();
        this.game.uiManager.toggleHud(false);
        this.game.uiManager.toggleHudShare(false);

        // Return to normal level
        this.game.startLevel(this.game.level);
    }

    setupHudShare(dateKey) {
        const btn = document.getElementById('hud-share-btn');
        if (btn) {
            // Remove old listeners to prevent duplicates (simple clone replacement or manage listener)
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const savedTime = localStorage.getItem(`boxgame_daily_time_${dateKey}`);
                const savedMistakes = localStorage.getItem(`boxgame_daily_mistakes_${dateKey}`);

                const stats = {
                    time: this.game.timerManager.formatTime(savedTime ? parseInt(savedTime) : 0),
                    mistakes: savedMistakes || 0,
                    targetPattern: this.game.targetPattern
                };

                Analytics.logShare();
                this.game.uiManager.handleShare(stats);
            });
        }
    }

    recordMistake() {
        // Don't modify mistakes if daily challenge is already completed
        if (this.isActive) {
            const dateKey = this.getLocalDateKey();
            if (this.isCompleted(dateKey)) {
                return; // Don't record mistakes for completed challenges
            }
        }

        this.mistakes++;
        if (this.isActive) {
            this.game.uiManager.updateMistakes(this.mistakes);

            // Save mistakes immediately
            const dateKey = this.getLocalDateKey();
            localStorage.setItem(`boxgame_daily_mistakes_${dateKey}`, this.mistakes);
        }

        Analytics.logMistake(this.game.level);
    }

    saveProgress(completed = false) {
        if (!this.isActive) return;

        const dateKey = this.getLocalDateKey();

        // Calculate time to save
        let timeToSave;
        if (completed) {
            // For completed challenges, use the stored elapsedTime
            timeToSave = this.elapsedTime;
        } else if (this.game.timerManager.isRunning()) {
            // Timer is running, calculate current total
            timeToSave = this.game.timerManager.getElapsedTime();
        } else {
            // Timer stopped but not completed, use startOffset
            timeToSave = this.game.timerManager.startOffset;
        }

        localStorage.setItem(`boxgame_daily_time_${dateKey}`, timeToSave);
        localStorage.setItem(`boxgame_daily_mistakes_${dateKey}`, this.mistakes);

        // Save piece positions
        const piecesData = this.game.pieces
            .filter(p => p.inBox)
            .map(p => ({ id: p.id, c: p.x, r: p.y }));
        localStorage.setItem(`boxgame_daily_pieces_${dateKey}`, JSON.stringify(piecesData));

        if (completed) {
            localStorage.setItem(`boxgame_daily_completed_${dateKey}`, 'true');
        }

        console.log("Saved Daily Progress. Completed:", completed, "Time:", timeToSave);
    }

    // Called from handleWin to capture final time and save
    onWin() {
        const currentSessionTime = Date.now() - this.game.timerManager.startTime;
        const totalTime = currentSessionTime + (this.game.timerManager.startOffset || 0);

        // Store the final time
        this.elapsedTime = totalTime;

        // Save completed state BEFORE stopping timer to capture correct time
        this.saveProgress(true);

        const dateKey = this.getLocalDateKey();
        this.game.uiManager.toggleHudShare(true);
        this.setupHudShare(dateKey);

        // Format dateKey (YYYYMMDD) to readable format (YYYY-MM-DD)
        const year = dateKey.substring(0, 4);
        const month = dateKey.substring(4, 6);
        const day = dateKey.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;

        Analytics.logDailyChallengeComplete(totalTime, this.mistakes, formattedDate);

        return {
            time: this.game.timerManager.formatTime(totalTime),
            mistakes: this.mistakes,
            isDaily: true,
            targetPattern: this.game.targetPattern
        };
    }
}
