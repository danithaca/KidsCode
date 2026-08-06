const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 600;

const keys = {};
let score = 0;
let coinCount = 0;
let bombCount = 0;
let hasBombs = false;
let camera = { x: 0, y: 0 };
let gameState = 'menu';
let currentLevel = 1;
let levelWidth = 5000;
let highestLevelUnlocked = 28;
let selectedLevel = 1;
let menuScroll = 0;
let lives = 10;

const levelNames = [
    "The Beginning",           // 1
    "Geyser Valley",          // 2
    "Bomb Mountain",          // 3
    "Spike Gauntlet",         // 4
    "Flying Fortress",        // 5
    "The Final Castle",       // 6
    "Rolling Hills",          // 7
    "Acid Swamp",            // 8
    "Deadly Forest",         // 9
    "Shark Bay",             // 10
    "Bubble Drift",          // 11
    "Mixed Madness",         // 12
    "Toxic Skies",           // 13
    "Frozen Terror",         // 14
    "Bear Canyon",           // 15
    "Tornado Alley",         // 16
    "Water World",           // 17
    "Chaos Slopes",          // 18
    "Double Danger",         // 19
    "Ultimate Trial",        // 20
    "Twister Zone",          // 21
    "Deep Waters",           // 22
    "Storm Front",           // 23
    "Beast Territory",       // 24
    "Mega Mix",              // 25
    "The Apocalypse",        // 26
    "Phantom Gauntlet",      // 27
    "Demon King's Lair"      // 28
];

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 6;
        this.jumpPower = 13;
        this.gravity = 0.6;
        this.onGround = false;
        this.jumpsLeft = 2;
        this.health = 100;
        this.maxHealth = 100;
        this.direction = 'right';
        this.attacking = false;
        this.attackCooldown = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.bombCooldown = 0;
        this.inWater = false;
    }

    update() {
        this.inWater = false;
        waterBlocks.forEach(water => {
            if (this.x < water.x + water.width &&
                this.x + this.width > water.x &&
                this.y < water.y + water.height &&
                this.y + this.height > water.y) {
                this.inWater = true;
            }
        });

        if (keys['ArrowLeft']) {
            this.velocityX = -this.speed * (this.inWater ? 0.7 : 1);
            this.direction = 'left';
        } else if (keys['ArrowRight']) {
            this.velocityX = this.speed * (this.inWater ? 0.7 : 1);
            this.direction = 'right';
        } else {
            this.velocityX = 0;
        }

        if (this.inWater) {
            this.velocityY *= 0.85;
            if (keys['ArrowUp']) {
                this.velocityY -= 0.8;
            }
            if (keys['ArrowDown']) {
                this.velocityY += 0.5;
            }
            this.velocityY += this.gravity * 0.3;
            if (this.velocityY < -5) this.velocityY = -5;
            if (this.velocityY > 5) this.velocityY = 5;
        } else {
            this.velocityY += this.gravity;
            if (this.velocityY > 15) this.velocityY = 15;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > levelWidth) this.x = levelWidth - this.width;

        if (currentLevel !== 11) {
            if (this.y + this.height > canvas.height - 50) {
                this.y = canvas.height - 50 - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.jumpsLeft = 2;
            }
        }

        this.onGround = false;

        platforms.forEach(platform => {
            if (this.velocityY > 0 &&
                this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height < platform.y + 10 &&
                this.y + this.height + this.velocityY >= platform.y) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.jumpsLeft = 2;
            }
        });

        movingPlatforms.forEach(platform => {
            if (this.velocityY > 0 &&
                this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height < platform.y + 10 &&
                this.y + this.height + this.velocityY >= platform.y) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.jumpsLeft = 2;
                if (platform.axis === 'horizontal') {
                    this.x += platform.speed * platform.direction;
                }
            }
        });

        breakableBlocks.forEach(block => {
            if (block.broken) return;

            if (this.velocityY > 0 &&
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y + this.height < block.y + 10 &&
                this.y + this.height + this.velocityY >= block.y) {
                this.y = block.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.jumpsLeft = 2;
            }

            if (this.velocityY < 0 &&
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y > block.y + block.height - 10 &&
                this.y + this.velocityY <= block.y + block.height) {
                this.y = block.y + block.height;
                this.velocityY = 0;
            }

            const oldX = this.x - this.velocityX;
            if (this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y < block.y + block.height &&
                this.y + this.height > block.y) {
                if (oldX + this.width <= block.x) {
                    this.x = block.x - this.width;
                } else if (oldX >= block.x + block.width) {
                    this.x = block.x + block.width;
                }
                this.velocityX = 0;
            }
        });

        disappearingBlocks.forEach(block => {
            if (!block.visible) return;

            if (this.velocityY > 0 &&
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y + this.height < block.y + 10 &&
                this.y + this.height + this.velocityY >= block.y) {
                this.y = block.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.jumpsLeft = 2;
            }

            if (this.velocityY < 0 &&
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y > block.y + block.height - 10 &&
                this.y + this.velocityY <= block.y + block.height) {
                this.y = block.y + block.height;
                this.velocityY = 0;
            }

            const oldXd = this.x - this.velocityX;
            if (this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y < block.y + block.height &&
                this.y + this.height > block.y) {
                if (oldXd + this.width <= block.x) {
                    this.x = block.x - this.width;
                } else if (oldXd >= block.x + block.width) {
                    this.x = block.x + block.width;
                }
                this.velocityX = 0;
            }
        });

        bouncePlatforms.forEach(platform => {
            if (this.velocityY > 0 &&
                this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height < platform.y + 10 &&
                this.y + this.height + this.velocityY >= platform.y) {
                this.velocityY = -18;
                this.jumpsLeft = 2;
            }
        });

        honeyBlocks.forEach(honey => {
            // Top collision - landing on honey block
            if (this.velocityY > 0 &&
                this.x < honey.x + honey.width &&
                this.x + this.width > honey.x &&
                this.y + this.height < honey.y + 10 &&
                this.y + this.height + this.velocityY >= honey.y) {
                this.y = honey.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
                this.jumpsLeft = 2;
            }

            // Bottom collision - hitting honey block from below
            if (this.velocityY < 0 &&
                this.x < honey.x + honey.width &&
                this.x + this.width > honey.x &&
                this.y > honey.y + honey.height - 10 &&
                this.y + this.velocityY <= honey.y + honey.height) {
                this.y = honey.y + honey.height;
                this.velocityY = 0;
            }

            // Side collision - hitting honey block from left or right
            const oldX = this.x - this.velocityX;
            if (this.x < honey.x + honey.width &&
                this.x + this.width > honey.x &&
                this.y < honey.y + honey.height &&
                this.y + this.height > honey.y) {
                if (oldX + this.width <= honey.x) {
                    this.x = honey.x - this.width;
                } else if (oldX >= honey.x + honey.width) {
                    this.x = honey.x + honey.width;
                }
                this.velocityX = 0;
            }
        });

        floatBubbles.forEach(bubble => {
            const bubbleTop = bubble.y;
            const bubbleBottom = bubble.y + bubble.radius * 2;
            const bubbleLeft = bubble.x;
            const bubbleRight = bubble.x + bubble.radius * 2;
            const bubbleCenterX = bubble.x + bubble.radius;
            const bubbleCenterY = bubble.y + bubble.radius;

            const playerCenterX = this.x + this.width / 2;
            const playerCenterY = this.y + this.height / 2;
            const distanceX = playerCenterX - bubbleCenterX;
            const distanceY = playerCenterY - bubbleCenterY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < bubble.radius + this.width / 2) {
                if (this.velocityY >= 0 &&
                    this.y + this.height < bubbleCenterY &&
                    this.y + this.height + this.velocityY >= bubbleTop) {
                    this.velocityY = -12;
                    this.jumpsLeft = 2;
                }
            }
        });

        slopes.forEach(slope => {
            const playerCenterX = this.x + this.width / 2;

            if (playerCenterX >= slope.x && playerCenterX <= slope.x + slope.width) {
                const slopeProgress = (playerCenterX - slope.x) / slope.width;
                const slopeY = slope.y + slope.height - (slopeProgress * slope.height);

                if (this.velocityY >= 0 &&
                    this.y + this.height >= slopeY - 10 &&
                    this.y + this.height <= slopeY + 20) {
                    this.y = slopeY - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.jumpsLeft = 2;
                }
            }
        });

        lavaBlocks.forEach(lava => {
            if (this.x < lava.x + lava.width &&
                this.x + this.width > lava.x &&
                this.y < lava.y + lava.height &&
                this.y + this.height > lava.y) {
                this.takeDamage(50);
            }
        });

        waterGeysers.forEach(geyser => {
            if (geyser.active &&
                this.x < geyser.x + geyser.width &&
                this.x + this.width > geyser.x &&
                this.y < geyser.y &&
                this.y + this.height > geyser.y - geyser.height) {
                this.velocityY = -10;
                this.jumpsLeft = 2;
            }
        });

        lavaGeysers.forEach(geyser => {
            if (geyser.active &&
                this.x < geyser.x + geyser.width &&
                this.x + this.width > geyser.x &&
                this.y < geyser.y &&
                this.y + this.height > geyser.y - geyser.height) {
                this.takeDamage(20);
            }
        });

        spikeBalls.forEach(spike => {
            if (this.x < spike.x + spike.width &&
                this.x + this.width > spike.x &&
                this.y < spike.y + spike.height &&
                this.y + this.height > spike.y) {
                this.takeDamage(15);
            }
        });

        if (finishLine &&
            this.x < finishLine.x + finishLine.width &&
            this.x + this.width > finishLine.x &&
            this.y < finishLine.y + finishLine.height &&
            this.y + this.height > finishLine.y) {
            nextLevel();
        }

        if (this.y > canvas.height) {
            this.health = 0;
            gameOver();
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.bombCooldown > 0) this.bombCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.invincibleTimer === 0) this.invincible = false;

        camera.x = this.x - canvas.width / 2 + this.width / 2;
        camera.x = Math.max(0, Math.min(camera.x, levelWidth - canvas.width));
    }

    jump() {
        if (this.jumpsLeft > 0) {
            this.velocityY = -this.jumpPower;
            this.jumpsLeft--;
            this.onGround = false;
        }
    }

    dropBomb() {
        if (hasBombs && bombCount > 0 && this.bombCooldown === 0 && gameState === 'playing') {
            bombs.push(new Bomb(this.x + this.width/2 - 15, this.y + this.height - 10));
            bombCount--;
            this.bombCooldown = 60;
            updateBombs();
        }
    }

    attack() {
        if (this.attackCooldown === 0 && gameState === 'playing') {
            this.attacking = true;
            this.attackCooldown = 30;
            setTimeout(() => this.attacking = false, 200);

            const attackRange = {
                x: this.direction === 'right' ? this.x + this.width - 20 : this.x - 80,
                y: this.y - 20,
                width: 100,
                height: this.height + 40
            };

            enemies.forEach((enemy, index) => {
                if (attackRange.x < enemy.x + enemy.width &&
                    attackRange.x + attackRange.width > enemy.x &&
                    attackRange.y < enemy.y + enemy.height &&
                    attackRange.y + attackRange.height > enemy.y) {
                    enemies.splice(index, 1);
                    score += 100;
                    updateScore();
                }
            });

            flyingEnemies.forEach((enemy, index) => {
                if (attackRange.x < enemy.x + enemy.width &&
                    attackRange.x + attackRange.width > enemy.x &&
                    attackRange.y < enemy.y + enemy.height &&
                    attackRange.y + attackRange.height > enemy.y) {
                    flyingEnemies.splice(index, 1);
                    score += 150;
                    updateScore();
                }
            });

            bees.forEach((bee, index) => {
                if (attackRange.x < bee.x + bee.width &&
                    attackRange.x + attackRange.width > bee.x &&
                    attackRange.y < bee.y + bee.height &&
                    attackRange.y + attackRange.height > bee.y) {
                    bees.splice(index, 1);
                    score += 150;
                    updateScore();
                }
            });

            spikeBalls.forEach((spike, index) => {
                if (attackRange.x < spike.x + spike.width &&
                    attackRange.x + attackRange.width > spike.x &&
                    attackRange.y < spike.y + spike.height &&
                    attackRange.y + attackRange.height > spike.y) {
                    spikeBalls.splice(index, 1);
                    score += 200;
                    updateScore();
                }
            });
        }
    }

    takeDamage(amount) {
        if (!this.invincible) {
            this.health -= amount;
            this.invincible = true;
            this.invincibleTimer = 60;
            updateHealth();
            if (this.health <= 0) {
                gameOver();
            }
        }
    }

    draw() {
        if (this.invincible && Math.floor(Date.now() / 100) % 2) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        ctx.fillStyle = '#f39c12';
        ctx.fillRect(screenX + 10, screenY + 5, 20, 15);

        ctx.fillStyle = '#000';
        if (this.direction === 'right') {
            ctx.fillRect(screenX + 20, screenY + 10, 5, 5);
        } else {
            ctx.fillRect(screenX + 15, screenY + 10, 5, 5);
        }

        if (this.attacking) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 4;
            if (this.direction === 'right') {
                ctx.fillRect(screenX + this.width - 20, screenY - 20, 100, this.height + 40);
                ctx.strokeRect(screenX + this.width - 20, screenY - 20, 100, this.height + 40);

                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(screenX + this.width, screenY + 20, 50, 8);
            } else {
                ctx.fillRect(screenX - 80, screenY - 20, 100, this.height + 40);
                ctx.strokeRect(screenX - 80, screenY - 20, 100, this.height + 40);

                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(screenX - 50, screenY + 20, 50, 8);
            }
        }
    }
}

class Heart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.collected = false;
        this.floatOffset = 0;
    }

    update() {
        this.floatOffset = Math.sin(Date.now() / 200) * 5;

        if (!this.collected &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            this.collected = true;
            player.health = Math.min(player.health + 25, player.maxHealth);
            score += 100;
            updateHealth();
            updateScore();
        }
    }

    draw() {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + this.floatOffset;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(screenX + this.width/2, screenY + this.height);
        ctx.bezierCurveTo(
            screenX + this.width/2, screenY + this.height * 0.7,
            screenX, screenY + this.height * 0.3,
            screenX, screenY + this.height * 0.3
        );
        ctx.arc(screenX + this.width/4, screenY + this.height * 0.25, this.width/4, Math.PI, 0, false);
        ctx.arc(screenX + this.width * 0.75, screenY + this.height * 0.25, this.width/4, Math.PI, 0, false);
        ctx.bezierCurveTo(
            screenX + this.width, screenY + this.height * 0.3,
            screenX + this.width/2, screenY + this.height * 0.7,
            screenX + this.width/2, screenY + this.height
        );
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(screenX + this.width/4, screenY + this.height * 0.25, this.width/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + this.width * 0.75, screenY + this.height * 0.25, this.width/6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + this.width/4 - 2, screenY + this.height * 0.2, 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class OneUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.collected = false;
        this.floatOffset = 0;
    }

    update() {
        this.floatOffset = Math.sin(Date.now() / 180) * 6;

        if (!this.collected &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            this.collected = true;
            lives += 2;
            score += 500;
            updateLives();
            updateScore();
        }
    }

    draw() {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + this.floatOffset;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(screenX + this.width/2, screenY + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(screenX + this.width/2, screenY + this.height/2, this.width/3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('1UP', screenX + this.width/2, screenY + this.height/2 + 7);
    }
}

class BreakableBlock {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.broken = false;
    }

    draw() {
        if (this.broken) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX, screenY, this.width, this.height);

        ctx.fillStyle = '#34495e';
        for (let i = 0; i < this.width; i += 30) {
            for (let j = 0; j < this.height; j += 30) {
                ctx.fillRect(screenX + i + 5, screenY + j + 5, 20, 20);
            }
        }

        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💣', screenX + this.width/2, screenY + this.height/2 + 7);
    }
}

class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.velocityY = -3;
        this.gravity = 0.4;
        this.timer = 180;
        this.exploded = false;
        this.explosionRadius = 120;
        this.explosionTimer = 0;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.timer--;
            this.velocityY += this.gravity;
            this.y += this.velocityY;

            if (this.y + this.height > canvas.height - 50) {
                this.y = canvas.height - 50 - this.height;
                this.velocityY = 0;
            }

            platforms.forEach(platform => {
                if (this.velocityY > 0 &&
                    this.x < platform.x + platform.width &&
                    this.x + this.width > platform.x &&
                    this.y + this.height < platform.y + 10 &&
                    this.y + this.height + this.velocityY >= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            });

            breakableBlocks.forEach(block => {
                if (!block.broken &&
                    this.velocityY > 0 &&
                    this.x < block.x + block.width &&
                    this.x + this.width > block.x &&
                    this.y + this.height < block.y + 10 &&
                    this.y + this.height + this.velocityY >= block.y) {
                    this.y = block.y - this.height;
                    this.velocityY = 0;
                }
            });

            if (this.timer <= 0) {
                this.explode();
            }
        } else {
            this.explosionTimer++;

            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.3;
                particle.life--;
            });

            this.particles = this.particles.filter(p => p.life > 0);
        }
    }

    explode() {
        this.exploded = true;

        const directions = [
            { angle: -Math.PI/2, speed: 8 },
            { angle: -Math.PI/3, speed: 7 },
            { angle: -2*Math.PI/3, speed: 7 },
            { angle: -Math.PI/4, speed: 6 },
            { angle: -3*Math.PI/4, speed: 6 },
            { angle: 0, speed: 5 },
            { angle: Math.PI, speed: 5 },
            { angle: -Math.PI/6, speed: 5 },
            { angle: -5*Math.PI/6, speed: 5 }
        ];

        directions.forEach(dir => {
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    vx: Math.cos(dir.angle) * dir.speed + (Math.random() - 0.5) * 2,
                    vy: Math.sin(dir.angle) * dir.speed + (Math.random() - 0.5) * 2,
                    size: 8 + Math.random() * 8,
                    life: 30 + Math.random() * 20,
                    maxLife: 30 + Math.random() * 20,
                    color: Math.random() > 0.5 ? '#ff6600' : '#ff0000'
                });
            }
        });

        const playerDx = (player.x + player.width/2) - (this.x + this.width/2);
        const playerDy = (player.y + player.height/2) - (this.y + this.height/2);
        const playerDistance = Math.sqrt(playerDx*playerDx + playerDy*playerDy);

        if (playerDistance < this.explosionRadius) {
            const pushAngle = Math.atan2(playerDy, playerDx);
            const pushForce = (1 - playerDistance / this.explosionRadius) * 15;

            player.velocityX = Math.cos(pushAngle) * pushForce;
            player.velocityY = Math.sin(pushAngle) * pushForce - 10;
        }

        enemies.forEach((enemy, index) => {
            const dx = enemy.x + enemy.width/2 - (this.x + this.width/2);
            const dy = enemy.y + enemy.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius) {
                enemies.splice(index, 1);
                score += 100;
                updateScore();
            }
        });

        flyingEnemies.forEach((enemy, index) => {
            const dx = enemy.x + enemy.width/2 - (this.x + this.width/2);
            const dy = enemy.y + enemy.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius) {
                flyingEnemies.splice(index, 1);
                score += 150;
                updateScore();
            }
        });

        bees.forEach((bee, index) => {
            const dx = bee.x + bee.width/2 - (this.x + this.width/2);
            const dy = bee.y + bee.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius) {
                bees.splice(index, 1);
                score += 150;
                updateScore();
            }
        });

        spikeBalls.forEach((spike, index) => {
            const dx = spike.x + spike.width/2 - (this.x + this.width/2);
            const dy = spike.y + spike.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius) {
                spikeBalls.splice(index, 1);
                score += 200;
                updateScore();
            }
        });

        breakableBlocks.forEach((block, index) => {
            const dx = block.x + block.width/2 - (this.x + this.width/2);
            const dy = block.y + block.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius && !block.broken) {
                block.broken = true;
                score += 50;
                updateScore();
            }
        });

        for (let i = grizzlyBears.length - 1; i >= 0; i--) {
            const bear = grizzlyBears[i];
            const dx = bear.x + bear.width/2 - (this.x + this.width/2);
            const dy = bear.y + bear.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius) {
                grizzlyBears.splice(i, 1);
                score += 300;
                updateScore();
            }
        }

        for (let i = sharks.length - 1; i >= 0; i--) {
            const shark = sharks[i];
            const dx = shark.x + shark.width/2 - (this.x + this.width/2);
            const dy = shark.y + shark.height/2 - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius) {
                sharks.splice(i, 1);
                score += 250;
                updateScore();
            }
        }

        for (let i = tornados.length - 1; i >= 0; i--) {
            const tornado = tornados[i];
            const dx = tornado.x + tornado.width/2 - (this.x + this.width/2);
            const dy = (tornado.y + tornado.height) - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.explosionRadius * 2) {
                tornados.splice(i, 1);
                score += 400;
                updateScore();
            }
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (!this.exploded) {
            const flash = this.timer < 60 && Math.floor(this.timer / 5) % 2;
            ctx.fillStyle = flash ? '#e74c3c' : '#34495e';
            ctx.beginPath();
            ctx.arc(screenX + this.width/2, screenY + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillRect(screenX + this.width/2 - 2, screenY + 5, 4, 8);

            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(screenX + this.width/2, screenY + 5, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            if (this.explosionTimer < 20) {
                const radius = (this.explosionTimer / 20) * this.explosionRadius;
                ctx.fillStyle = `rgba(255, 165, 0, ${1 - this.explosionTimer/20})`;
                ctx.beginPath();
                ctx.arc(screenX + this.width/2, screenY + this.height/2, radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(255, 69, 0, ${1 - this.explosionTimer/20})`;
                ctx.beginPath();
                ctx.arc(screenX + this.width/2, screenY + this.height/2, radius * 0.7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(255, 255, 0, ${1 - this.explosionTimer/20})`;
                ctx.beginPath();
                ctx.arc(screenX + this.width/2, screenY + this.height/2, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            this.particles.forEach(particle => {
                const particleScreenX = particle.x - camera.x;
                const particleScreenY = particle.y - camera.y;
                const opacity = particle.life / particle.maxLife;
                ctx.fillStyle = particle.color === '#ff6600' ?
                    `rgba(255, 102, 0, ${opacity})` :
                    `rgba(255, 0, 0, ${opacity})`;
                ctx.beginPath();
                ctx.arc(particleScreenX, particleScreenY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    isFinished() {
        return this.exploded && this.explosionTimer > 20;
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = type === 'fast' ? 3 : 2;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.type = type;
        this.patrolStart = x - 150;
        this.patrolEnd = x + 150;
    }

    update() {
        this.x += this.speed * this.direction;

        if (this.x < this.patrolStart || this.x > this.patrolEnd) {
            this.direction *= -1;
        }

        if (this.x < 0) {
            this.x = 0;
            this.direction = 1;
        }
        if (this.x + this.width > levelWidth) {
            this.x = levelWidth - this.width;
            this.direction = -1;
        }

        if (player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(10);
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        if (this.type === 'fast') {
            ctx.fillStyle = '#e74c3c';
        } else {
            ctx.fillStyle = '#c0392b';
        }
        ctx.fillRect(screenX, screenY, this.width, this.height);

        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + 8, screenY + 8, 8, 8);
        ctx.fillRect(screenX + 20, screenY + 8, 8, 8);

        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 10, screenY + 10, 4, 4);
        ctx.fillRect(screenX + 22, screenY + 10, 4, 4);
    }
}

class FlyingEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speedX = 2;
        this.speedY = 1.5;
        this.directionX = Math.random() > 0.5 ? 1 : -1;
        this.directionY = Math.random() > 0.5 ? 1 : -1;
        this.patrolStartX = x - 200;
        this.patrolEndX = x + 200;
        this.patrolStartY = y - 100;
        this.patrolEndY = y + 100;
    }

    update() {
        this.x += this.speedX * this.directionX;
        this.y += this.speedY * this.directionY;

        if (this.x < this.patrolStartX || this.x > this.patrolEndX) {
            this.directionX *= -1;
        }
        if (this.y < this.patrolStartY || this.y > this.patrolEndY) {
            this.directionY *= -1;
        }

        if (player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(15);
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width/2, screenY + this.height/2, this.width/2, this.height/2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + 10, screenY + 12, 6, 6);
        ctx.fillRect(screenX + 20, screenY + 12, 6, 6);

        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 12, screenY + 14, 3, 3);
        ctx.fillRect(screenX + 22, screenY + 14, 3, 3);

        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.moveTo(screenX - 5, screenY + 15);
        ctx.lineTo(screenX, screenY + 10);
        ctx.lineTo(screenX + 5, screenY + 15);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + this.width + 5, screenY + 15);
        ctx.lineTo(screenX + this.width, screenY + 10);
        ctx.lineTo(screenX + this.width - 5, screenY + 15);
        ctx.fill();
    }
}

class Bee {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.chaseRange = 400;
        this.stopRange = 500;
        this.isChasing = false;
    }

    update() {
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );

        if (distanceToPlayer < this.chaseRange) {
            this.isChasing = true;
        } else if (distanceToPlayer > this.stopRange) {
            this.isChasing = false;
        }

        if (this.isChasing) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }

        if (player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(10);
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width/2, screenY + this.height/2, this.width/2.5, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, screenY + 10, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX - 5, screenY + 8);
        ctx.lineTo(screenX - 10, screenY + 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width + 5, screenY + 8);
        ctx.lineTo(screenX + this.width + 10, screenY + 3);
        ctx.stroke();

        ctx.fillStyle = this.isChasing ? '#FF0000' : '#FFD700';
        ctx.beginPath();
        ctx.moveTo(screenX + this.width/2 - 3, screenY + 18);
        ctx.lineTo(screenX + this.width/2, screenY + 22);
        ctx.lineTo(screenX + this.width/2 + 3, screenY + 18);
        ctx.fill();
    }
}

class SpikeBall {
    constructor(x, y, minY, maxY) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 3;
        this.direction = 1;
        this.minY = minY;
        this.maxY = maxY;
    }

    update() {
        this.y += this.speed * this.direction;
        if (this.y < this.minY || this.y > this.maxY) {
            this.direction *= -1;
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(screenX + this.width/2, screenY + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const spikeX = screenX + this.width/2 + Math.cos(angle) * this.width/2;
            const spikeY = screenY + this.height/2 + Math.sin(angle) * this.height/2;
            const tipX = screenX + this.width/2 + Math.cos(angle) * (this.width/2 + 8);
            const tipY = screenY + this.height/2 + Math.sin(angle) * (this.height/2 + 8);

            ctx.beginPath();
            ctx.moveTo(screenX + this.width/2, screenY + this.height/2);
            ctx.lineTo(spikeX, spikeY);
            ctx.lineTo(tipX, tipY);
            ctx.closePath();
            ctx.fill();
        }
    }
}

class WaterGeyser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 250;
        this.active = false;
        this.timer = 0;
        this.activeTime = 90;
        this.inactiveTime = 120;
    }

    update() {
        this.timer++;
        if (this.active) {
            if (this.timer >= this.activeTime) {
                this.active = false;
                this.timer = 0;
            }
        } else {
            if (this.timer >= this.inactiveTime) {
                this.active = true;
                this.timer = 0;
            }
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(screenX, screenY, this.width, 20);

        if (this.active) {
            const wave = Math.sin(Date.now() / 50) * 5;
            ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            ctx.fillRect(screenX + 10 + wave, screenY - this.height, this.width - 20, this.height);

            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            for (let i = 0; i < 5; i++) {
                const bubbleY = screenY - (this.height * (i / 5)) - (Date.now() / 20 % 50);
                ctx.beginPath();
                ctx.arc(screenX + this.width/2 + Math.sin(i) * 10, bubbleY, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

class LavaGeyser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 200;
        this.active = false;
        this.timer = 0;
        this.activeTime = 60;
        this.inactiveTime = 120;
        this.warningTime = 30;
    }

    update() {
        this.timer++;
        if (this.active) {
            if (this.timer >= this.activeTime) {
                this.active = false;
                this.timer = 0;
            }
        } else {
            if (this.timer >= this.inactiveTime) {
                this.active = true;
                this.timer = 0;
            }
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(screenX, screenY, this.width, 20);

        if (!this.active && this.timer > this.inactiveTime - this.warningTime) {
            const flash = Math.floor(Date.now() / 100) % 2;
            if (flash) {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(screenX, screenY, this.width, 20);
            }
        }

        if (this.active) {
            const wave = Math.sin(Date.now() / 30) * 8;
            ctx.fillStyle = '#ff4500';
            ctx.fillRect(screenX + 10 + wave, screenY - this.height, this.width - 20, this.height);

            ctx.fillStyle = '#ff6347';
            ctx.fillRect(screenX + 15 + wave/2, screenY - this.height, this.width - 30, this.height);

            ctx.fillStyle = '#ff0000';
            for (let i = 0; i < 6; i++) {
                const sparkY = screenY - (this.height * (i / 6)) - (Date.now() / 15 % 40);
                ctx.fillRect(screenX + this.width/2 + Math.sin(i * 2) * 15, sparkY, 4, 8);
            }
        }
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, this.width, this.height);

        for (let i = 0; i < this.width; i += 20) {
            ctx.strokeRect(screenX + i, screenY, 20, this.height);
        }
    }
}

class MovingPlatform {
    constructor(x, y, width, height, speed, direction, minPos, maxPos, axis) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = direction;
        this.axis = axis;
        if (axis === 'horizontal') {
            this.minX = minPos;
            this.maxX = maxPos;
        } else {
            this.minY = minPos;
            this.maxY = maxPos;
        }
    }

    update() {
        if (this.axis === 'horizontal') {
            this.x += this.speed * this.direction;
            if (this.x < this.minX || this.x > this.maxX) {
                this.direction *= -1;
            }
        } else {
            this.y += this.speed * this.direction;
            if (this.y < this.minY || this.y > this.maxY) {
                this.direction *= -1;
            }
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#3498db';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, this.width, this.height);

        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + 5, screenY + 5, 10, 10);
        ctx.fillRect(screenX + this.width - 15, screenY + 5, 10, 10);
    }
}

class BouncePlatform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bouncing = false;
        this.bounceTimer = 0;
    }

    update() {
        if (this.bounceTimer > 0) {
            this.bounceTimer--;
            if (this.bounceTimer === 0) this.bouncing = false;
        }
    }

    trigger() {
        this.bouncing = true;
        this.bounceTimer = 10;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const offset = this.bouncing ? 5 : 0;

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(screenX, screenY + offset, this.width, this.height);
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX, screenY + offset, this.width, this.height);

        ctx.fillStyle = '#fff';
        for (let i = 0; i < this.width; i += 15) {
            ctx.fillRect(screenX + i + 3, screenY + offset + 3, 8, 8);
        }
    }
}

class LavaBlock {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.animationOffset = Math.random() * 100;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const wave = Math.sin(Date.now() / 200 + this.animationOffset) * 3;

        ctx.fillStyle = '#ff4500';
        ctx.fillRect(screenX, screenY + wave, this.width, this.height);

        ctx.fillStyle = '#ff6347';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(screenX + i, screenY + wave, 10, this.height);
        }

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, screenY + wave, this.width, 5);
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.1;

        if (!this.collected &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            this.collected = true;
            coinCount++;
            score += 50;
            updateCoins();
            updateScore();
        }
    }

    draw() {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class QuestionBlock {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.hit = false;
        this.bounceOffset = 0;
    }

    update() {
        if (this.bounceOffset > 0) {
            this.bounceOffset -= 2;
        }

        if (!this.hit &&
            player.velocityY < 0 &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y > this.y) {
            this.hit = true;
            this.bounceOffset = 10;
            coins.push(new Coin(this.x + 10, this.y - 30));
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = this.hit ? '#95a5a6' : '#f39c12';
        ctx.fillRect(screenX, screenY - this.bounceOffset, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX, screenY - this.bounceOffset, this.width, this.height);

        if (!this.hit) {
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.fillText('?', screenX + 12, screenY + 28 - this.bounceOffset);
        }
    }
}

class FinishLine {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#f39c12';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(screenX + this.width/2, screenY + 20);
        ctx.lineTo(screenX + 15, screenY + 50);
        ctx.lineTo(screenX + this.width - 15, screenY + 50);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(screenX + this.width/2, screenY + 40);
        ctx.lineTo(screenX + 22, screenY + 60);
        ctx.lineTo(screenX + this.width - 22, screenY + 60);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(screenX + this.width/2, screenY + 60);
        ctx.lineTo(screenX + 28, screenY + 80);
        ctx.lineTo(screenX + this.width - 28, screenY + 80);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e67e22';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TRIFORCE', screenX + this.width/2, screenY + this.height - 10);
    }
}

class Slope {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + this.height);
        ctx.lineTo(screenX + this.width, screenY);
        ctx.lineTo(screenX + this.width, screenY + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class RollingRock {
    constructor(x, y, width, height, speedX, speedY, minX, maxX) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = speedX;
        this.speedY = speedY;
        this.minX = minX;
        this.maxX = maxX;
        this.startX = x;
        this.startY = y;
        this.rotation = 0;
        this.onSlope = false;
    }

    update() {
        this.x += this.speedX;
        this.rotation -= this.speedX * 0.05;

        this.onSlope = false;
        slopes.forEach(slope => {
            const rockCenterX = this.x + this.width / 2;

            if (rockCenterX >= slope.x && rockCenterX <= slope.x + slope.width) {
                const slopeProgress = (rockCenterX - slope.x) / slope.width;
                const slopeY = slope.y + slope.height - (slopeProgress * slope.height);

                if (Math.abs(this.y + this.height - slopeY) < 50) {
                    this.onSlope = true;
                    this.y = slopeY - this.height;
                }
            }
        });

        if (!this.onSlope) {
            this.y += this.speedY;
        }

        if (this.x < this.minX) {
            this.x = this.startX || this.maxX;
            this.y = this.startY;
            this.rotation = 0;
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.save();
        ctx.translate(screenX + this.width/2, screenY + this.height/2);
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#333';
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const x = Math.cos(angle) * this.width/3;
            const y = Math.sin(angle) * this.width/3;
            ctx.fillRect(x - 2, y - 2, 4, 4);
        }

        ctx.restore();
    }
}

class AcidPool {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.5, '#00cc00');
        gradient.addColorStop(1, '#00aa00');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, this.width, this.height);
    }
}

class Tree {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(screenX + this.width/2, screenY, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Shark {
    constructor(x, y, width, height, speed, detectionRange) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.detectionRange = detectionRange;
        this.velocityX = 0;
        this.velocityY = 0;
        this.chasing = false;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = this.chasing ? '#0000CD' : '#4169E1';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + this.height/2);
        ctx.lineTo(screenX + this.width * 0.7, screenY);
        ctx.lineTo(screenX + this.width, screenY + this.height/2);
        ctx.lineTo(screenX + this.width * 0.7, screenY + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(screenX + this.width * 0.6, screenY + this.height * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class WaterBlock {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
        gradient.addColorStop(0, '#4169E1');
        gradient.addColorStop(0.5, '#1E90FF');
        gradient.addColorStop(1, '#0066CC');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, this.width, this.height);
    }
}

class AcidCloud {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rainTimer = 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.strokeStyle = 'rgba(0, 200, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(screenX + this.width/2, screenY + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('☠', screenX + this.width/2, screenY + this.height/2 + 8);
    }
}

class BlizzardCloud {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hailTimer = 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
        ctx.strokeStyle = 'rgba(150, 180, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(screenX + this.width/2, screenY + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i < 3; i++) {
            ctx.fillText('❄', screenX + 30 + i * 50, screenY + this.height/2 + 5);
        }
    }
}

class GrizzlyBear {
    constructor(x, y, width, height, speed, detectionRange, minX, maxX) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.detectionRange = detectionRange;
        this.minX = minX;
        this.maxX = maxX;
        this.direction = 1;
        this.chasing = false;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = this.chasing ? '#4a2511' : '#654321';
        ctx.fillRect(screenX, screenY + 20, this.width, this.height - 20);
        ctx.beginPath();
        ctx.arc(screenX + this.width/2, screenY + 15, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 5, 6, 0, Math.PI * 2);
        ctx.arc(screenX + this.width - 10, screenY + 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.chasing ? '#ff0000' : '#000';
        ctx.beginPath();
        ctx.arc(screenX + 15, screenY + 15, 3, 0, Math.PI * 2);
        ctx.arc(screenX + this.width - 15, screenY + 15, 3, 0, Math.PI * 2);
        ctx.fill();
        if (this.chasing) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX + (this.direction === 1 ? this.width : 0), screenY + 35 + i * 8);
                ctx.lineTo(screenX + (this.direction === 1 ? this.width + 10 : -10), screenY + 30 + i * 8);
                ctx.stroke();
            }
        }
    }
}

class Tornado {
    constructor(x, y, width, height, speedX, direction, minX, maxX, pullRadius, pullStrength) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = speedX;
        this.direction = direction;
        this.minX = minX;
        this.maxX = maxX;
        this.pullRadius = pullRadius;
        this.pullStrength = pullStrength;
        this.spinTimer = 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const numLevels = 30;
        for (let i = 0; i < numLevels; i++) {
            const y = screenY + (i / numLevels) * this.height;
            const width = this.width * (1 - i / (numLevels * 1.5));
            const alpha = 0.3 + (i / numLevels) * 0.4;
            const offset = Math.sin(Date.now() * 0.01 + i) * 15;

            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(screenX + this.width/2 + offset, y, width/2, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#333';
        for (let i = 0; i < 12; i++) {
            const angle = (Date.now() * 0.005 + i) % (Math.PI * 2);
            const radius = 40 + Math.sin(Date.now() * 0.003 + i) * 20;
            const heightOffset = (i / 12) * this.height;
            const x = screenX + this.width/2 + Math.cos(angle) * radius;
            const y = screenY + heightOffset + Math.sin(angle) * radius;
            ctx.fillRect(x - 3, y - 3, 6, 6);
        }
    }
}

class HoneyBlock {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        ctx.strokeStyle = '#CC8800';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const x = screenX + 10 + i * 15;
            const y = screenY + 5;
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j;
                const hx = x + 5 * Math.cos(angle);
                const hy = y + 5 * Math.sin(angle);
                if (j === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
}

class DisappearingBlock {
    constructor(x, y, width, height, offset) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.timer = offset || 0;
        this.visible = true;
        this.visibleTime = 150;
        this.invisibleTime = 80;
        this.warnTime = 35;
    }

    update() {
        this.timer++;
        const cycle = this.visibleTime + this.invisibleTime;
        const t = this.timer % cycle;
        this.visible = t < this.visibleTime;
    }

    isWarning() {
        const cycle = this.visibleTime + this.invisibleTime;
        const t = this.timer % cycle;
        return t >= this.visibleTime - this.warnTime && t < this.visibleTime;
    }

    draw() {
        if (!this.visible) return;
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const warning = this.isWarning();
        const flash = warning && Math.floor(Date.now() / 80) % 2;
        ctx.fillStyle = flash ? '#ff6b6b' : '#9b59b6';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.strokeStyle = flash ? '#e74c3c' : '#8e44ad';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX, screenY, this.width, this.height);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(screenX + 4, screenY + 4, 12, 8);
        ctx.fillRect(screenX + this.width - 16, screenY + 4, 12, 8);
    }
}

class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 120;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.05;
        if (player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            nextLevel();
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const cx = screenX + this.width / 2;
        const cy = screenY + this.height / 2;
        const rx = this.width / 2;
        const ry = this.height / 2;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx + 20);
        grad.addColorStop(0, 'rgba(100, 0, 200, 0.95)');
        grad.addColorStop(0.5, 'rgba(50, 0, 150, 0.7)');
        grad.addColorStop(1, 'rgba(0, 0, 50, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx + 20, ry + 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0015';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 3; i++) {
            const angle = this.rotation + i * Math.PI * 2 / 3;
            ctx.strokeStyle = `rgba(200, 0, 255, ${0.7 - i * 0.15})`;
            ctx.lineWidth = 4 - i;
            ctx.beginPath();
            for (let t = 0; t < Math.PI * 2; t += 0.15) {
                const r = (t / (Math.PI * 2)) * rx * 0.9;
                const px = cx + Math.cos(t + angle) * r;
                const py = cy + Math.sin(t + angle) * r * 1.6;
                if (t === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 0, 255, ${pulse})`;
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GANONDORF', cx, screenY - 12);
        ctx.fillText('PORTAL', cx, screenY - 0);
    }
}

class GunPickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 20;
        this.collected = false;
        this.floatOffset = 0;
    }

    update() {
        this.floatOffset = Math.sin(Date.now() / 200) * 5;
        if (!this.collected &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            this.collected = true;
            gunCount += 10;
            hasGun = true;
            score += 50;
            updateGuns();
            updateScore();
        }
    }

    draw() {
        if (this.collected) return;
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + this.floatOffset;
        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#555';
        ctx.fillRect(screenX, screenY + 5, 28, 10);
        ctx.fillRect(screenX + 18, screenY, 10, 15);
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + 24, screenY + 5, 11, 5);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(screenX + 2, screenY + 6, 13, 3);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GUN', screenX + 14, screenY - 2);
    }
}

class BombPickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 26;
        this.height = 26;
        this.collected = false;
        this.floatOffset = 0;
    }

    update() {
        this.floatOffset = Math.sin(Date.now() / 250 + 1) * 5;
        if (!this.collected &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            this.collected = true;
            bombCount += 3;
            hasBombs = true;
            score += 50;
            updateBombs();
            updateScore();
            document.getElementById('bombDisplay').style.display = 'block';
        }
    }

    draw() {
        if (this.collected) return;
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + this.floatOffset;
        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(screenX + 13, screenY + 15, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + 11, screenY + 4, 4, 7);
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(screenX + 13, screenY + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💣', screenX + 13, screenY + 18);
    }
}

class Bullet {
    constructor(x, y, dirX) {
        this.x = x;
        this.y = y;
        this.width = 14;
        this.height = 6;
        this.velocityX = dirX * 18;
        this.life = 90;
        this.done = false;
    }

    update() {
        this.x += this.velocityX;
        this.life--;
        if (this.life <= 0 || this.x < 0 || this.x > levelWidth) { this.done = true; return; }

        if (ganondorf && !ganondorf.dead &&
            this.x < ganondorf.x + ganondorf.width &&
            this.x + this.width > ganondorf.x &&
            this.y < ganondorf.y + ganondorf.height &&
            this.y + this.height > ganondorf.y) {
            ganondorf.takeDamage(15);
            this.done = true;
            return;
        }

        for (let i = phantomGanons.length - 1; i >= 0; i--) {
            const pg = phantomGanons[i];
            if (this.x < pg.x + pg.width &&
                this.x + this.width > pg.x &&
                this.y < pg.y + pg.height &&
                this.y + this.height > pg.y) {
                pg.health -= 15;
                if (pg.health <= 0) {
                    phantomGanons.splice(i, 1);
                    score += 200;
                    updateScore();
                }
                this.done = true;
                break;
            }
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + this.width - 4, screenY + 1, 4, 4);
        ctx.fillStyle = 'rgba(255,200,0,0.4)';
        ctx.fillRect(screenX - 8, screenY - 2, 22, 10);
    }
}

class GloomOrb {
    constructor(x, y, targetX, targetY, speed) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const s = speed || 4;
        this.velocityX = (dx / dist) * s;
        this.velocityY = (dy / dist) * s;
        this.life = 220;
        this.done = false;
        this.pulse = 0;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life--;
        this.pulse += 0.2;
        if (this.life <= 0 || this.x < -50 || this.x > levelWidth + 50 || this.y > canvas.height + 50) this.done = true;

        if (!player.invincible &&
            Math.abs(this.x - (player.x + player.width / 2)) < this.radius + 18 &&
            Math.abs(this.y - (player.y + player.height / 2)) < this.radius + 25) {
            player.takeDamage(20);
            this.done = true;
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        if (screenX < -30 || screenX > canvas.width + 30) return;
        const r = this.radius + Math.sin(this.pulse) * 3;

        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r * 2.2);
        grad.addColorStop(0, 'rgba(200, 0, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(80, 0, 180, 0.6)');
        grad.addColorStop(1, 'rgba(0, 0, 80, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cc00ff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,150,255,0.5)';
        ctx.beginPath();
        ctx.arc(screenX - r * 0.3, screenY - r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
}

class LightningWarning {
    constructor(x) {
        this.x = x;
        this.width = 60;
        this.timer = 0;
        this.maxTimer = 90;
        this.struck = false;
        this.strikeTimer = 0;
    }

    update() {
        this.timer++;
        if (this.timer >= this.maxTimer && !this.struck) {
            this.struck = true;
            this.strikeTimer = 35;
            if (Math.abs(player.x + player.width / 2 - (this.x + this.width / 2)) < 55) {
                player.takeDamage(30);
            }
        }
        if (this.struck) this.strikeTimer--;
    }

    isDone() {
        return this.struck && this.strikeTimer <= 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        if (!this.struck) {
            const flash = Math.floor(Date.now() / 80) % 2;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';
                ctx.fillRect(screenX, 0, this.width, canvas.height);
            }
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(screenX + this.width / 2, 0);
            ctx.lineTo(screenX + this.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.strikeTimer > 0) {
            const alpha = this.strikeTimer / 35;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 10;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            let y = 0;
            ctx.moveTo(screenX + this.width / 2, 0);
            while (y < canvas.height) {
                const nx = screenX + this.width / 2 + (Math.random() - 0.5) * 28;
                y += 55;
                ctx.lineTo(nx, y);
            }
            ctx.stroke();
            ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }
}

class Shockwave {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 55;
        this.height = 32;
        this.velocityX = direction * 9;
        this.done = false;
        this.life = 120;
        this.pulse = 0;
    }

    update() {
        this.x += this.velocityX;
        this.life--;
        this.pulse += 0.3;
        if (this.life <= 0 || this.x < -100 || this.x > levelWidth + 100) this.done = true;

        if (!player.invincible &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(25);
            player.velocityY = -12;
            this.done = true;
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        if (screenX + this.width < 0 || screenX > canvas.width) return;

        const a = 0.6 + Math.sin(this.pulse) * 0.3;
        ctx.fillStyle = `rgba(180, 0, 255, ${a})`;
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, this.width, this.height);
    }
}

class PhantomGanon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 55;
        this.height = 80;
        this.speed = 2.5;
        this.direction = -1;
        this.health = 60;
        this.shootTimer = 0;
        this.dead = false;
    }

    update() {
        if (this.dead) return;
        const dx = player.x - this.x;
        this.direction = dx > 0 ? 1 : -1;
        this.x += this.speed * this.direction;
        if (this.x < 50) this.x = 50;
        if (this.x + this.width > levelWidth - 50) this.x = levelWidth - 50 - this.width;
        if (this.y + this.height > canvas.height - 50) this.y = canvas.height - 50 - this.height;

        this.shootTimer++;
        if (this.shootTimer > 110) {
            this.shootTimer = 0;
            gloomOrbs.push(new GloomOrb(
                this.x + this.width / 2, this.y + this.height / 2,
                player.x + player.width / 2, player.y + player.height / 2,
                3
            ));
        }

        if (!player.invincible &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(15);
        }

        if (player.attacking) {
            const ar = {
                x: player.direction === 'right' ? player.x + player.width - 20 : player.x - 80,
                y: player.y - 20,
                width: 100,
                height: player.height + 40
            };
            if (ar.x < this.x + this.width &&
                ar.x + ar.width > this.x &&
                ar.y < this.y + this.height &&
                ar.y + ar.height > this.y) {
                this.health -= 25;
                if (this.health <= 0) { this.dead = true; score += 300; updateScore(); }
            }
        }
    }

    draw() {
        if (this.dead) return;
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        if (screenX + this.width < 0 || screenX > canvas.width) return;

        ctx.globalAlpha = 0.82;
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY + this.height);
        ctx.lineTo(screenX - 12, screenY + this.height);
        ctx.lineTo(screenX + 10, screenY + 28);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width - 5, screenY + this.height);
        ctx.lineTo(screenX + this.width + 12, screenY + this.height);
        ctx.lineTo(screenX + this.width - 10, screenY + 28);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3a0060';
        ctx.fillRect(screenX + 8, screenY + 28, 39, 52);
        ctx.fillStyle = '#5500aa';
        ctx.fillRect(screenX + 10, screenY + 3, 35, 28);
        ctx.fillStyle = '#6600cc';
        ctx.fillRect(screenX + 12, screenY + 33, 31, 22);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX + 14, screenY + 10, 8, 8);
        ctx.fillRect(screenX + 33, screenY + 10, 8, 8);
        ctx.fillStyle = '#cc00ff';
        if (this.direction > 0) {
            ctx.fillRect(screenX + 46, screenY + 18, 5, 38);
        } else {
            ctx.fillRect(screenX - 6, screenY + 18, 5, 38);
        }
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 13, this.width, 8);
        ctx.fillStyle = '#cc00ff';
        ctx.fillRect(screenX, screenY - 13, this.width * (this.health / 60), 8);
    }
}

class FireMeteor {
    constructor(targetX) {
        this.x = targetX + (Math.random() - 0.5) * 180;
        this.y = -60;
        this.width = 32;
        this.height = 32;
        this.velocityY = 7 + Math.random() * 4;
        this.done = false;
        this.shadowX = this.x;
    }

    update() {
        this.y += this.velocityY;
        if (this.y > canvas.height + 20) { this.done = true; return; }

        if (!player.invincible &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(35);
            this.done = true;
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        const shadowSX = this.shadowX - camera.x;

        ctx.fillStyle = 'rgba(255, 80, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(shadowSX + 16, canvas.height - 55, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(screenX + 16, screenY + 16, 2, screenX + 16, screenY + 16, 22);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#FFD700');
        grad.addColorStop(0.65, '#ff6600');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 22, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Ganondorf {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 90;
        this.height = 140;
        this.health = 300;
        this.maxHealth = 300;
        this.phase = 1;
        this.direction = -1;
        this.dead = false;
        this.deathTimer = 0;

        this.gloomTimer = 0;
        this.gloomInterval = 120;
        this.lightningTimer = 60;
        this.lightningInterval = 210;
        this.shockwaveTimer = 0;
        this.shockwaveInterval = 290;
        this.meteorTimer = 0;
        this.meteorInterval = 85;
        this.phantomSummoned = false;
        this.phantomSummoned2 = false;

        this.animFrame = 0;
        this.hit = false;
        this.hitTimer = 0;
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.health -= amount;
        this.hit = true;
        this.hitTimer = 14;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            return;
        }
        if (this.health <= 100 && this.phase < 3) {
            this.phase = 3;
            this.gloomInterval = 55;
            this.lightningInterval = 110;
            this.meteorTimer = 0;
        } else if (this.health <= 200 && this.phase < 2) {
            this.phase = 2;
            this.gloomInterval = 85;
            this.lightningInterval = 155;
            this.shockwaveInterval = 190;
        }
    }

    update() {
        if (this.dead) { this.deathTimer++; return; }

        this.animFrame++;
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.hitTimer === 0) this.hit = false;

        const dx = player.x - this.x;
        this.direction = dx > 0 ? 1 : -1;
        this.x += this.direction * 1.3;
        if (this.x < 100) this.x = 100;
        if (this.x + this.width > levelWidth - 100) this.x = levelWidth - 100 - this.width;
        if (this.y + this.height > canvas.height - 50) this.y = canvas.height - 50 - this.height;

        if (!player.invincible &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            player.takeDamage(25);
        }

        if (player.attacking) {
            const ar = {
                x: player.direction === 'right' ? player.x + player.width - 20 : player.x - 80,
                y: player.y - 20,
                width: 100,
                height: player.height + 40
            };
            if (ar.x < this.x + this.width &&
                ar.x + ar.width > this.x &&
                ar.y < this.y + this.height &&
                ar.y + ar.height > this.y) {
                this.takeDamage(20);
            }
        }

        this.gloomTimer++;
        if (this.gloomTimer >= this.gloomInterval) {
            this.gloomTimer = 0;
            if (this.phase >= 2) {
                for (let i = -1; i <= 1; i++) {
                    const ang = Math.atan2(player.y - this.y, player.x - this.x) + i * 0.38;
                    gloomOrbs.push(new GloomOrb(
                        this.x + this.width / 2, this.y + 60,
                        this.x + Math.cos(ang) * 500, this.y + Math.sin(ang) * 500, 5
                    ));
                }
            } else {
                gloomOrbs.push(new GloomOrb(
                    this.x + this.width / 2, this.y + 60,
                    player.x + player.width / 2, player.y + player.height / 2, 4
                ));
            }
        }

        this.lightningTimer++;
        if (this.lightningTimer >= this.lightningInterval) {
            this.lightningTimer = 0;
            lightningWarnings.push(new LightningWarning(player.x - 30));
            if (this.phase >= 2) {
                lightningWarnings.push(new LightningWarning(player.x + 90));
            }
            if (this.phase >= 3) {
                lightningWarnings.push(new LightningWarning(player.x - 140));
            }
        }

        if (this.phase >= 2) {
            this.shockwaveTimer++;
            if (this.shockwaveTimer >= this.shockwaveInterval) {
                this.shockwaveTimer = 0;
                shockwaves.push(new Shockwave(this.x, canvas.height - 82, 1));
                shockwaves.push(new Shockwave(this.x + this.width, canvas.height - 82, -1));
            }
        }

        if (this.health <= 200 && !this.phantomSummoned) {
            this.phantomSummoned = true;
            phantomGanons.push(new PhantomGanon(this.x - 350, this.y));
            phantomGanons.push(new PhantomGanon(this.x + 220, this.y));
        }
        if (this.health <= 150 && !this.phantomSummoned2) {
            this.phantomSummoned2 = true;
            phantomGanons.push(new PhantomGanon(player.x + 220, this.y));
        }

        if (this.phase >= 3) {
            this.meteorTimer++;
            if (this.meteorTimer >= this.meteorInterval) {
                this.meteorTimer = 0;
                fireMeteors.push(new FireMeteor(player.x));
                fireMeteors.push(new FireMeteor(player.x + 210));
                fireMeteors.push(new FireMeteor(player.x - 210));
            }
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (this.dead) {
            if (this.deathTimer < 90) {
                for (let i = 0; i < 6; i++) {
                    const r = Math.random() * 90;
                    const a = Math.random() * Math.PI * 2;
                    ctx.fillStyle = Math.random() > 0.5 ? '#ff6600' : '#cc00ff';
                    ctx.beginPath();
                    ctx.arc(screenX + this.width / 2 + Math.cos(a) * r, screenY + this.height / 2 + Math.sin(a) * r, 18, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            return;
        }

        if (screenX + this.width < -100 || screenX > canvas.width + 100) return;

        const hitFlash = this.hit && Math.floor(Date.now() / 50) % 2;

        if (this.phase >= 3) {
            const pulse = Math.sin(this.animFrame * 0.08) * 0.15 + 0.25;
            ctx.fillStyle = `rgba(255, 80, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(screenX + this.width / 2, screenY + this.height / 2, 95, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(80, 0, 120, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, canvas.height - 55, 55, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hitFlash ? '#fff' : (this.phase >= 3 ? '#5a0000' : '#0f0020');
        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY + 32);
        ctx.lineTo(screenX - 18, screenY + this.height);
        ctx.lineTo(screenX + this.width + 18, screenY + this.height);
        ctx.lineTo(screenX + this.width - 5, screenY + 32);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = hitFlash ? '#ffbbbb' : (this.phase >= 3 ? '#3a0000' : '#1e0040');
        ctx.fillRect(screenX + 15, screenY + 32, 60, 78);

        ctx.fillStyle = hitFlash ? '#ffdddd' : (this.phase >= 3 ? '#6a0000' : '#5500aa');
        ctx.fillRect(screenX + 20, screenY + 37, 50, 38);

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(screenX + 45, screenY + 44);
        ctx.lineTo(screenX + 37, screenY + 57);
        ctx.lineTo(screenX + 53, screenY + 57);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + 37, screenY + 57);
        ctx.lineTo(screenX + 29, screenY + 70);
        ctx.lineTo(screenX + 45, screenY + 70);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + 53, screenY + 57);
        ctx.lineTo(screenX + 45, screenY + 70);
        ctx.lineTo(screenX + 61, screenY + 70);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = hitFlash ? '#ffbbbb' : '#2d0055';
        ctx.fillRect(screenX + 20, screenY + 2, 50, 34);

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX + 18, screenY - 4, 54, 9);
        ctx.fillRect(screenX + 30, screenY - 17, 10, 15);
        ctx.fillRect(screenX + 50, screenY - 14, 10, 12);
        ctx.fillRect(screenX + 40, screenY - 21, 10, 19);

        const eyeGlow = `rgba(255, 0, 0, ${0.6 + Math.sin(this.animFrame * 0.12) * 0.35})`;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX + 26, screenY + 9, 13, 10);
        ctx.fillRect(screenX + 51, screenY + 9, 13, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 29, screenY + 11, 7, 7);
        ctx.fillRect(screenX + 54, screenY + 11, 7, 7);
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(screenX + 32, screenY + 14, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 57, screenY + 14, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hitFlash ? '#fff' : '#8800dd';
        if (this.direction > 0) {
            ctx.fillRect(screenX + 78, screenY + 22, 9, 80);
            ctx.fillRect(screenX + 68, screenY + 27, 30, 10);
            ctx.fillRect(screenX + 78, screenY + 12, 9, 14);
        } else {
            ctx.fillRect(screenX - 17, screenY + 22, 9, 80);
            ctx.fillRect(screenX - 17, screenY + 27, 30, 10);
            ctx.fillRect(screenX - 17, screenY + 12, 9, 14);
        }

        if (this.phase >= 3) {
            const flap = Math.sin(this.animFrame * 0.14) * 22;
            ctx.fillStyle = 'rgba(140, 0, 0, 0.75)';
            ctx.beginPath();
            ctx.moveTo(screenX + 15, screenY + 32);
            ctx.lineTo(screenX - 75, screenY - 28 - flap);
            ctx.lineTo(screenX - 55, screenY + 8 - flap * 0.4);
            ctx.lineTo(screenX - 35, screenY - 18 - flap * 0.7);
            ctx.lineTo(screenX - 20, screenY + 22);
            ctx.lineTo(screenX + 15, screenY + 50);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(screenX + this.width - 15, screenY + 32);
            ctx.lineTo(screenX + this.width + 75, screenY - 28 - flap);
            ctx.lineTo(screenX + this.width + 55, screenY + 8 - flap * 0.4);
            ctx.lineTo(screenX + this.width + 35, screenY - 18 - flap * 0.7);
            ctx.lineTo(screenX + this.width + 20, screenY + 22);
            ctx.lineTo(screenX + this.width - 15, screenY + 50);
            ctx.closePath();
            ctx.fill();
        }

        const barW = 380;
        const barX = canvas.width / 2 - barW / 2;
        const barY = 18;
        ctx.fillStyle = '#111';
        ctx.fillRect(barX - 5, barY - 5, barW + 10, 48);
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barW, 30);
        const hpColor = this.phase >= 3 ? '#ff4400' : this.phase >= 2 ? '#cc0000' : '#8800cc';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), 30);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barW, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GANONDORF   ' + this.health + ' / ' + this.maxHealth, barX + barW / 2, barY + 20);
        const phaseName = this.phase === 3 ? '⚠  CALAMITY GANON  ⚠' : this.phase === 2 ? '★  DEMON KING  ★' : 'Demon King Ganondorf';
        ctx.fillStyle = this.phase >= 3 ? '#ff7700' : '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(phaseName, barX + barW / 2, barY + 44);
    }
}

let player = new Player(50, 300);
let enemies = [];
let flyingEnemies = [];
let bees = [];
let spikeBalls = [];
let platforms = [];
let movingPlatforms = [];
let bouncePlatforms = [];
let lavaBlocks = [];
let waterGeysers = [];
let lavaGeysers = [];
let coins = [];
let questionBlocks = [];
let bombs = [];
let breakableBlocks = [];
let hearts = [];
let oneUps = [];
let slopes = [];
let rollingRocks = [];
let acidPools = [];
let acidBubbles = [];
let trees = [];
let fallingSticks = [];
let sharks = [];
let floatBubbles = [];
let waterBlocks = [];
let acidClouds = [];
let acidRain = [];
let blizzardClouds = [];
let hailStones = [];
let grizzlyBears = [];
let tornados = [];
let honeyBlocks = [];
let groundCracks = [];
let finishLine;

function loadLevel(levelNum) {
    enemies = [];
    flyingEnemies = [];
    bees = [];
    spikeBalls = [];
    platforms = [];
    movingPlatforms = [];
    bouncePlatforms = [];
    lavaBlocks = [];
    waterGeysers = [];
    lavaGeysers = [];
    coins = [];
    questionBlocks = [];
    bombs = [];
    breakableBlocks = [];
    hearts = [];
    oneUps = [];
    slopes = [];
    rollingRocks = [];
    acidPools = [];
    acidBubbles = [];
    trees = [];
    fallingSticks = [];
    sharks = [];
    floatBubbles = [];
    waterBlocks = [];
    acidClouds = [];
    acidRain = [];
    blizzardClouds = [];
    hailStones = [];
    grizzlyBears = [];
    tornados = [];
    honeyBlocks = [];
    groundCracks = [];

    if (levelNum === 1) {
        levelWidth = 5000;
        player.x = 50;
        player.y = 300;
        player.health = 100;

        platforms.push(new Platform(0, 550, 400, 50));
        platforms.push(new Platform(600, 550, 300, 50));
        platforms.push(new Platform(1100, 550, 400, 50));
        platforms.push(new Platform(1700, 550, 300, 50));
        platforms.push(new Platform(2200, 550, 400, 50));
        platforms.push(new Platform(2800, 550, 300, 50));
        platforms.push(new Platform(3300, 550, 400, 50));
        platforms.push(new Platform(3900, 550, 300, 50));
        platforms.push(new Platform(4400, 550, 600, 50));

        platforms.push(new Platform(450, 450, 120, 20));
        platforms.push(new Platform(750, 400, 100, 20));
        platforms.push(new Platform(1550, 450, 120, 20));
        platforms.push(new Platform(2050, 400, 100, 20));
        platforms.push(new Platform(3150, 450, 120, 20));

        movingPlatforms.push(new MovingPlatform(950, 450, 100, 20, 2, 1, 950, 1200, 'horizontal'));
        movingPlatforms.push(new MovingPlatform(2350, 450, 100, 20, 2.5, 1, 2350, 2650, 'horizontal'));

        bouncePlatforms.push(new BouncePlatform(200, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1300, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(3600, 530, 80, 20));

        lavaBlocks.push(new LavaBlock(400, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(900, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(1500, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(2000, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(3100, 570, 200, 30));

        for (let i = 0; i < 15; i++) {
            const x = 300 + i * 300;
            const y = canvas.height - 100 - Math.random() * 150;
            const type = Math.random() > 0.5 ? 'fast' : 'normal';
            enemies.push(new Enemy(x, y, type));
        }

        for (let i = 0; i < 8; i++) {
            const x = 600 + i * 500;
            const y = 200 + Math.random() * 150;
            flyingEnemies.push(new FlyingEnemy(x, y));
        }

        for (let i = 0; i < 25; i++) {
            const x = 150 + i * 190;
            const y = 100 + Math.random() * 300;
            coins.push(new Coin(x, y));
        }

        questionBlocks.push(new QuestionBlock(500, 350));
        questionBlocks.push(new QuestionBlock(1800, 350));
        questionBlocks.push(new QuestionBlock(3400, 350));

        hearts.push(new Heart(750, 340));
        hearts.push(new Heart(2050, 340));
        hearts.push(new Heart(3750, 280));

        finishLine = new FinishLine(4850, 350, 60, 200);

    } else if (levelNum === 2) {
        levelWidth = 6000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        platforms.push(new Platform(500, 550, 250, 50));
        platforms.push(new Platform(950, 550, 300, 50));
        platforms.push(new Platform(1450, 550, 250, 50));
        platforms.push(new Platform(1900, 550, 300, 50));
        platforms.push(new Platform(2400, 550, 250, 50));
        platforms.push(new Platform(2850, 550, 300, 50));
        platforms.push(new Platform(3350, 550, 250, 50));
        platforms.push(new Platform(3800, 550, 300, 50));
        platforms.push(new Platform(4300, 550, 250, 50));
        platforms.push(new Platform(4750, 550, 300, 50));
        platforms.push(new Platform(5250, 550, 750, 50));

        platforms.push(new Platform(350, 450, 100, 20));
        platforms.push(new Platform(800, 400, 100, 20));
        platforms.push(new Platform(1300, 350, 100, 20));
        platforms.push(new Platform(2250, 450, 100, 20));
        platforms.push(new Platform(2700, 400, 100, 20));
        platforms.push(new Platform(3200, 350, 100, 20));
        platforms.push(new Platform(4150, 450, 100, 20));

        waterGeysers.push(new WaterGeyser(700, 570));
        waterGeysers.push(new WaterGeyser(1800, 570));
        waterGeysers.push(new WaterGeyser(3000, 570));
        waterGeysers.push(new WaterGeyser(4500, 570));

        movingPlatforms.push(new MovingPlatform(1100, 300, 100, 20, 2, 1, 250, 500, 'vertical'));
        movingPlatforms.push(new MovingPlatform(2000, 450, 100, 20, 2.5, 1, 2000, 2300, 'horizontal'));
        movingPlatforms.push(new MovingPlatform(3500, 300, 100, 20, 2, 1, 250, 500, 'vertical'));
        movingPlatforms.push(new MovingPlatform(4600, 450, 100, 20, 3, 1, 4600, 4950, 'horizontal'));

        bouncePlatforms.push(new BouncePlatform(150, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1550, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(3650, 530, 80, 20));

        spikeBalls.push(new SpikeBall(600, 200, 100, 450));
        spikeBalls.push(new SpikeBall(1650, 200, 100, 450));
        spikeBalls.push(new SpikeBall(2950, 200, 100, 450));
        spikeBalls.push(new SpikeBall(4400, 250, 150, 450));

        lavaBlocks.push(new LavaBlock(300, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(750, 570, 50, 30));
        lavaBlocks.push(new LavaBlock(1250, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(2200, 570, 50, 30));
        lavaBlocks.push(new LavaBlock(2650, 570, 200, 30));
        lavaBlocks.push(new LavaBlock(3150, 570, 50, 30));
        lavaBlocks.push(new LavaBlock(4100, 570, 200, 30));

        for (let i = 0; i < 20; i++) {
            const x = 250 + i * 280;
            const y = canvas.height - 100 - Math.random() * 150;
            const type = Math.random() > 0.6 ? 'fast' : 'normal';
            enemies.push(new Enemy(x, y, type));
        }

        for (let i = 0; i < 12; i++) {
            const x = 500 + i * 450;
            const y = 180 + Math.random() * 140;
            flyingEnemies.push(new FlyingEnemy(x, y));
        }

        for (let i = 0; i < 35; i++) {
            const x = 120 + i * 165;
            const y = 80 + Math.random() * 320;
            coins.push(new Coin(x, y));
        }

        questionBlocks.push(new QuestionBlock(600, 300));
        questionBlocks.push(new QuestionBlock(1400, 250));
        questionBlocks.push(new QuestionBlock(2500, 300));
        questionBlocks.push(new QuestionBlock(3600, 250));
        questionBlocks.push(new QuestionBlock(4800, 300));

        hearts.push(new Heart(800, 340));
        hearts.push(new Heart(1300, 290));
        hearts.push(new Heart(2700, 340));
        hearts.push(new Heart(3500, 240));
        hearts.push(new Heart(4600, 380));

        finishLine = new FinishLine(5900, 350, 60, 200);

    } else if (levelNum === 3) {
        levelWidth = 7000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 250, 50));
        platforms.push(new Platform(400, 550, 200, 50));
        platforms.push(new Platform(750, 550, 200, 50));
        platforms.push(new Platform(1100, 550, 200, 50));
        platforms.push(new Platform(1450, 550, 200, 50));
        platforms.push(new Platform(1800, 550, 200, 50));
        platforms.push(new Platform(2150, 550, 200, 50));
        platforms.push(new Platform(2500, 550, 200, 50));
        platforms.push(new Platform(2850, 550, 200, 50));
        platforms.push(new Platform(3200, 550, 200, 50));
        platforms.push(new Platform(3550, 550, 200, 50));
        platforms.push(new Platform(3900, 550, 200, 50));
        platforms.push(new Platform(4250, 550, 200, 50));
        platforms.push(new Platform(4600, 550, 200, 50));
        platforms.push(new Platform(4950, 550, 200, 50));
        platforms.push(new Platform(5300, 550, 200, 50));
        platforms.push(new Platform(5650, 550, 1350, 50));

        platforms.push(new Platform(300, 450, 80, 20));
        platforms.push(new Platform(650, 400, 80, 20));
        platforms.push(new Platform(1000, 350, 80, 20));
        platforms.push(new Platform(1700, 450, 80, 20));
        platforms.push(new Platform(2400, 400, 80, 20));
        platforms.push(new Platform(3100, 350, 80, 20));
        platforms.push(new Platform(3800, 450, 80, 20));
        platforms.push(new Platform(4500, 400, 80, 20));
        platforms.push(new Platform(5200, 350, 80, 20));

        lavaGeysers.push(new LavaGeyser(550, 570));
        lavaGeysers.push(new LavaGeyser(950, 570));
        lavaGeysers.push(new LavaGeyser(1300, 570));
        lavaGeysers.push(new LavaGeyser(1650, 570));
        lavaGeysers.push(new LavaGeyser(2000, 570));
        lavaGeysers.push(new LavaGeyser(2350, 570));
        lavaGeysers.push(new LavaGeyser(2700, 570));
        lavaGeysers.push(new LavaGeyser(3050, 570));
        lavaGeysers.push(new LavaGeyser(3400, 570));
        lavaGeysers.push(new LavaGeyser(3750, 570));
        lavaGeysers.push(new LavaGeyser(4100, 570));
        lavaGeysers.push(new LavaGeyser(4450, 570));
        lavaGeysers.push(new LavaGeyser(4800, 570));
        lavaGeysers.push(new LavaGeyser(5150, 570));
        lavaGeysers.push(new LavaGeyser(5500, 570));

        waterGeysers.push(new WaterGeyser(250, 570));
        waterGeysers.push(new WaterGeyser(1350, 570));
        waterGeysers.push(new WaterGeyser(2450, 570));
        waterGeysers.push(new WaterGeyser(3550, 570));
        waterGeysers.push(new WaterGeyser(4650, 570));
        waterGeysers.push(new WaterGeyser(5750, 570));

        movingPlatforms.push(new MovingPlatform(850, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        movingPlatforms.push(new MovingPlatform(1550, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        movingPlatforms.push(new MovingPlatform(2250, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        movingPlatforms.push(new MovingPlatform(2950, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        movingPlatforms.push(new MovingPlatform(3650, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        movingPlatforms.push(new MovingPlatform(4350, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        movingPlatforms.push(new MovingPlatform(5050, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));

        bouncePlatforms.push(new BouncePlatform(100, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1200, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(2300, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(3400, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(4500, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(5600, 530, 80, 20));

        spikeBalls.push(new SpikeBall(500, 200, 100, 450));
        spikeBalls.push(new SpikeBall(900, 250, 150, 450));
        spikeBalls.push(new SpikeBall(1600, 200, 100, 450));
        spikeBalls.push(new SpikeBall(2300, 250, 150, 450));
        spikeBalls.push(new SpikeBall(3000, 200, 100, 450));
        spikeBalls.push(new SpikeBall(3700, 250, 150, 450));
        spikeBalls.push(new SpikeBall(4400, 200, 100, 450));
        spikeBalls.push(new SpikeBall(5100, 250, 150, 450));

        for (let i = 0; i < 28; i++) {
            const x = 200 + i * 240;
            const y = canvas.height - 100 - Math.random() * 150;
            const type = Math.random() > 0.6 ? 'fast' : 'normal';
            enemies.push(new Enemy(x, y, type));
        }

        for (let i = 0; i < 18; i++) {
            const x = 400 + i * 370;
            const y = 160 + Math.random() * 130;
            flyingEnemies.push(new FlyingEnemy(x, y));
        }

        for (let i = 0; i < 45; i++) {
            const x = 100 + i * 150;
            const y = 70 + Math.random() * 330;
            coins.push(new Coin(x, y));
        }

        questionBlocks.push(new QuestionBlock(500, 280));
        questionBlocks.push(new QuestionBlock(1200, 230));
        questionBlocks.push(new QuestionBlock(1900, 280));
        questionBlocks.push(new QuestionBlock(2600, 230));
        questionBlocks.push(new QuestionBlock(3300, 280));
        questionBlocks.push(new QuestionBlock(4000, 230));
        questionBlocks.push(new QuestionBlock(4700, 280));
        questionBlocks.push(new QuestionBlock(5400, 230));

        breakableBlocks.push(new BreakableBlock(6200, 400, 120, 150));
        breakableBlocks.push(new BreakableBlock(6200, 250, 120, 150));
        breakableBlocks.push(new BreakableBlock(6400, 400, 120, 150));
        breakableBlocks.push(new BreakableBlock(6400, 250, 120, 150));
        breakableBlocks.push(new BreakableBlock(6600, 400, 120, 150));
        breakableBlocks.push(new BreakableBlock(6600, 250, 120, 150));

        hearts.push(new Heart(650, 330));
        hearts.push(new Heart(1000, 280));
        hearts.push(new Heart(2400, 330));
        hearts.push(new Heart(3800, 380));
        hearts.push(new Heart(5200, 280));

        oneUps.push(new OneUp(3500, 250));

        finishLine = new FinishLine(6900, 350, 60, 200);

    } else if (levelNum === 4) {
        levelWidth = 8000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 200, 50));
        for (let i = 0; i < 30; i++) {
            platforms.push(new Platform(300 + i * 250, 550, 150, 50));
        }

        for (let i = 0; i < 15; i++) {
            platforms.push(new Platform(250 + i * 500, 450 - (i % 3) * 50, 80, 20));
        }

        for (let i = 0; i < 10; i++) {
            waterGeysers.push(new WaterGeyser(400 + i * 750, 570));
        }

        for (let i = 0; i < 10; i++) {
            lavaGeysers.push(new LavaGeyser(650 + i * 750, 570));
        }

        for (let i = 0; i < 10; i++) {
            movingPlatforms.push(new MovingPlatform(1000 + i * 700, 300, 90, 20, 2.5, 1, 250, 480, 'vertical'));
        }

        for (let i = 0; i < 8; i++) {
            bouncePlatforms.push(new BouncePlatform(500 + i * 900, 530, 80, 20));
        }

        for (let i = 0; i < 12; i++) {
            spikeBalls.push(new SpikeBall(800 + i * 600, 200 + (i % 2) * 50, 100, 450));
        }

        for (let i = 0; i < 35; i++) {
            const x = 200 + i * 220;
            const y = canvas.height - 100 - Math.random() * 150;
            const type = Math.random() > 0.5 ? 'fast' : 'normal';
            enemies.push(new Enemy(x, y, type));
        }

        for (let i = 0; i < 22; i++) {
            const x = 400 + i * 350;
            const y = 150 + Math.random() * 120;
            flyingEnemies.push(new FlyingEnemy(x, y));
        }

        for (let i = 0; i < 55; i++) {
            const x = 100 + i * 140;
            const y = 60 + Math.random() * 340;
            coins.push(new Coin(x, y));
        }

        for (let i = 0; i < 10; i++) {
            questionBlocks.push(new QuestionBlock(600 + i * 700, 250 + (i % 2) * 80));
        }

        breakableBlocks.push(new BreakableBlock(7100, 400, 100, 150));
        breakableBlocks.push(new BreakableBlock(7100, 250, 100, 150));
        breakableBlocks.push(new BreakableBlock(7250, 400, 100, 150));
        breakableBlocks.push(new BreakableBlock(7250, 250, 100, 150));
        breakableBlocks.push(new BreakableBlock(7400, 400, 100, 150));
        breakableBlocks.push(new BreakableBlock(7400, 250, 100, 150));
        breakableBlocks.push(new BreakableBlock(7550, 400, 100, 150));
        breakableBlocks.push(new BreakableBlock(7550, 250, 100, 150));

        hearts.push(new Heart(900, 360));
        hearts.push(new Heart(1700, 380));
        hearts.push(new Heart(2950, 360));
        hearts.push(new Heart(3650, 360));
        hearts.push(new Heart(5050, 360));
        hearts.push(new Heart(6400, 380));

        finishLine = new FinishLine(7900, 350, 60, 200);

    } else if (levelNum === 5) {
        levelWidth = 9000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 150, 50));
        for (let i = 0; i < 35; i++) {
            if (i % 4 !== 2) {
                platforms.push(new Platform(250 + i * 250, 550, 120, 50));
            }
        }

        for (let i = 0; i < 20; i++) {
            platforms.push(new Platform(200 + i * 450, 400 - (i % 4) * 40, 70, 20));
        }

        for (let i = 0; i < 18; i++) {
            lavaGeysers.push(new LavaGeyser(500 + i * 470, 570));
        }

        for (let i = 0; i < 8; i++) {
            waterGeysers.push(new WaterGeyser(300 + i * 1100, 570));
        }

        for (let i = 0; i < 12; i++) {
            movingPlatforms.push(new MovingPlatform(900 + i * 700, 350, 80, 20, 3, 1, 900 + i * 700, 1100 + i * 700, 'horizontal'));
        }

        for (let i = 0; i < 15; i++) {
            spikeBalls.push(new SpikeBall(700 + i * 550, 180 + (i % 3) * 40, 80, 450));
        }

        for (let i = 0; i < 20; i++) {
            lavaBlocks.push(new LavaBlock(370 + i * 250, 570, 100, 30));
        }

        for (let i = 0; i < 10; i++) {
            bouncePlatforms.push(new BouncePlatform(150 + i * 850, 530, 80, 20));
        }

        for (let i = 0; i < 42; i++) {
            const x = 180 + i * 200;
            const y = canvas.height - 100 - Math.random() * 150;
            const type = Math.random() > 0.5 ? 'fast' : 'normal';
            enemies.push(new Enemy(x, y, type));
        }

        for (let i = 0; i < 28; i++) {
            const x = 350 + i * 310;
            const y = 140 + Math.random() * 110;
            flyingEnemies.push(new FlyingEnemy(x, y));
        }

        for (let i = 0; i < 65; i++) {
            const x = 90 + i * 135;
            const y = 50 + Math.random() * 350;
            coins.push(new Coin(x, y));
        }

        for (let i = 0; i < 12; i++) {
            questionBlocks.push(new QuestionBlock(550 + i * 700, 230 + (i % 3) * 60));
        }

        breakableBlocks.push(new BreakableBlock(8000, 450, 90, 100));
        breakableBlocks.push(new BreakableBlock(8000, 350, 90, 100));
        breakableBlocks.push(new BreakableBlock(8000, 250, 90, 100));
        breakableBlocks.push(new BreakableBlock(8150, 450, 90, 100));
        breakableBlocks.push(new BreakableBlock(8150, 350, 90, 100));
        breakableBlocks.push(new BreakableBlock(8150, 250, 90, 100));
        breakableBlocks.push(new BreakableBlock(8300, 450, 90, 100));
        breakableBlocks.push(new BreakableBlock(8300, 350, 90, 100));
        breakableBlocks.push(new BreakableBlock(8300, 250, 90, 100));
        breakableBlocks.push(new BreakableBlock(8450, 450, 90, 100));
        breakableBlocks.push(new BreakableBlock(8450, 350, 90, 100));
        breakableBlocks.push(new BreakableBlock(8450, 250, 90, 100));

        hearts.push(new Heart(550, 340));
        hearts.push(new Heart(1350, 380));
        hearts.push(new Heart(2450, 340));
        hearts.push(new Heart(3550, 380));
        hearts.push(new Heart(4650, 340));
        hearts.push(new Heart(5750, 380));
        hearts.push(new Heart(7200, 340));

        finishLine = new FinishLine(8900, 350, 60, 200);

    } else if (levelNum === 6) {
        levelWidth = 10000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 120, 50));
        for (let i = 0; i < 40; i++) {
            if (i % 5 !== 3) {
                platforms.push(new Platform(200 + i * 240, 550, 100, 50));
            }
        }

        for (let i = 0; i < 25; i++) {
            platforms.push(new Platform(150 + i * 400, 380 - (i % 5) * 35, 60, 20));
        }

        for (let i = 0; i < 22; i++) {
            lavaGeysers.push(new LavaGeyser(450 + i * 440, 570));
        }

        for (let i = 0; i < 10; i++) {
            waterGeysers.push(new WaterGeyser(250 + i * 980, 570));
        }

        for (let i = 0; i < 15; i++) {
            movingPlatforms.push(new MovingPlatform(800 + i * 650, 280, 75, 20, 3.5, 1, 200, 500, 'vertical'));
        }

        for (let i = 0; i < 12; i++) {
            movingPlatforms.push(new MovingPlatform(1000 + i * 750, 450, 85, 20, 3, 1, 1000 + i * 750, 1200 + i * 750, 'horizontal'));
        }

        for (let i = 0; i < 20; i++) {
            spikeBalls.push(new SpikeBall(650 + i * 480, 160 + (i % 4) * 35, 70, 470));
        }

        for (let i = 0; i < 25; i++) {
            lavaBlocks.push(new LavaBlock(340 + i * 240, 570, 90, 30));
        }

        for (let i = 0; i < 12; i++) {
            bouncePlatforms.push(new BouncePlatform(120 + i * 820, 530, 80, 20));
        }

        for (let i = 0; i < 50; i++) {
            const x = 160 + i * 195;
            const y = canvas.height - 100 - Math.random() * 150;
            const type = Math.random() > 0.5 ? 'fast' : 'normal';
            enemies.push(new Enemy(x, y, type));
        }

        for (let i = 0; i < 35; i++) {
            const x = 320 + i * 280;
            const y = 130 + Math.random() * 100;
            flyingEnemies.push(new FlyingEnemy(x, y));
        }

        for (let i = 0; i < 75; i++) {
            const x = 80 + i * 130;
            const y = 40 + Math.random() * 360;
            coins.push(new Coin(x, y));
        }

        for (let i = 0; i < 15; i++) {
            questionBlocks.push(new QuestionBlock(500 + i * 630, 210 + (i % 4) * 50));
        }

        breakableBlocks.push(new BreakableBlock(9000, 500, 80, 50));
        breakableBlocks.push(new BreakableBlock(9000, 450, 80, 50));
        breakableBlocks.push(new BreakableBlock(9000, 400, 80, 50));
        breakableBlocks.push(new BreakableBlock(9000, 350, 80, 50));
        breakableBlocks.push(new BreakableBlock(9000, 300, 80, 50));
        breakableBlocks.push(new BreakableBlock(9000, 250, 80, 50));
        breakableBlocks.push(new BreakableBlock(9130, 500, 80, 50));
        breakableBlocks.push(new BreakableBlock(9130, 450, 80, 50));
        breakableBlocks.push(new BreakableBlock(9130, 400, 80, 50));
        breakableBlocks.push(new BreakableBlock(9130, 350, 80, 50));
        breakableBlocks.push(new BreakableBlock(9130, 300, 80, 50));
        breakableBlocks.push(new BreakableBlock(9130, 250, 80, 50));
        breakableBlocks.push(new BreakableBlock(9260, 500, 80, 50));
        breakableBlocks.push(new BreakableBlock(9260, 450, 80, 50));
        breakableBlocks.push(new BreakableBlock(9260, 400, 80, 50));
        breakableBlocks.push(new BreakableBlock(9260, 350, 80, 50));
        breakableBlocks.push(new BreakableBlock(9260, 300, 80, 50));
        breakableBlocks.push(new BreakableBlock(9260, 250, 80, 50));
        breakableBlocks.push(new BreakableBlock(9390, 500, 80, 50));
        breakableBlocks.push(new BreakableBlock(9390, 450, 80, 50));
        breakableBlocks.push(new BreakableBlock(9390, 400, 80, 50));
        breakableBlocks.push(new BreakableBlock(9390, 350, 80, 50));
        breakableBlocks.push(new BreakableBlock(9390, 300, 80, 50));
        breakableBlocks.push(new BreakableBlock(9390, 250, 80, 50));
        breakableBlocks.push(new BreakableBlock(9520, 500, 80, 50));
        breakableBlocks.push(new BreakableBlock(9520, 450, 80, 50));
        breakableBlocks.push(new BreakableBlock(9520, 400, 80, 50));
        breakableBlocks.push(new BreakableBlock(9520, 350, 80, 50));
        breakableBlocks.push(new BreakableBlock(9520, 300, 80, 50));
        breakableBlocks.push(new BreakableBlock(9520, 250, 80, 50));

        hearts.push(new Heart(500, 320));
        hearts.push(new Heart(1200, 340));
        hearts.push(new Heart(2300, 320));
        hearts.push(new Heart(3400, 340));
        hearts.push(new Heart(4500, 320));
        hearts.push(new Heart(5600, 340));
        hearts.push(new Heart(7000, 320));
        hearts.push(new Heart(8200, 340));

        oneUps.push(new OneUp(6200, 300));

        finishLine = new FinishLine(9900, 350, 60, 200);

    } else if (levelNum === 7) {
        levelWidth = 6000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        platforms.push(new Platform(500, 550, 300, 50));
        platforms.push(new Platform(1000, 550, 300, 50));
        platforms.push(new Platform(1500, 550, 300, 50));
        platforms.push(new Platform(2000, 550, 300, 50));
        platforms.push(new Platform(2500, 550, 300, 50));
        platforms.push(new Platform(3000, 550, 300, 50));
        platforms.push(new Platform(3500, 550, 300, 50));
        platforms.push(new Platform(4000, 550, 300, 50));
        platforms.push(new Platform(4500, 550, 300, 50));
        platforms.push(new Platform(5000, 550, 1000, 50));

        slopes.push(new Slope(800, 300, 300, 250));
        slopes.push(new Slope(1600, 300, 300, 250));
        slopes.push(new Slope(2400, 300, 300, 250));
        slopes.push(new Slope(3200, 300, 300, 250));

        rollingRocks.push(new RollingRock(1050, 250, 50, 50, -5, 5, 700, 1100));
        rollingRocks.push(new RollingRock(1850, 250, 50, 50, -5, 5, 1500, 1900));
        rollingRocks.push(new RollingRock(2650, 250, 50, 50, -5, 5, 2300, 2700));

        for (let i = 0; i < 20; i++) {
            coins.push(new Coin(200 + i * 280, 100 + Math.random() * 200));
        }

        hearts.push(new Heart(1200, 300));
        hearts.push(new Heart(2800, 300));
        hearts.push(new Heart(4200, 300));

        finishLine = new FinishLine(5900, 350, 60, 200);

    } else if (levelNum === 8) {
        levelWidth = 6000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 250, 50));
        platforms.push(new Platform(400, 550, 200, 50));
        platforms.push(new Platform(800, 550, 200, 50));
        platforms.push(new Platform(1200, 550, 200, 50));
        platforms.push(new Platform(1600, 550, 200, 50));
        platforms.push(new Platform(2000, 550, 200, 50));
        platforms.push(new Platform(2400, 550, 200, 50));
        platforms.push(new Platform(2800, 550, 200, 50));
        platforms.push(new Platform(3200, 550, 200, 50));
        platforms.push(new Platform(3600, 550, 200, 50));
        platforms.push(new Platform(4000, 550, 200, 50));
        platforms.push(new Platform(4400, 550, 200, 50));
        platforms.push(new Platform(4800, 550, 1200, 50));

        acidPools.push(new AcidPool(250, 570, 150, 30));
        acidPools.push(new AcidPool(600, 570, 200, 30));
        acidPools.push(new AcidPool(1000, 570, 200, 30));
        acidPools.push(new AcidPool(1400, 570, 200, 30));
        acidPools.push(new AcidPool(1800, 570, 200, 30));
        acidPools.push(new AcidPool(2200, 570, 200, 30));
        acidPools.push(new AcidPool(2600, 570, 200, 30));
        acidPools.push(new AcidPool(3000, 570, 200, 30));
        acidPools.push(new AcidPool(3400, 570, 200, 30));
        acidPools.push(new AcidPool(3800, 570, 200, 30));
        acidPools.push(new AcidPool(4200, 570, 200, 30));
        acidPools.push(new AcidPool(4600, 570, 200, 30));

        bouncePlatforms.push(new BouncePlatform(300, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1100, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1900, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(2700, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(3500, 530, 80, 20));

        for (let i = 0; i < 25; i++) {
            coins.push(new Coin(150 + i * 230, 80 + Math.random() * 220));
        }

        hearts.push(new Heart(900, 300));
        hearts.push(new Heart(2100, 300));
        hearts.push(new Heart(3300, 300));

        finishLine = new FinishLine(5900, 350, 60, 200);

    } else if (levelNum === 9) {
        levelWidth = 6000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 400, 50));
        platforms.push(new Platform(600, 550, 400, 50));
        platforms.push(new Platform(1200, 550, 400, 50));
        platforms.push(new Platform(1800, 550, 400, 50));
        platforms.push(new Platform(2400, 550, 400, 50));
        platforms.push(new Platform(3000, 550, 400, 50));
        platforms.push(new Platform(3600, 550, 400, 50));
        platforms.push(new Platform(4200, 550, 400, 50));
        platforms.push(new Platform(4800, 550, 1200, 50));

        trees.push(new Tree(500, 450, 30, 100));
        trees.push(new Tree(900, 450, 30, 100));
        trees.push(new Tree(1300, 450, 30, 100));
        trees.push(new Tree(1700, 450, 30, 100));
        trees.push(new Tree(2100, 450, 30, 100));
        trees.push(new Tree(2500, 450, 30, 100));
        trees.push(new Tree(2900, 450, 30, 100));
        trees.push(new Tree(3300, 450, 30, 100));
        trees.push(new Tree(3700, 450, 30, 100));
        trees.push(new Tree(4100, 450, 30, 100));

        for (let i = 0; i < 8; i++) {
            enemies.push(new Enemy(400 + i * 600, canvas.height - 100, 'normal'));
        }

        for (let i = 0; i < 20; i++) {
            coins.push(new Coin(200 + i * 280, 100 + Math.random() * 200));
        }

        hearts.push(new Heart(1100, 300));
        hearts.push(new Heart(2700, 300));
        hearts.push(new Heart(4100, 300));

        oneUps.push(new OneUp(2000, 250));

        finishLine = new FinishLine(5900, 350, 60, 200);

    } else if (levelNum === 10) {
        levelWidth = 7000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        platforms.push(new Platform(500, 550, 200, 50));
        platforms.push(new Platform(1500, 550, 200, 50));
        platforms.push(new Platform(2500, 550, 200, 50));
        platforms.push(new Platform(3500, 550, 200, 50));
        platforms.push(new Platform(4500, 550, 200, 50));
        platforms.push(new Platform(5500, 550, 200, 50));
        platforms.push(new Platform(6200, 550, 800, 50));

        waterBlocks.push(new WaterBlock(700, 400, 800, 200));
        waterBlocks.push(new WaterBlock(1700, 400, 800, 200));
        waterBlocks.push(new WaterBlock(2700, 400, 800, 200));
        waterBlocks.push(new WaterBlock(3700, 400, 800, 200));
        waterBlocks.push(new WaterBlock(4700, 400, 800, 200));
        waterBlocks.push(new WaterBlock(5700, 400, 500, 200));

        sharks.push(new Shark(800, 450, 50, 30, 2, 300));
        sharks.push(new Shark(1800, 450, 50, 30, 2, 300));
        sharks.push(new Shark(2800, 450, 50, 30, 2, 300));
        sharks.push(new Shark(3800, 450, 50, 30, 2, 300));
        sharks.push(new Shark(4800, 450, 50, 30, 2, 300));

        for (let i = 0; i < 25; i++) {
            coins.push(new Coin(150 + i * 270, 80 + Math.random() * 180));
        }

        hearts.push(new Heart(1200, 250));
        hearts.push(new Heart(3200, 250));
        hearts.push(new Heart(5200, 250));

        finishLine = new FinishLine(6900, 350, 60, 200);

    } else if (levelNum === 11) {
        levelWidth = 6000;
        player.x = 100;
        player.y = 100;

        floatBubbles.push({ x: 150, y: 150, radius: 60 });
        floatBubbles.push({ x: 350, y: 200, radius: 60 });
        floatBubbles.push({ x: 550, y: 150, radius: 60 });
        floatBubbles.push({ x: 750, y: 250, radius: 60 });
        floatBubbles.push({ x: 950, y: 180, radius: 60 });
        floatBubbles.push({ x: 1150, y: 220, radius: 60 });
        floatBubbles.push({ x: 1350, y: 150, radius: 60 });
        floatBubbles.push({ x: 1550, y: 200, radius: 60 });
        floatBubbles.push({ x: 1750, y: 270, radius: 60 });
        floatBubbles.push({ x: 1950, y: 180, radius: 60 });
        floatBubbles.push({ x: 2150, y: 220, radius: 60 });
        floatBubbles.push({ x: 2350, y: 150, radius: 60 });
        floatBubbles.push({ x: 2550, y: 200, radius: 60 });
        floatBubbles.push({ x: 2750, y: 260, radius: 60 });
        floatBubbles.push({ x: 2950, y: 170, radius: 60 });
        floatBubbles.push({ x: 3150, y: 230, radius: 60 });
        floatBubbles.push({ x: 3350, y: 160, radius: 60 });
        floatBubbles.push({ x: 3550, y: 210, radius: 60 });
        floatBubbles.push({ x: 3750, y: 250, radius: 60 });
        floatBubbles.push({ x: 3950, y: 180, radius: 60 });
        floatBubbles.push({ x: 4150, y: 220, radius: 60 });
        floatBubbles.push({ x: 4350, y: 160, radius: 60 });
        floatBubbles.push({ x: 4550, y: 200, radius: 60 });
        floatBubbles.push({ x: 4750, y: 240, radius: 60 });
        floatBubbles.push({ x: 4950, y: 180, radius: 60 });
        floatBubbles.push({ x: 5150, y: 210, radius: 60 });
        floatBubbles.push({ x: 5350, y: 160, radius: 60 });
        floatBubbles.push({ x: 5550, y: 200, radius: 60 });
        floatBubbles.push({ x: 5750, y: 230, radius: 60 });

        bees.push(new Bee(500, 400));
        bees.push(new Bee(1000, 350));
        bees.push(new Bee(1500, 450));
        bees.push(new Bee(2000, 380));
        bees.push(new Bee(2500, 420));
        bees.push(new Bee(3000, 360));
        bees.push(new Bee(3500, 440));
        bees.push(new Bee(4000, 390));
        bees.push(new Bee(4500, 410));
        bees.push(new Bee(5000, 370));

        for (let i = 0; i < 20; i++) {
            coins.push(new Coin(200 + i * 280, 60 + Math.random() * 150));
        }

        hearts.push(new Heart(1000, 280));
        hearts.push(new Heart(2500, 280));
        hearts.push(new Heart(4000, 280));

        finishLine = new FinishLine(5900, 200, 60, 200);

    } else if (levelNum === 12) {
        levelWidth = 7000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 250, 50));
        platforms.push(new Platform(400, 550, 200, 50));
        platforms.push(new Platform(800, 550, 200, 50));
        platforms.push(new Platform(1200, 550, 200, 50));
        platforms.push(new Platform(1600, 550, 200, 50));
        platforms.push(new Platform(2000, 550, 200, 50));
        platforms.push(new Platform(2400, 550, 200, 50));
        platforms.push(new Platform(2800, 550, 200, 50));
        platforms.push(new Platform(3200, 550, 200, 50));
        platforms.push(new Platform(3600, 550, 200, 50));
        platforms.push(new Platform(4000, 550, 200, 50));
        platforms.push(new Platform(4400, 550, 200, 50));
        platforms.push(new Platform(4800, 550, 200, 50));
        platforms.push(new Platform(5200, 550, 200, 50));
        platforms.push(new Platform(5600, 550, 1400, 50));

        slopes.push(new Slope(600, 300, 300, 250));
        slopes.push(new Slope(1400, 300, 300, 250));
        slopes.push(new Slope(2200, 300, 300, 250));
        slopes.push(new Slope(3000, 300, 300, 250));
        slopes.push(new Slope(3800, 300, 300, 250));
        slopes.push(new Slope(4600, 300, 300, 250));

        rollingRocks.push(new RollingRock(850, 250, 50, 50, -5, 5, 500, 900));
        rollingRocks.push(new RollingRock(1650, 250, 50, 50, -5, 5, 1300, 1700));
        rollingRocks.push(new RollingRock(2450, 250, 50, 50, -5, 5, 2100, 2500));

        acidPools.push(new AcidPool(250, 570, 150, 30));
        acidPools.push(new AcidPool(1000, 570, 200, 30));
        acidPools.push(new AcidPool(1800, 570, 200, 30));
        acidPools.push(new AcidPool(2600, 570, 200, 30));
        acidPools.push(new AcidPool(3400, 570, 200, 30));
        acidPools.push(new AcidPool(4200, 570, 200, 30));
        acidPools.push(new AcidPool(5000, 570, 200, 30));

        for (let i = 0; i < 10; i++) {
            flyingEnemies.push(new FlyingEnemy(500 + i * 600, 200 + Math.random() * 100));
        }

        for (let i = 0; i < 30; i++) {
            coins.push(new Coin(150 + i * 220, 70 + Math.random() * 180));
        }

        hearts.push(new Heart(1100, 300));
        hearts.push(new Heart(2700, 300));
        hearts.push(new Heart(4300, 300));
        hearts.push(new Heart(5700, 300));

        oneUps.push(new OneUp(3500, 250));

        finishLine = new FinishLine(6900, 350, 60, 200);

    } else if (levelNum === 13) {
        levelWidth = 6000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 400, 50));
        platforms.push(new Platform(600, 550, 400, 50));
        platforms.push(new Platform(1200, 550, 400, 50));
        platforms.push(new Platform(1800, 550, 400, 50));
        platforms.push(new Platform(2400, 550, 400, 50));
        platforms.push(new Platform(3000, 550, 400, 50));
        platforms.push(new Platform(3600, 550, 400, 50));
        platforms.push(new Platform(4200, 550, 400, 50));
        platforms.push(new Platform(4800, 550, 1200, 50));

        acidClouds.push(new AcidCloud(300, 50, 150, 60));
        acidClouds.push(new AcidCloud(900, 50, 150, 60));
        acidClouds.push(new AcidCloud(1500, 50, 150, 60));
        acidClouds.push(new AcidCloud(2100, 50, 150, 60));
        acidClouds.push(new AcidCloud(2700, 50, 150, 60));
        acidClouds.push(new AcidCloud(3300, 50, 150, 60));
        acidClouds.push(new AcidCloud(3900, 50, 150, 60));
        acidClouds.push(new AcidCloud(4500, 50, 150, 60));

        movingPlatforms.push(new MovingPlatform(800, 400, 100, 20, 2, 1, 800, 1100, 'horizontal'));
        movingPlatforms.push(new MovingPlatform(2000, 400, 100, 20, 2, 1, 2000, 2300, 'horizontal'));
        movingPlatforms.push(new MovingPlatform(3200, 400, 100, 20, 2, 1, 3200, 3500, 'horizontal'));

        for (let i = 0; i < 20; i++) {
            coins.push(new Coin(200 + i * 280, 250 + Math.random() * 150));
        }

        hearts.push(new Heart(1000, 350));
        hearts.push(new Heart(2500, 350));
        hearts.push(new Heart(4000, 350));

        finishLine = new FinishLine(5900, 350, 60, 200);

    } else if (levelNum === 14) {
        levelWidth = 6000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 350, 50));
        platforms.push(new Platform(550, 550, 350, 50));
        platforms.push(new Platform(1100, 550, 350, 50));
        platforms.push(new Platform(1650, 550, 350, 50));
        platforms.push(new Platform(2200, 550, 350, 50));
        platforms.push(new Platform(2750, 550, 350, 50));
        platforms.push(new Platform(3300, 550, 350, 50));
        platforms.push(new Platform(3850, 550, 350, 50));
        platforms.push(new Platform(4400, 550, 350, 50));
        platforms.push(new Platform(4950, 550, 1050, 50));

        blizzardClouds.push(new BlizzardCloud(250, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(800, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(1350, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(1900, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(2450, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(3000, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(3550, 40, 180, 70));
        blizzardClouds.push(new BlizzardCloud(4100, 40, 180, 70));

        bouncePlatforms.push(new BouncePlatform(450, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1000, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(1550, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(2100, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(2650, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(3200, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(3750, 530, 80, 20));
        bouncePlatforms.push(new BouncePlatform(4300, 530, 80, 20));

        for (let i = 0; i < 22; i++) {
            coins.push(new Coin(180 + i * 260, 240 + Math.random() * 160));
        }

        hearts.push(new Heart(900, 350));
        hearts.push(new Heart(2300, 350));
        hearts.push(new Heart(3700, 350));

        finishLine = new FinishLine(5900, 350, 60, 200);

    } else if (levelNum === 15) {
        levelWidth = 7000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 500, 50));
        platforms.push(new Platform(700, 550, 500, 50));
        platforms.push(new Platform(1400, 550, 500, 50));
        platforms.push(new Platform(2100, 550, 500, 50));
        platforms.push(new Platform(2800, 550, 500, 50));
        platforms.push(new Platform(3500, 550, 500, 50));
        platforms.push(new Platform(4200, 550, 500, 50));
        platforms.push(new Platform(4900, 550, 2100, 50));

        grizzlyBears.push(new GrizzlyBear(600, canvas.height - 140, 60, 70, 2, 400, 500, 1200));
        grizzlyBears.push(new GrizzlyBear(1300, canvas.height - 140, 60, 70, 2, 400, 1200, 1900));
        grizzlyBears.push(new GrizzlyBear(2000, canvas.height - 140, 60, 70, 2, 400, 1900, 2600));
        grizzlyBears.push(new GrizzlyBear(2700, canvas.height - 140, 60, 70, 2, 400, 2600, 3300));
        grizzlyBears.push(new GrizzlyBear(3400, canvas.height - 140, 60, 70, 2, 400, 3300, 4000));
        grizzlyBears.push(new GrizzlyBear(4100, canvas.height - 140, 60, 70, 2, 400, 4000, 4700));

        for (let i = 0; i < 10; i++) {
            platforms.push(new Platform(550 + i * 650, 400, 100, 20));
        }

        for (let i = 0; i < 25; i++) {
            coins.push(new Coin(200 + i * 270, 200 + Math.random() * 150));
        }

        hearts.push(new Heart(950, 350));
        hearts.push(new Heart(2250, 350));
        hearts.push(new Heart(3550, 350));
        hearts.push(new Heart(5000, 350));

        oneUps.push(new OneUp(4100, 280));

        finishLine = new FinishLine(6900, 350, 60, 200);

    } else if (levelNum === 16) {
        levelWidth = 6500;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 400, 50));
        platforms.push(new Platform(600, 550, 400, 50));
        platforms.push(new Platform(1200, 550, 400, 50));
        platforms.push(new Platform(1800, 550, 400, 50));
        platforms.push(new Platform(2400, 550, 400, 50));
        platforms.push(new Platform(3000, 550, 400, 50));
        platforms.push(new Platform(3600, 550, 400, 50));
        platforms.push(new Platform(4200, 550, 400, 50));
        platforms.push(new Platform(4800, 550, 1700, 50));

        tornados.push(new Tornado(500, 100, 100, 450, 2, 1, 400, 1000, 200, 0.5));
        tornados.push(new Tornado(1500, 100, 100, 450, 2, 1, 1100, 2000, 200, 0.5));
        tornados.push(new Tornado(2500, 100, 100, 450, 2, 1, 1800, 3000, 200, 0.5));
        tornados.push(new Tornado(3500, 100, 100, 450, 2, 1, 2600, 4000, 200, 0.5));

        honeyBlocks.push(new HoneyBlock(950, 450, 80, 100));
        honeyBlocks.push(new HoneyBlock(1950, 450, 80, 100));
        honeyBlocks.push(new HoneyBlock(2950, 450, 80, 100));
        honeyBlocks.push(new HoneyBlock(3950, 450, 80, 100));

        for (let i = 0; i < 20; i++) {
            coins.push(new Coin(200 + i * 300, 180 + Math.random() * 140));
        }

        hearts.push(new Heart(1050, 360));
        hearts.push(new Heart(2050, 360));
        hearts.push(new Heart(3050, 360));

        finishLine = new FinishLine(6400, 350, 60, 200);

    } else if (levelNum === 17) {
        levelWidth = 7500;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        platforms.push(new Platform(500, 550, 250, 50));
        platforms.push(new Platform(950, 550, 250, 50));
        platforms.push(new Platform(1400, 550, 250, 50));
        platforms.push(new Platform(1850, 550, 250, 50));
        platforms.push(new Platform(2300, 550, 250, 50));
        platforms.push(new Platform(2750, 550, 250, 50));
        platforms.push(new Platform(3200, 550, 250, 50));
        platforms.push(new Platform(3650, 550, 250, 50));
        platforms.push(new Platform(4100, 550, 250, 50));
        platforms.push(new Platform(4550, 550, 250, 50));
        platforms.push(new Platform(5000, 550, 250, 50));
        platforms.push(new Platform(5450, 550, 250, 50));
        platforms.push(new Platform(5900, 550, 250, 50));
        platforms.push(new Platform(6350, 550, 250, 50));
        platforms.push(new Platform(6800, 550, 700, 50));

        waterBlocks.push(new WaterBlock(750, 400, 200, 200));
        waterBlocks.push(new WaterBlock(1200, 400, 200, 200));
        waterBlocks.push(new WaterBlock(2100, 400, 200, 200));
        waterBlocks.push(new WaterBlock(2550, 400, 200, 200));
        waterBlocks.push(new WaterBlock(3450, 400, 200, 200));
        waterBlocks.push(new WaterBlock(3900, 400, 200, 200));
        waterBlocks.push(new WaterBlock(4800, 400, 200, 200));
        waterBlocks.push(new WaterBlock(5250, 400, 200, 200));
        waterBlocks.push(new WaterBlock(6150, 400, 200, 200));

        sharks.push(new Shark(800, 450, 50, 30, 2, 250));
        sharks.push(new Shark(2150, 450, 50, 30, 2, 250));
        sharks.push(new Shark(3500, 450, 50, 30, 2, 250));
        sharks.push(new Shark(4850, 450, 50, 30, 2, 250));

        floatBubbles.push({ x: 350, y: 200, radius: 50 });
        floatBubbles.push({ x: 850, y: 180, radius: 50 });
        floatBubbles.push({ x: 1650, y: 200, radius: 50 });
        floatBubbles.push({ x: 2550, y: 180, radius: 50 });
        floatBubbles.push({ x: 3450, y: 200, radius: 50 });
        floatBubbles.push({ x: 4350, y: 180, radius: 50 });
        floatBubbles.push({ x: 5250, y: 200, radius: 50 });
        floatBubbles.push({ x: 6150, y: 180, radius: 50 });

        for (let i = 0; i < 30; i++) {
            coins.push(new Coin(150 + i * 240, 120 + Math.random() * 160));
        }

        hearts.push(new Heart(1050, 280));
        hearts.push(new Heart(2650, 280));
        hearts.push(new Heart(4250, 280));
        hearts.push(new Heart(5850, 280));

        finishLine = new FinishLine(7400, 350, 60, 200);

    } else if (levelNum === 18) {
        levelWidth = 8000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 250, 50));
        for (let i = 0; i < 25; i++) {
            platforms.push(new Platform(350 + i * 300, 550, 200, 50));
        }

        slopes.push(new Slope(250, 300, 270, 250));
        slopes.push(new Slope(1000, 300, 270, 250));
        slopes.push(new Slope(1750, 300, 270, 250));
        slopes.push(new Slope(2500, 300, 270, 250));
        slopes.push(new Slope(3250, 300, 270, 250));
        slopes.push(new Slope(4000, 300, 270, 250));
        slopes.push(new Slope(4750, 300, 270, 250));
        slopes.push(new Slope(5500, 300, 270, 250));

        rollingRocks.push(new RollingRock(470, 250, 50, 50, -5, 5, 150, 520));
        rollingRocks.push(new RollingRock(1220, 250, 50, 50, -5, 5, 900, 1270));
        rollingRocks.push(new RollingRock(1970, 250, 50, 50, -5, 5, 1650, 2020));

        acidPools.push(new AcidPool(550, 570, 200, 30));
        acidPools.push(new AcidPool(1300, 570, 200, 30));
        acidPools.push(new AcidPool(2050, 570, 200, 30));
        acidPools.push(new AcidPool(2800, 570, 200, 30));
        acidPools.push(new AcidPool(3550, 570, 200, 30));
        acidPools.push(new AcidPool(4300, 570, 200, 30));
        acidPools.push(new AcidPool(5050, 570, 200, 30));
        acidPools.push(new AcidPool(5800, 570, 200, 30));

        trees.push(new Tree(650, 450, 30, 100));
        trees.push(new Tree(1400, 450, 30, 100));
        trees.push(new Tree(2150, 450, 30, 100));
        trees.push(new Tree(2900, 450, 30, 100));
        trees.push(new Tree(3650, 450, 30, 100));
        trees.push(new Tree(4400, 450, 30, 100));

        for (let i = 0; i < 35; i++) {
            coins.push(new Coin(130 + i * 220, 90 + Math.random() * 180));
        }

        for (let i = 0; i < 12; i++) {
            flyingEnemies.push(new FlyingEnemy(500 + i * 600, 180 + Math.random() * 100));
        }

        hearts.push(new Heart(800, 300));
        hearts.push(new Heart(2200, 300));
        hearts.push(new Heart(3600, 300));
        hearts.push(new Heart(5000, 300));
        hearts.push(new Heart(6500, 300));

        oneUps.push(new OneUp(4200, 250));

        finishLine = new FinishLine(7900, 350, 60, 200);

    } else if (levelNum === 19) {
        levelWidth = 8000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 350, 50));
        platforms.push(new Platform(550, 550, 300, 50));
        platforms.push(new Platform(1050, 550, 300, 50));
        platforms.push(new Platform(1550, 550, 300, 50));
        platforms.push(new Platform(2050, 550, 300, 50));
        platforms.push(new Platform(2550, 550, 300, 50));
        platforms.push(new Platform(3050, 550, 300, 50));
        platforms.push(new Platform(3550, 550, 300, 50));
        platforms.push(new Platform(4050, 550, 300, 50));
        platforms.push(new Platform(4550, 550, 300, 50));
        platforms.push(new Platform(5050, 550, 300, 50));
        platforms.push(new Platform(5550, 550, 300, 50));
        platforms.push(new Platform(6050, 550, 300, 50));
        platforms.push(new Platform(6550, 550, 1450, 50));

        acidClouds.push(new AcidCloud(250, 40, 150, 60));
        acidClouds.push(new AcidCloud(750, 40, 150, 60));
        acidClouds.push(new AcidCloud(1250, 40, 150, 60));
        acidClouds.push(new AcidCloud(1750, 40, 150, 60));
        acidClouds.push(new AcidCloud(2250, 40, 150, 60));
        acidClouds.push(new AcidCloud(2750, 40, 150, 60));
        acidClouds.push(new AcidCloud(3250, 40, 150, 60));
        acidClouds.push(new AcidCloud(3750, 40, 150, 60));
        acidClouds.push(new AcidCloud(4250, 40, 150, 60));
        acidClouds.push(new AcidCloud(4750, 40, 150, 60));
        acidClouds.push(new AcidCloud(5250, 40, 150, 60));
        acidClouds.push(new AcidCloud(5750, 40, 150, 60));

        blizzardClouds.push(new BlizzardCloud(450, 130, 180, 70));
        blizzardClouds.push(new BlizzardCloud(1450, 130, 180, 70));
        blizzardClouds.push(new BlizzardCloud(2450, 130, 180, 70));
        blizzardClouds.push(new BlizzardCloud(3450, 130, 180, 70));
        blizzardClouds.push(new BlizzardCloud(4450, 130, 180, 70));
        blizzardClouds.push(new BlizzardCloud(5450, 130, 180, 70));

        movingPlatforms.push(new MovingPlatform(900, 400, 90, 20, 2.5, 1, 250, 450, 'vertical'));
        movingPlatforms.push(new MovingPlatform(1900, 400, 90, 20, 2.5, 1, 250, 450, 'vertical'));
        movingPlatforms.push(new MovingPlatform(2900, 400, 90, 20, 2.5, 1, 250, 450, 'vertical'));
        movingPlatforms.push(new MovingPlatform(3900, 400, 90, 20, 2.5, 1, 250, 450, 'vertical'));
        movingPlatforms.push(new MovingPlatform(4900, 400, 90, 20, 2.5, 1, 250, 450, 'vertical'));
        movingPlatforms.push(new MovingPlatform(5900, 400, 90, 20, 2.5, 1, 250, 450, 'vertical'));

        for (let i = 0; i < 35; i++) {
            coins.push(new Coin(140 + i * 220, 150 + Math.random() * 170));
        }

        hearts.push(new Heart(1100, 320));
        hearts.push(new Heart(2600, 320));
        hearts.push(new Heart(4100, 320));
        hearts.push(new Heart(5600, 320));

        finishLine = new FinishLine(7900, 350, 60, 200);

    } else if (levelNum === 20) {
        levelWidth = 8500;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 400, 50));
        for (let i = 0; i < 20; i++) {
            platforms.push(new Platform(600 + i * 380, 550, 280, 50));
        }

        grizzlyBears.push(new GrizzlyBear(500, canvas.height - 140, 60, 70, 2.5, 450, 400, 1200));
        grizzlyBears.push(new GrizzlyBear(1400, canvas.height - 140, 60, 70, 2.5, 450, 980, 2180));
        grizzlyBears.push(new GrizzlyBear(2300, canvas.height - 140, 60, 70, 2.5, 450, 1760, 3160));
        grizzlyBears.push(new GrizzlyBear(3200, canvas.height - 140, 60, 70, 2.5, 450, 2540, 4140));
        grizzlyBears.push(new GrizzlyBear(4100, canvas.height - 140, 60, 70, 2.5, 450, 3320, 5120));
        grizzlyBears.push(new GrizzlyBear(5000, canvas.height - 140, 60, 70, 2.5, 450, 4100, 6100));

        trees.push(new Tree(800, 450, 30, 100));
        trees.push(new Tree(1700, 450, 30, 100));
        trees.push(new Tree(2600, 450, 30, 100));
        trees.push(new Tree(3500, 450, 30, 100));
        trees.push(new Tree(4400, 450, 30, 100));
        trees.push(new Tree(5300, 450, 30, 100));
        trees.push(new Tree(6200, 450, 30, 100));

        acidPools.push(new AcidPool(880, 570, 100, 30));
        acidPools.push(new AcidPool(1260, 570, 100, 30));
        acidPools.push(new AcidPool(1640, 570, 100, 30));
        acidPools.push(new AcidPool(2400, 570, 100, 30));
        acidPools.push(new AcidPool(3020, 570, 100, 30));
        acidPools.push(new AcidPool(3780, 570, 100, 30));
        acidPools.push(new AcidPool(4540, 570, 100, 30));
        acidPools.push(new AcidPool(5300, 570, 100, 30));
        acidPools.push(new AcidPool(6060, 570, 100, 30));

        for (let i = 0; i < 15; i++) {
            spikeBalls.push(new SpikeBall(700 + i * 520, 180, 80, 450));
        }

        for (let i = 0; i < 35; i++) {
            coins.push(new Coin(150 + i * 235, 110 + Math.random() * 160));
        }

        hearts.push(new Heart(1000, 330));
        hearts.push(new Heart(2400, 330));
        hearts.push(new Heart(3800, 330));
        hearts.push(new Heart(5200, 330));
        hearts.push(new Heart(6800, 330));

        finishLine = new FinishLine(8400, 350, 60, 200);

    } else if (levelNum === 21) {
        levelWidth = 9000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        for (let i = 0; i < 22; i++) {
            if (i % 3 !== 1) {
                platforms.push(new Platform(400 + i * 380, 550, 280, 50));
            }
        }

        tornados.push(new Tornado(700, 100, 100, 450, 2.5, 1, 550, 1500, 220, 0.6));
        tornados.push(new Tornado(2200, 100, 100, 450, 2.5, 1, 1900, 3100, 220, 0.6));
        tornados.push(new Tornado(3700, 100, 100, 450, 2.5, 1, 3250, 4650, 220, 0.6));
        tornados.push(new Tornado(5200, 100, 100, 450, 2.5, 1, 4600, 6200, 220, 0.6));
        tornados.push(new Tornado(6700, 100, 100, 450, 2.5, 1, 5950, 7750, 220, 0.6));

        honeyBlocks.push(new HoneyBlock(1100, 420, 100, 130));
        honeyBlocks.push(new HoneyBlock(2600, 420, 100, 130));
        honeyBlocks.push(new HoneyBlock(4100, 420, 100, 130));
        honeyBlocks.push(new HoneyBlock(5600, 420, 100, 130));
        honeyBlocks.push(new HoneyBlock(7100, 420, 100, 130));

        floatBubbles.push({ x: 350, y: 230, radius: 55 });
        floatBubbles.push({ x: 900, y: 200, radius: 55 });
        floatBubbles.push({ x: 1800, y: 230, radius: 55 });
        floatBubbles.push({ x: 2700, y: 200, radius: 55 });
        floatBubbles.push({ x: 3600, y: 230, radius: 55 });
        floatBubbles.push({ x: 4500, y: 200, radius: 55 });
        floatBubbles.push({ x: 5400, y: 230, radius: 55 });
        floatBubbles.push({ x: 6300, y: 200, radius: 55 });
        floatBubbles.push({ x: 7200, y: 230, radius: 55 });

        for (let i = 0; i < 40; i++) {
            coins.push(new Coin(140 + i * 215, 100 + Math.random() * 170));
        }

        for (let i = 0; i < 15; i++) {
            flyingEnemies.push(new FlyingEnemy(550 + i * 560, 160 + Math.random() * 120));
        }

        hearts.push(new Heart(1200, 340));
        hearts.push(new Heart(2700, 340));
        hearts.push(new Heart(4200, 340));
        hearts.push(new Heart(5700, 340));
        hearts.push(new Heart(7400, 340));

        oneUps.push(new OneUp(6000, 280));

        finishLine = new FinishLine(8900, 350, 60, 200);

    } else if (levelNum === 22) {
        levelWidth = 10000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 250, 50));
        for (let i = 0; i < 30; i++) {
            platforms.push(new Platform(350 + i * 320, 550, 220, 50));
        }

        waterBlocks.push(new WaterBlock(250, 380, 100, 220));
        for (let i = 0; i < 15; i++) {
            waterBlocks.push(new WaterBlock(570 + i * 640, 380, 320, 220));
        }

        sharks.push(new Shark(700, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(1340, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(1980, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(2620, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(3260, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(3900, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(4540, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(5180, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(5820, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(6460, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(7100, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(7740, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(8380, 430, 55, 35, 2.5, 330));
        sharks.push(new Shark(9020, 430, 55, 35, 2.5, 330));

        floatBubbles.push({ x: 450, y: 200, radius: 50 });
        for (let i = 0; i < 15; i++) {
            floatBubbles.push({ x: 740 + i * 640, y: 210, radius: 50 });
        }

        for (let i = 0; i < 12; i++) {
            bouncePlatforms.push(new BouncePlatform(280 + i * 800, 530, 70, 20));
        }

        for (let i = 0; i < 45; i++) {
            coins.push(new Coin(120 + i * 215, 90 + Math.random() * 150));
        }

        hearts.push(new Heart(1000, 280));
        hearts.push(new Heart(2500, 280));
        hearts.push(new Heart(4000, 280));
        hearts.push(new Heart(5500, 280));
        hearts.push(new Heart(7000, 280));
        hearts.push(new Heart(8500, 280));

        finishLine = new FinishLine(9900, 350, 60, 200);

    } else if (levelNum === 23) {
        levelWidth = 10000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 350, 50));
        for (let i = 0; i < 23; i++) {
            platforms.push(new Platform(450 + i * 410, 550, 310, 50));
        }

        slopes.push(new Slope(350, 300, 270, 250));
        for (let i = 0; i < 11; i++) {
            slopes.push(new Slope(760 + i * 820, 300, 270, 250));
        }

        rollingRocks.push(new RollingRock(570, 250, 50, 50, -6, 6, 250, 620));
        rollingRocks.push(new RollingRock(1990, 250, 50, 50, -6, 6, 660, 2040));
        rollingRocks.push(new RollingRock(2810, 250, 50, 50, -6, 6, 1480, 2860));

        acidClouds.push(new AcidCloud(200, 35, 160, 65));
        for (let i = 0; i < 12; i++) {
            acidClouds.push(new AcidCloud(650 + i * 780, 35, 160, 65));
        }

        blizzardClouds.push(new BlizzardCloud(430, 120, 190, 75));
        for (let i = 0; i < 11; i++) {
            blizzardClouds.push(new BlizzardCloud(1070 + i * 780, 120, 190, 75));
        }

        for (let i = 0; i < 18; i++) {
            enemies.push(new Enemy(380 + i * 520, canvas.height - 100, i % 2 === 0 ? 'fast' : 'normal'));
        }

        for (let i = 0; i < 50; i++) {
            coins.push(new Coin(110 + i * 195, 140 + Math.random() * 150));
        }

        hearts.push(new Heart(1100, 300));
        hearts.push(new Heart(2800, 300));
        hearts.push(new Heart(4500, 300));
        hearts.push(new Heart(6200, 300));
        hearts.push(new Heart(7900, 300));

        finishLine = new FinishLine(9900, 350, 60, 200);

    } else if (levelNum === 24) {
        levelWidth = 11000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        for (let i = 0; i < 28; i++) {
            platforms.push(new Platform(400 + i * 370, 550, 270, 50));
        }

        grizzlyBears.push(new GrizzlyBear(350, canvas.height - 140, 65, 75, 3, 500, 300, 1200));
        for (let i = 0; i < 10; i++) {
            grizzlyBears.push(new GrizzlyBear(1070 + i * 980, canvas.height - 140, 65, 75, 3, 500, 670 + i * 980, 1570 + i * 980));
        }

        trees.push(new Tree(600, 450, 30, 100));
        for (let i = 0; i < 13; i++) {
            trees.push(new Tree(1050 + i * 750, 450, 30, 100));
        }

        acidPools.push(new AcidPool(770, 570, 130, 30));
        for (let i = 0; i < 14; i++) {
            acidPools.push(new AcidPool(1140 + i * 740, 570, 130, 30));
        }

        for (let i = 0; i < 20; i++) {
            spikeBalls.push(new SpikeBall(550 + i * 520, 170, 70, 460));
        }

        for (let i = 0; i < 50; i++) {
            coins.push(new Coin(130 + i * 212, 100 + Math.random() * 140));
        }

        hearts.push(new Heart(1200, 310));
        hearts.push(new Heart(2900, 310));
        hearts.push(new Heart(4600, 310));
        hearts.push(new Heart(6300, 310));
        hearts.push(new Heart(8000, 310));
        hearts.push(new Heart(9700, 310));

        oneUps.push(new OneUp(5500, 260));

        finishLine = new FinishLine(10900, 350, 60, 200);

    } else if (levelNum === 25) {
        levelWidth = 12000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 280, 50));
        for (let i = 0; i < 32; i++) {
            if (i % 4 !== 2) {
                platforms.push(new Platform(380 + i * 360, 550, 260, 50));
            }
        }

        tornados.push(new Tornado(580, 100, 110, 450, 3, 1, 400, 1700, 240, 0.7));
        for (let i = 0; i < 8; i++) {
            tornados.push(new Tornado(2020 + i * 1440, 100, 110, 450, 3, 1, 1560 + i * 1440, 3140 + i * 1440, 240, 0.7));
        }

        honeyBlocks.push(new HoneyBlock(1300, 400, 110, 150));
        for (let i = 0; i < 8; i++) {
            honeyBlocks.push(new HoneyBlock(2740 + i * 1440, 400, 110, 150));
        }

        waterBlocks.push(new WaterBlock(740, 360, 280, 240));
        for (let i = 0; i < 16; i++) {
            waterBlocks.push(new WaterBlock(1100 + i * 720, 360, 360, 240));
        }

        sharks.push(new Shark(850, 410, 60, 38, 2.8, 360));
        for (let i = 0; i < 16; i++) {
            sharks.push(new Shark(1220 + i * 720, 410, 60, 38, 2.8, 360));
        }

        floatBubbles.push({ x: 1020, y: 180, radius: 60 });
        for (let i = 0; i < 15; i++) {
            floatBubbles.push({ x: 1380 + i * 720, y: 190, radius: 60 });
        }

        for (let i = 0; i < 20; i++) {
            flyingEnemies.push(new FlyingEnemy(480 + i * 580, 140 + Math.random() * 130));
        }

        for (let i = 0; i < 55; i++) {
            coins.push(new Coin(110 + i * 212, 80 + Math.random() * 150));
        }

        hearts.push(new Heart(1400, 320));
        hearts.push(new Heart(3200, 320));
        hearts.push(new Heart(5000, 320));
        hearts.push(new Heart(6800, 320));
        hearts.push(new Heart(8600, 320));
        hearts.push(new Heart(10400, 320));

        finishLine = new FinishLine(11900, 350, 60, 200);

    } else if (levelNum === 26) {
        levelWidth = 10000;
        player.x = 50;
        player.y = 300;

        platforms.push(new Platform(0, 550, 300, 50));
        for (let i = 0; i < 28; i++) {
            platforms.push(new Platform(400 + i * 340, 550, 260, 50));
        }

        slopes.push(new Slope(300, 300, 270, 250));
        for (let i = 0; i < 10; i++) {
            slopes.push(new Slope(800 + i * 900, 300, 270, 250));
        }

        rollingRocks.push(new RollingRock(520, 250, 50, 50, -5, 5, 200, 570));
        rollingRocks.push(new RollingRock(2620, 250, 50, 50, -5, 5, 700, 2670));

        acidClouds.push(new AcidCloud(200, 30, 170, 70));
        for (let i = 0; i < 8; i++) {
            acidClouds.push(new AcidCloud(700 + i * 1100, 30, 170, 70));
        }

        blizzardClouds.push(new BlizzardCloud(450, 115, 200, 80));
        for (let i = 0; i < 7; i++) {
            blizzardClouds.push(new BlizzardCloud(1300 + i * 1100, 115, 200, 80));
        }

        grizzlyBears.push(new GrizzlyBear(650, canvas.height - 140, 70, 80, 3, 500, 300, 1400));
        for (let i = 0; i < 6; i++) {
            grizzlyBears.push(new GrizzlyBear(1700 + i * 1400, canvas.height - 140, 70, 80, 3, 500, 700 + i * 1400, 2100 + i * 1400));
        }

        tornados.push(new Tornado(1200, 100, 120, 450, 3, 1, 800, 2200, 240, 0.7));
        for (let i = 0; i < 4; i++) {
            tornados.push(new Tornado(3400 + i * 1600, 100, 120, 450, 3, 1, 2600 + i * 1600, 4400 + i * 1600, 240, 0.7));
        }

        trees.push(new Tree(550, 450, 30, 100));
        for (let i = 0; i < 10; i++) {
            trees.push(new Tree(950 + i * 900, 450, 30, 100));
        }

        acidPools.push(new AcidPool(660, 570, 140, 30));
        for (let i = 0; i < 10; i++) {
            acidPools.push(new AcidPool(1060 + i * 900, 570, 140, 30));
        }

        honeyBlocks.push(new HoneyBlock(2100, 390, 120, 160));
        for (let i = 0; i < 5; i++) {
            honeyBlocks.push(new HoneyBlock(3700 + i * 1600, 390, 120, 160));
        }

        for (let i = 0; i < 15; i++) {
            spikeBalls.push(new SpikeBall(600 + i * 650, 160, 65, 470));
        }

        for (let i = 0; i < 15; i++) {
            flyingEnemies.push(new FlyingEnemy(500 + i * 650, 130 + Math.random() * 120));
        }

        for (let i = 0; i < 50; i++) {
            coins.push(new Coin(120 + i * 195, 80 + Math.random() * 140));
        }

        hearts.push(new Heart(1100, 300));
        hearts.push(new Heart(2500, 300));
        hearts.push(new Heart(4000, 300));
        hearts.push(new Heart(5500, 300));
        hearts.push(new Heart(7000, 300));
        hearts.push(new Heart(8500, 300));

        oneUps.push(new OneUp(6000, 250));
        oneUps.push(new OneUp(9000, 250));

        breakableBlocks.push(new BreakableBlock(9200, 490, 90, 60));
        breakableBlocks.push(new BreakableBlock(9200, 430, 90, 60));
        breakableBlocks.push(new BreakableBlock(9200, 370, 90, 60));
        breakableBlocks.push(new BreakableBlock(9200, 310, 90, 60));
        breakableBlocks.push(new BreakableBlock(9200, 250, 90, 60));
        breakableBlocks.push(new BreakableBlock(9310, 490, 90, 60));
        breakableBlocks.push(new BreakableBlock(9310, 430, 90, 60));
        breakableBlocks.push(new BreakableBlock(9310, 370, 90, 60));
        breakableBlocks.push(new BreakableBlock(9310, 310, 90, 60));
        breakableBlocks.push(new BreakableBlock(9310, 250, 90, 60));

        finishLine = new FinishLine(9900, 350, 60, 200);
    }

    camera.x = 0;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        if (!keys['ArrowUp']) {
            player.jump();
            keys['ArrowUp'] = true;
        }
    } else if (e.key === ' ') {
        e.preventDefault();
        player.attack();
    } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        player.dropBomb();
    } else {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function updateHealth() {
    document.getElementById('health').textContent = Math.max(0, Math.floor(player.health));
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateCoins() {
    document.getElementById('coins').textContent = coinCount;
}

function updateBombs() {
    document.getElementById('bombs').textContent = bombCount;
}

function updateLevel() {
    const levelName = levelNames[currentLevel - 1] || 'Unknown';
    document.getElementById('level').textContent = currentLevel + ': ' + levelName;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function drawGround() {
    const startX = Math.floor(camera.x / 30) * 30;
    const endX = startX + canvas.width + 60;

    ctx.fillStyle = '#2ecc40';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillStyle = '#27ae60';
    for (let i = startX; i < endX && i < levelWidth; i += 30) {
        const screenX = i - camera.x;
        ctx.fillRect(screenX, canvas.height - 50, 15, 50);
    }
}

function gameOver() {
    if (lives > 0) {
        lives--;
        updateLives();
        player.health = 100;
        updateHealth();
        loadLevel(currentLevel);
        gameState = 'playing';
    } else {
        gameState = 'gameover';
    }
}

function restartCurrentLevel() {
    player.health = 100;
    updateHealth();
    loadLevel(currentLevel);
    gameState = 'playing';
}

function nextLevel() {
    if (currentLevel === 2) {
        hasBombs = true;
        bombCount = 5;
        updateBombs();
        document.getElementById('bombDisplay').style.display = 'block';
    }

    if (currentLevel >= 3 && currentLevel <= 25) {
        bombCount += 5;
        updateBombs();
    }

    if (currentLevel < 26) {
        currentLevel++;
        if (currentLevel > highestLevelUnlocked) {
            highestLevelUnlocked = currentLevel;
        }
        updateLevel();
        loadLevel(currentLevel);
        gameState = 'playing';
    } else {
        gameState = 'victory';
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('You ran out of lives!', canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Final Level: ' + currentLevel, canvas.width / 2, canvas.height / 2 + 90);
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 130);
    ctx.fillText('Press R to Restart from Level 1', canvas.width / 2, canvas.height / 2 + 170);
}

function drawMenu() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ZELDA ADVENTURE', canvas.width / 2, 50);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = '18px Arial';
    ctx.fillText('Use Arrow Keys to Select - Press ENTER to Start', canvas.width / 2, 80);

    const levelsPerRow = 5;
    const boxWidth = 140;
    const boxHeight = 70;
    const spacingX = 35;
    const spacingY = 20;
    const startX = canvas.width / 2 - (levelsPerRow * boxWidth + (levelsPerRow - 1) * spacingX) / 2;
    const startY = 110;

    for (let i = 1; i <= 26; i++) {
        const row = Math.floor((i - 1) / levelsPerRow);
        const col = (i - 1) % levelsPerRow;
        const x = startX + col * (boxWidth + spacingX);
        const y = startY + row * (boxHeight + spacingY) - menuScroll;

        if (y + boxHeight < 100 || y > canvas.height) continue;

        const isUnlocked = i <= highestLevelUnlocked;
        const isSelected = i === selectedLevel;

        if (isSelected) {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x - 4, y - 4, boxWidth + 8, boxHeight + 8);
        }

        if (isUnlocked) {
            if (i <= 6) {
                ctx.fillStyle = '#27ae60';
            } else if (i <= 12) {
                ctx.fillStyle = '#2980b9';
            } else if (i <= 18) {
                ctx.fillStyle = '#8e44ad';
            } else {
                ctx.fillStyle = '#e67e22';
            }
        } else {
            ctx.fillStyle = '#7f8c8d';
        }
        ctx.fillRect(x, y, boxWidth, boxHeight);

        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('LV ' + i, x + boxWidth / 2, y + 30);

        if (isUnlocked) {
            ctx.font = '11px Arial';
            const levelName = levelNames[i - 1] || 'Unknown';
            ctx.fillText(levelName, x + boxWidth / 2, y + 50);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('🔒', x + boxWidth / 2, y + 55);
        }
    }
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2ecc71';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '40px Arial';
    ctx.fillText('You saved Hyrule!', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('Coins: ' + coinCount, canvas.width / 2, canvas.height / 2 + 100);
    ctx.fillText('Press R to Return to Menu', canvas.width / 2, canvas.height / 2 + 140);
}

function restartGame() {
    currentLevel = 1;
    lives = 10;
    gameState = 'playing';
    selectedLevel = 1;
    menuScroll = 0;
    score = 0;
    coinCount = 0;
    bombCount = 0;
    hasBombs = false;
    player.health = 100;
    updateLevel();
    updateLives();
    updateHealth();
    updateScore();
    updateCoins();
    loadLevel(1);
    if (document.getElementById('bombDisplay')) {
        document.getElementById('bombDisplay').style.display = 'none';
    }
}

document.addEventListener('keydown', (e) => {
    if (gameState === 'menu') {
        if (e.key === 'ArrowLeft') {
            selectedLevel = Math.max(1, selectedLevel - 1);
        } else if (e.key === 'ArrowRight') {
            selectedLevel = Math.min(highestLevelUnlocked, selectedLevel + 1);
        } else if (e.key === 'ArrowUp') {
            selectedLevel = Math.max(1, selectedLevel - 5);
        } else if (e.key === 'ArrowDown') {
            selectedLevel = Math.min(highestLevelUnlocked, selectedLevel + 5);
        } else if (e.key === 'Enter') {
            if (selectedLevel <= highestLevelUnlocked) {
                currentLevel = selectedLevel;
                updateLevel();
                loadLevel(currentLevel);
                if (currentLevel > 2) {
                    hasBombs = true;
                    bombCount = 5 + (currentLevel - 3) * 5;
                    updateBombs();
                    document.getElementById('bombDisplay').style.display = 'block';
                }
                gameState = 'playing';
            }
        }

        const row = Math.floor((selectedLevel - 1) / 5);
        const boxHeight = 70;
        const spacingY = 20;
        const startY = 110;
        const selectedY = startY + row * (boxHeight + spacingY) - menuScroll;

        if (selectedY < 110) {
            menuScroll = row * (boxHeight + spacingY);
        } else if (selectedY + boxHeight > canvas.height - 20) {
            menuScroll = row * (boxHeight + spacingY) - (canvas.height - startY - boxHeight - 20);
        }

        if (menuScroll < 0) menuScroll = 0;
    } else if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameover') {
            restartGame();
        } else if (gameState === 'victory') {
            restartGame();
        }
    }
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'victory') {
        drawVictory();
    } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (currentLevel !== 11) {
            drawGround();
        }

        lavaBlocks.forEach(lava => lava.draw());
        platforms.forEach(platform => platform.draw());
        breakableBlocks.forEach(block => block.draw());

        waterGeysers.forEach(geyser => {
            geyser.update();
            geyser.draw();
        });

        lavaGeysers.forEach(geyser => {
            geyser.update();
            geyser.draw();
        });

        movingPlatforms.forEach(platform => {
            platform.update();
            platform.draw();
        });

        bouncePlatforms.forEach(platform => {
            platform.update();
            platform.draw();
        });

        questionBlocks.forEach(block => {
            block.update();
            block.draw();
        });

        coins.forEach(coin => {
            coin.update();
            coin.draw();
        });

        hearts.forEach(heart => {
            heart.update();
            heart.draw();
        });

        oneUps.forEach(oneUp => {
            oneUp.update();
            oneUp.draw();
        });

        bombs.forEach((bomb, index) => {
            bomb.update();
            bomb.draw();
            if (bomb.isFinished()) {
                bombs.splice(index, 1);
            }
        });

        honeyBlocks.forEach(honey => honey.draw());
        waterBlocks.forEach(water => water.draw());
        slopes.forEach(slope => slope.draw());

        rollingRocks.forEach((rock, index) => {
            rock.update();
            if (player.x < rock.x + rock.width &&
                player.x + player.width > rock.x &&
                player.y < rock.y + rock.height &&
                player.y + player.height > rock.y) {
                player.takeDamage(30);
            }
            rock.draw();
        });

        acidPools.forEach(acid => {
            acid.draw();
            if (player.x < acid.x + acid.width &&
                player.x + player.width > acid.x &&
                player.y < acid.y + acid.height &&
                player.y + player.height > acid.y) {
                player.takeDamage(20);
            }
            if (Math.random() < 0.03) {
                acidBubbles.push({
                    x: acid.x + Math.random() * acid.width,
                    y: acid.y,
                    width: 20,
                    height: 20,
                    speed: 2
                });
            }
        });

        acidBubbles.forEach((bubble, index) => {
            bubble.y -= bubble.speed;
            if (bubble.y < -50) {
                acidBubbles.splice(index, 1);
            }
            if (player.x < bubble.x + bubble.width &&
                player.x + player.width > bubble.x &&
                player.y < bubble.y + bubble.height &&
                player.y + player.height > bubble.y) {
                player.takeDamage(15);
            }
            const screenX = bubble.x - camera.x;
            const screenY = bubble.y - camera.y;
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(screenX + bubble.width/2, screenY + bubble.height/2, bubble.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00aa00';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        trees.forEach(tree => {
            tree.draw();
            if (Math.random() < 0.02) {
                const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#8B7355', '#DEB887'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                fallingSticks.push({
                    x: tree.x + 10,
                    y: tree.y,
                    width: 20,
                    height: 40,
                    speed: 1,
                    color: randomColor
                });
            }
        });

        fallingSticks.forEach((stick, index) => {
            stick.y += stick.speed;
            stick.speed += 0.3;
            if (stick.y > 600) {
                fallingSticks.splice(index, 1);
            }
            if (player.x < stick.x + stick.width &&
                player.x + player.width > stick.x &&
                player.y < stick.y + stick.height &&
                player.y + player.height > stick.y) {
                player.takeDamage(10);
            }
            const screenX = stick.x - camera.x;
            const screenY = stick.y - camera.y;
            ctx.fillStyle = stick.color || '#8B4513';
            ctx.fillRect(screenX, screenY, stick.width, stick.height);
        });

        sharks.forEach(shark => {
            const distanceX = Math.abs(player.x - shark.x);
            const distanceY = Math.abs(player.y - shark.y);
            const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (totalDistance < shark.detectionRange) {
                shark.chasing = true;
                if (player.x > shark.x) {
                    shark.velocityX = shark.speed;
                } else {
                    shark.velocityX = -shark.speed;
                }
                if (player.y > shark.y) {
                    shark.velocityY = shark.speed * 0.7;
                } else {
                    shark.velocityY = -shark.speed * 0.7;
                }
            } else {
                shark.chasing = false;
                shark.velocityX *= 0.9;
                shark.velocityY *= 0.9;
            }

            shark.x += shark.velocityX;
            shark.y += shark.velocityY;

            let waterBounds = null;
            waterBlocks.forEach(water => {
                if (shark.x >= water.x - 100 && shark.x <= water.x + water.width + 100) {
                    waterBounds = water;
                }
            });

            if (waterBounds) {
                if (shark.x < waterBounds.x) {
                    shark.x = waterBounds.x;
                    shark.velocityX = 0;
                }
                if (shark.x + shark.width > waterBounds.x + waterBounds.width) {
                    shark.x = waterBounds.x + waterBounds.width - shark.width;
                    shark.velocityX = 0;
                }
                if (shark.y < waterBounds.y) {
                    shark.y = waterBounds.y;
                    shark.velocityY = 0;
                }
                if (shark.y + shark.height > waterBounds.y + waterBounds.height) {
                    shark.y = waterBounds.y + waterBounds.height - shark.height;
                    shark.velocityY = 0;
                }
            }

            if (player.x < shark.x + shark.width &&
                player.x + player.width > shark.x &&
                player.y < shark.y + shark.height &&
                player.y + player.height > shark.y) {
                player.takeDamage(25);
            }
            shark.draw();
        });

        floatBubbles.forEach(bubble => {
            const bubbleRect = {
                x: bubble.x,
                y: bubble.y,
                width: bubble.radius * 2,
                height: bubble.radius * 2
            };
            if (player.x < bubbleRect.x + bubbleRect.width &&
                player.x + player.width > bubbleRect.x &&
                player.y < bubbleRect.y + bubbleRect.height &&
                player.y + player.height > bubbleRect.y) {
                player.velocityY -= 1.2;
                if (player.velocityY < -6) player.velocityY = -6;
            }
            const screenX = bubble.x - camera.x;
            const screenY = bubble.y - camera.y;
            ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
            ctx.strokeStyle = 'rgba(135, 206, 250, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screenX + bubble.radius, screenY + bubble.radius, bubble.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        acidClouds.forEach(cloud => {
            cloud.rainTimer++;
            if (cloud.rainTimer > 90) {
                cloud.rainTimer = 0;
                for (let i = 0; i < 3; i++) {
                    acidRain.push({
                        x: cloud.x + Math.random() * cloud.width,
                        y: cloud.y + cloud.height,
                        width: 8,
                        height: 20,
                        speed: 3 + Math.random() * 1
                    });
                }
            }
            cloud.draw();
        });

        acidRain.forEach((drop, index) => {
            drop.y += drop.speed;
            if (drop.y > canvas.height) {
                acidRain.splice(index, 1);
            }
            if (player.x < drop.x + drop.width &&
                player.x + player.width > drop.x &&
                player.y < drop.y + drop.height &&
                player.y + player.height > drop.y) {
                player.takeDamage(10);
            }
            const screenX = drop.x - camera.x;
            const screenY = drop.y - camera.y;
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(screenX, screenY, drop.width, drop.height);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.fillRect(screenX - 2, screenY, drop.width + 4, drop.height);
        });

        blizzardClouds.forEach(cloud => {
            cloud.hailTimer++;
            if (cloud.hailTimer > 75) {
                cloud.hailTimer = 0;
                for (let i = 0; i < 4; i++) {
                    hailStones.push({
                        x: cloud.x + Math.random() * cloud.width,
                        y: cloud.y + cloud.height,
                        width: 12,
                        height: 12,
                        speedY: 3.5 + Math.random() * 1.5,
                        speedX: (Math.random() - 0.5) * 1
                    });
                }
            }
            cloud.draw();
        });

        hailStones.forEach((hail, index) => {
            hail.y += hail.speedY;
            hail.x += hail.speedX;
            if (hail.y > canvas.height || hail.x < 0 || hail.x > levelWidth) {
                hailStones.splice(index, 1);
            }
            if (player.x < hail.x + hail.width &&
                player.x + player.width > hail.x &&
                player.y < hail.y + hail.height &&
                player.y + player.height > hail.y) {
                player.takeDamage(8);
            }
            const screenX = hail.x - camera.x;
            const screenY = hail.y - camera.y;
            ctx.fillStyle = '#e0f0ff';
            ctx.strokeStyle = '#9ec5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX + hail.width/2, screenY + hail.height/2, hail.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        grizzlyBears.forEach(bear => {
            const distanceX = Math.abs(player.x - bear.x);
            const distanceY = Math.abs(player.y - bear.y);
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < bear.detectionRange && distanceY < 100) {
                bear.chasing = true;
                if (player.x < bear.x) {
                    bear.direction = -1;
                } else {
                    bear.direction = 1;
                }
            } else {
                bear.chasing = false;
            }

            const moveSpeed = bear.chasing ? bear.speed * 1.5 : bear.speed;
            bear.x += moveSpeed * bear.direction;

            if (bear.x <= bear.minX) {
                bear.x = bear.minX;
                bear.direction = 1;
            }
            if (bear.x + bear.width >= bear.maxX) {
                bear.x = bear.maxX - bear.width;
                bear.direction = -1;
            }

            if (player.x < bear.x + bear.width &&
                player.x + player.width > bear.x &&
                player.y < bear.y + bear.height &&
                player.y + player.height > bear.y) {
                player.takeDamage(40);
            }
            bear.draw();
        });

        tornados.forEach(tornado => {
            tornado.x += tornado.speedX * tornado.direction;

            if (tornado.x <= tornado.minX) {
                tornado.x = tornado.minX;
                tornado.direction = 1;
            }
            if (tornado.x + tornado.width >= tornado.maxX) {
                tornado.x = tornado.maxX - tornado.width;
                tornado.direction = -1;
            }

            const tornadoCenterX = tornado.x + tornado.width / 2;
            const tornadoCenterY = tornado.y + tornado.height / 2;
            const distanceX = tornadoCenterX - (player.x + player.width / 2);
            const distanceY = tornadoCenterY - (player.y + player.height / 2);
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < tornado.pullRadius) {
                const pullForce = tornado.pullStrength * (1 - distance / tornado.pullRadius);
                player.velocityX += (distanceX / distance) * pullForce * 0.3;
                player.velocityY += (distanceY / distance) * pullForce * 0.3;
            }

            if (player.x < tornado.x + tornado.width &&
                player.x + player.width > tornado.x &&
                player.y < tornado.y + tornado.height &&
                player.y + player.height > tornado.y) {
                tornado.spinTimer = (tornado.spinTimer || 0) + 1;
                const angle = tornado.spinTimer * 0.3;
                const spinRadius = 60;
                player.x = tornadoCenterX + Math.cos(angle) * spinRadius - player.width / 2;
                player.y = tornadoCenterY + Math.sin(angle) * spinRadius - player.height / 2;

                if (tornado.spinTimer >= 30) {
                    player.velocityY = -25;
                    player.velocityX = (Math.random() - 0.5) * 15;
                    tornado.spinTimer = 0;
                }
            }
            tornado.draw();
        });

        groundCracks.forEach(crack => {
            if (player.x < crack.x + crack.width &&
                player.x + player.width > crack.x &&
                player.y < crack.y + crack.height &&
                player.y + player.height > crack.y) {
                player.takeDamage(50);
            }
            const screenX = crack.x - camera.x;
            const screenY = crack.y - camera.y;
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX, screenY, crack.width, crack.height);
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + crack.width * 0.3, screenY + crack.height * 0.3);
            ctx.lineTo(screenX + crack.width * 0.5, screenY + crack.height * 0.1);
            ctx.lineTo(screenX + crack.width * 0.7, screenY + crack.height * 0.5);
            ctx.lineTo(screenX + crack.width, screenY);
            ctx.stroke();
        });

        finishLine.draw();

        if (gameState === 'playing') {
            player.update();
        }
        player.draw();

        enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();
        });

        flyingEnemies.forEach(enemy => {
            enemy.update();
            enemy.draw();
        });

        bees.forEach(bee => {
            bee.update();
            bee.draw();
        });

        spikeBalls.forEach(spike => {
            spike.update();
            spike.draw();
        });
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
