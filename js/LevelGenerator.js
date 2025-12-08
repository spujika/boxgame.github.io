/* Level Generator */
class LevelGenerator {
    constructor() {
    }


    generate(level, rng) {
        const params = this.getLevelParams(level, rng);
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
            const shape = getRandomShape(rng);
            // Random rotation
            let rotatedShape = shape;
            const rotations = rng ? Math.floor(rng.nextFloat() * 4) : Math.floor(Math.random() * 4);
            for (let r = 0; r < rotations; r++) rotatedShape = rotateMatrix(rotatedShape);

            // Multicolor support
            let color = getRandomColor(rng);
            // Ensure we don't pick the same color as the previous piece if possible, for variety
            if (pieces.length > 0 && pieces[pieces.length - 1].color === color) {
                color = getRandomColor(rng);
            }

            const piece = new Piece(i, rotatedShape, color);

            // Try to place it somewhere valid
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const randR = rng ? rng.nextFloat() : Math.random();
                const randC = rng ? rng.nextFloat() : Math.random();

                const r = Math.floor(randR * (size - rotatedShape.length + 1));
                const c = Math.floor(randC * (size - rotatedShape[0].length + 1));

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

    // getLevelParams remains the same except for internal probabilistic logic if needed, 
    // but the current implementation uses Math.random() for transitions. 
    // To be fully deterministic, we should also use RNG in getLevelParams if we pass it there.
    // However, for daily challenge we might want fixed difficulty or standard progression?
    // The prompt implies "Seeded Challenge", so let's allow it to use RNG too.

    getLevelParams(level, rng) {
        // Define Tiers
        const tiers = {
            1: { size: 3, overlap: false, basePieces: 3 }, // 3x3 Easy
            2: { size: 3, overlap: true, basePieces: 4 },  // 3x3 Hard
            3: { size: 4, overlap: false, basePieces: 4 }, // 4x4 Easy
            4: { size: 4, overlap: true, basePieces: 5 },  // 4x4 Hard
            5: { size: 5, overlap: true, basePieces: 6 }   // 5x5 Hard
        };

        let selectedTier = 1;
        const rand = () => rng ? rng.nextFloat() : Math.random();

        // Probabilistic Transition Logic
        if (level <= 3) {
            selectedTier = 1;
        } else if (level <= 13) {
            // Transition 1 -> 2 (Intro -> 3x3 Overlap)
            const progress = (level - 3) / 20; // 0.0 to 1.0
            selectedTier = rand() < progress ? 2 : 1;
        } else if (level <= 23) {
            selectedTier = 2;
        } else if (level <= 53) {
            // Transition 2 -> 4 (3x3 Overlap -> 4x4 Overlap)
            // Skipping Tier 3 (4x4 No Overlap) as requested
            const progress = (level - 33) / 30;
            selectedTier = rand() < progress ? 4 : 2;
        } else if (level <= 113) {
            // Mostly Tier 4
            selectedTier = 4;
        } else {
            // Transition 4 -> 5 (4x4 Overlap -> 5x5 Overlap)
            const progress = Math.min(1, (level - 113) / 50);
            selectedTier = rand() < progress ? 5 : 4;
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
}
