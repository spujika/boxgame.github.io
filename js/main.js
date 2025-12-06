// Start the game
document.addEventListener('DOMContentLoaded', () => {
    // Settings Menu Logic
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const muteToggle = document.getElementById('mute-toggle');

    // Check if elements exist before adding listeners (safety check)
    if (settingsBtn && settingsModal && muteToggle) {
        function openSettings() {
            settingsModal.classList.remove('hidden');
            // Update toggle state to match current sound manager state
            // Update toggle state to match current sound manager state
            if (window.game && window.game.soundManager) {
                muteToggle.checked = !window.game.soundManager.enabled;
            }
        }

        function closeSettings() {
            settingsModal.classList.add('hidden');
        }

        settingsBtn.addEventListener('click', openSettings);

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', closeSettings);
        }

        // Close on click outside
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettings();
            }
        });

        // Mute Toggle
        muteToggle.addEventListener('change', (e) => {
            if (window.game && window.game.soundManager) {
                window.game.soundManager.enabled = !e.target.checked;
                // Optional: Save preference to localStorage
                localStorage.setItem('boxGameMuted', !window.game.soundManager.enabled);
            }
        });

        // Load mute preference

        // Theme Switching
        const themeBtns = document.querySelectorAll('.theme-btn');

        function setTheme(theme) {
            // Set the theme attribute (even for default)
            document.documentElement.setAttribute('data-theme', theme);

            // Update active button state
            themeBtns.forEach(btn => {
                if (btn.dataset.theme === theme) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Save preference
            localStorage.setItem('boxGameTheme', theme);
        }

        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setTheme(btn.dataset.theme);
            });
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('boxGameTheme') || 'default';
        setTheme(savedTheme);
    }

    window.game = new Game();

    // Load mute preference
    const savedMuted = localStorage.getItem('boxGameMuted');
    if (savedMuted === 'true' && window.game && window.game.soundManager) {
        window.game.soundManager.enabled = false;
        if (muteToggle) muteToggle.checked = true;
    }
});
