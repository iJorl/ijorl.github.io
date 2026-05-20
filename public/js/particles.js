// Particle System for Hero Image Hover Effect

class Particle {
  constructor(x, y, vx, vy, centerX, centerY) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.centerX = centerX;
    this.centerY = centerY;
    this.life = 1.0; // 0 to 1, starts at full opacity
    this.decay = Math.random() * 0.015 + 0.01; // Random decay rate
    this.radius = Math.random() * 2.5 + 1.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98; // Slight friction
    this.vy *= 0.98;
    this.life -= this.decay;
  }

  draw(ctx) {
    // Calculate distance from center for alpha falloff
    const dx = this.x - this.centerX;
    const dy = this.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 300; // Distance at which alpha becomes 0
    const distanceFactor = Math.max(0, 1 - distance / maxDistance);
    const alpha = this.life * 0.7 * distanceFactor;

    ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`; // Blue with variable alpha
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  isAlive() {
    return this.life > 0;
  }
}

class ParticleSystem {
  constructor(canvasId, imageSelector) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.image = document.querySelector(imageSelector);
    this.particles = [];
    this.isHovering = false;
    this.spawnRatePerMs = 0.8; // Particles per millisecond while hovering
    this.lastSpawnTime = 0;
    this.imageRect = null;
    this.connectionDistance = 120; // Distance to form edges

    this.setupCanvas();
    this.setupEventListeners();
    this.animate();
  }

  setupCanvas() {
    const updateCanvasSize = () => {
      if (this.image && this.canvas.parentElement) {
        const imageRect = this.image.getBoundingClientRect();

        // Canvas should be much larger than the image (4x width, 3x height)
        const canvasWidth = imageRect.width * 4;
        const canvasHeight = imageRect.height * 3;

        // Image will be centered in the canvas
        const imageLeftInCanvas = (canvasWidth - imageRect.width) / 2;
        const imageTopInCanvas = (canvasHeight - imageRect.height) / 2;

        // Store image position relative to the canvas
        this.imageRect = {
          width: imageRect.width,
          height: imageRect.height,
          left: imageLeftInCanvas,
          top: imageTopInCanvas
        };

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', () => updateCanvasSize());
  }

  setupEventListeners() {
    this.canvas.addEventListener('mouseenter', () => {
      this.isHovering = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isHovering = false;
    });
  }

  spawnParticles(currentTime) {
    if (!this.isHovering || !this.imageRect) return;

    // Time-based spawning: spawn particles based on elapsed time
    const timeDelta = currentTime - this.lastSpawnTime;
    const particlesToSpawn = Math.floor(timeDelta * this.spawnRatePerMs);

    if (particlesToSpawn === 0) return;

    this.lastSpawnTime = currentTime;

    const imageWidth = this.imageRect.width;
    const imageHeight = this.imageRect.height;
    const centerX = this.imageRect.left + imageWidth / 2;
    const centerY = this.imageRect.top + imageHeight / 2;
    const imageRadius = Math.max(imageWidth, imageHeight) / 2;

    for (let i = 0; i < particlesToSpawn; i++) {
      // Spawn particles only outside the image boundary
      const angle = Math.random() * Math.PI * 2;
      const minDistance = imageRadius + 10; // Start outside image
      const distance = Math.random() * 50 + minDistance;

      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Velocity pointing away from center
      const speed = Math.random() * 2 + 1.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.particles.push(new Particle(x, y, vx, vy, centerX, centerY));
    }
  }

  lineIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
    // Check if a line segment intersects with a circle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return false;

    const discriminantSqrt = Math.sqrt(discriminant);
    const t1 = (-b - discriminantSqrt) / (2 * a);
    const t2 = (-b + discriminantSqrt) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
  }

  drawEdges() {
    if (!this.imageRect) return;

    const imageWidth = this.imageRect.width;
    const imageHeight = this.imageRect.height;
    const centerX = this.imageRect.left + imageWidth / 2;
    const centerY = this.imageRect.top + imageHeight / 2;
    const imageRadius = Math.max(imageWidth, imageHeight) / 2;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectionDistance) {
          // Check if edge passes through the image
          const intersectsImage = this.lineIntersectsCircle(
            this.particles[i].x,
            this.particles[i].y,
            this.particles[j].x,
            this.particles[j].y,
            centerX,
            centerY,
            imageRadius
          );

          if (!intersectsImage) {
            const alpha = (1 - distance / this.connectionDistance) * 0.3;
            this.ctx.strokeStyle = `rgba(128, 128, 128, ${alpha})`; // Gray edges
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.stroke();
          }
        }
      }
    }
  }

  animate() {
    // Clear canvas
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Spawn new particles while hovering
    this.spawnParticles(performance.now());

    // Update and draw particles
    this.particles = this.particles.filter(p => {
      p.update();
      p.draw(this.ctx);
      return p.isAlive();
    });

    // Draw edges between nearby particles
    this.drawEdges();

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize particle system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ParticleSystem('particle-canvas', '.hero-image img');
});
