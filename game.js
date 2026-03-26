/**
 * OCEAN INVADERS - Deep Sea Defense
 * A Space Invaders clone with underwater theme
 * 
 * Classes: SoundManager, Player, SeaCreature, AlienGrid, 
 *          Bullet, Barrier, Particle, Game
 */

// ============================================================
// SOUND MANAGER - Web Audio API Sound Effects
// ============================================================
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.audioCtx) return;
        
        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        switch(type) {
            case 'playerShoot':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'enemyShoot':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;

            case 'hit':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'playerHit':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;

            case 'barrierHit':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'win':
                this.playWinMelody();
                break;

            case 'gameOver':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(300, now + 0.2);
                osc.frequency.setValueAtTime(200, now + 0.4);
                osc.frequency.setValueAtTime(100, now + 0.6);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                break;

            case 'start':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(400, now + 0.1);
                osc.frequency.setValueAtTime(500, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
        }
    }

    playWinMelody() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + i * 0.15 + 0.3);
            osc.start(this.audioCtx.currentTime + i * 0.15);
            osc.stop(this.audioCtx.currentTime + i * 0.15 + 0.3);
        });
    }
}

// ============================================================
// PARTICLE - Explosion/Bubble Effects
// ============================================================
class Particle {
    constructor(x, y, color, velocityX, velocityY, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocityX;
        this.vy = velocityY;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// PARTICLE SYSTEM - Manages all particles
// ============================================================
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 4;
            const life = 0.3 + Math.random() * 0.4;
            this.particles.push(new Particle(x, y, color, vx, vy, size, life));
        }
    }

    createBubbles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 40;
            const vy = -30 - Math.random() * 50;
            const size = 2 + Math.random() * 3;
            const life = 0.5 + Math.random() * 0.5;
            this.particles.push(new Particle(x, y, '#88ffff', vx, vy, size, life));
        }
    }

    createInkSplat(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 4 + Math.random() * 6;
            const life = 0.4 + Math.random() * 0.3;
            this.particles.push(new Particle(x, y, '#000033', vx, vy, size, life));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return p.active;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

// ============================================================
// PLAYER - Yellow Submarine
// ============================================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.speed = 300;
        this.lives = 3;
        this.fireRate = 0.25; // seconds between shots
        this.lastFire = 0;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.pulsePhase = 0;
    }

    update(dt, keys, canvasWidth) {
        // Movement
        if (keys.left) {
            this.x -= this.speed * dt;
        }
        if (keys.right) {
            this.x += this.speed * dt;
        }

        // Boundaries
        if (this.x < this.width / 2) {
            this.x = this.width / 2;
        }
        if (this.x > canvasWidth - this.width / 2) {
            this.x = canvasWidth - this.width / 2;
        }

        // Invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Pulse animation
        this.pulsePhase += dt * 3;
    }

    canFire(currentTime) {
        return currentTime - this.lastFire >= this.fireRate;
    }

    fire(currentTime) {
        this.lastFire = currentTime;
        return new Bullet(this.x, this.y - this.height / 2, true);
    }

    hit() {
        this.lives--;
        this.invulnerable = true;
        this.invulnerableTime = 2;
        return this.lives <= 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.lives = 3;
        this.invulnerable = false;
    }

    draw(ctx) {
        ctx.save();
        
        // Flicker when invulnerable
        if (this.invulnerable && Math.floor(this.invulnerableTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        const pulse = Math.sin(this.pulsePhase) * 2;

        // Submarine body (yellow hull)
        ctx.fillStyle = '#f4d03f';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker hull outline
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Conning tower (top part)
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(this.x - 10, this.y - this.height / 2 - 8 + pulse, 20, 10);
        ctx.strokeStyle = '#c9a227';
        ctx.strokeRect(this.x - 10, this.y - this.height / 2 - 8 + pulse, 20, 10);

        // Periscope
        ctx.fillStyle = '#888';
        ctx.fillRect(this.x - 2, this.y - this.height / 2 - 16 + pulse, 4, 10);

        // Viewport (window)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#008888';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Propeller area
        ctx.fillStyle = '#888';
        ctx.fillRect(this.x + this.width / 2 - 5, this.y - 8, 8, 16);

        // Propeller blades (animated)
        ctx.fillStyle = '#666';
        const propAngle = this.pulsePhase * 5;
        for (let i = 0; i < 3; i++) {
            const angle = propAngle + (Math.PI * 2 / 3) * i;
            ctx.save();
            ctx.translate(this.x + this.width / 2 + 2, this.y);
            ctx.rotate(angle);
            ctx.fillRect(-2, -10, 4, 10);
            ctx.restore();
        }

        // Bubbles from propeller
        ctx.fillStyle = 'rgba(136, 255, 255, 0.5)';
        for (let i = 0; i < 3; i++) {
            const bx = this.x + this.width / 2 + 10 + i * 5;
            const by = this.y + Math.sin(this.pulsePhase * 2 + i) * 5;
            ctx.beginPath();
            ctx.arc(bx, by, 2 + i, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2 + 5,
            y: this.y - this.height / 2 + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

// ============================================================
// SEA CREATURE - Individual alien creatures
// ============================================================
class SeaCreature {
    constructor(x, y, type, row) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.row = row;
        this.width = 40;
        this.height = 30;
        this.active = true;
        this.animFrame = 0;
        this.animTimer = 0;
        
        // Type-specific properties
        switch(type) {
            case 'jellyfish':
                this.speedMult = 0.5;
                this.points = 30;
                this.color = '#ff69b4';
                this.secondaryColor = '#ff1493';
                break;
            case 'octopus':
                this.speedMult = 0.75;
                this.points = 20;
                this.color = '#9370db';
                this.secondaryColor = '#8a2be2';
                break;
            case 'squid':
                this.speedMult = 1.0;
                this.points = 20;
                this.color = '#20b2aa';
                this.secondaryColor = '#008b8b';
                break;
            case 'pufferfish':
                this.speedMult = 1.25;
                this.points = 10;
                this.color = '#ffd700';
                this.secondaryColor = '#ff8c00';
                break;
            case 'shark':
                this.speedMult = 1.5;
                this.points = 10;
                this.color = '#708090';
                this.secondaryColor = '#4a5568';
                break;
        }
    }

    update(dt) {
        this.animTimer += dt;
        if (this.animTimer >= 0.3) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;

        switch(this.type) {
            case 'jellyfish':
                this.drawJellyfish(ctx);
                break;
            case 'octopus':
                this.drawOctopus(ctx);
                break;
            case 'squid':
                this.drawSquid(ctx);
                break;
            case 'pufferfish':
                this.drawPufferfish(ctx);
                break;
            case 'shark':
                this.drawShark(ctx);
                break;
        }

        ctx.restore();
    }

    drawJellyfish(ctx) {
        const wobble = Math.sin(this.animTimer * 4) * 3;
        
        // Bell (top dome)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 8, 18 + wobble, 14, 0, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Inner glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 10, 10, 8, 0, Math.PI, 0);
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const tx = this.x - 12 + i * 6;
            const wave = Math.sin(this.animTimer * 3 + i) * 4;
            ctx.beginPath();
            ctx.moveTo(tx, this.y - 2);
            ctx.quadraticCurveTo(tx + wave, this.y + 10, tx + wave * 0.5, this.y + 20);
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 8, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 8, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawOctopus(ctx) {
        const pulse = this.animFrame === 0 ? 0 : 2;
        
        // Head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, 16 + pulse, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head details
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 8, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 7, this.y - 6, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 7, this.y - 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI + (Math.PI / 5) * (i - 2.5);
            const wave = Math.sin(this.animTimer * 4 + i) * 3;
            const tx = this.x + Math.cos(angle) * 12;
            const ty = this.y + 8;
            const tx2 = tx + wave;
            const ty2 = ty + 12;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.quadraticCurveTo(tx2, ty + 6, tx2, ty2);
            ctx.stroke();
        }
    }

    drawSquid(ctx) {
        const mantleHeight = this.animFrame === 0 ? 25 : 22;
        
        // Mantle (main body)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, 10, mantleHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Fins
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y - 10);
        ctx.lineTo(this.x - 15, this.y - 5);
        ctx.lineTo(this.x - 8, this.y);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 8, this.y - 10);
        ctx.lineTo(this.x + 15, this.y - 5);
        ctx.lineTo(this.x + 8, this.y);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y + 2, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y + 2, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const tx = this.x - 7 + i * 2;
            const wave = Math.sin(this.animTimer * 5 + i * 0.5) * 3;
            ctx.beginPath();
            ctx.moveTo(tx, this.y + mantleHeight / 2 - 2);
            ctx.quadraticCurveTo(tx + wave, this.y + mantleHeight / 2 + 5, tx + wave, this.y + mantleHeight / 2 + 12);
            ctx.stroke();
        }
    }

    drawPufferfish(ctx) {
        const puff = this.animFrame === 0 ? 0 : 3;
        const size = 14 + puff;
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spots
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(this.x - 3, this.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Fins
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(this.x - 18, this.y, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.ellipse(this.x + 18, this.y, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y + 4, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    drawShark(ctx) {
        const lunge = this.animFrame === 0 ? 0 : 4;
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x - 20 - lunge, this.y);
        ctx.quadraticCurveTo(this.x - 10 - lunge, this.y - 12, this.x + 15, this.y - 5);
        ctx.lineTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 15, this.y + 5);
        ctx.quadraticCurveTo(this.x - 10 - lunge, this.y + 8, this.x - 20 - lunge, this.y);
        ctx.fill();
        ctx.stroke();

        // Dorsal fin
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x + 5, this.y - 18);
        ctx.lineTo(this.x + 12, this.y - 8);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(this.x - 18 - lunge, this.y);
        ctx.lineTo(this.x - 28 - lunge, this.y - 10);
        ctx.lineTo(this.x - 22 - lunge, this.y);
        ctx.lineTo(this.x - 28 - lunge, this.y + 6);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 11, this.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Gills
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + 2 + i * 4, this.y - 5);
            ctx.lineTo(this.x + 2 + i * 4, this.y + 3);
            ctx.stroke();
        }

        // Teeth hint
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(this.x + 18, this.y - 2);
        ctx.lineTo(this.x + 20, this.y + 2);
        ctx.lineTo(this.x + 16, this.y + 2);
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================================
// ALIEN GRID - Manages sea creature formation
// ============================================================
class AlienGrid {
    constructor(x, y, cols, rows) {
        this.x = x;
        this.y = y;
        this.cols = cols;
        this.rows = rows;
        this.creatures = [];
        this.direction = 1; // 1 = right, -1 = left
        this.baseSpeed = 50;
        this.moveTimer = 0;
        this.moveInterval = 1.0; // seconds between moves
        this.dropAmount = 20;
        this.shootTimer = 0;
        this.shootInterval = 1.5;
        this.active = true;

        this.initCreatures();
    }

    initCreatures() {
        const types = ['jellyfish', 'octopus', 'squid', 'pufferfish', 'shark'];
        const spacingX = 55;
        const spacingY = 45;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const type = types[row];
                const cx = this.x + col * spacingX;
                const cy = this.y + row * spacingY;
                this.creatures.push(new SeaCreature(cx, cy, type, row));
            }
        }
    }

    getActiveCreatures() {
        return this.creatures.filter(c => c.active);
    }

    update(dt, canvasWidth) {
        const active = this.getActiveCreatures();
        if (active.length === 0) {
            this.active = false;
            return;
        }

        // Speed increases as creatures die
        const speedMult = 1 + (1 - active.length / this.creatures.length) * 2;
        const currentSpeed = this.baseSpeed * speedMult;
        this.moveInterval = Math.max(0.1, 1.0 / speedMult);

        // Movement timer
        this.moveTimer += dt;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.moveGroup();
        }

        // Update individual creatures
        this.creatures.forEach(c => c.update(dt));

        // Shooting timer
        this.shootTimer += dt;
    }

    moveGroup() {
        const active = this.getActiveCreatures();
        if (active.length === 0) return;

        // Find boundaries
        let minX = Infinity, maxX = -Infinity;
        active.forEach(c => {
            minX = Math.min(minX, c.x - c.width / 2);
            maxX = Math.max(maxX, c.x + c.width / 2);
        });

        const moveAmount = 15;

        // Check if we need to change direction
        if ((this.direction > 0 && maxX + moveAmount > 750) ||
            (this.direction < 0 && minX - moveAmount < 50)) {
            // Drop down and reverse
            this.creatures.forEach(c => {
                if (c.active) c.y += this.dropAmount;
            });
            this.direction *= -1;
        } else {
            // Move horizontally
            this.creatures.forEach(c => {
                if (c.active) c.x += moveAmount * this.direction;
            });
        }
    }

    canShoot() {
        if (this.shootTimer < this.shootInterval) return false;
        const active = this.getActiveCreatures();
        if (active.length === 0) return false;
        this.shootTimer = 0;
        return true;
    }

    getRandomShooter() {
        const active = this.getActiveCreatures();
        if (active.length === 0) return null;

        // Get creatures at the bottom of each column
        const bottomCreatures = [];
        const columns = {};

        active.forEach(c => {
            const col = Math.round(c.x / 55);
            if (!columns[col] || c.y > columns[col].y) {
                columns[col] = c;
            }
        });

        Object.values(columns).forEach(c => bottomCreatures.push(c));
        
        if (bottomCreatures.length === 0) return null;
        return bottomCreatures[Math.floor(Math.random() * bottomCreatures.length)];
    }

    getLowestY() {
        const active = this.getActiveCreatures();
        if (active.length === 0) return 0;
        return Math.max(...active.map(c => c.y + c.height / 2));
    }

    draw(ctx) {
        this.creatures.forEach(c => c.draw(ctx));
    }
}

// ============================================================
// BULLET - Bubble projectiles
// ============================================================
class Bullet {
    constructor(x, y, isPlayer) {
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.width = 8;
        this.height = 12;
        this.speed = isPlayer ? -400 : 200;
        this.active = true;
        this.wobblePhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.y += this.speed * dt;
        this.wobblePhase += dt * 10;
        
        // Check bounds
        if (this.y < -20 || this.y > 620) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const wobble = Math.sin(this.wobblePhase) * 2;

        // Bubble outline
        ctx.strokeStyle = this.isPlayer ? '#00ffff' : '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x + wobble, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Bubble fill with transparency
        ctx.fillStyle = this.isPlayer ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 107, 107, 0.3)';
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x + wobble - 2, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================================
// BARRIER - Coral Reef destructible barriers
// ============================================================
class Barrier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 50;
        this.segments = 4; // Number of damage segments
        this.health = this.segments;
        this.active = true;
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
        }
        return this.health <= 0;
    }

    draw(ctx) {
        if (!this.active) return;

        const healthRatio = this.health / this.segments;

        // Coral base shape
        ctx.fillStyle = `hsl(${15 + (1 - healthRatio) * 20}, 70%, ${50 + (1 - healthRatio) * 20}%)`;

        // Draw coral branches based on health
        const branchCount = Math.ceil(healthRatio * 5);

        // Main coral body
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y + this.height / 2);
        
        // Bottom curve
        ctx.quadraticCurveTo(this.x - this.width / 3, this.y + this.height / 3, 
                             this.x - this.width / 4, this.y);
        
        // Left branches
        for (let i = 0; i < branchCount; i++) {
            const bx = this.x - this.width / 4 - i * 10;
            const by = this.y - i * 8;
            ctx.lineTo(bx - 8, by - 15);
            ctx.lineTo(bx - 4, by);
        }

        // Center branches
        ctx.lineTo(this.x, this.y - this.height / 2 - 10);
        ctx.lineTo(this.x + 5, this.y);

        // Right branches
        for (let i = 0; i < branchCount; i++) {
            const bx = this.x + this.width / 4 + i * 10;
            const by = this.y - i * 8;
            ctx.lineTo(bx + 8, by - 15);
            ctx.lineTo(bx + 4, by);
        }

        // Right side
        ctx.quadraticCurveTo(this.x + this.width / 3, this.y + this.height / 3, 
                             this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.closePath();
        ctx.fill();

        // Coral texture dots
        ctx.fillStyle = `hsl(${20}, 60%, ${40 + (1 - healthRatio) * 20}%)`;
        for (let i = 0; i < 8 * healthRatio; i++) {
            const dx = (Math.random() - 0.5) * this.width * 0.8;
            const dy = (Math.random() - 0.5) * this.height * 0.6;
            ctx.beginPath();
            ctx.arc(this.x + dx, this.y + dy, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Darken damaged areas
        if (healthRatio < 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(1 - healthRatio) * 0.3})`;
            ctx.fillRect(this.x - this.width / 2, this.y + this.height / 4, 
                        this.width, this.height / 4);
        }
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================================
// GAME - Main game controller
// ============================================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameOver, win
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('oceanInvadersHigh')) || 0;
        
        // Game objects
        this.player = null;
        this.alienGrid = null;
        this.playerBullets = [];
        this.alienBullets = [];
        this.barriers = [];
        this.particles = new ParticleSystem();
        this.sound = new SoundManager();
        
        // Input state
        this.keys = {
            left: false,
            right: false,
            fire: false
        };
        
        // Touch controls
        this.touch = {
            active: false,
            moveX: 0
        };
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Background bubbles
        this.bgBubbles = [];
        this.initBgBubbles();
        
        // Initialize
        this.init();
        this.setupEventListeners();
        this.updateHUD();
        
        // Start game loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initBgBubbles() {
        for (let i = 0; i < 20; i++) {
            this.bgBubbles.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: 1 + Math.random() * 3,
                speed: 10 + Math.random() * 20,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }

    init() {
        this.player = new Player(400, 550);
        this.alienGrid = new AlienGrid(100, 80, 11, 5);
        this.playerBullets = [];
        this.alienBullets = [];
        this.barriers = [];
        this.particles.clear();
        
        // Create coral barriers
        const barrierPositions = [120, 280, 440, 600];
        barrierPositions.forEach(x => {
            this.barriers.push(new Barrier(x, 480));
        });
    }

    reset() {
        this.score = 0;
        this.init();
        this.state = 'playing';
        this.hideAllOverlays();
        this.sound.play('start');
        this.updateHUD();
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent scrolling
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        // Buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.sound.init();
            this.reset();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resume();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('win-restart-btn').addEventListener('click', () => {
            this.reset();
        });

        // Touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        const joystickZone = document.getElementById('joystick-zone');
        const joystickStick = document.getElementById('joystick-stick');
        const fireZone = document.getElementById('fire-zone');
        
        let joystickTouch = null;
        
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickTouch = e.touches[0];
            this.touch.active = true;
        });
        
        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches[0]) {
                const rect = joystickZone.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const moveX = e.touches[0].clientX - centerX;
                const clampedX = Math.max(-50, Math.min(50, moveX));
                joystickStick.style.transform = `translateX(${clampedX}px)`;
                this.touch.moveX = clampedX / 50;
            }
        });
        
        joystickZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            joystickStick.style.transform = 'translateX(0)';
            this.touch.active = false;
            this.touch.moveX = 0;
        });
        
        fireZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.fire = true;
        });
        
        fireZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.fire = false;
        });
    }

    handleKeyDown(e) {
        // Initialize sound on first interaction
        if (!this.sound.initialized) {
            this.sound.init();
        }

        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                e.preventDefault();
                break;
            case 'Space':
                this.keys.fire = true;
                e.preventDefault();
                break;
            case 'KeyW':
            case 'ArrowUp':
                this.keys.fire = true;
                e.preventDefault();
                break;
            case 'KeyP':
                if (this.state === 'playing') {
                    this.pause();
                } else if (this.state === 'paused') {
                    this.resume();
                }
                e.preventDefault();
                break;
            case 'KeyR':
                if (this.state === 'gameOver' || this.state === 'win' || this.state === 'playing') {
                    this.reset();
                }
                e.preventDefault();
                break;
        }
    }

    handleKeyUp(e) {
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
            case 'KeyW':
            case 'ArrowUp':
                this.keys.fire = false;
                break;
        }
    }

    pause() {
        this.state = 'paused';
        document.getElementById('pause-screen').classList.remove('hidden');
    }

    resume() {
        this.state = 'playing';
        document.getElementById('pause-screen').classList.add('hidden');
    }

    showGameOver() {
        this.state = 'gameOver';
        this.sound.play('gameOver');
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-high').textContent = this.highScore;
        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    showWin() {
        this.state = 'win';
        this.sound.play('win');
        document.getElementById('win-score').textContent = this.score;
        document.getElementById('win-high').textContent = this.highScore;
        document.getElementById('win-screen').classList.remove('hidden');
    }

    hideAllOverlays() {
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        
        const livesContainer = document.getElementById('lives');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.player.lives; i++) {
            const life = document.createElement('div');
            life.className = 'life-icon';
            livesContainer.appendChild(life);
        }
    }

    checkCollision(a, b) {
        const boundsA = a.getBounds();
        const boundsB = b.getBounds();
        return boundsA.x < boundsB.x + boundsB.width &&
               boundsA.x + boundsA.width > boundsB.x &&
               boundsA.y < boundsB.y + boundsB.height &&
               boundsA.y + boundsA.height > boundsB.y;
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // Touch input
        if (this.touch.active) {
            this.keys.left = this.touch.moveX < -0.2;
            this.keys.right = this.touch.moveX > 0.2;
        }

        // Update player
        this.player.update(dt, this.keys, this.canvas.width);

        // Player shooting
        if (this.keys.fire && this.player.canFire(this.lastTime / 1000)) {
            this.playerBullets.push(this.player.fire(this.lastTime / 1000));
            this.sound.play('playerShoot');
        }

        // Update alien grid
        this.alienGrid.update(dt, this.canvas.width);

        // Alien shooting
        if (this.alienGrid.canShoot()) {
            const shooter = this.alienGrid.getRandomShooter();
            if (shooter) {
                this.alienBullets.push(new Bullet(shooter.x, shooter.y + 15, false));
                this.sound.play('enemyShoot');
            }
        }

        // Update bullets
        this.playerBullets.forEach(b => b.update(dt));
        this.alienBullets.forEach(b => b.update(dt));
        this.playerBullets = this.playerBullets.filter(b => b.active);
        this.alienBullets = this.alienBullets.filter(b => b.active);

        // Update particles
        this.particles.update(dt);

        // Update background bubbles
        this.bgBubbles.forEach(b => {
            b.y -= b.speed * dt;
            b.wobble += dt * 2;
            b.x += Math.sin(b.wobble) * 0.5;
            if (b.y < -10) {
                b.y = 610;
                b.x = Math.random() * 800;
            }
        });

        // Collision: Player bullets vs Aliens
        this.playerBullets.forEach(bullet => {
            if (!bullet.active) return;
            this.alienGrid.creatures.forEach(creature => {
                if (!creature.active) return;
                if (this.checkCollision(bullet, creature)) {
                    bullet.active = false;
                    creature.active = false;
                    this.score += creature.points;
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('oceanInvadersHigh', this.highScore);
                    }
                    this.updateHUD();
                    this.particles.createExplosion(creature.x, creature.y, creature.color, 12);
                    this.particles.createBubbles(creature.x, creature.y, 8);
                    this.sound.play('hit');
                }
            });
        });

        // Collision: Player bullets vs Barriers
        this.playerBullets.forEach(bullet => {
            if (!bullet.active) return;
            this.barriers.forEach(barrier => {
                if (!barrier.active) return;
                if (this.checkCollision(bullet, barrier)) {
                    bullet.active = false;
                    barrier.hit();
                    this.particles.createExplosion(bullet.x, bullet.y, '#c9a227', 5);
                    this.sound.play('barrierHit');
                }
            });
        });

        // Collision: Alien bullets vs Player
        if (!this.player.invulnerable) {
            this.alienBullets.forEach(bullet => {
                if (!bullet.active) return;
                if (this.checkCollision(bullet, this.player)) {
                    bullet.active = false;
                    if (this.player.hit()) {
                        this.showGameOver();
                    } else {
                        this.particles.createExplosion(this.player.x, this.player.y, '#f4d03f', 15);
                        this.sound.play('playerHit');
                        this.updateHUD();
                    }
                }
            });
        }

        // Collision: Alien bullets vs Barriers
        this.alienBullets.forEach(bullet => {
            if (!bullet.active) return;
            this.barriers.forEach(barrier => {
                if (!barrier.active) return;
                if (this.checkCollision(bullet, barrier)) {
                    bullet.active = false;
                    barrier.hit();
                    this.particles.createExplosion(bullet.x, bullet.y, '#c9a227', 5);
                    this.sound.play('barrierHit');
                }
            });
        });

        // Collision: Aliens vs Barriers (barriers block aliens)
        this.alienGrid.creatures.forEach(creature => {
            if (!creature.active) return;
            this.barriers.forEach(barrier => {
                if (!barrier.active) return;
                if (this.checkCollision(creature, barrier)) {
                    barrier.hit();
                }
            });
        });

        // Win condition: All aliens destroyed
        if (!this.alienGrid.active) {
            this.showWin();
        }

        // Lose condition: Aliens reach bottom or hit player
        const lowestAlien = this.alienGrid.getLowestY();
        if (lowestAlien >= this.player.y - 30) {
            this.showGameOver();
        }
    }

    drawBackground() {
        const ctx = this.ctx;
        
        // Ocean gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#006666');
        gradient.addColorStop(0.3, '#003366');
        gradient.addColorStop(0.7, '#001a33');
        gradient.addColorStop(1, '#000033');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Light rays from top
        ctx.save();
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 5; i++) {
            const x = 100 + i * 150;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 60, this.canvas.height);
            ctx.lineTo(x + 100, this.canvas.height);
            ctx.lineTo(x + 40, 0);
            ctx.fill();
        }
        ctx.restore();

        // Background bubbles
        ctx.fillStyle = 'rgba(136, 255, 255, 0.2)';
        this.bgBubbles.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Sandy bottom
        const sandGradient = ctx.createLinearGradient(0, 560, 0, 600);
        sandGradient.addColorStop(0, 'rgba(244, 208, 63, 0.3)');
        sandGradient.addColorStop(1, 'rgba(244, 208, 63, 0.6)');
        ctx.fillStyle = sandGradient;
        ctx.fillRect(0, 560, this.canvas.width, 40);

        // Sand texture
        ctx.fillStyle = 'rgba(201, 162, 39, 0.3)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 27) % 800;
            const y = 570 + (i % 3) * 8;
            ctx.beginPath();
            ctx.arc(x, y, 1 + (i % 2), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    draw() {
        const ctx = this.ctx;
        
        // Clear and draw background
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();

        // Draw game objects
        this.barriers.forEach(b => b.draw(ctx));
        this.alienGrid.draw(ctx);
        this.player.draw(ctx);
        this.playerBullets.forEach(b => b.draw(ctx));
        this.alienBullets.forEach(b => b.draw(ctx));
        this.particles.draw(ctx);
    }

    gameLoop(currentTime) {
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent huge jumps
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }

        // Update and draw
        this.update(this.deltaTime);
        this.draw();

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ============================================================
// INITIALIZE GAME
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
