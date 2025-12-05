/* Utils */
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

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getRandomShape() {
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
