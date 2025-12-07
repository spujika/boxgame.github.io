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
        this.confetti = new Confetti();
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

    toggleHud(show) {
        const hud = document.getElementById('hud-stats');
        if (hud) {
            hud.classList.toggle('hidden', !show);
        }
    }

    toggleHudShare(show) {
        const btn = document.getElementById('hud-share-btn');
        if (btn) {
            btn.classList.toggle('hidden', !show);
        }
    }

    updateTimer(time) {
        const el = document.getElementById('timer-display');
        if (el) el.innerText = time;
    }

    updateMistakes(count) {
        const el = document.getElementById('mistakes-display');
        if (el) el.innerText = count;
    }

    showWinScreen(onNextLevel, stats) {
        if (!this.winScreen) return;

        this.winScreen.classList.remove('hidden');
        this.confetti.start(this.winScreen);

        const btn = document.getElementById('next-level-btn');
        const shareBtn = document.getElementById('share-btn');
        const statsEl = document.getElementById('win-stats');

        // Reset display
        if (statsEl) statsEl.classList.add('hidden');
        if (shareBtn) shareBtn.classList.add('hidden');
        if (btn) btn.classList.remove('hidden');

        // Daily Challenge Mode
        if (stats && stats.isDaily) {
            if (btn) btn.innerText = "Back to Menu"; // Or "Exit Daily Mode"

            if (statsEl) {
                statsEl.innerHTML = `<p>Time: ${stats.time}</p><p>Mistakes: ${stats.mistakes}</p>`;
                statsEl.classList.remove('hidden');
            }

            if (shareBtn) {
                shareBtn.classList.remove('hidden');
                shareBtn.onclick = () => this.handleShare(stats);
            }
        } else {
            if (btn) btn.innerText = "Next Level";
        }

        if (btn) {
            btn.onclick = () => {
                this.winScreen.classList.add('hidden');
                this.confetti.stop();
                if (onNextLevel) onNextLevel();
            };
        }
    }

    async handleShare(stats) {
        const date = new Date().toISOString().slice(0, 10);
        const emojiGrid = this.generateEmojiGrid(stats.targetPattern);
        const text = `Box Game Daily ${date}\n${emojiGrid}\nTime: ${stats.time} | Mistakes: ${stats.mistakes}\nhttp://boxgame.454546.xyz`;

        try {
            await navigator.clipboard.writeText(text);
            const shareBtn = document.getElementById('share-btn');
            const originalText = shareBtn.innerHTML;
            shareBtn.innerText = "Copied!";
            setTimeout(() => shareBtn.innerHTML = originalText, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback?
        }
    }

    generateEmojiGrid(pattern) {
        // Map colors to emojis
        // We need to know which color var corresponds to which emoji roughly
        // Variables: --color-1 (Red), --color-2 (Yellow), --color-3 (Green), --color-4 (Blue), --color-5 (Purple)
        // Since we store exact color strings (e.g. "var(--color-1)"), we can map them.

        const colorMap = {
            'var(--color-1)': '🟥',
            'var(--color-2)': '🟨',
            'var(--color-3)': '🟩',
            'var(--color-4)': '🟦',
            'var(--color-5)': '🟪'
        };

        return pattern.map(row => {
            return row.map(cell => {
                if (!cell) return '⬛'; // Empty/Black
                return colorMap[cell] || '⬜'; // Unknown
            }).join('');
        }).join('\n');
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
