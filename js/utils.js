const COLORS = [
    'var(--color-1)',
    'var(--color-2)',
    'var(--color-3)',
    'var(--color-4)',
    'var(--color-5)'
];

const SHAPES = [
    [[1]], // Dot
    [[1, 1]], // 2-bar
    [[1, 1, 1]], // 3-bar
    [[1, 1], [1, 1]], // Square
    [[1, 1, 1], [0, 1, 0]], // T-shape
    [[1, 1, 0], [0, 1, 1]], // Z-shape
    [[1, 0], [1, 0], [1, 1]] // L-shape
];

class SeededRNG {
    constructor(seed) {
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    nextFloat() {
        // returns in range [0, 1]
        return this.nextInt() / (this.m - 1);
    }

    nextRange(min, max) {
        // returns in range [min, max)
        return min + Math.floor(this.nextFloat() * (max - min));
    }
}

function getRandomColor(rng) {
    if (rng) {
        return COLORS[Math.floor(rng.nextFloat() * COLORS.length)];
    }
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getRandomShape(rng) {
    if (rng) {
        return SHAPES[Math.floor(rng.nextFloat() * SHAPES.length)];
    }
    return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

function rotateMatrix(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    let result = Array(M).fill(0).map(() => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            result[j][N - 1 - i] = matrix[i][j];
        }
    }
    return result;
}
