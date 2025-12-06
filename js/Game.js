/* Game */
class Game {
    constructor() {
        const savedLevel = localStorage.getItem('boxgame_level');
        this.level = savedLevel ? parseInt(savedLevel) : 1;
        this.grid = null;
        this.generator = new LevelGenerator();
        this.pieces = [];
        this.draggedPiece = null;
        this.offset = { x: 0, y: 0 };

        this.uiManager = new UIManager();
        this.inputManager = new InputManager(this);

        this.init();
    }

    init() {
        this.soundManager = new SoundManager();
        this.uiManager.init(this);
        this.inputManager.init();
        this.isDailyChallenge = false;

        // Daily Challenge Stats
        this.startTime = 0;
        this.timerInterval = null;
        this.mistakes = 0;

        this.startLevel(this.level);

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.soundManager.play('reset');
                this.resetLevel();
            });
        }

        const dailyBtn = document.getElementById('daily-btn');
        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => {
                if (this.isDailyChallenge) {
                    this.exitDailyChallenge();
                } else {
                    this.startDailyChallenge();
                }
            });
        }

        // Handle window resize
        let wasLargeScreen = window.innerWidth >= 1024; // Initial check
        window.addEventListener('resize', () => {
            const isLarge = this.isLargeScreen();

            if (this.grid && this.pieces) {
                // Update grid positions
                this.updatePiecePositions();

                // Handle mode switch

                // Handle mode switch
                if (wasLargeScreen !== isLarge) {
                    wasLargeScreen = isLarge;
                    // Re-distribute pieces that are not in the box
                    this.pieces.forEach(piece => {
                        if (!piece.inBox) {
                            this.returnToTray(piece);
                        }
                    });
                }
            }

            this.uiManager.updateTrayScrollIndicators();
        });
    }

    updatePiecePositions() {
        if (this.grid && this.pieces) {
            this.pieces.forEach(piece => {
                if (piece.inBox) {
                    const coords = this.grid.getCellCoordinates(piece.x, piece.y);
                    piece.updatePosition(coords.x, coords.y);
                }
            });
        }
    }

    startDailyChallenge() {
        this.isDailyChallenge = true;
        const dailyBtn = document.getElementById('daily-btn');
        if (dailyBtn) dailyBtn.classList.add('active');

        const indicator = document.getElementById('level-indicator');
        if (indicator) indicator.innerText = "Daily Challenge";

        // Generate seed from date YYYYMMDD
        const dateIso = new Date().toISOString().slice(0, 10);
        const dateKey = dateIso.replace(/-/g, '');
        const seed = parseInt(dateKey);

        // Load saved state for this date
        const savedTime = localStorage.getItem(`boxgame_daily_time_${dateKey}`);
        const savedMistakes = localStorage.getItem(`boxgame_daily_mistakes_${dateKey}`);

        this.mistakes = savedMistakes ? parseInt(savedMistakes) : 0;
        this.elapsedTime = savedTime ? parseInt(savedTime) : 0; // Track accumulated time

        this.uiManager.toggleHud(true);
        this.uiManager.updateMistakes(this.mistakes);

        // Resume timer
        this.startTimer(this.elapsedTime);

        // Use a fixed 'level' difficulty for daily, e.g., level 100 difficulty (Consistent 4x4)
        this.startLevel(100, seed);

        // Restore placed pieces if any
        if (this.grid) {
            // Use setTimeout to ensure grid DOM is rendered/reflowed before calculating coordinates
            setTimeout(() => {
                const savedPieces = localStorage.getItem(`boxgame_daily_pieces_${dateKey}`);
                if (savedPieces) {
                    try {
                        const piecesData = JSON.parse(savedPieces);
                        piecesData.forEach(pData => {
                            const piece = this.pieces.find(p => p.id === pData.id);
                            if (piece) {
                                this.grid.placePiece(piece, pData.c, pData.r);

                                piece.x = pData.c;
                                piece.y = pData.r;
                                piece.inBox = true;
                                // Visual update
                                document.body.appendChild(piece.element);
                                piece.element.style.position = 'absolute'; // IMPORTANT: Must be absolute
                                piece.element.classList.remove('dragging');
                                const coords = this.grid.getCellCoordinates(pData.c, pData.r);
                                piece.updatePosition(coords.x, coords.y);
                            }
                        });
                        // Force update positions after all are attached
                        this.updatePiecePositions();
                        this.uiManager.updateTrayScrollIndicators();
                        console.log("Restored Daily Challenge pieces");
                    } catch (e) {
                        console.error("Failed to load saved pieces", e);
                    }
                }
            }, 50);
        }
    }

    exitDailyChallenge() {
        // Save state before exiting
        if (this.isDailyChallenge) {
            const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const currentElapsed = Date.now() - this.startTime + this.startOffset; // Total time
            localStorage.setItem(`boxgame_daily_time_${dateKey}`, currentElapsed);
            localStorage.setItem(`boxgame_daily_mistakes_${dateKey}`, this.mistakes);

            // Save piece positions
            const piecesData = this.pieces
                .filter(p => p.inBox)
                .map(p => ({ id: p.id, c: p.x, r: p.y }));
            localStorage.setItem(`boxgame_daily_pieces_${dateKey}`, JSON.stringify(piecesData));
            console.log("Saving Daily Challenge:", dateKey, "Pieces:", piecesData);
        }

        this.isDailyChallenge = false;
        const dailyBtn = document.getElementById('daily-btn');
        if (dailyBtn) dailyBtn.classList.remove('active');

        this.stopTimer();
        this.uiManager.toggleHud(false);

        // Return to normal level
        this.startLevel(this.level);
    }

    startTimer(initialOffset = 0) {
        this.stopTimer();
        this.startOffset = initialOffset;
        this.startTime = Date.now();

        // Update immediately
        this.uiManager.updateTimer(this.formatTime(initialOffset));

        this.timerInterval = setInterval(() => {
            const currentSessionTime = Date.now() - this.startTime;
            const totalTime = currentSessionTime + this.startOffset;
            const formatted = this.formatTime(totalTime);
            this.uiManager.updateTimer(formatted);
        }, 1000);
    }

    stopTimer() {
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

    recordMistake() {
        if (this.isDailyChallenge) {
            this.mistakes++;
            this.uiManager.updateMistakes(this.mistakes);

            // Save mistakes immediately
            const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            localStorage.setItem(`boxgame_daily_mistakes_${dateKey}`, this.mistakes);
        }
    }

    clearLevel() {
        // Remove existing pieces from DOM (body or tray)
        if (this.pieces) {
            this.pieces.forEach(p => {
                if (p.element && p.element.parentNode) {
                    p.element.parentNode.removeChild(p.element);
                }
            });
        }
        this.pieces = [];
        this.uiManager.clearTray();
    }

    resetLevel() {
        // Handle mistakes on reset for daily challenge
        if (this.isDailyChallenge) {
            let resetMistakes = 0;
            this.pieces.forEach(piece => {
                if (piece.inBox) {
                    resetMistakes++;
                }
            });

            if (resetMistakes > 0) {
                this.mistakes += resetMistakes;
                this.uiManager.updateMistakes(this.mistakes);
                const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                localStorage.setItem(`boxgame_daily_mistakes_${dateKey}`, this.mistakes);
            }
        }

        // Return all pieces to tray
        this.pieces.forEach(piece => {
            if (piece.inBox) {
                this.grid.removePiece(piece, piece.x, piece.y);
            }

            const tray = document.getElementById('tray-container');
            if (piece.element.parentNode !== tray) {
                this.returnToTray(piece);
            }
        });
    }

    startLevel(level, seed) {
        this.clearLevel();

        let rng = null;
        if (seed) {
            rng = new SeededRNG(seed);
        }

        const data = this.generator.generate(level, rng);

        // Setup Grid
        this.grid = new Grid(data.gridSize, data.gridSize, 'box-grid');
        this.grid.init();

        // Render Target
        this.targetPattern = data.targetPattern;
        this.uiManager.renderTarget(data.targetPattern);

        // Render Pieces in Tray
        this.pieces = data.pieces;

        this.pieces.forEach((piece, index) => {
            const el = piece.render();
            // Random initial position in tray
            el.style.position = 'relative'; // In tray they are relative

            // Add spawn animation delay
            el.style.animation = `spawn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s backwards`;

            this.uiManager.addPieceToTray(el);
        });

        setTimeout(() => this.uiManager.updateTrayScrollIndicators(), 100);

        if (!this.isDailyChallenge) {
            this.uiManager.updateLevelIndicator(level);
        }
    }

    returnToTray(piece) {
        piece.inBox = false;
        const tray = document.getElementById('tray-container');
        piece.element.classList.remove('scattered-piece');

        // Find the correct position to insert the piece to maintain order
        const currentId = piece.id;
        let inserted = false;

        const children = Array.from(tray.children);
        for (let i = 0; i < children.length; i++) {
            const childId = parseInt(children[i].dataset.id);
            if (childId > currentId) {
                tray.insertBefore(piece.element, children[i]);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            tray.appendChild(piece.element);
        }

        piece.element.style.position = 'relative';
        piece.element.style.left = 'auto';
        piece.element.style.top = 'auto';

        piece.element.style.animation = 'spawn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        setTimeout(() => this.uiManager.updateTrayScrollIndicators(), 50);
    }

    isLargeScreen() {
        return window.innerWidth >= 1024;
    }

    checkWinCondition() {
        // Get current grid state (colors)
        const currentPattern = [];
        for (let r = 0; r < this.grid.rows; r++) {
            const row = [];
            for (let c = 0; c < this.grid.cols; c++) {
                const stack = this.grid.state[r][c];
                if (stack.length > 0) {
                    const topPieceId = stack[stack.length - 1];
                    const piece = this.pieces.find(p => p.id === topPieceId);
                    row.push(piece.color);
                } else {
                    row.push(null);
                }
            }
            currentPattern.push(row);
        }

        // Compare with target
        let match = true;
        for (let r = 0; r < this.targetPattern.length; r++) {
            for (let c = 0; c < this.targetPattern[0].length; c++) {
                const targetColor = this.targetPattern[r][c];
                const currentColor = currentPattern[r][c];

                if (targetColor !== currentColor) {
                    match = false;
                    break;
                }
            }
            if (!match) break;
        }

        if (match) {
            this.handleWin();
        }
    }

    handleWin() {
        this.stopTimer();
        this.soundManager.play('win');

        let stats = { isDaily: false };
        if (this.isDailyChallenge) {
            const currentSessionTime = Date.now() - this.startTime;
            const totalTime = currentSessionTime + (this.startOffset || 0);

            stats = {
                time: this.formatTime(totalTime),
                mistakes: this.mistakes,
                isDaily: true,
                targetPattern: this.targetPattern
            };

            // Clear saved state on win? Or keep it? 
            // Usually you want to clear it so they can't replay it? Or let them replay?
            // User didn't specify. Assuming we don't clear it immediately so they can see their result, 
            // but if they "Exit" via button it might re-save. 
            // Actually, if we Re-enter, we probably want to start fresh or keep previous best?
            // "Daily Challenge" usually implies one attempt or cumulative. 
            // Let's just leave the saved state as is for now, user asked for "not reset when switching".
            // If they beat it, maybe we should mark it as "Complete" in storage?
        }

        this.uiManager.showWinScreen(() => {
            if (this.isDailyChallenge) {
                // For daily challenge, maybe just restart it or go back to main menu? 
                // Currently just reloading the same daily challenge as "Next Level" implies progression.
                // Or we can just exit daily mode?
                // Let's just restart it for now, or maybe show a "Coinplete" message.
                // Ideally, daily is one-off. Let's make "Next Level" exit daily mode.
                this.exitDailyChallenge();
            } else {
                this.level++;
                localStorage.setItem('boxgame_level', this.level);
                this.startLevel(this.level);
            }
        }, stats);
    }
}
