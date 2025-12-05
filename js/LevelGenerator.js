/* Level Generator */
class LevelGenerator {
    constructor() {
    }

    generate(level) {
        // Difficulty scaling
        const size = level < 3 ? 3 : (level < 6 ? 4 : 5);
        const numPieces = level + 2; // Start with 3 pieces
        const allowOverlap = level > 3; // No overlap (red herrings) in early levels

        // 1. Create a virtual grid
        let grid = Array(size).fill(0).map(() => Array(size).fill(null));
        let pieces = [];

        // Track occupied cells for no-overlap mode
        let occupied = Array(size).fill(0).map(() => Array(size).fill(false));

        // 2. Generate pieces and place them on the virtual grid
        // We simulate placing them to build the target image
        for (let i = 0; i < numPieces; i++) {
            const shape = getRandomShape();
            // Random rotation
            let rotatedShape = shape;
            const rotations = Math.floor(Math.random() * 4);
            for (let r = 0; r < rotations; r++) rotatedShape = rotateMatrix(rotatedShape);

            // Multicolor support: Instead of just a single color, we can have a color per cell
            // For now, let's stick to one base color per piece but ensure variety
            // Or better: Let's make the piece shape itself contain colors?
            // Current Piece class expects `color` property.
            // Let's modify Piece to use `color` as a fallback or base, but we can also bake colors into the shape?
            // Actually, let's keep it simple: Monocolor pieces, but ensure we use different colors.

            let color = getRandomColor();
            // Ensure we don't pick the same color as the previous piece if possible, for variety
            if (pieces.length > 0 && pieces[pieces.length - 1].color === color) {
                color = getRandomColor();
            }

            const piece = new Piece(i, rotatedShape, color);

            // Try to place it somewhere valid
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const r = Math.floor(Math.random() * (size - rotatedShape.length + 1));
                const c = Math.floor(Math.random() * (size - rotatedShape[0].length + 1));

                // Check overlap if not allowed
                let overlaps = false;
                if (!allowOverlap) {
                    rotatedShape.forEach((row, ri) => {
                        row.forEach((val, ci) => {
                            if (val === 1) {
                                if (occupied[r + ri][c + ci]) overlaps = true;
                            }
                        });
                    });
                }

                if (!overlaps) {
                    // Place it
                    piece.targetR = r;
                    piece.targetC = c;

                    // Update virtual grid
                    rotatedShape.forEach((row, ri) => {
                        row.forEach((val, ci) => {
                            if (val === 1) {
                                grid[r + ri][c + ci] = color;
                                occupied[r + ri][c + ci] = true;
                            }
                        });
                    });

                    pieces.push(piece);
                    placed = true;
                }
                attempts++;
            }
        }

        return {
            gridSize: size,
            targetPattern: grid,
            pieces: pieces
        };
    }
}
