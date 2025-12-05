/* Piece */
class Piece {
    constructor(id, shape, color, startX, startY) {
        this.id = id;
        this.shape = shape; // 2D array of 0s and 1s
        this.color = color;
        this.x = startX || 0; // Grid coordinates (if in box)
        this.y = startY || 0;
        this.element = null;
        this.rotation = 0; // 0, 90, 180, 270
        this.inBox = false;
        this.zIndex = 10;
    }

    render() {
        const el = document.createElement('div');
        el.classList.add('piece');
        el.dataset.id = this.id;

        // Set grid template based on shape
        el.style.gridTemplateRows = `repeat(${this.shape.length}, 1fr)`;
        el.style.gridTemplateColumns = `repeat(${this.shape[0].length}, 1fr)`;

        this.shape.forEach((row, rIndex) => {
            row.forEach((cell, cIndex) => {
                if (cell === 1) {
                    const cellDiv = document.createElement('div');
                    cellDiv.classList.add('piece-cell');
                    cellDiv.style.backgroundColor = this.color;
                    // Position in the piece's local grid
                    cellDiv.style.gridRow = rIndex + 1;
                    cellDiv.style.gridColumn = cIndex + 1;
                    el.appendChild(cellDiv);
                }
            });
        });

        this.element = el;
        return el;
    }

    updatePosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }
}
