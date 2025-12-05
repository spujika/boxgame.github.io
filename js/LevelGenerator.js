/* Level Generator */
class LevelGenerator {
    constructor() {
    }


    getLevelParams(level) {
        // Define Tiers
        const tiers = {
            1: { size: 3, overlap: false, basePieces: 3 }, // 3x3 Easy
            2: { size: 3, overlap: true, basePieces: 4 },  // 3x3 Hard
            3: { size: 4, overlap: false, basePieces: 4 }, // 4x4 Easy
            4: { size: 4, overlap: true, basePieces: 5 },  // 4x4 Hard
            5: { size: 5, overlap: true, basePieces: 6 }   // 5x5 Hard
        };

        let selectedTier = 1;

        // Probabilistic Transition Logic
        if (level <= 10) {
            selectedTier = 1;
        } else if (level <= 30) {
            // Transition 1 -> 2 (Intro -> 3x3 Overlap)
            const progress = (level - 10) / 20; // 0.0 to 1.0
            selectedTier = Math.random() < progress ? 2 : 1;
        } else if (level <= 40) {
            selectedTier = 2;
        } else if (level <= 70) {
            // Transition 2 -> 3 (3x3 Overlap -> 4x4 No Overlap)
            const progress = (level - 40) / 30;
            selectedTier = Math.random() < progress ? 3 : 2;
        } else if (level <= 80) {
            selectedTier = 3;
        } else if (level <= 120) {
            // Transition 3 -> 4 (4x4 No Overlap -> 4x4 Overlap)
            const progress = (level - 80) / 40;
            selectedTier = Math.random() < progress ? 4 : 3;
        } else {
            // Transition 4 -> 5 (4x4 Overlap -> 5x5 Overlap)
            const progress = Math.min(1, (level - 120) / 50);
            selectedTier = Math.random() < progress ? 5 : 4;
        }

        const params = tiers[selectedTier];

        // Calculate piece count: Base + small increase over time (capped)
        const extraPieces = Math.floor(level / 20);
        const numPieces = params.basePieces + Math.min(extraPieces, 3);

        return {
            size: params.size,
            allowOverlap: params.overlap,
            numPieces: numPieces
        };
    }

    generate(level) {
        const params = this.getLevelParams(level);
        const size = params.size;
        const numPieces = params.numPieces;
        const allowOverlap = params.allowOverlap;

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
