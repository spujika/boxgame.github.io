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

        this.startLevel(this.level);

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.soundManager.play('reset');
                this.resetLevel();
            });
        }

        // Handle window resize
        let wasLargeScreen = window.innerWidth >= 1024; // Initial check
        window.addEventListener('resize', () => {
            const isLarge = this.isLargeScreen();

            if (this.grid && this.pieces) {
                // Update grid positions
                this.pieces.forEach(piece => {
                    if (piece.inBox) {
                        const coords = this.grid.getCellCoordinates(piece.x, piece.y);
                        piece.updatePosition(coords.x, coords.y);
                    }
                });

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

    startLevel(level) {
        this.clearLevel();
        const data = this.generator.generate(level);

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

        this.uiManager.updateLevelIndicator(level);
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
        this.soundManager.play('win');
        this.uiManager.showWinScreen(() => {
            this.level++;
            localStorage.setItem('boxgame_level', this.level);
            this.startLevel(this.level);
        });
    }
}
