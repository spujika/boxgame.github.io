/* UIManager */
class UIManager {
    constructor() {
        this.tray = document.getElementById('tray-container');
        this.targetContainer = document.getElementById('target-preview');
        this.winScreen = document.getElementById('win-screen');
        this.levelIndicator = document.getElementById('level-indicator');
        this.scrollHints = {
            left: document.querySelector('.scroll-hint.left'),
            right: document.querySelector('.scroll-hint.right')
        };
    }

    init(game) {
        this.game = game;
        if (this.tray) {
            this.tray.addEventListener('scroll', () => this.updateTrayScrollIndicators());
        }
    }

    renderTarget(pattern) {
        if (!this.targetContainer) return;

        this.targetContainer.style.gridTemplateRows = `repeat(${pattern.length}, 1fr)`;
        this.targetContainer.style.gridTemplateColumns = `repeat(${pattern[0].length}, 1fr)`;
        this.targetContainer.innerHTML = '';

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
                this.targetContainer.appendChild(cell);
            });
        });
    }

    updateTrayScrollIndicators() {
        if (!this.tray || !this.scrollHints.left || !this.scrollHints.right) return;

        // Check scroll position
        const scrollLeft = this.tray.scrollLeft;
        const scrollWidth = this.tray.scrollWidth;
        const clientWidth = this.tray.clientWidth;

        // Show/hide left hint
        if (scrollLeft > 10) {
            this.scrollHints.left.classList.add('visible');
        } else {
            this.scrollHints.left.classList.remove('visible');
        }

        // Show/hide right hint
        if (scrollWidth - scrollLeft - clientWidth > 10) {
            this.scrollHints.right.classList.add('visible');
        } else {
            this.scrollHints.right.classList.remove('visible');
        }
    }

    shakePiece(piece) {
        if (!piece || !piece.element) return;

        piece.element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 200,
            iterations: 1
        });
    }

    showWinScreen(onNextLevel) {
        if (!this.winScreen) return;

        this.winScreen.classList.remove('hidden');

        // Setup next level button
        const btn = document.getElementById('next-level-btn');
        if (btn) {
            btn.onclick = () => {
                this.winScreen.classList.add('hidden');
                if (onNextLevel) onNextLevel();
            };
        }
    }

    updateLevelIndicator(level) {
        if (this.levelIndicator) {
            this.levelIndicator.innerText = `Level ${level}`;
        }
    }

    clearTray() {
        if (this.tray) {
            this.tray.innerHTML = '';
        }
    }

    addPieceToTray(element) {
        if (this.tray) {
            this.tray.appendChild(element);
        }
    }
}
