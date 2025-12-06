class Confetti {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    }

    init(container = document.body) {
        if (this.canvas) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'confetti-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1'; // Behind content

        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    start(container) {
        this.init(container);
        this.particles = [];
        this.createParticles();
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null;
        }
        this.particles = [];
    }

    createParticles() {
        const particleCount = 200;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // Get theme colors
        let style = getComputedStyle(document.body);
        let themeColors = [
            style.getPropertyValue('--color-1').trim(),
            style.getPropertyValue('--color-2').trim(),
            style.getPropertyValue('--color-3').trim(),
            style.getPropertyValue('--color-4').trim(),
            style.getPropertyValue('--color-5').trim()
        ].filter(c => c !== '');

        // Fallback for first load if body doesn't have theme yet? 
        // Usually theme is on :root or passed via class. 
        // Themes.css uses [data-theme="..."] selector. 
        // If getting from body fails (if theme attribute is on something else), try documentElement.
        if (themeColors.length === 0) {
            style = getComputedStyle(document.documentElement);
            themeColors = [
                style.getPropertyValue('--color-1').trim(),
                style.getPropertyValue('--color-2').trim(),
                style.getPropertyValue('--color-3').trim(),
                style.getPropertyValue('--color-4').trim(),
                style.getPropertyValue('--color-5').trim()
            ].filter(c => c !== '');
        }

        const useColors = themeColors.length > 0 ? themeColors : this.colors;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Increase velocity for higher burst (screen max height approx)
            const velocity = Math.random() * 25 + 10;

            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: useColors[Math.floor(Math.random() * useColors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }
    }

    animate() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeParticles = false;

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            // Physics
            p.vy += 0.2; // Gravity
            p.vx *= 0.96; // Air resistance
            p.vy *= 0.96;

            // Keep alive if within bounds or slightly outside
            if (p.y < this.canvas.height + 100 && p.x > -100 && p.x < this.canvas.width + 100) {
                activeParticles = true;

                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                this.ctx.restore();
            }
        });

        if (activeParticles) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
}
