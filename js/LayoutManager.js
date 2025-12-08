/* LayoutManager */
class LayoutManager {
    constructor(game) {
        this.game = game;
        this.currentGridCellSize = 60;
    }

    updatePiecePositions() {
        if (this.game.grid && this.game.pieces) {
            this.game.pieces.forEach(piece => {
                if (piece.inBox) {
                    const coords = this.game.grid.getCellCoordinates(piece.x, piece.y);
                    piece.updatePosition(coords.x, coords.y);
                }
            });
        }
    }

    // Calculate optimal grid and target sizes based on available space
    // Priority: 1) Grid shrinks to fit, 2) Tray padding shrinks, 3) Compact mode, 4) Tray pieces shrink (last resort)
    updateGridSize() {
        if (!this.game.grid) return;

        const main = document.querySelector('main');
        const trayWrapper = document.getElementById('tray-wrapper');
        const trayContainer = document.getElementById('tray-container');
        const gameArea = document.getElementById('game-area');

        if (!main || !trayWrapper || !gameArea || !trayContainer) return;

        const isMobile = window.innerWidth <= 600;
        const gridRows = this.game.grid.rows;
        const gridCols = this.game.grid.cols;
        const gridGap = isMobile ? 2 : 4;

        // Constants - be very generous with spacing to prevent overlap
        const headerHeight = document.querySelector('header')?.offsetHeight || 50;
        // Account for: #app padding (40), main gap (15), game-area padding (10), extra buffer
        const totalFixedSpacing = isMobile ? 80 : 120;
        const totalHeight = window.innerHeight;

        // Width constraints
        const mainRect = main.getBoundingClientRect();
        const availableWidth = Math.min(mainRect.width, 600) - 40;

        // Tray sizing parameters
        const defaultTrayCellSize = isMobile ? 30 : 35;
        const minTrayCellSize = isMobile ? 20 : 25; // Absolute minimum for playability
        const maxTrayPadding = isMobile ? 10 : 15;
        const minTrayPadding = 4;

        // Grid sizing parameters
        const maxGridCellSize = isMobile ? 50 : 60;
        const minGridCellSize = isMobile ? 25 : 30;

        // Target sizing - account for target-container glass-panel padding (20px * 2) + h2 height (~25px)
        const targetCellSize = isMobile ? 12 : 16;
        const targetTotalHeight = (targetCellSize * gridRows) + 2 * (gridRows - 1) + 65; // cells + gaps + container padding + h2

        // Calculate tray height with current piece size
        // Tray has glass-panel class which adds padding, plus internal tray-container padding
        let currentTrayCellSize = defaultTrayCellSize;
        let currentTrayPadding = maxTrayPadding;
        const maxPieceHeight = 4; // Tallest piece is 4 cells

        // Get actual tray height from DOM, or estimate if not rendered yet
        // Glass-panel padding (40px) + tray-container padding (2x) + pieces + extra safety buffer
        const getActualTrayHeight = () => {
            const actualHeight = trayWrapper.offsetHeight;
            if (actualHeight > 0) return actualHeight + 20; // Add extra safety buffer
            // Fallback estimate if not yet rendered
            return (currentTrayCellSize * maxPieceHeight) + (currentTrayPadding * 2) + 60;
        };

        // Estimated tray height for calculations when we change tray sizing
        const getTrayHeight = (cellSize, padding) => (cellSize * maxPieceHeight) + (padding * 2) + 60; // +60 for all container padding

        // Calculate space available for game area
        const getAvailableForGameArea = (trayHeight) => {
            return totalHeight - headerHeight - trayHeight - totalFixedSpacing;
        };

        // Calculate required height for stacked layout
        // box-container has glass-panel padding 20px * 2 = 40px
        const getStackedHeight = (gridCellSize) => {
            const gridHeight = (gridCellSize * gridRows) + (gridGap * (gridRows - 1)) + 40; // grid + container padding
            return gridHeight + targetTotalHeight + 15; // + gap between target and grid
        };

        // Calculate required height for compact (side-by-side) layout
        const getCompactHeight = (gridCellSize) => {
            return (gridCellSize * gridRows) + (gridGap * (gridRows - 1)) + 40;
        };

        // Try different configurations until we find one that fits without overlap
        let needsCompactMode = false;
        let finalGridCellSize = maxGridCellSize;

        // Start with actual tray height measurement
        let trayHeight = getActualTrayHeight();
        let availableForGameArea = getAvailableForGameArea(trayHeight);

        // Step 1: Check if stacked layout fits at max grid size
        if (availableForGameArea >= getStackedHeight(maxGridCellSize)) {
            // Perfect - stacked layout works at full size
            finalGridCellSize = maxGridCellSize;
            needsCompactMode = false;
        }
        // Step 2: Try compact mode at max grid size (before shrinking grid)
        else if (availableForGameArea >= getCompactHeight(maxGridCellSize)) {
            finalGridCellSize = maxGridCellSize;
            needsCompactMode = true;
        }
        // Step 3: Compact mode doesn't fit at max size, shrink grid in compact mode
        else {
            needsCompactMode = true;

            // Find the largest grid size that fits in compact mode
            for (let cellSize = maxGridCellSize; cellSize >= minGridCellSize; cellSize--) {
                if (availableForGameArea >= getCompactHeight(cellSize)) {
                    finalGridCellSize = cellSize;
                    break;
                }
                finalGridCellSize = cellSize;
            }
        }

        // Step 4: If compact mode at min grid size still doesn't fit, shrink tray
        if (needsCompactMode && availableForGameArea < getCompactHeight(minGridCellSize)) {
            // Shrink tray padding first
            for (let padding = maxTrayPadding; padding >= minTrayPadding; padding--) {
                trayHeight = getTrayHeight(currentTrayCellSize, padding);
                availableForGameArea = getAvailableForGameArea(trayHeight);

                if (availableForGameArea >= getCompactHeight(minGridCellSize)) {
                    currentTrayPadding = padding;
                    finalGridCellSize = minGridCellSize;
                    break;
                }
                currentTrayPadding = padding;
            }

            // Step 5: Last resort - shrink tray pieces
            if (availableForGameArea < getCompactHeight(minGridCellSize)) {
                for (let trayCellSize = defaultTrayCellSize; trayCellSize >= minTrayCellSize; trayCellSize--) {
                    trayHeight = getTrayHeight(trayCellSize, minTrayPadding);
                    availableForGameArea = getAvailableForGameArea(trayHeight);

                    if (availableForGameArea >= getCompactHeight(minGridCellSize)) {
                        currentTrayCellSize = trayCellSize;
                        currentTrayPadding = minTrayPadding;
                        finalGridCellSize = minGridCellSize;
                        break;
                    }
                    currentTrayCellSize = trayCellSize;
                    currentTrayPadding = minTrayPadding;
                }
            }
        }

        // Step 6: Ultra-compact mode - tray goes to the right, scrolls vertically
        // This is the fallback when even min grid + min tray doesn't fit
        let needsUltraCompact = false;
        const minTrayHeight = getTrayHeight(minTrayCellSize, minTrayPadding);
        const minAvailable = getAvailableForGameArea(minTrayHeight);

        if (needsCompactMode && minAvailable < getCompactHeight(minGridCellSize)) {
            // Nothing fits - use ultra-compact mode
            needsUltraCompact = true;
            // In ultra-compact, tray is on the side, so we have more vertical space
            // Grid can use most of the height now
            finalGridCellSize = minGridCellSize;
            currentTrayCellSize = minTrayCellSize;
            currentTrayPadding = minTrayPadding;
        }

        // Apply tray styling
        trayContainer.style.padding = `${currentTrayPadding}px`;
        trayContainer.style.setProperty('--cell-size', `${currentTrayCellSize}px`);

        // Apply grid and target styling
        document.documentElement.style.setProperty('--grid-cell-size', `${finalGridCellSize}px`);
        document.documentElement.style.setProperty('--target-cell-size', `${targetCellSize}px`);

        // Apply layout modes
        const app = document.getElementById('app');

        if (needsUltraCompact) {
            app.classList.add('ultra-compact');
            gameArea.classList.add('compact');
        } else if (needsCompactMode) {
            app.classList.remove('ultra-compact');
            gameArea.classList.add('compact');
        } else {
            app.classList.remove('ultra-compact');
            gameArea.classList.remove('compact');
        }

        this.currentGridCellSize = finalGridCellSize;
    }

    // Get the current grid cell size for piece scaling
    getGridCellSize() {
        return this.currentGridCellSize || 60;
    }

    isLargeScreen() {
        return window.innerWidth >= 1024;
    }
}
