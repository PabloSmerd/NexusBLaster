let gameStarted = false;
let player, bullets, enemies, healthPacks, lastFired = 0;
let playerHP = 10, score = 0, gameTime = 0;
let enemySpawnRate = 1000, enemySpeed = 100, difficultyTimer;
let keys, shootingTime = 0, currentWeapon = 0, weaponText, gameScene;
let lastHitTime = 0, invulnerabilityTime = 1000, isInvulnerable = false;
const maxHP = 10;
let hpBarBackground, hpBarFill, scoreText;
let gamePaused = false;
let weaponChoiceOpen = false; // For weapon selection
let upgradeChoiceOpen = false; // For upgrades
let playerWeapon = null; // Weapon object in player's hands
let weaponSlots = []; // UI weapon slots
let enemyBullets; // Enemy bullets group

// Combo system (changed: 7 kills in 10 seconds)
let killCount = 0;
let comboTimer = 0;
let comboTimeLimit = 10000; // 10 seconds
let comboTarget = 7; // 7 kills for combo

// Large map dimensions
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;

// Enemy types
const enemyTypes = {
  basic: {
    name: 'Basic',
    texture: 'robot_basic',
    hp: 1,
    speed: 100,
    scale: 1,
    points: 10,
    color: 0xffffff,
    unlockScore: 0
  },
  fast: {
    name: 'Fast',
    texture: 'robot_fast',
    hp: 1,
    speed: 180,
    scale: 0.8,
    points: 15,
    color: 0xffffff,
    unlockScore: 100
  },
  heavy: {
    name: 'Heavy',
    texture: 'robot_heavy', 
    hp: 3,
    speed: 60,
    scale: 1.5,
    points: 30,
    color: 0xffffff,
    unlockScore: 250
  },
  elite: {
    name: 'Elite',
    texture: 'robot_elite',
    hp: 2,
    speed: 120,
    scale: 1.2,
    points: 25,
    color: 0xffffff,
    unlockScore: 400
  },
  boss: {
    name: 'Boss',
    texture: 'robot_boss',
    hp: 8,
    speed: 40,
    scale: 2.5,
    points: 100,
    color: 0xffffff,
    unlockScore: 600
  },
  super_boss: {
    name: 'Super Boss',
    texture: 'robot_super_boss',
    hp: 19, // Уменьшено с 75 до 19 (в 4 раза меньше)
    speed: 30,
    scale: 4,
    points: 500,
    color: 0xffffff,
    unlockScore: 1000,
    canShoot: true,
    fireRate: 2000,
    bulletSpeed: 400
  }
};

// Weapon system with unlock thresholds
const weapons = [
  { 
    name: 'Pistol', 
    fireRate: 500, // Increased firing rate (was 300)
    bulletSpeed: 600, 
    bulletsPerShot: 1, 
    spread: 0, 
    unlockScore: 0, 
    owned: true,
    description: 'Starting firearm weapon',
    level: 1,
    maxLevel: 5
  },
  { 
    name: 'Rifle', 
    fireRate: 200, // Increased firing rate (was 100)
    bulletSpeed: 700, 
    bulletsPerShot: 1, 
    spread: 5, 
    unlockScore: 200, 
    owned: false,
    description: 'Fast firing with spread',
    level: 1,
    maxLevel: 5
  },
  { 
    name: 'Shotgun', 
    fireRate: 1200, // Increased firing rate (was 800)
    bulletSpeed: 500, 
    bulletsPerShot: 5, 
    spread: 30, 
    unlockScore: 500, 
    owned: false,
    description: 'Powerful fan shot',
    level: 1,
    maxLevel: 5
  },
  { 
    name: 'Sniper Rifle', 
    fireRate: 2000, // Increased firing rate (was 1500)
    bulletSpeed: 2000, // Увеличено с 1200 до 2000
    bulletsPerShot: 1, 
    spread: 0, 
    unlockScore: 800, 
    owned: false,
    description: 'Long-range precision weapon',
    level: 1,
    maxLevel: 5
  },
  { 
    name: 'Machine Gun', 
    fireRate: 150, // Increased firing rate (was 80)
    bulletSpeed: 800, 
    bulletsPerShot: 1, 
    spread: 8, 
    unlockScore: 1200, 
    owned: false,
    description: 'Continuous rapid fire',
    level: 1,
    maxLevel: 5
  },
  { 
    name: 'RPG', 
    fireRate: 3000, // Increased firing rate (was 2000)
    bulletSpeed: 500, // Увеличено с 400 до 500
    bulletsPerShot: 1, 
    spread: 0, 
    unlockScore: 1600, 
    owned: false,
    description: 'Massive area damage explosive shells',
    explosive: true,
    level: 1,
    maxLevel: 5
  }
];

// Weapon unlock thresholds (doubled)
const weaponUnlockThresholds = [200, 500, 800, 1200, 1600];
let currentUnlockIndex = 0;

function startGame() {
  if (gameStarted) return;
  
  gameStarted = true;
  
  // Hide menu with animation
  const menu = document.getElementById('gameMenu');
  const gameContainer = document.getElementById('gameContainer');
  
  menu.classList.add('hidden');
  
  setTimeout(() => {
    gameContainer.classList.add('visible');
    initializeGame();
  }, 800);
}

function showInstructions() {
  alert(`🎮 NEXUSBLASTER CONTROLS 🎮

🏃 Movement: WASD
🔫 Shooting: Mouse (hold for automatic fire)
🔧 Weapons: 1,2,3,4,5,6 - quick weapon switch

💊 Collect green health packs to restore HP
🎯 Kill enemies to gain points
⚡ New weapons unlock automatically at thresholds
📈 After unlocking all weapons - stat upgrades every 500 points
🗺️ Explore the large map!
💥 Get 7 kills in 10 seconds for NEXUS COMBO!
👾 Watch out for SUPER BOSS - shoots back and has 19 HP!

🔫 WEAPONS:
• Pistol - starting weapon
• Rifle - 200 points
• Shotgun - 500 points
• Sniper Rifle - 800 points (piercing bullets!)
• Machine Gun - 1200 points
• RPG - 1600 points (area damage!)

Good luck in battle! 🚀`);
}

function initializeGame() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
    parent: 'gameContainer',
    physics: {
      default: 'arcade',
      arcade: { debug: false }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  const game = new Phaser.Game(config);
}

function preload() {
  this.load.image('player', 'hero.png');
  this.load.image('player_shooting', 'shot.png');
  this.load.image('bullet', 'bullet.jfif');
  
  // Create weapon textures for display in hands
  
  // Pistol
  this.add.graphics()
    .fillStyle(0x666666)
    .fillRect(2, 8, 12, 6) // barrel
    .fillStyle(0x444444)
    .fillRect(8, 6, 8, 10) // handle
    .fillStyle(0x888888)
    .fillRect(4, 10, 2, 2) // trigger
    .generateTexture('weapon_pistol', 20, 20);

  // Rifle
  this.add.graphics()
    .fillStyle(0x333333)
    .fillRect(0, 8, 18, 6) // barrel
    .fillStyle(0x222222)
    .fillRect(12, 6, 8, 10) // handle
    .fillStyle(0x555555)
    .fillRect(6, 6, 6, 4) // sight
    .fillRect(2, 12, 4, 6) // magazine
    .generateTexture('weapon_rifle', 20, 20);

  // Shotgun
  this.add.graphics()
    .fillStyle(0x8B4513)
    .fillRect(0, 9, 16, 4) // barrel
    .fillStyle(0x654321)
    .fillRect(10, 7, 8, 8) // handle
    .fillStyle(0x444444)
    .fillRect(8, 11, 4, 2) // bolt
    .generateTexture('weapon_shotgun', 20, 20);

  // Sniper rifle
  this.add.graphics()
    .fillStyle(0x2F4F2F)
    .fillRect(0, 9, 20, 3) // long barrel
    .fillStyle(0x1C3A1C)
    .fillRect(14, 7, 6, 7) // handle
    .fillStyle(0x000000)
    .fillRect(8, 6, 6, 2) // scope
    .generateTexture('weapon_sniper', 20, 20);

  // Machine gun
  this.add.graphics()
    .fillStyle(0x4A4A4A)
    .fillRect(0, 8, 16, 8) // massive barrel
    .fillStyle(0x2A2A2A)
    .fillRect(12, 6, 8, 12) // handle
    .fillStyle(0x666666)
    .fillRect(4, 6, 8, 4) // cooling
    .generateTexture('weapon_machinegun', 20, 20);

  // RPG
  this.add.graphics()
    .fillStyle(0x556B2F)
    .fillRect(0, 8, 18, 8) // tube
    .fillStyle(0x3C4F1F)
    .fillRect(12, 6, 8, 12) // handle
    .fillStyle(0xFF6347)
    .fillRect(0, 10, 4, 4) // rocket
    .generateTexture('weapon_rpg', 20, 20);
  
  // Create different robots for each enemy type
  
  // Basic robot (white)
  this.add.graphics()
    .fillStyle(0xcccccc)
    .fillRect(8, 4, 16, 20) // body
    .fillRect(6, 8, 20, 12) // torso
    .fillStyle(0x888888)
    .fillRect(10, 6, 4, 4) // head
    .fillRect(16, 6, 4, 4) // head
    .fillStyle(0xff0000)
    .fillCircle(12, 8, 1) // eye
    .fillCircle(18, 8, 1) // eye
    .fillStyle(0x666666)
    .fillRect(4, 18, 6, 8) // left leg
    .fillRect(20, 18, 6, 8) // right leg
    .fillRect(2, 10, 6, 6) // left arm
    .fillRect(22, 10, 6, 6) // right arm
    .generateTexture('robot_basic', 32, 32);

  // Fast robot (green, slim)
  this.add.graphics()
    .fillStyle(0x00ff00)
    .fillRect(10, 6, 12, 18) // body
    .fillRect(8, 10, 16, 8) // torso
    .fillStyle(0x00aa00)
    .fillRect(12, 4, 8, 4) // head
    .fillStyle(0xffff00)
    .fillCircle(14, 6, 1) // eye
    .fillCircle(18, 6, 1) // eye
    .fillStyle(0x008800)
    .fillRect(6, 20, 4, 10) // left leg
    .fillRect(22, 20, 4, 10) // right leg
    .fillRect(4, 12, 4, 4) // left arm
    .fillRect(24, 12, 4, 4) // right arm
    .generateTexture('robot_fast', 32, 32);

  // Heavy robot (red, massive)
  this.add.graphics()
    .fillStyle(0xff0000)
    .fillRect(6, 8, 20, 16) // body
    .fillRect(4, 12, 24, 10) // torso
    .fillStyle(0xaa0000)
    .fillRect(8, 4, 16, 8) // head
    .fillStyle(0xffff00)
    .fillCircle(12, 8, 2) // eye
    .fillCircle(20, 8, 2) // eye
    .fillStyle(0x880000)
    .fillRect(2, 20, 8, 8) // left leg
    .fillRect(22, 20, 8, 8) // right leg
    .fillRect(0, 14, 8, 8) // left arm
    .fillRect(24, 14, 8, 8) // right arm
    .fillStyle(0x666666)
    .fillRect(10, 6, 2, 2) // antenna
    .fillRect(20, 6, 2, 2) // antenna
    .generateTexture('robot_heavy', 32, 32);

  // Elite robot (purple, high-tech)
  this.add.graphics()
    .fillStyle(0xff00ff)
    .fillRect(8, 6, 16, 18) // body
    .fillRect(6, 10, 20, 10) // torso
    .fillStyle(0xcc00cc)
    .fillRect(10, 2, 12, 6) // head
    .fillStyle(0x00ffff)
    .fillCircle(13, 5, 1.5) // eye
    .fillCircle(19, 5, 1.5) // eye
    .fillStyle(0xaa00aa)
    .fillRect(4, 18, 6, 10) // left leg
    .fillRect(22, 18, 6, 10) // right leg
    .fillRect(2, 12, 6, 6) // left arm
    .fillRect(24, 12, 6, 6) // right arm
    .fillStyle(0xffffff)
    .fillRect(12, 8, 8, 2) // sensor
    .fillRect(14, 14, 4, 2) // sensor
    .generateTexture('robot_elite', 32, 32);

  // Boss robot (yellow, huge and threatening)
  this.add.graphics()
    .fillStyle(0xffff00)
    .fillRect(4, 10, 24, 18) // body
    .fillRect(2, 14, 28, 12) // torso
    .fillStyle(0xcccc00)
    .fillRect(6, 4, 20, 10) // head
    .fillStyle(0xff0000)
    .fillCircle(12, 9, 2) // eye
    .fillCircle(20, 9, 2) // eye
    .fillStyle(0xaaaa00)
    .fillRect(0, 24, 10, 8) // left leg
    .fillRect(22, 24, 10, 8) // right leg
    .fillRect(-2, 16, 10, 8) // left arm
    .fillRect(24, 16, 10, 8) // right arm
    .fillStyle(0xff6600)
    .fillRect(8, 6, 4, 2) // antenna
    .fillRect(20, 6, 4, 2) // antenna
    .fillStyle(0x666666)
    .fillRect(10, 12, 12, 4) // armor
    .fillRect(12, 18, 8, 4) // armor
    .generateTexture('robot_boss', 32, 32);

  // Super boss robot (black-red, huge and threatening)
  this.add.graphics()
    .fillStyle(0x220000)
    .fillRect(2, 8, 28, 22) // huge body
    .fillRect(0, 12, 32, 16) // massive torso
    .fillStyle(0x440000)
    .fillRect(4, 2, 24, 12) // head
    .fillStyle(0xff0000)
    .fillCircle(10, 8, 3) // big eye
    .fillCircle(22, 8, 3) // big eye
    .fillStyle(0x880000)
    .fillRect(-2, 26, 12, 6) // left leg
    .fillRect(22, 26, 12, 6) // right leg
    .fillRect(-4, 14, 12, 10) // left arm
    .fillRect(24, 14, 12, 10) // right arm
    .fillStyle(0xff4400)
    .fillRect(6, 0, 6, 4) // antenna
    .fillRect(20, 0, 6, 4) // antenna
    .fillStyle(0x333333)
    .fillRect(8, 10, 16, 6) // armor
    .fillRect(10, 18, 12, 6) // armor
    .fillStyle(0xff6600)
    .fillRect(12, 6, 8, 2) // laser sight
    .generateTexture('robot_super_boss', 32, 32);
    
  // Create enemy bullet
  this.add.graphics()
    .fillStyle(0xff0000)
    .fillCircle(6, 6, 5)
    .fillStyle(0xff6666)
    .fillCircle(6, 6, 2)
    .generateTexture('enemy_bullet', 12, 12);
    
  // Create health pack
  this.add.graphics()
    .fillStyle(0x00ff00)
    .fillRect(0, 0, 20, 20)
    .fillStyle(0xffffff)
    .fillRect(6, 8, 8, 4)
    .fillRect(8, 6, 4, 8)
    .generateTexture('healthpack', 20, 20);
    
  // Create explosive bullet for RPG
  this.add.graphics()
    .fillStyle(0xff6600)
    .fillCircle(10, 10, 8)
    .fillStyle(0xffff00)
    .fillCircle(10, 10, 4)
    .generateTexture('explosive_bullet', 20, 20);
}

function create() {
  gameScene = this;
  
  playerHP = maxHP;
  score = 0;
  gameTime = 0;
  enemySpawnRate = 1000;
  enemySpeed = 100;
  shootingTime = 0;
  currentWeapon = 0; // Start with pistol
  lastHitTime = 0;
  isInvulnerable = false;
  gamePaused = false;
  weaponChoiceOpen = false;
  upgradeChoiceOpen = false;
  currentUnlockIndex = 0;
  killCount = 0;
  comboTimer = 0;

  // Set world bounds
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Create map background with grid
  createMapBackground.call(this);
  
  // Create map borders
  createMapBorders.call(this);

  // Create player in center of map
  player = this.physics.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'player');
  player.setDisplaySize(96, 96);
  player.body.setSize(60, 60);
  player.setCollideWorldBounds(true);

  // Create weapon in player's hands
  createPlayerWeapon.call(this);

  // Setup camera to follow player
  this.cameras.main.startFollow(player);
  this.cameras.main.setLerp(0.1, 0.1);
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  keys = this.input.keyboard.addKeys('W,S,A,D,ONE,TWO,THREE,FOUR,FIVE,SIX');

  bullets = this.physics.add.group({ classType: Phaser.GameObjects.Image, runChildUpdate: true });
  enemies = this.physics.add.group();
  healthPacks = this.physics.add.group();
  enemyBullets = this.physics.add.group({ classType: Phaser.GameObjects.Image, runChildUpdate: true });

  difficultyTimer = this.time.addEvent({ 
    delay: enemySpawnRate, 
    callback: spawnEnemy, 
    callbackScope: this, 
    loop: true 
  });

  this.time.addEvent({
    delay: 8000,
    callback: spawnHealthPack,
    callbackScope: this,
    loop: true
  });

  this.time.addEvent({
    delay: 10000,
    callback: increaseDifficulty,
    callbackScope: this,
    loop: true
  });

  this.physics.add.overlap(bullets, enemies, bulletHitsEnemy, null, this);
  this.physics.add.overlap(player, enemies, playerHit, null, this);
  this.physics.add.overlap(player, healthPacks, collectHealthPack, null, this);
  this.physics.add.overlap(enemyBullets, player, enemyBulletHitsPlayer, null, this);

  // UI elements
  createUI.call(this);

  // Mini-map
  createMiniMap.call(this);
  
  // Weapon slots UI
  createWeaponSlots.call(this);
  
  // Weapon selection system
  createWeaponChoice.call(this);
  
  // Upgrade system
  createUpgradeChoice.call(this);
}

function createUI() {
  // HP bar
  hpBarBackground = this.add.rectangle(20, 20, 200, 20, 0x444444).setOrigin(0, 0).setScrollFactor(0);
  hpBarFill = this.add.rectangle(20, 20, 200, 20, 0x00ff00).setOrigin(0, 0).setScrollFactor(0);
  
  // Score
  scoreText = this.add.text(20, 55, 'Score: 0', {
    fontSize: '24px',
    fill: '#ffffff',
    fontFamily: 'Arial'
  }).setScrollFactor(0);

  // Current weapon
  weaponText = this.add.text(20, 85, 'Weapon: ' + weapons[currentWeapon].name, {
    fontSize: '20px',
    fill: '#ffff00',
    fontFamily: 'Arial'
  }).setScrollFactor(0);

  // HP
  this.add.text(230, 20, 'HP: ' + playerHP + '/' + maxHP, {
    fontSize: '18px',
    fill: '#ffffff',
    fontFamily: 'Arial'
  }).setScrollFactor(0);
}

function createPlayerWeapon() {
  // Create weapon in player's hands
  const weaponTextures = ['weapon_pistol', 'weapon_rifle', 'weapon_shotgun', 'weapon_sniper', 'weapon_machinegun', 'weapon_rpg'];
  playerWeapon = this.add.image(0, 0, weaponTextures[currentWeapon]);
  playerWeapon.setScale(2);
  playerWeapon.setDepth(1); // Above player
  updatePlayerWeaponPosition();
}

function updatePlayerWeaponPosition() {
  if (playerWeapon) {
    // Position weapon near player
    playerWeapon.x = player.x + 25;
    playerWeapon.y = player.y + 10;
    
    // Rotate weapon towards cursor
    if (gameScene && gameScene.input) {
      const worldPoint = gameScene.cameras.main.getWorldPoint(gameScene.input.x, gameScene.input.y);
      const angle = Phaser.Math.Angle.Between(player.x, player.y, worldPoint.x, worldPoint.y);
      playerWeapon.setRotation(angle);
    }
  }
}

function updatePlayerWeapon() {
  const weaponTextures = ['weapon_pistol', 'weapon_rifle', 'weapon_shotgun', 'weapon_sniper', 'weapon_machinegun', 'weapon_rpg'];
  if (playerWeapon && weaponTextures[currentWeapon]) {
    playerWeapon.setTexture(weaponTextures[currentWeapon]);
  }
}

function createWeaponSlots() {
  // Create weapon panel at bottom of screen
  const slotSize = 60;
  const spacing = 70;
  const startX = window.innerWidth / 2 - (weapons.length * spacing) / 2 + spacing / 2;
  const y = window.innerHeight - 80;
  
  weaponSlots = [];
  
  for (let i = 0; i < weapons.length; i++) {
    const x = startX + (i * spacing);
    
    // Slot background
    const slotBg = this.add.rectangle(x, y, slotSize, slotSize, 0x333333, 0.8)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);
    
    // Slot border
    const slotBorder = this.add.rectangle(x, y, slotSize, slotSize, 0x666666, 0)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x666666, 0.8);
    
    // Weapon icon
    const weaponTextures = ['weapon_pistol', 'weapon_rifle', 'weapon_shotgun', 'weapon_sniper', 'weapon_machinegun', 'weapon_rpg'];
    const weaponIcon = this.add.image(x, y - 8, weaponTextures[i])
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setScale(1.5)
      .setVisible(weapons[i].owned);
    
    // Key number
    const keyNumber = this.add.text(x, y + 18, (i + 1).toString(), {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    
    // Lock indicator
    const lockIcon = this.add.text(x, y, '🔒', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setVisible(!weapons[i].owned);
    
    weaponSlots.push({
      bg: slotBg,
      border: slotBorder,
      icon: weaponIcon,
      key: keyNumber,
      lock: lockIcon,
      index: i
    });
  }
  
  updateWeaponSlots();
}

function updateWeaponSlots() {
  weaponSlots.forEach((slot, index) => {
    const weapon = weapons[index];
    
    // Update icon and lock visibility
    slot.icon.setVisible(weapon.owned);
    slot.lock.setVisible(!weapon.owned);
    
    // Highlight current weapon
    if (index === currentWeapon && weapon.owned) {
      slot.border.setStrokeStyle(3, 0x00ff00, 1); // Green border for active weapon
      slot.bg.setFillStyle(0x004400, 0.8);
    } else if (weapon.owned) {
      slot.border.setStrokeStyle(2, 0x666666, 0.8); // Normal border for available weapon
      slot.bg.setFillStyle(0x333333, 0.8);
    } else {
      slot.border.setStrokeStyle(2, 0x444444, 0.6); // Dark border for locked weapon
      slot.bg.setFillStyle(0x222222, 0.6);
    }
  });
}

function createWeaponChoice() {
  // Weapon selection background
  window.weaponChoiceBg = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 500, 300, 0x000000, 0.9)
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Weapon selection border
  window.weaponChoiceBorder = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 500, 300, 0xffffff, 0)
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setStrokeStyle(3, 0x00ff00, 0.8)
    .setVisible(false);

  // Weapon selection title
  window.weaponChoiceTitle = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 120, '🎉 NEW WEAPON AVAILABLE!', {
    fontSize: '24px',
    fill: '#00ff00',
    fontFamily: 'Arial'
  }).setOrigin(0.5, 0.5).setScrollFactor(0).setVisible(false);

  // Weapon selection buttons
  window.weaponChoiceButtons = [];
}

function createUpgradeChoice() {
  // Upgrade background
  window.upgradeBg = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 600, 400, 0x000000, 0.9)
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Upgrade border
  window.upgradeBorder = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 600, 400, 0xffffff, 0)
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setStrokeStyle(3, 0xffff00, 0.8)
    .setVisible(false);

  // Upgrade title
  window.upgradeTitle = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 160, '⚡ CHOOSE UPGRADE!', {
    fontSize: '24px',
    fill: '#ffff00',
    fontFamily: 'Arial'
  }).setOrigin(0.5, 0.5).setScrollFactor(0).setVisible(false);

  // Upgrade buttons
  window.upgradeButtons = [];
}

function checkForWeaponUnlock() {
  // Check if new weapon should be unlocked
  if (currentUnlockIndex < weaponUnlockThresholds.length && 
      score >= weaponUnlockThresholds[currentUnlockIndex]) {
    
    showWeaponChoice();
    return;
  }
  
  // If all weapons unlocked, check upgrades every 500 points
  if (currentUnlockIndex >= weaponUnlockThresholds.length) {
    const upgradeInterval = 500;
    const baseScore = 1600; // Last weapon unlock threshold
    if (score >= baseScore && (score - baseScore) % upgradeInterval === 0 && score > baseScore) {
      showUpgradeChoice();
    }
  }
}

function getTotalUpgrades() {
  return weapons.reduce((total, weapon) => total + (weapon.level - 1), 0);
}

function showWeaponChoice() {
  weaponChoiceOpen = true;
  gamePaused = true;
  
  // Hide weapon in player's hands
  if (playerWeapon) {
    playerWeapon.setVisible(false);
  }
  
  // Show weapon selection elements
  window.weaponChoiceBg.setVisible(true);
  window.weaponChoiceBorder.setVisible(true);
  window.weaponChoiceTitle.setVisible(true);
  
  // Create weapon options for selection
  const availableWeapons = [];
  for (let i = 1; i < weapons.length; i++) { // Start with 1, skipping pistol
    if (!weapons[i].owned) {
      availableWeapons.push(i);
    }
  }
  
  // Show up to 3 options
  const weaponsToShow = availableWeapons.slice(0, 3);
  
  weaponsToShow.forEach((weaponIndex, index) => {
    const weapon = weapons[weaponIndex];
    const x = window.innerWidth / 2 - 150 + (index * 150);
    const y = window.innerHeight / 2;
    
    const button = gameScene.add.rectangle(x, y, 120, 60, 0x004400, 0.8)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setInteractive();
    
    const buttonText = gameScene.add.text(x, y, weapon.name, {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    
    button.on('pointerdown', () => selectWeapon(weaponIndex));
    
    window.weaponChoiceButtons.push(button, buttonText);
  });
}

function selectWeapon(weaponIndex) {
  weapons[weaponIndex].owned = true;
  currentUnlockIndex++;
  
  // Update UI slots
  updateWeaponSlots();
  
  // Selection effect
  const selectText = gameScene.add.text(window.innerWidth / 2, window.innerHeight / 2 + 100, 
    `${weapons[weaponIndex].name} UNLOCKED!`, {
    fontSize: '20px',
    fill: '#00ff00',
    fontFamily: 'Arial'
  }).setOrigin(0.5, 0.5).setScrollFactor(0);
  
  gameScene.tweens.add({
    targets: selectText,
    alpha: 0,
    duration: 2000,
    onComplete: () => selectText.destroy()
  });
  
  hideWeaponChoice();
}

function hideWeaponChoice() {
  weaponChoiceOpen = false;
  gamePaused = false;
  
  // Show weapon back
  if (playerWeapon) {
    playerWeapon.setVisible(true);
  }
  
  // Hide elements
  window.weaponChoiceBg.setVisible(false);
  window.weaponChoiceBorder.setVisible(false);
  window.weaponChoiceTitle.setVisible(false);
  
  // Remove buttons
  window.weaponChoiceButtons.forEach(element => element.destroy());
  window.weaponChoiceButtons = [];
  
  resumeGame();
}

function showUpgradeChoice() {
  upgradeChoiceOpen = true;
  gamePaused = true;
  
  // Show upgrade elements
  window.upgradeBg.setVisible(true);
  window.upgradeBorder.setVisible(true);
  window.upgradeTitle.setVisible(true);
  
  // Create 3 random upgrades
  const upgradeOptions = [
    { name: 'Fire Rate', description: '+20% fire rate', type: 'fireRate' },
    { name: 'Bullet Speed', description: '+15% bullet speed', type: 'bulletSpeed' },
    { name: 'More Bullets', description: '+1 bullet per shot', type: 'bulletsPerShot' },
    { name: 'Accuracy', description: '-25% spread', type: 'spread' },
    { name: 'Health', description: '+2 max HP', type: 'health' }
  ];
  
  const selectedUpgrades = Phaser.Math.RND.shuffle(upgradeOptions).slice(0, 3);
  
  selectedUpgrades.forEach((upgrade, index) => {
    const x = window.innerWidth / 2 - 180 + (index * 180);
    const y = window.innerHeight / 2;
    
    const button = gameScene.add.rectangle(x, y, 150, 80, 0x444400, 0.8)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setInteractive();
    
    const titleText = gameScene.add.text(x, y - 15, upgrade.name, {
      fontSize: '16px',
      fill: '#ffff00',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    
    const descText = gameScene.add.text(x, y + 15, upgrade.description, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 140 }
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    
    button.on('pointerdown', () => selectUpgrade(upgrade));
    
    window.upgradeButtons.push(button, titleText, descText);
  });
}

function selectUpgrade(upgrade) {
  // Apply upgrade to all weapons
  weapons.forEach(weapon => {
    if (weapon.owned) {
      switch(upgrade.type) {
        case 'fireRate':
          weapon.fireRate = Math.max(50, weapon.fireRate * 0.8);
          break;
        case 'bulletSpeed':
          weapon.bulletSpeed = Math.floor(weapon.bulletSpeed * 1.15);
          break;
        case 'bulletsPerShot':
          weapon.bulletsPerShot += 1;
          break;
        case 'spread':
          weapon.spread = Math.max(0, weapon.spread * 0.75);
          break;
        case 'health':
          playerHP = Math.min(playerHP + 2, maxHP + 2);
          break;
      }
      weapon.level++;
    }
  });
  
  if (upgrade.type === 'health') {
    updateHPBar();
    updateHPText();
  }
  
  // Upgrade effect
  const upgradeText = gameScene.add.text(window.innerWidth / 2, window.innerHeight / 2 + 120, 
    `${upgrade.name} UPGRADED!`, {
    fontSize: '20px',
    fill: '#ffff00',
    fontFamily: 'Arial'
  }).setOrigin(0.5, 0.5).setScrollFactor(0);
  
  gameScene.tweens.add({
    targets: upgradeText,
    alpha: 0,
    duration: 2000,
    onComplete: () => upgradeText.destroy()
  });
  
  hideUpgradeChoice();
}

function hideUpgradeChoice() {
  upgradeChoiceOpen = false;
  gamePaused = false;
  
  // Hide elements
  window.upgradeBg.setVisible(false);
  window.upgradeBorder.setVisible(false);
  window.upgradeTitle.setVisible(false);
  
  // Remove buttons
  window.upgradeButtons.forEach(element => element.destroy());
  window.upgradeButtons = [];
  
  resumeGame();
}

function getAvailableEnemyTypes() {
  return Object.values(enemyTypes).filter(type => score >= type.unlockScore);
}

function update(time, delta) {
  updateMiniMap();

  // Key handling always available
  // Weapon switching
  if (Phaser.Input.Keyboard.JustDown(keys.ONE) && weapons[0].owned) {
    currentWeapon = 0;
    weaponText.setText('Weapon: ' + weapons[currentWeapon].name);
    updatePlayerWeapon();
    updateWeaponSlots();
  }
  if (Phaser.Input.Keyboard.JustDown(keys.TWO) && weapons[1].owned) {
    currentWeapon = 1;
    weaponText.setText('Weapon: ' + weapons[currentWeapon].name);
    updatePlayerWeapon();
    updateWeaponSlots();
  }
  if (Phaser.Input.Keyboard.JustDown(keys.THREE) && weapons[2].owned) {
    currentWeapon = 2;
    weaponText.setText('Weapon: ' + weapons[currentWeapon].name);
    updatePlayerWeapon();
    updateWeaponSlots();
  }
  if (Phaser.Input.Keyboard.JustDown(keys.FOUR) && weapons[3].owned) {
    currentWeapon = 3;
    weaponText.setText('Weapon: ' + weapons[currentWeapon].name);
    updatePlayerWeapon();
    updateWeaponSlots();
  }
  if (Phaser.Input.Keyboard.JustDown(keys.FIVE) && weapons[4].owned) {
    currentWeapon = 4;
    weaponText.setText('Weapon: ' + weapons[currentWeapon].name);
    updatePlayerWeapon();
    updateWeaponSlots();
  }
  if (Phaser.Input.Keyboard.JustDown(keys.SIX) && weapons[5].owned) {
    currentWeapon = 5;
    weaponText.setText('Weapon: ' + weapons[currentWeapon].name);
    updatePlayerWeapon();
    updateWeaponSlots();
  }

  // If game is paused, stop game logic but not input
  if (gamePaused) return;
  
  gameTime += delta;
  const speed = 200;

  if (isInvulnerable && time > lastHitTime + invulnerabilityTime) {
    isInvulnerable = false;
    player.clearTint();
    player.setAlpha(1);
  }

  if (isInvulnerable) {
    const blinkSpeed = 100;
    const shouldBlink = Math.floor(time / blinkSpeed) % 2;
    player.setAlpha(shouldBlink ? 0.5 : 1);
  }

  // Player movement
  player.setVelocity(0);
  
  if (keys.W.isDown) player.setVelocityY(-speed);
  if (keys.S.isDown) player.setVelocityY(speed);
  if (keys.A.isDown) player.setVelocityX(-speed);
  if (keys.D.isDown) player.setVelocityX(speed);

  const weapon = weapons[currentWeapon];
  
  const worldPoint = gameScene.cameras.main.getWorldPoint(gameScene.input.x, gameScene.input.y);
  
  if (this.input.activePointer.isDown && time > lastFired) {
    fireWeapon(weapon, worldPoint.x, worldPoint.y);
    lastFired = time + weapon.fireRate;
    
    player.setTexture('player_shooting');
    player.setDisplaySize(96, 96);
    shootingTime = time + 150;
  }

  if (shootingTime > 0 && time > shootingTime) {
    player.setTexture('player');
    player.setDisplaySize(96, 96);
    shootingTime = 0;
  }

  bullets.children.iterate(b => {
    if (b && b.lifespan > 0) {
      b.lifespan -= delta;
    } else if (b) {
      b.destroy();
    }
  });

  // Update enemy HP bars so they follow them
  enemies.children.iterate(enemy => {
    if (enemy && enemy.active) {
      if (enemy.hpBar) {
        updateEnemyHPBar(enemy);
      }
      
      // Enemy shooting logic
      if (enemy.canShoot && time > enemy.lastFired + enemy.fireRate) {
        fireEnemyBullet(enemy, time);
        enemy.lastFired = time;
      }
    }
  });

  // Update weapon position in hands
  updatePlayerWeaponPosition();

  // Update combo system
  if (comboTimer > 0) {
    comboTimer -= delta;
    if (comboTimer <= 0) {
      killCount = 0; // Reset counter if time runs out
    }
  }
  
  // Update enemy bullets
  enemyBullets.children.iterate(b => {
    if (b && b.lifespan > 0) {
      b.lifespan -= delta;
    } else if (b) {
      b.destroy();
    }
  });
}

function updateMiniMap() {
  if (window.miniMapPlayer) {
    const miniMapSize = 150;
    const miniMapX = window.innerWidth - miniMapSize - 20;
    const miniMapY = 20;
    
    const playerXPercent = player.x / WORLD_WIDTH;
    const playerYPercent = player.y / WORLD_HEIGHT;
    
    window.miniMapPlayer.x = miniMapX + (playerXPercent * miniMapSize);
    window.miniMapPlayer.y = miniMapY + (playerYPercent * miniMapSize * (WORLD_HEIGHT / WORLD_WIDTH));
  }
}

function fireWeapon(weapon, targetX, targetY) {
  // Normal logic for ranged weapons
  const angleToTarget = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
  
  for (let i = 0; i < weapon.bulletsPerShot; i++) {
    const bulletTexture = weapon.explosive ? 'explosive_bullet' : 'bullet';
    const bullet = bullets.create(player.x, player.y, bulletTexture);
    bullet.setScale(0.2);
    bullet.isExplosive = weapon.explosive || false;
    
    // Добавляем информацию о типе оружия
    bullet.weaponType = weapon.name;
    bullet.isSniper = (weapon.name === 'Sniper Rifle');
    
    let bulletAngle = angleToTarget;
    if (weapon.spread > 0) {
      const spreadAmount = (weapon.spread * Math.PI / 180);
      bulletAngle += (Math.random() - 0.5) * spreadAmount;
    }
    
    const distance = 1000;
    const endX = player.x + Math.cos(bulletAngle) * distance;
    const endY = player.y + Math.sin(bulletAngle) * distance;
    
    gameScene.physics.moveTo(bullet, endX, endY, weapon.bulletSpeed);
    bullet.lifespan = 1000;
  }
}

function fireEnemyBullet(enemy, time) {
  // Create enemy bullet
  const bullet = enemyBullets.create(enemy.x, enemy.y, 'enemy_bullet');
  bullet.setScale(1);
  
  // Shoot at player
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  
  const distance = 1000;
  const endX = enemy.x + Math.cos(angle) * distance;
  const endY = enemy.y + Math.sin(angle) * distance;
  
  gameScene.physics.moveTo(bullet, endX, endY, enemy.bulletSpeed);
  bullet.lifespan = 3000; // 3 seconds lifespan
}

function enemyBulletHitsPlayer(player, bullet) {
  if (isInvulnerable) {
    bullet.destroy();
    return;
  }
  
  bullet.destroy();
  
  playerHP = Math.max(playerHP - 1, 0);
  isInvulnerable = true;
  lastHitTime = gameScene.time.now;
  updateHPBar();
  updateHPText();

  player.setTint(0xff0000);

  if (playerHP <= 0) {
    const survivalTime = Math.floor(gameTime / 1000);
    const finalScoreText = gameScene.add.text(player.x, player.y, 
      'Game Over!\nFinal Score: ' + score + 
      '\nSurvival Time: ' + survivalTime + 's\nRestarting...', {
      fontSize: '32px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    gameScene.time.delayedCall(3000, () => {
      location.reload();
    });
  }
}

function pauseGame() {
  // Just stop all enemies, not touching physics
  enemies.children.iterate(enemy => {
    if (enemy && enemy.body) {
      enemy.body.setVelocity(0, 0);
    }
  });
}

function resumeGame() {
  // Resume enemy movement towards player
  enemies.children.iterate(enemy => {
    if (enemy && enemy.body && enemy.enemyType) {
      const enemyType = Object.values(enemyTypes).find(t => t.name === enemy.enemyType);
      if (enemyType) {
        gameScene.physics.moveToObject(enemy, player, enemyType.speed);
      }
    }
  });
}

function spawnHealthPack() {
  if (gamePaused) return; // Don't spawn during pause
  
  const margin = 200;
  const x = Phaser.Math.Between(margin, WORLD_WIDTH - margin);
  const y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin);
  
  const healthPack = healthPacks.create(x, y, 'healthpack');
  healthPack.setScale(1.5);
  
  gameScene.tweens.add({
    targets: healthPack,
    scaleX: 2,
    scaleY: 2,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  gameScene.time.delayedCall(30000, () => {
    if (healthPack && healthPack.active) {
      healthPack.destroy();
    }
  });
}

function collectHealthPack(player, healthPack) {
  const healAmount = 3;
  const oldHP = playerHP;
  playerHP = Math.min(playerHP + healAmount, maxHP);
  
  if (playerHP > oldHP) {
    const healText = gameScene.add.text(player.x, player.y - 50, '+' + (playerHP - oldHP) + ' HP', {
      fontSize: '24px',
      fill: '#00ff00',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0.5);
    
    gameScene.tweens.add({
      targets: healText,
      y: healText.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => healText.destroy()
    });
    
    updateHPBar();
    updateHPText();
  }
  
  healthPack.destroy();
}

function increaseDifficulty() {
  if (gamePaused) return; // Don't increase difficulty during pause
  
  if (enemySpawnRate > 200) {
    enemySpawnRate = Math.max(200, enemySpawnRate - 100);
    
    difficultyTimer.remove();
    difficultyTimer = gameScene.time.addEvent({
      delay: enemySpawnRate,
      callback: spawnEnemy,
      callbackScope: gameScene,
      loop: true
    });
  }
  
  if (enemySpeed < 250) {
    enemySpeed = Math.min(250, enemySpeed + 15);
  }
}

function spawnEnemy() {
  if (gamePaused) return; // Don't spawn enemies during pause
  
  const availableTypes = getAvailableEnemyTypes();
  if (availableTypes.length === 0) return;
  
  // Super boss spawns rarely, only after 1000 points
  let enemyType;
  if (score >= 1000 && Math.random() < 0.05) { // 5% chance for super boss
    enemyType = enemyTypes.super_boss;
  } else {
    enemyType = Phaser.Math.RND.pick(availableTypes.filter(t => t.name !== 'Super Boss'));
  }
  
  const playerRadius = 800;
  let x, y;
  let attempts = 0;
  let minDistance = 400;
  
  do {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (playerRadius - minDistance);
    
    x = player.x + Math.cos(angle) * distance;
    y = player.y + Math.sin(angle) * distance;
    
    x = Phaser.Math.Clamp(x, 50, WORLD_WIDTH - 50);
    y = Phaser.Math.Clamp(y, 50, WORLD_HEIGHT - 50);
    
    attempts++;
  } while (attempts < 10);
  
  const enemy = enemies.create(x, y, enemyType.texture);
  
  enemy.setScale(enemyType.scale);
  enemy.enemyType = enemyType.name;
  enemy.maxHP = enemyType.hp;
  enemy.currentHP = enemyType.hp;
  enemy.points = enemyType.points;
  
  // Add shooting ability for super boss
  if (enemyType.canShoot) {
    enemy.canShoot = true;
    enemy.fireRate = enemyType.fireRate;
    enemy.bulletSpeed = enemyType.bulletSpeed;
    enemy.lastFired = 0;
  }
  
  if (enemyType.hp > 1) {
    enemy.hpBar = gameScene.add.graphics();
    enemy.hpBarBg = gameScene.add.graphics();
    updateEnemyHPBar(enemy);
  }
  
  gameScene.physics.moveToObject(enemy, player, enemyType.speed);
}

function updateEnemyHPBar(enemy) {
  if (!enemy.hpBar || !enemy.hpBarBg) return;
  
  const barWidth = 40 * enemy.scaleX;
  const barHeight = 6;
  const x = enemy.x - barWidth / 2;
  const y = enemy.y - (enemy.height * enemy.scaleY / 2) - 15;
  
  enemy.hpBarBg.clear();
  enemy.hpBarBg.fillStyle(0x000000, 0.8);
  enemy.hpBarBg.fillRect(x, y, barWidth, barHeight);
  
  enemy.hpBar.clear();
  const hpPercent = enemy.currentHP / enemy.maxHP;
  const fillWidth = barWidth * hpPercent;
  
  let color = 0x00ff00;
  if (hpPercent < 0.5) color = 0xffff00;
  if (hpPercent < 0.25) color = 0xff0000;
  
  enemy.hpBar.fillStyle(color);
  enemy.hpBar.fillRect(x, y, fillWidth, barHeight);
}

function bulletHitsEnemy(bullet, enemy) {
  // Определяем урон в зависимости от типа оружия
  let damage = 1; // Базовый урон
  
  // Увеличенный урон для снайперской винтовки
  if (bullet.isSniper) {
    damage = 5; // В 5 раз больше урона
  }
  
  // Улучшенный взрывной урон для RPG
  if (bullet.isExplosive) {
    damage = 6; // Увеличено в 3 раза (было 2, стало 6)
    
    // Улучшенный взрыв с большей площадью
    const explosionRadius = 120; // Увеличено с 50 до 120
    const explosion = gameScene.add.circle(bullet.x, bullet.y, explosionRadius, 0xff6600, 0.8);
    
    // Добавляем внутренний взрыв для красоты
    const innerExplosion = gameScene.add.circle(bullet.x, bullet.y, explosionRadius * 0.6, 0xffff00, 0.6);
    
    gameScene.tweens.add({
      targets: [explosion, innerExplosion],
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        explosion.destroy();
        innerExplosion.destroy();
      }
    });
    
    // Урон по площади - наносим урон всем врагам в радиусе взрыва
    enemies.children.iterate(otherEnemy => {
      if (otherEnemy && otherEnemy.active && otherEnemy !== enemy) {
        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, otherEnemy.x, otherEnemy.y);
        
        if (distance <= explosionRadius) {
          // Урон уменьшается с расстоянием
          const distancePercent = 1 - (distance / explosionRadius);
          const explosionDamage = Math.ceil(damage * 0.7 * distancePercent); // 70% от основного урона
          
          otherEnemy.currentHP = Math.max(0, otherEnemy.currentHP - explosionDamage);
          
          // Визуальный эффект попадания
          otherEnemy.setTint(0xff6600);
          gameScene.time.delayedCall(150, () => {
            if (otherEnemy.active) {
              otherEnemy.clearTint();
            }
          });
          
          // Текст урона для взрыва
          const damageText = gameScene.add.text(otherEnemy.x, otherEnemy.y - 40, '-' + explosionDamage, {
            fontSize: '16px',
            fill: '#ff6600',
            fontFamily: 'Arial'
          }).setOrigin(0.5, 0.5);
          
          gameScene.tweens.add({
            targets: damageText,
            y: damageText.y - 20,
            alpha: 0,
            duration: 600,
            onComplete: () => damageText.destroy()
          });
          
          updateEnemyHPBar(otherEnemy);
          
          // Если враг умирает от взрыва
          if (otherEnemy.currentHP <= 0) {
            if (otherEnemy.hpBar) otherEnemy.hpBar.destroy();
            if (otherEnemy.hpBarBg) otherEnemy.hpBarBg.destroy();
            
            score += otherEnemy.points;
            scoreText.setText('Score: ' + score);
            
            // Combo system
            killCount++;
            comboTimer = comboTimeLimit;
            
            if (killCount >= comboTarget) {
              showNexusCombo();
              killCount = 0;
            }
            
            checkForWeaponUnlock();
            
            const pointsText = gameScene.add.text(otherEnemy.x, otherEnemy.y - 30, '+' + otherEnemy.points, {
              fontSize: '18px',
              fill: '#ffff00',
              fontFamily: 'Arial'
            }).setOrigin(0.5, 0.5);
            
            gameScene.tweens.add({
              targets: pointsText,
              y: pointsText.y - 30,
              alpha: 0,
              duration: 800,
              onComplete: () => pointsText.destroy()
            });
            
            otherEnemy.destroy();
          }
        }
      }
    });
  }
  
  // Пуля снайперки не уничтожается, а продолжает лететь
  if (!bullet.isSniper) {
    bullet.destroy();
  }
  
  // Наносим урон основной цели (в которую попала пуля)
  enemy.currentHP = Math.max(0, enemy.currentHP - damage);
  
  updateEnemyHPBar(enemy);
  
  enemy.setTint(0xffffff);
  gameScene.time.delayedCall(100, () => {
    if (enemy.active) {
      enemy.clearTint(); // Just remove white tint, returning original robot colors
    }
  });
  
  if (enemy.currentHP <= 0) {
    if (enemy.hpBar) enemy.hpBar.destroy();
    if (enemy.hpBarBg) enemy.hpBarBg.destroy();
    
    score += enemy.points;
    scoreText.setText('Score: ' + score);
    
    // Combo system
    killCount++;
    comboTimer = comboTimeLimit; // Restart combo timer
    
    if (killCount >= comboTarget) {
      showNexusCombo();
      killCount = 0; // Reset counter after combo
    }
    
    // Check for weapon unlock or upgrades
    checkForWeaponUnlock();
    
    const pointsText = gameScene.add.text(enemy.x, enemy.y - 30, '+' + enemy.points, {
      fontSize: '18px',
      fill: '#ffff00',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0.5);
    
    gameScene.tweens.add({
      targets: pointsText,
      y: pointsText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => pointsText.destroy()
    });
    
    enemy.destroy();
  }
}

function showNexusCombo() {
  // NEXUS COMBO effect - positioned higher on screen
  const comboText = gameScene.add.text(window.innerWidth / 2, window.innerHeight / 3, 
    '💥 NEXUS COMBO! 💥', {
    fontSize: '48px',
    fill: '#ff00ff',
    fontFamily: 'Arial',
    stroke: '#ffffff',
    strokeThickness: 3
  }).setOrigin(0.5, 0.5).setScrollFactor(0);
  
  // Combo animation
  gameScene.tweens.add({
    targets: comboText,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 500,
    yoyo: true,
    onComplete: () => {
      gameScene.tweens.add({
        targets: comboText,
        alpha: 0,
        duration: 1000,
        onComplete: () => comboText.destroy()
      });
    }
  });
  
  // Combo bonus
  score += 100;
  scoreText.setText('Score: ' + score);
  
  const bonusText = gameScene.add.text(window.innerWidth / 2, window.innerHeight / 3 + 80, 
    '+100 BONUS!', {
    fontSize: '24px',
    fill: '#00ff00',
    fontFamily: 'Arial'
  }).setOrigin(0.5, 0.5).setScrollFactor(0);
  
  gameScene.tweens.add({
    targets: bonusText,
    alpha: 0,
    duration: 2000,
    onComplete: () => bonusText.destroy()
  });
}

function playerHit(player, enemy) {
  if (isInvulnerable) return;

  enemy.destroy();
  
  if (enemy.hpBar) enemy.hpBar.destroy();
  if (enemy.hpBarBg) enemy.hpBarBg.destroy();
  
  playerHP = Math.max(playerHP - 1, 0);
  isInvulnerable = true;
  lastHitTime = gameScene.time.now;
  updateHPBar();
  updateHPText();

  player.setTint(0xff0000);

  if (playerHP <= 0) {
    const survivalTime = Math.floor(gameTime / 1000);
    const finalScoreText = gameScene.add.text(player.x, player.y, 
      'Game Over!\nFinal Score: ' + score + 
      '\nSurvival Time: ' + survivalTime + 's\nRestarting...', {
      fontSize: '32px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    gameScene.time.delayedCall(3000, () => {
      location.reload();
    });
  }
}

function updateHPBar() {
  const percent = playerHP / maxHP;
  hpBarFill.width = 200 * percent;

  if (percent > 0.6) {
    hpBarFill.fillColor = 0x00ff00;
  } else if (percent > 0.3) {
    hpBarFill.fillColor = 0xffff00;
  } else {
    hpBarFill.fillColor = 0xff0000;
  }
}

function updateHPText() {
  gameScene.children.list.forEach(child => {
    if (child.type === 'Text' && child.text && child.text.includes('HP:')) {
      child.setText('HP: ' + playerHP + '/' + maxHP);
    }
  });
}

function createMapBackground() {
  const graphics = this.add.graphics();
  
  graphics.fillStyle(0x0a0a0a);
  graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  
  graphics.lineStyle(1, 0x333333, 0.5);
  
  for (let x = 0; x <= WORLD_WIDTH; x += 100) {
    graphics.moveTo(x, 0);
    graphics.lineTo(x, WORLD_HEIGHT);
  }
  
  for (let y = 0; y <= WORLD_HEIGHT; y += 100) {
    graphics.moveTo(0, y);
    graphics.lineTo(WORLD_WIDTH, y);
  }
  
  graphics.strokePath();
  
  for (let i = 0; i < 50; i++) {
    const x = Phaser.Math.Between(0, WORLD_WIDTH);
    const y = Phaser.Math.Between(0, WORLD_HEIGHT);
    const size = Phaser.Math.Between(2, 6);
    
    graphics.fillStyle(0x444444, 0.3);
    graphics.fillCircle(x, y, size);
  }
}

function createMapBorders() {
  const borderThickness = 20;
  const borderColor = 0xff6b6b;
  
  const graphics = this.add.graphics();
  graphics.fillStyle(borderColor);
  
  graphics.fillRect(0, 0, WORLD_WIDTH, borderThickness);
  graphics.fillRect(0, WORLD_HEIGHT - borderThickness, WORLD_WIDTH, borderThickness);
  graphics.fillRect(0, 0, borderThickness, WORLD_HEIGHT);
  graphics.fillRect(WORLD_WIDTH - borderThickness, 0, borderThickness, WORLD_HEIGHT);
  
  graphics.lineStyle(4, 0xff9999, 0.8);
  graphics.strokeRect(borderThickness/2, borderThickness/2, 
                     WORLD_WIDTH - borderThickness, WORLD_HEIGHT - borderThickness);
}

function createMiniMap() {
  const miniMapSize = 150;
  const miniMapX = window.innerWidth - miniMapSize - 20;
  const miniMapY = 20;
  
  const miniMapBg = this.add.rectangle(miniMapX, miniMapY, miniMapSize, miniMapSize * (WORLD_HEIGHT / WORLD_WIDTH), 0x000000, 0.7)
    .setOrigin(0, 0)
    .setScrollFactor(0);
  
  const miniMapBorder = this.add.rectangle(miniMapX, miniMapY, miniMapSize, miniMapSize * (WORLD_HEIGHT / WORLD_WIDTH), 0xffffff, 0)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setStrokeStyle(2, 0xffffff, 0.8);
  
  window.miniMapPlayer = this.add.circle(0, 0, 3, 0x00ff00)
    .setScrollFactor(0);
}

window.addEventListener('resize', () => {
  if (gameStarted && gameScene) {
    gameScene.game.scale.resize(window.innerWidth, window.innerHeight);
  }
});
