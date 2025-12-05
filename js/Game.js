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

        this.init();
    }

    init() {
        this.soundManager = new SoundManager();
        this.startLevel(this.level);
        this.setupInput();
        this.setupAudioUnlock();

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
    }

    resetLevel() {
        // Return all pieces to tray
        this.pieces.forEach(piece => {
            if (piece.inBox) {
                this.grid.removePiece(piece, piece.x, piece.y);
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
        this.renderTarget(data.targetPattern);

        // Render Pieces in Tray
        this.pieces = data.pieces;
        const tray = document.getElementById('tray-container');
        tray.innerHTML = '';

        this.pieces.forEach((piece, index) => {
            const el = piece.render();
            // Random initial position in tray
            el.style.position = 'relative'; // In tray they are relative

            // Add spawn animation delay
            el.style.animation = `spawn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s backwards`;

            tray.appendChild(el);
        });

        document.getElementById('level-indicator').innerText = `Level ${level}`;
    }

    renderTarget(pattern) {
        const container = document.getElementById('target-preview');
        container.style.gridTemplateRows = `repeat(${pattern.length}, 1fr)`;
        container.style.gridTemplateColumns = `repeat(${pattern[0].length}, 1fr)`;
        container.innerHTML = '';

        pattern.forEach(row => {
            row.forEach(color => {
                const cell = document.createElement('div');
                cell.classList.add('preview-cell');
                if (color) {
                    cell.style.backgroundColor = color;
                } else {
                    cell.style.backgroundColor = 'transparent';
                    cell.style.border = '1px dashed rgba(255,255,255,0.1)';
                }
                container.appendChild(cell);
            });
        });
    }

    setupInput() {
        document.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        document.addEventListener('pointermove', this.handlePointerMove.bind(this));
        document.addEventListener('pointerup', this.handlePointerUp.bind(this));
    }

    setupAudioUnlock() {
        const unlockHandler = () => {
            if (this.soundManager) {
                this.soundManager.unlock();
            }
            // Remove listeners after first interaction
            document.removeEventListener('touchstart', unlockHandler);
            document.removeEventListener('click', unlockHandler);
            document.removeEventListener('keydown', unlockHandler);
        };

        document.addEventListener('touchstart', unlockHandler, { passive: true });
        document.addEventListener('click', unlockHandler);
        document.addEventListener('keydown', unlockHandler);
    }

    handlePointerDown(e) {
        const pieceEl = e.target.closest('.piece');
        if (!pieceEl) return;

        const id = parseInt(pieceEl.dataset.id);
        const piece = this.pieces.find(p => p.id === id);

        if (!piece) return;

        // Check if locked (covered in grid)
        if (piece.inBox) {
            if (this.grid.isPieceCovered(piece, piece.x, piece.y)) {
                // TODO: Visual feedback for locked piece (shake?)
                return;
            }
            // Remove from grid temporarily while dragging
            this.grid.removePiece(piece, piece.x, piece.y);
        }

        this.soundManager.play('pickup');
        this.draggedPiece = piece;
        this.draggedPiece.element.classList.add('dragging');

        // Calculate offset to keep mouse relative to piece
        // Calculate relative offset (0-1) to handle scaling
        const rect = piece.element.getBoundingClientRect();
        const ratioX = (e.clientX - rect.left) / rect.width;
        const ratioY = (e.clientY - rect.top) / rect.height;

        this.dragOffsetRatio = { x: ratioX, y: ratioY };

        // Move to body to ensure it's on top of everything
        document.body.appendChild(piece.element);
        piece.element.style.position = 'absolute';
        this.updatePiecePosition(e.clientX, e.clientY);
    }

    handlePointerMove(e) {
        if (!this.draggedPiece) return;
        e.preventDefault(); // Prevent scrolling on touch
        this.updatePiecePosition(e.clientX, e.clientY);
    }

    handlePointerUp(e) {
        if (!this.draggedPiece) return;

        const piece = this.draggedPiece;
        piece.element.classList.remove('dragging');

        // Check drop target
        // We want to find the grid cell corresponding to the piece's top-left corner.
        const pieceRect = piece.element.getBoundingClientRect();
        const gridCell = this.grid.getCellFromPoint(pieceRect.left + this.grid.getCellCoordinates(0, 0).width / 2, pieceRect.top + this.grid.getCellCoordinates(0, 0).height / 2);

        let placed = false;

        if (gridCell) {
            // Attempt to place in grid
            if (this.grid.canPlace(piece, gridCell.r, gridCell.c)) {
                this.grid.placePiece(piece, gridCell.r, gridCell.c);
                piece.inBox = true;
                piece.x = gridCell.r;
                piece.y = gridCell.c;

                // Snap visually
                const coords = this.grid.getCellCoordinates(gridCell.r, gridCell.c);
                piece.updatePosition(coords.x, coords.y);

                placed = true;
                this.soundManager.play('drop');
                this.checkWinCondition();
            }
        }

        if (!placed) {
            // Check if dropped in tray
            const tray = document.getElementById('tray-container');
            const trayRect = tray.getBoundingClientRect();
            const pieceRect = piece.element.getBoundingClientRect();

            // Simple overlap check for tray
            const inTray = (
                pieceRect.left < trayRect.right &&
                pieceRect.right > trayRect.left &&
                pieceRect.top < trayRect.bottom &&
                pieceRect.bottom > trayRect.top
            );
        }

        this.draggedPiece = null;
    }

    updatePiecePosition(x, y) {
        if (!this.draggedPiece) return;
        const el = this.draggedPiece.element;
        // Calculate offset in pixels based on current size
        const offsetX = this.dragOffsetRatio.x * el.offsetWidth;
        const offsetY = this.dragOffsetRatio.y * el.offsetHeight;

        this.draggedPiece.updatePosition(x - offsetX, y - offsetY);
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
        const winScreen = document.getElementById('win-screen');
        winScreen.classList.remove('hidden');

        // Setup next level button
        const btn = document.getElementById('next-level-btn');
        btn.onclick = () => {
            winScreen.classList.add('hidden');
            this.level++;
            localStorage.setItem('boxgame_level', this.level);
            this.startLevel(this.level);
        };
    }
}
