// Week 5 Side Quest — Super Mario Bros Maze

const SPRITE = {
  frameWidth:  75,
  frameHeight: 150,
  numFrames:   4,
  animSpeed:   20,
  scale:       0.5,
  rows: {
    down:  0,
    up:    1,
    right: 2,
    left:  3,
  },
  offsets: {
    down:  { x: 0, y: 0  },
    up:    { x: 0, y: 0  },
    right: { x: 0, y: 10 },
    left:  { x: 0, y: 20 },
  },
};

const COIN = {
  frameWidth:  32,
  frameHeight: 32,
  numFrames:   8,
  animSpeed:   6,
  scale:       1.5,
};

const TILE_SIZE = 50;

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 3, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 3, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const TILE_COLORS = {
  0: [94,  148, 68 ],
  1: [139, 90,  43 ],
  2: [94,  148, 68 ],
  3: [94,  148, 68 ],
  4: [60,  100, 200],
};

let player = {
  x: 0,
  y: 0,
  speed: 2,
  currentFrame: 0,
  frameTimer:   0,
  direction:    "down",
  isMoving:     false,
  hw: 12,
  hh: 12,
};

let coins = [];
let coinsCollected = 0;
let gameWon = false;

let characterSheet;
let coinSheet;

function preload() {
  characterSheet = loadImage("assets/images/walking.png");
  coinSheet      = loadImage("assets/images/coin_gold.png");
}

function setup() {
  createCanvas(TILE_SIZE * MAZE[0].length, TILE_SIZE * MAZE.length);
  imageMode(CENTER);

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];
      if (tile === 2) {
        player.x = col * TILE_SIZE + TILE_SIZE / 2;
        player.y = row * TILE_SIZE + TILE_SIZE / 2;
      }
      if (tile === 3) {
        coins.push({
          x:          col * TILE_SIZE + TILE_SIZE / 2,
          y:          row * TILE_SIZE + TILE_SIZE / 2,
          frame:      floor(random(COIN.numFrames)),
          frameTimer: 0,
          collected:  false,
        });
      }
    }
  }
}

function draw() {
  background(92, 148, 252);
  drawMaze();
  updateCoins();
  drawCoins();
  handleInput();
  resolveWallCollisions();
  checkCoinCollection();
  checkExit();
  animateSprite();
  drawCharacter();
  drawHUD();
  if (gameWon) drawWinScreen();
}

function drawMaze() {
  rectMode(CORNER);
  noStroke();

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 4) {
        if (coinsCollected === coins.length) {
          fill(0, 200, 0);
        } else {
          fill(0, 120, 0);
        }
      } else {
        let c = TILE_COLORS[tile];
        fill(c[0], c[1], c[2]);
      }

      rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      if (tile === 1) {
        stroke(100, 60, 20);
        strokeWeight(2);
        line(col * TILE_SIZE, row * TILE_SIZE + TILE_SIZE / 2,
             col * TILE_SIZE + TILE_SIZE, row * TILE_SIZE + TILE_SIZE / 2);
        line(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE,
             col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE);
        noStroke();
      }

      // Draw ? block on exit tile
      if (tile === 4) {
        fill(255, 200, 0);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(24);
        textFont("monospace");
        text("?", col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
      }
    }
  }
}

function updateCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;
    coins[i].frameTimer++;
    if (coins[i].frameTimer >= COIN.animSpeed) {
      coins[i].frameTimer = 0;
      coins[i].frame = (coins[i].frame + 1) % COIN.numFrames;
    }
  }
}

function drawCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;
    let coin = coins[i];
    let sx = coin.frame * COIN.frameWidth;
    let dw = COIN.frameWidth  * COIN.scale;
    let dh = COIN.frameHeight * COIN.scale;
    image(coinSheet, coin.x, coin.y, dw, dh, sx, 0, COIN.frameWidth, COIN.frameHeight);
  }
}

function handleInput() {
  if (gameWon) return;
  player.isMoving = false;
  if (keyIsDown(87)) { player.y -= player.speed; player.direction = "up";    player.isMoving = true; }
  if (keyIsDown(83)) { player.y += player.speed; player.direction = "down";  player.isMoving = true; }
  if (keyIsDown(65)) { player.x -= player.speed; player.direction = "left";  player.isMoving = true; }
  if (keyIsDown(68)) { player.x += player.speed; player.direction = "right"; player.isMoving = true; }
}

function resolveWallCollisions() {
  let corners = [
    { x: player.x - player.hw, y: player.y - player.hh },
    { x: player.x + player.hw, y: player.y - player.hh },
    { x: player.x - player.hw, y: player.y + player.hh },
    { x: player.x + player.hw, y: player.y + player.hh },
  ];

  for (let i = 0; i < corners.length; i++) {
    let c = corners[i];
    let col = floor(c.x / TILE_SIZE);
    let row = floor(c.y / TILE_SIZE);
    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) continue;

    if (MAZE[row][col] === 1) {
      let tileLeft   = col * TILE_SIZE;
      let tileRight  = tileLeft + TILE_SIZE;
      let tileTop    = row * TILE_SIZE;
      let tileBottom = tileTop + TILE_SIZE;

      let overlapLeft   = (player.x + player.hw) - tileLeft;
      let overlapRight  = tileRight  - (player.x - player.hw);
      let overlapTop    = (player.y + player.hh) - tileTop;
      let overlapBottom = tileBottom - (player.y - player.hh);

      let minOverlap = min(overlapLeft, overlapRight, overlapTop, overlapBottom);
      if      (minOverlap === overlapLeft)   player.x -= overlapLeft;
      else if (minOverlap === overlapRight)  player.x += overlapRight;
      else if (minOverlap === overlapTop)    player.y -= overlapTop;
      else if (minOverlap === overlapBottom) player.y += overlapBottom;
    }
  }
}

function checkCoinCollection() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;
    let d = dist(player.x, player.y, coins[i].x, coins[i].y);
    if (d < TILE_SIZE * 0.6) {
      coins[i].collected = true;
      coinsCollected++;
    }
  }
}

function checkExit() {
  if (coinsCollected < coins.length) return;
  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      if (MAZE[row][col] === 4) {
        let exitX = col * TILE_SIZE + TILE_SIZE / 2;
        let exitY = row * TILE_SIZE + TILE_SIZE / 2;
        if (dist(player.x, player.y, exitX, exitY) < TILE_SIZE * 0.6) {
          gameWon = true;
        }
      }
    }
  }
}

function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;
    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer   = 0;
  }
}

function drawCharacter() {
  let row    = SPRITE.rows[player.direction];
  let offset = SPRITE.offsets[player.direction];
  let sx = (player.currentFrame * SPRITE.frameWidth)  + offset.x;
  let sy = (row                 * SPRITE.frameHeight) + offset.y;
  let dw = SPRITE.frameWidth  * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;
  image(characterSheet, player.x, player.y, dw, dh, sx, sy, SPRITE.frameWidth, SPRITE.frameHeight);
}

function drawHUD() {
  noStroke();
  fill(255, 220, 0);
  textSize(16);
  textAlign(LEFT);
  textFont("monospace");
  text("COINS: " + coinsCollected + " / " + coins.length, 10, 20);

  if (coinsCollected === coins.length) {
    fill(0, 220, 0);
    text("Reach the GREEN PIPE to escape!", 10, 40);
  }
}

function drawWinScreen() {
  fill(0, 0, 0, 160);
  rectMode(CORNER);
  rect(0, 0, width, height);

  fill(255, 220, 0);
  textAlign(CENTER);
  textSize(48);
  textFont("monospace");
  text("YOU WIN!", width / 2, height / 2 - 20);

  fill(255);
  textSize(18);
  text("All coins collected!", width / 2, height / 2 + 20);

  fill(180);
  textSize(14);
  text("Mario would be proud.", width / 2, height / 2 + 50);
}