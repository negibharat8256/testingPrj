class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.planet = new Planet(this);
    this.player = new Player(this);
    this.debug = false;

    this.projecTilePool = [];
    this.numberOfProjectiles = 20;
    this.createProjecTiles();

    this.enemyPool = [];
    this.numberOfEnemies = 20;
    this.createEnemyPool();
    this.enemyPool[0].start();
    this.enemyTimer = 0;
    this.enemyInterval = 1700;

    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 150;

    this.mouse = {
      x: 0,
      y: 0,
    };

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("mousedown", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.player.shoot();
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "d") {
        this.debug = !this.debug;
      } else if (e.key === "1") {
        this.player.shoot();
      }
    });
  }
  render(deltaTime) {
    this.planet.draw();
    this.player.draw();
    this.player.update();
    this.projecTilePool.forEach((projecTile) => {
      projecTile.draw();
      projecTile.update();
    });
    this.enemyPool.forEach((enemy) => {
      enemy.draw();
      enemy.update();
    });
    // periodically activate an enemy
    if (this.enemyTimer < this.enemyInterval) {
      this.enemyTimer += deltaTime;
    } else {
      this.enemyTimer = 0;
      const enemy = this.getEnemy();
      if (enemy) {
        enemy.start();
      }
    }
    // periodically update sprites
    if (this.spriteTimer < this.spriteInterval) {
      this.spriteTimer += deltaTime;
      this.spriteUpdate = false;
    } else {
      this.spriteTimer = 0;
      this.spriteUpdate = true;
    }
  }
  calcAim(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const aimX = (dx / distance) * -1;
    const aimY = (dy / distance) * -1;
    return [aimX, aimY, dx, dy];
  }
  checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const sumofRadii = a.radius + b.radius;
    return distance < sumofRadii;
  }
  createProjecTiles() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projecTilePool.push(new ProjecTiles(this));
    }
  }
  getProjecTile() {
    for (let i = 0; i < this.projecTilePool.length; i++) {
      if (this.projecTilePool[i].free) {
        return this.projecTilePool[i];
      }
    }
  }
  createEnemyPool() {
    for (let i = 0; i < this.numberOfEnemies; i++) {
      this.enemyPool.push(new Asteroid(this));
    }
  }
  getEnemy() {
    for (let i = 0; i < this.enemyPool.length; i++) {
      if (this.enemyPool[i].free) {
        return this.enemyPool[i];
      }
    }
  }
}

class Planet {
  constructor(game) {
    this.game = game;
    this.radius = 80;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.img = document.getElementById("planet");
  }
  draw() {
    this.game.ctx.drawImage(this.img, this.x - 100, this.y - 100);
    if (this.game.debug) {
      this.game.ctx.beginPath();
      this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      this.game.ctx.stroke();
    }
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.radius = 40;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.img = document.getElementById("player");
    this.aim;
    this.angle = 0;
  }
  draw() {
    this.game.ctx.save();
    this.game.ctx.translate(this.x, this.y);
    this.game.ctx.rotate(this.angle);
    this.game.ctx.drawImage(this.img, -this.radius, -this.radius);
    if (this.game.debug) {
      this.game.ctx.beginPath();
      this.game.ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      this.game.ctx.stroke();
    }
    this.game.ctx.restore();
  }
  update() {
    this.aim = this.game.calcAim(this.game.planet, this.game.mouse);
    this.x =
      this.game.planet.x +
      (this.game.planet.radius + this.radius) * this.aim[0];
    this.y =
      this.game.planet.y +
      (this.game.planet.radius + this.radius) * this.aim[1];
    this.angle = Math.atan2(this.aim[3], this.aim[2]);
  }
  shoot() {
    const projecTile = this.game.getProjecTile();
    if (projecTile) {
      projecTile.start(
        this.x + this.radius * this.aim[0],
        this.y + this.radius * this.aim[1],
        this.aim[0],
        this.aim[1]
      );
    }
  }
}

class ProjecTiles {
  constructor(game) {
    this.game = game;
    this.x;
    this.y;
    this.radius = 5;
    this.speedX = 1;
    this.speedY = 1;
    this.speedModifier = 5;
    this.free = true;
  }
  draw() {
    if (!this.free) {
      this.game.ctx.save();
      this.game.ctx.beginPath();
      this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      this.game.ctx.fillStyle = "gold";
      this.game.ctx.fill();
      this.game.ctx.restore();
    }
  }
  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;
    }
    if (
      this.x < 0 ||
      this.x > this.game.width ||
      this.y < 0 ||
      this.y > this.game.height
    ) {
      this.reset();
    }
  }
  start(x, y, speedX, speedY) {
    this.free = false;
    this.x = x;
    this.y = y;
    this.speedX = speedX * this.speedModifier;
    this.speedY = speedY * this.speedModifier;
  }
  reset() {
    this.free = true;
  }
}

class Enemy {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.radius = 40;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.speedX = 0;
    this.speedY = 0;
    this.free = true;
  }
  start() {
    this.free = false;
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    if (Math.random() < 0.5) {
      this.x = Math.random() * this.game.width;
      this.y =
        Math.random() < 0.5 ? -this.radius : this.game.height + this.radius;
    } else {
      this.x =
        Math.random() < 0.5 ? -this.radius : this.game.width + this.radius;
      this.y = Math.random() * this.game.height;
    }
    this.y = Math.random() * this.game.height;
    const aim = this.game.calcAim(this, this.game.planet);
    this.speedX = aim[0];
    this.speedY = aim[1];
  }
  reset() {
    this.free = true;
  }
  hit(damage) {
    this.lives -= damage;
  }
  draw() {
    if (!this.free) {
      this.game.ctx.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x - this.radius,
        this.y - this.radius,
        this.width,
        this.height
      );
      if (this.game.debug) {
        this.game.ctx.beginPath();
        this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.game.ctx.stroke();
        this.game.ctx.fillText(this.lives, this.x, this.y);
      }
    }
  }
  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;
      // check collision enemy / planet
      if (this.game.checkCollision(this, this.game.planet)) {
        this.reset();
      }

      // check collision enemy / player
      if (this.game.checkCollision(this, this.game.player)) {
        this.reset();
      }

      // check collision enemy / projecTiles
      this.game.projecTilePool.forEach((projecTile) => {
        if (
          !projecTile.free &&
          this.game.checkCollision(this, projecTile) &&
          this.lives >= 1
        ) {
          projecTile.reset();
          this.hit(1);
        }
      });

      if (this.lives < 1 && this.game.spriteUpdate) {
        this.frameX++;
      }
      if (this.frameX > this.maxFrame) {
        this.reset();
      }
    }
  }
}

class Asteroid extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("asteroid");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 7;
    this.lives = 5;
    this.maxLives = this.lives;
  }
}

window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.lineWidth = 2;
  ctx.font = "50px Helvetica";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;

  const game = new Game(canvas, ctx);
  let lastTime = 0;
  function animate(timeStamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    game.render(deltaTime);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
});
