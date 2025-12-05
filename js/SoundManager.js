class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.unlocked = false;
    }

    unlock() {
        if (this.unlocked) return;

        // Resume context if suspended (common in Chrome/Edge)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.unlocked = true;
                console.log('AudioContext resumed');
            });
        } else {
            this.unlocked = true;
        }

        // Play silent buffer to unlock iOS
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
    }

    play(soundName) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        switch (soundName) {
            case 'pickup':
                this.playPickup();
                break;
            case 'drop':
                this.playDrop();
                break;
            case 'reset':
                this.playReset();
                break;
            case 'win':
                this.playWin();
                break;
        }
    }

    playPickup() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playDrop() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle'; // Wood-like thud
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playReset() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playWin() {
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A major chord

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 1.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 1.5);
        });
    }
}
