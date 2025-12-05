/* Grid */
class Grid {
    constructor(rows, cols, containerId) {
        this.rows = rows;
        this.cols = cols;
        this.container = document.getElementById(containerId);
        this.cells = []; // Array of cell elements
        this.state = []; // 2D array tracking what's in each cell (stack of pieces)
    }

    init() {
        this.container.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        this.container.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;

        this.container.innerHTML = '';
        this.cells = [];
        this.state = [];

        for (let r = 0; r < this.rows; r++) {
            let rowState = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                this.container.appendChild(cell);
                this.cells.push(cell);

                // Each cell holds a stack of piece IDs that cover it
                // The last item in the array is the top-most piece
                rowState.push([]);
            }
            this.state.push(rowState);
        }
    }

    // Check if a piece can be placed at (r, c)
    canPlace(piece, r, c) {
        // Boundary check
        if (r < 0 || c < 0) return false;
        if (r + piece.shape.length > this.rows) return false;
        if (c + piece.shape[0].length > this.cols) return false;

        // Overlap check? 
        // In this game, we CAN overlap, but we might want to prevent placing 
        // if the piece is "under" something that shouldn't be moved?
        // For now, placement is always valid if within bounds.
        return true;
    }

    // Add piece to grid state
    placePiece(piece, r, c) {
        piece.shape.forEach((row, i) => {
            row.forEach((val, j) => {
                if (val === 1) {
                    this.state[r + i][c + j].push(piece.id);
                }
            });
        });
    }

    // Remove piece from grid state
    removePiece(piece, r, c) {
        piece.shape.forEach((row, i) => {
            row.forEach((val, j) => {
                if (val === 1) {
                    const stack = this.state[r + i][c + j];
                    const index = stack.indexOf(piece.id);
                    if (index > -1) {
                        stack.splice(index, 1);
                    }
                }
            });
        });
    }

    // Check if a piece is covered by another piece
    isPieceCovered(piece, r, c) {
        let isCovered = false;
        piece.shape.forEach((row, i) => {
            row.forEach((val, j) => {
                if (val === 1) {
                    const stack = this.state[r + i][c + j];
                    // If the piece is NOT the last one in the stack, it's covered
                    if (stack.length > 0 && stack[stack.length - 1] !== piece.id) {
                        isCovered = true;
                    }
                }
            });
        });
        return isCovered;
    }

    // Get grid row/col from screen coordinates (x, y)
    getCellFromPoint(x, y) {
        const rect = this.container.getBoundingClientRect();
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            return null;
        }

        const cellWidth = rect.width / this.cols;
        const cellHeight = rect.height / this.rows;

        const c = Math.floor((x - rect.left) / cellWidth);
        const r = Math.floor((y - rect.top) / cellHeight);

        return { r, c };
    }

    // Get screen coordinates for a specific grid cell
    getCellCoordinates(r, c) {
        const rect = this.container.getBoundingClientRect();
        const cellWidth = rect.width / this.cols;
        const cellHeight = rect.height / this.rows;

        return {
            x: rect.left + c * cellWidth,
            y: rect.top + r * cellHeight,
            width: cellWidth,
            height: cellHeight
        };
    }
}
