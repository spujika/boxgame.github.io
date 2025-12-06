/* InputManager */
class InputManager {
    constructor(game) {
        this.game = game;
        this.pendingDrag = null;
        this.dragOffsetRatio = { x: 0, y: 0 };
    }

    init() {
        this.setupInput();
        this.setupAudioUnlock();
    }

    setupInput() {
        // Use pointer events for unified touch/mouse handling
        document.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        document.addEventListener('pointermove', this.handlePointerMove.bind(this));
        document.addEventListener('pointerup', this.handlePointerUp.bind(this));
        document.addEventListener('pointercancel', this.handlePointerUp.bind(this));
    }

    setupAudioUnlock() {
        const unlockHandler = () => {
            if (this.game.soundManager) {
                this.game.soundManager.unlock();
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
        // Ignore if not primary button (left click)
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        const pieceEl = e.target.closest('.piece');
        if (!pieceEl) return;

        const id = parseInt(pieceEl.dataset.id);
        const piece = this.game.pieces.find(p => p.id === id);

        if (!piece) return;

        // Check if locked (covered in grid)
        if (piece.inBox) {
            if (this.game.grid.isPieceCovered(piece, piece.x, piece.y)) {
                // Visual feedback for locked piece
                this.game.uiManager.shakePiece(piece);
                return;
            }
        }

        // Check if we need a threshold (only if in tray AND tray is scrollable)
        let useThreshold = false;
        const tray = document.getElementById('tray-container');
        // Check if piece is actually in the tray (direct child)
        const inTray = piece.element.parentNode === tray;

        if (inTray) {
            if (tray && tray.scrollWidth > tray.clientWidth) {
                useThreshold = true;
            }
        }

        if (useThreshold) {
            // Initialize pending drag
            this.pendingDrag = {
                piece: piece,
                startX: e.clientX,
                startY: e.clientY,
                pointerId: e.pointerId
            };
        } else {
            // Start drag immediately
            this.startDrag(piece, e.clientX, e.clientY, e.pointerId);
        }
    }

    handlePointerMove(e) {
        if (this.game.draggedPiece) {
            e.preventDefault(); // Prevent scrolling while dragging
            this.updatePiecePosition(e.clientX, e.clientY);
            return;
        }

        if (this.pendingDrag && this.pendingDrag.pointerId === e.pointerId) {
            const dx = e.clientX - this.pendingDrag.startX;
            const dy = e.clientY - this.pendingDrag.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const threshold = 10; // px

            if (distance > threshold) {
                // Check if we should scroll or drag
                // If piece is in tray, and movement is mostly horizontal, assume scroll
                const isHorizontal = Math.abs(dx) > Math.abs(dy);
                const tray = document.getElementById('tray-container');
                const inTray = this.pendingDrag.piece.element.parentNode === tray;

                if (inTray && isHorizontal) {
                    // It's a scroll, cancel pending drag
                    this.pendingDrag = null;
                } else {
                    // Start dragging
                    this.startDrag(this.pendingDrag.piece, e.clientX, e.clientY, e.pointerId);
                    this.pendingDrag = null;
                }
            }
        }
    }

    startDrag(piece, clientX, clientY, pointerId) {
        // Remove from grid temporarily while dragging
        if (piece.inBox) {
            this.game.grid.removePiece(piece, piece.x, piece.y);
            // Record mistake only if not placed back
            // this.game.recordMistake(); 
            piece.wasInBox = true;
        } else {
            piece.wasInBox = false;
        }

        this.game.soundManager.play('pickup');
        this.game.draggedPiece = piece;
        this.game.draggedPiece.element.classList.add('dragging');

        // Capture pointer now that we are definitely dragging
        if (pointerId && piece.element.setPointerCapture) {
            try {
                piece.element.setPointerCapture(pointerId);
            } catch (err) {
                console.warn('Failed to capture pointer', err);
            }
        }

        // Calculate offset to keep mouse relative to piece
        const rect = piece.element.getBoundingClientRect();
        const ratioX = (clientX - rect.left) / rect.width;
        const ratioY = (clientY - rect.top) / rect.height;

        this.dragOffsetRatio = { x: ratioX, y: ratioY };

        // Move to body to ensure it's on top of everything
        document.body.appendChild(piece.element);
        piece.element.style.position = 'absolute';
        this.updatePiecePosition(clientX, clientY);
    }

    handlePointerUp(e) {
        if (this.pendingDrag) {
            this.pendingDrag = null;
            return;
        }

        if (!this.game.draggedPiece) return;

        const piece = this.game.draggedPiece;
        piece.element.classList.remove('dragging');

        // Check drop target
        const pieceRect = piece.element.getBoundingClientRect();
        const gridCell = this.game.grid.getCellFromPoint(
            pieceRect.left + this.game.grid.getCellCoordinates(0, 0).width / 2,
            pieceRect.top + this.game.grid.getCellCoordinates(0, 0).height / 2
        );

        let placed = false;

        if (gridCell) {
            // Attempt to place in grid
            if (this.game.grid.canPlace(piece, gridCell.r, gridCell.c)) {
                this.game.grid.placePiece(piece, gridCell.r, gridCell.c);
                piece.inBox = true;
                piece.x = gridCell.r;
                piece.y = gridCell.c;

                // Snap visually
                const coords = this.game.grid.getCellCoordinates(gridCell.r, gridCell.c);
                piece.updatePosition(coords.x, coords.y);

                placed = true;
                this.game.soundManager.play('drop');
                this.game.checkWinCondition();
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

            if (inTray) {
                if (piece.wasInBox) this.game.recordMistake();
                this.game.returnToTray(piece);
                this.game.soundManager.play('drop');
            } else {
                // Dropped anywhere else - leave it there
                if (piece.inBox) {
                    piece.inBox = false;
                }
                // If it was in box and now is not placed and not in tray (scattered), still a mistake
                if (piece.wasInBox) this.game.recordMistake();

                this.game.soundManager.play('drop');
            }
        }

        this.game.draggedPiece = null;
    }

    updatePiecePosition(x, y) {
        if (!this.game.draggedPiece) return;
        const el = this.game.draggedPiece.element;
        // Calculate offset in pixels based on current size
        const offsetX = this.dragOffsetRatio.x * el.offsetWidth;
        const offsetY = this.dragOffsetRatio.y * el.offsetHeight;

        this.game.draggedPiece.updatePosition(x - offsetX, y - offsetY);
    }
}
