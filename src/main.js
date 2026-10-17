import * as THREE from 'three';
import { EngineRenderer } from './engine/renderer.js';
import { soundEngine } from './engine/audio.js';
import { InputManager } from './engine/input.js';
import { ParticleSystem } from './engine/particles.js';
import { GameCamera } from './engine/camera.js';
import { StageManager } from './stages/stageManager.js';
import { Character } from './entities/character.js';
import { Enemy } from './entities/enemy.js';
import { StickmanBuilder } from './entities/stickman.js';
import { IntroCinematic } from './cinematics/introCinematic.js';
import { HUD } from './ui/hud.js';
import { ScreenManager } from './ui/screens.js';

class StickmanRestorationGame {
  constructor() {
    // 1. Core Systems
    window.game = this;
    this.canvasContainer = document.getElementById('canvas-container');
    this.renderer = new EngineRenderer(this.canvasContainer);
    this.particles = new ParticleSystem(this.renderer.scene);
    this.camCtrl = new GameCamera(this.renderer.camera);
    this.input = new InputManager();
    this.stageManager = new StageManager(this.renderer.scene, this.particles);
    this.hud = new HUD();
    this.screens = new ScreenManager(this);
    this.cinematic = new IntroCinematic(this.renderer.scene, this.camCtrl, this.renderer, this.particles);

    // 2. Game State
    // Modes: 'intro', 'menu', 'campaign', 'pvp', 'dojo'
    this.mode = 'intro';
    this.currentChapter = 1;
    this.maxChapters = 4;
    this.isPaused = false;

    // Entities
    this.player1 = null;
    this.player2 = null; // PvP
    this.enemies = [];
    this.activeBoss = null;
    this.projectiles = [];
    this.menuHeroLeft = null;
    this.menuHeroRight = null;

    // Campaign metrics
    this.stageStartTime = 0;
    this.killCount = 0;
    this.targetKills = 10;
    this.maxComboAchieved = 0;

    // PvP metrics
    this.p1RoundsWon = 0;
    this.p2RoundsWon = 0;

    // Time tracking
    this.clock = new THREE.Clock();
    this.totalTime = 0;
    this.hasTriggeredEnd = false;

    // Bindings
    this.loop = this.loop.bind(this);
    this.initGlobalButtons();

    // Start with Intro Cinematic
    this.playIntro();

    // Start loop
    requestAnimationFrame(this.loop);
  }

  initGlobalButtons() {
    const sndBtn = document.getElementById('btn-sound-toggle');
    sndBtn.addEventListener('click', () => {
      soundEngine.setMute(!soundEngine.isMuted);
      sndBtn.textContent = soundEngine.isMuted ? '🔇 ĐÃ TẮT TIẾNG' : '🔊 ÂM THANH';
    });

    document.getElementById('btn-quick-controls').addEventListener('click', () => {
      this.screens.showControlsModal(true);
    });

    document.getElementById('btn-quick-menu').addEventListener('click', () => {
      this.returnToMenu();
    });

    const skipBtn = document.getElementById('btn-skip-intro');
    skipBtn.addEventListener('click', () => {
      if (this.cinematic.isPlaying) {
        this.cinematic.skip();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.cinematic.isPlaying) {
          this.cinematic.skip();
        }
      }
    });
  }

  // --- INTRO CINEMATIC ---
  playIntro() {
    this.mode = 'intro';
    this.cleanupCombat();
    this.screens.hideAllScreens();
    document.getElementById('hud-container').style.display = 'none';
    document.getElementById('btn-skip-intro').style.display = 'block';

    this.cinematic.start(() => {
      document.getElementById('btn-skip-intro').style.display = 'none';
      this.returnToMenu();
    });
  }

  returnToMenu() {
    this.hasTriggeredEnd = false;
    this.isPaused = false;
    if (this.cinematic) {
      this.cinematic.isPlaying = false;
      this.cinematic.onComplete = null;
      this.cinematic.clear();
    }
    this.cleanupCombat();
    this.renderer.resetEffects();

    // Load Stage 0 (Showroom) & spawn dual Stickman champions on both sides
    this.stageManager.loadStage(0);
    this.spawnMenuHeroes();

    this.camCtrl.setMenuMode();
    this.mode = 'menu';
    this.screens.showMainMenu();
    soundEngine.stopBGM();
    soundEngine.playThemeSong(0.28); // Play official theme song softly in background on Home screen
  }

  spawnMenuHeroes() {
    this.cleanupMenuHeroes();

    // 1. LEFT HERO: Captain Zero (Cobalt Cyan Ninja Champion)
    this.menuHeroLeft = StickmanBuilder.build({ type: 'zero', scale: 1.25 });
    this.menuHeroLeft.root.position.set(-5.2, 0, 0.8);
    this.menuHeroLeft.root.rotation.y = 0.55; // Posed facing inward towards center
    // Heroic ready samurai stance (Katana held low at side, clear of head!)
    this.menuHeroLeft.joints.rightShoulder.rotation.x = 0.35;
    this.menuHeroLeft.joints.rightShoulder.rotation.z = 0.25;
    this.menuHeroLeft.joints.rightElbow.rotation.x = -0.65;
    this.menuHeroLeft.joints.weaponGroup.rotation.x = 0.75;
    this.menuHeroLeft.joints.weaponGroup.rotation.z = -0.35;
    this.menuHeroLeft.joints.leftShoulder.rotation.x = -0.30;
    this.menuHeroLeft.joints.leftShoulder.rotation.z = -0.20;
    this.menuHeroLeft.joints.leftElbow.rotation.x = -0.45;
    this.renderer.scene.add(this.menuHeroLeft.root);

    // 2. RIGHT HERO: Iron Shadow (Crimson & Gold Demon Mecha Warrior)
    this.menuHeroRight = StickmanBuilder.build({ type: 'shadow', scale: 1.25 });
    this.menuHeroRight.root.position.set(5.2, 0, 0.8);
    this.menuHeroRight.root.rotation.y = -0.55; // Posed facing inward towards center
    // Intimidating crimson dual-blade stance
    this.menuHeroRight.joints.rightShoulder.rotation.x = 0.35;
    this.menuHeroRight.joints.rightShoulder.rotation.z = -0.25;
    this.menuHeroRight.joints.rightElbow.rotation.x = -0.65;
    this.menuHeroRight.joints.weaponGroup.rotation.x = 0.75;
    this.menuHeroRight.joints.weaponGroup.rotation.z = 0.35;
    this.menuHeroRight.joints.leftShoulder.rotation.x = -0.40;
    this.menuHeroRight.joints.leftShoulder.rotation.z = 0.25;
    this.menuHeroRight.joints.leftElbow.rotation.x = -0.55;
    this.renderer.scene.add(this.menuHeroRight.root);
  }

  cleanupMenuHeroes() {
    if (this.menuHeroLeft) {
      this.renderer.scene.remove(this.menuHeroLeft.root);
      this.menuHeroLeft.root.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      this.menuHeroLeft = null;
    }
    if (this.menuHeroRight) {
      this.renderer.scene.remove(this.menuHeroRight.root);
      this.menuHeroRight.root.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      this.menuHeroRight = null;
    }
    if (this.menuHero) {
      this.renderer.scene.remove(this.menuHero.root);
      this.menuHero = null;
    }
  }

  // --- CAMPAIGN MODE ---
  startCampaign(chapter = 1) {
    this.mode = 'campaign';
    this.currentChapter = chapter;
    this.hasTriggeredEnd = false;
    this.cleanupCombat();
    this.screens.showGameHUD();

    this.stageStartTime = performance.now();
    this.killCount = 0;
    this.maxComboAchieved = 0;

    // Load Stage Environment
    this.stageManager.loadStage(this.currentChapter);

    // Spawn Player 1 (Zero)
    this.player1 = new Character(this.renderer.scene, this.particles, {
      type: 'zero',
      isPlayer: true,
      playerIndex: 1,
      x: -5,
      y: 0,
      maxHp: 100
    });

    this.camCtrl.setMode('follow');
    this.camCtrl.setFollowTarget(this.player1.position);

    // Determine Stage Enemies
    this.setupChapterEnemies(this.currentChapter);

    // BGM: Play theme song softly in battlefield
    soundEngine.stopBGM();
    soundEngine.setThemeVolume(0.18);
    soundEngine.playThemeSong(0.18);
  }

  setupChapterEnemies(chapter) {
    this.enemies = [];
    this.activeBoss = null;

    if (chapter === 1) {
      // Neo-Neon City: 6 Hounds + 3 Cyber Drones
      this.targetKills = 8;
      for (let i = 0; i < 5; i++) {
        this.enemies.push(new Enemy(this.renderer.scene, this.particles, 'hound', 8 + i * 4));
      }
      for (let i = 0; i < 3; i++) {
        this.enemies.push(new Enemy(this.renderer.scene, this.particles, 'drone', 12 + i * 5));
      }
    } else if (chapter === 2) {
      // Digital Wasteland: 7 Fast Hounds + 4 Drones
      this.targetKills = 10;
      for (let i = 0; i < 6; i++) {
        this.enemies.push(new Enemy(this.renderer.scene, this.particles, 'hound', 8 + i * 4));
      }
      for (let i = 0; i < 4; i++) {
        this.enemies.push(new Enemy(this.renderer.scene, this.particles, 'drone', 14 + i * 5));
      }
    } else if (chapter === 3) {
      // The Sunken Grid: Elite units + Mini-boss Corrupted Echo
      this.targetKills = 6;
      for (let i = 0; i < 4; i++) {
        this.enemies.push(new Enemy(this.renderer.scene, this.particles, 'hound', 8 + i * 5));
      }
      const echoBoss = new Enemy(this.renderer.scene, this.particles, 'echo', 22);
      this.enemies.push(echoBoss);
      this.activeBoss = echoBoss;
    } else if (chapter === 4) {
      // Void Citadel: Colossal Final Boss Void Sovereign!
      this.targetKills = 1;
      const sovBoss = new Enemy(this.renderer.scene, this.particles, 'sovereign', 14);
      this.enemies.push(sovBoss);
      this.activeBoss = sovBoss;
    }
  }

  // --- LOCAL 2-PLAYER PVP MODE ---
  startPvP() {
    this.mode = 'pvp';
    this.hasTriggeredEnd = false;
    this.cleanupCombat();
    this.screens.showGameHUD();

    this.stageManager.loadStage(99); // PvP Arena

    // Spawn Player 1 (Zero - Cyan)
    this.player1 = new Character(this.renderer.scene, this.particles, {
      type: 'zero',
      isPlayer: true,
      playerIndex: 1,
      x: -6,
      y: 0,
      facing: 1
    });

    // Spawn Player 2 (Shadow - Crimson)
    this.player2 = new Character(this.renderer.scene, this.particles, {
      type: 'shadow',
      isPlayer: true,
      playerIndex: 2,
      x: 6,
      y: 0,
      facing: -1
    });

    this.camCtrl.setPvPPlayers(this.player1, this.player2);
    soundEngine.stopBGM();
    soundEngine.setThemeVolume(0.18);
    soundEngine.playThemeSong(0.18);
  }

  // --- TRAINING DOJO MODE ---
  startDojo() {
    this.mode = 'dojo';
    this.hasTriggeredEnd = false;
    this.cleanupCombat();
    this.screens.showGameHUD();

    this.stageManager.loadStage(99);

    this.player1 = new Character(this.renderer.scene, this.particles, {
      type: 'zero',
      isPlayer: true,
      playerIndex: 1,
      x: -4,
      y: 0
    });

    // Dummy Echo with massive HP
    const dummy = new Enemy(this.renderer.scene, this.particles, 'echo', 4);
    dummy.hp = 9999;
    dummy.maxHp = 9999;
    this.enemies.push(dummy);
    this.activeBoss = dummy;

    this.camCtrl.setMode('follow');
    this.camCtrl.setFollowTarget(this.player1.position);
    soundEngine.stopBGM();
    soundEngine.setThemeVolume(0.18);
    soundEngine.playThemeSong(0.18);
  }

  cleanupCombat() {
    this.cleanupMenuHeroes();
    if (this.menuHero) {
      this.renderer.scene.remove(this.menuHero.root);
      this.menuHero = null;
    }
    if (this.player1) {
      this.player1.destroy();
      this.player1 = null;
    }
    if (this.player2) {
      this.player2.destroy();
      this.player2 = null;
    }
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.activeBoss = null;
    this.particles.clear();
    this.clearProjectiles();
    this.hud.reset();
  }

  spawnProjectile(options) {
    const proj = {
      owner: options.owner,
      position: options.position.clone(),
      velocity: options.velocity ? options.velocity.clone() : new THREE.Vector3((options.facing || 1) * (options.speed || 22.0), 0, 0),
      mesh: options.mesh,
      damage: options.damage || 35,
      knockback: options.knockback !== undefined ? options.knockback : ((options.facing || 1) * 8),
      isCrit: options.isCrit ?? true,
      radius: options.radius || 1.8,
      life: options.life || 1.4,
      maxLife: options.life || 1.4,
      hasHit: new Set(),
      color: options.color || (options.owner?.type === 'shadow' ? 'crimson' : 'cyan'),
      type: options.type || 'wave'
    };
    this.projectiles.push(proj);
    return proj;
  }

  clearProjectiles() {
    for (const p of this.projectiles) {
      if (p.mesh && p.mesh.parent) {
        p.mesh.parent.remove(p.mesh);
        p.mesh.traverse((c) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
            else c.material.dispose();
          }
        });
      }
    }
    this.projectiles = [];
  }

  processProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      // Update position along trajectory
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      if (p.mesh) {
        p.mesh.position.copy(p.position);
      }

      // 1. PvP: Player 2 projectile -> Player 1
      if (this.mode === 'pvp' && p.owner === this.player2 && this.player1 && !this.player1.isDead && !p.hasHit.has(this.player1)) {
        const dx = Math.abs(p.position.x - this.player1.position.x);
        const dy = Math.abs(p.position.y - (this.player1.position.y + 1.0));
        if (dx < (p.radius + 1.2) && dy < 2.2) {
          p.hasHit.add(this.player1);
          const result = this.player1.takeDamage(p.damage, p.knockback, p.isCrit, this.renderer);
          this.handleHitResult(result, p, this.player1.position, this.player2);
          this.particles.spawnHitSparks(this.player1.position, p.color, 24, 6);
          this.particles.spawnShockwave(this.player1.position, 3.0, 0xff1755, 0.25);
          if (this.renderer) this.renderer.triggerScreenShake(0.25, 0.2);
        }
      }

      // 2. PvP: Player 1 projectile -> Player 2
      if (this.mode === 'pvp' && p.owner === this.player1 && this.player2 && !this.player2.isDead && !p.hasHit.has(this.player2)) {
        const dx = Math.abs(p.position.x - this.player2.position.x);
        const dy = Math.abs(p.position.y - (this.player2.position.y + 1.0));
        if (dx < (p.radius + 1.2) && dy < 2.2) {
          p.hasHit.add(this.player2);
          const result = this.player2.takeDamage(p.damage, p.knockback, p.isCrit, this.renderer);
          this.handleHitResult(result, p, this.player2.position, this.player1);
          this.particles.spawnHitSparks(this.player2.position, p.color, 24, 6);
          this.particles.spawnShockwave(this.player2.position, 3.0, 0x00f5ff, 0.25);
          if (this.renderer) this.renderer.triggerScreenShake(0.25, 0.2);
        }
      }

      // 3. Campaign / Dojo: Player 1 projectile -> Enemies
      if (this.mode !== 'pvp' && p.owner === this.player1) {
        for (const enemy of this.enemies) {
          if (!enemy.isDead && !p.hasHit.has(enemy)) {
            const dx = Math.abs(p.position.x - enemy.position.x);
            const dy = Math.abs(p.position.y - (enemy.position.y + 1.0));
            if (dx < (p.radius + 1.3) && dy < 2.2) {
              p.hasHit.add(enemy);
              const result = enemy.takeDamage(p.damage, p.knockback, p.isCrit, this.renderer);
              this.handleHitResult(result, p, enemy.position, this.player1);
              this.particles.spawnHitSparks(enemy.position, p.color, 22, 6);
              if (enemy.isDead) this.killCount++;
            }
          }
        }
      }

      // 4. Enemy / Boss projectile -> Player 1
      if (p.owner !== this.player1 && p.owner !== this.player2 && this.player1 && !this.player1.isDead && !p.hasHit.has(this.player1)) {
        const dx = Math.abs(p.position.x - this.player1.position.x);
        const dy = Math.abs(p.position.y - (this.player1.position.y + 1.0));
        if (dx < (p.radius + 1.2) && dy < 2.2) {
          p.hasHit.add(this.player1);
          const result = this.player1.takeDamage(p.damage, p.knockback, p.isCrit, this.renderer);
          if (result === 'parried') {
            this.hud.spawnTextPopup('PERFECT PARRY!', 'parry', this.player1.position);
            this.particles.spawnClashSpark(this.player1.position);
          }
          this.particles.spawnHitSparks(this.player1.position, 'crimson', 22, 6);
        }
      }

      // Expire projectile
      if (p.life <= 0) {
        if (p.mesh && p.mesh.parent) {
          p.mesh.parent.remove(p.mesh);
          p.mesh.traverse((c) => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
              if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
              else c.material.dispose();
            }
          });
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  nextStage() {
    if (this.currentChapter < this.maxChapters) {
      this.startCampaign(this.currentChapter + 1);
    } else {
      this.returnToMenu();
    }
  }

  restartStage() {
    if (this.mode === 'campaign') {
      this.startCampaign(this.currentChapter);
    } else if (this.mode === 'pvp') {
      this.startPvP();
    } else {
      this.startDojo();
    }
  }

  // --- COMBAT HIT DETECTION & RESOLUTION ---
  processCombat(dt = 0.016) {
    // 0. Update and process all traveling projectiles
    this.processProjectiles(dt);
    // 1. Player 1 Attacks -> Enemies
    if (this.player1 && this.player1.activeHitbox) {
      const hb = this.player1.activeHitbox;

      if (this.mode === 'pvp' && this.player2 && !hb.hasHit.has(this.player2)) {
        if (this.checkHitboxCollision(hb, this.player2.position, 1.2)) {
          hb.hasHit.add(this.player2);
          const result = this.player2.takeDamage(hb.damage, hb.knockback, hb.isCrit, this.renderer);
          this.handleHitResult(result, hb, this.player2.position, this.player1);
        }
      } else {
        // Campaign enemies
        for (const enemy of this.enemies) {
          if (!enemy.isDead && !hb.hasHit.has(enemy)) {
            if (this.checkHitboxCollision(hb, enemy.position, 1.5)) {
              hb.hasHit.add(enemy);
              const result = enemy.takeDamage(hb.damage, hb.knockback, hb.isCrit, this.renderer);
              this.handleHitResult(result, hb, enemy.position, this.player1);

              if (enemy.isDead) {
                this.killCount++;
              }
            }
          }
        }
      }
    }

    // 2. Player 2 Attacks -> Player 1 (PvP)
    if (this.player2 && this.player2.activeHitbox && this.player1) {
      const hb = this.player2.activeHitbox;
      if (!hb.hasHit.has(this.player1)) {
        if (this.checkHitboxCollision(hb, this.player1.position, 1.2)) {
          hb.hasHit.add(this.player1);
          const result = this.player1.takeDamage(hb.damage, hb.knockback, hb.isCrit, this.renderer);
          this.handleHitResult(result, hb, this.player1.position, this.player2);
        }
      }
    }

    // 3. Enemy Attacks -> Player 1
    if (this.player1 && !this.player1.isDead) {
      for (const enemy of this.enemies) {
        if (!enemy.isDead && enemy.activeHitbox) {
          const hb = enemy.activeHitbox;
          if (!hb.hasHit.has(this.player1)) {
            if (this.checkHitboxCollision(hb, this.player1.position, 1.2)) {
              hb.hasHit.add(this.player1);
              const result = this.player1.takeDamage(hb.damage, hb.knockback, hb.isCrit, this.renderer);
              if (result === 'parried') {
                enemy.takeDamage(20, -hb.knockback, true, this.renderer);
                this.hud.spawnTextPopup('PERFECT PARRY!', 'parry', this.player1.position);
              }
            }
          }
        }
      }
    }
  }

  checkHitboxCollision(hitbox, targetPos, targetRadius = 1.0) {
    const dx = Math.abs(hitbox.center.x - targetPos.x);
    const dy = Math.abs(hitbox.center.y - (targetPos.y + 1.0));
    return dx < (hitbox.size.x * 0.5 + targetRadius) && dy < (hitbox.size.y * 0.5 + targetRadius);
  }

  handleHitResult(result, hitbox, hitPos, attacker) {
    if (result === 'parried') {
      this.hud.spawnTextPopup('PERFECT PARRY!', 'parry', hitPos);
      this.particles.spawnClashSpark(hitPos);
      attacker.takeDamage(18, -hitbox.knockback, true, this.renderer);
      return;
    }

    if (result === 'blocked') {
      this.hud.spawnTextPopup('BLOCKED', 'blocked', hitPos);
      this.particles.spawnHitSparks(hitPos, 'cyan', 8, 3);
      return;
    }

    if (result) {
      // Successful hit
      if (hitbox.isCrit) {
        this.particles.spawnClashSpark(hitPos);
      }
      this.hud.registerHit(hitbox.damage, hitbox.isCrit, hitPos);
      if (this.hud.comboCount > this.maxComboAchieved) {
        this.maxComboAchieved = this.hud.comboCount;
      }
      // Energy gain on hit
      attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + (hitbox.isCrit ? 22 : 14));
    }
  }

  // --- WIN / LOSS CONDITIONS ---
  checkEndConditions() {
    if (this.hasTriggeredEnd) return;

    if (this.mode === 'campaign') {
      // Check Defeat
      if (this.player1 && this.player1.isDead && this.player1.stateTimer > 1.4) {
        this.hasTriggeredEnd = true;

        // Dynamic progress calculation considering kills, exploration distance, and combat time
        const killFactor = (this.killCount / Math.max(1, this.targetKills)) * 60;
        const distFactor = Math.min(25, (Math.max(0, this.player1.position.x) / 35) * 25);
        const timeFactor = Math.min(15, ((performance.now() - this.stageStartTime) / 1000) * 0.5);
        const progress = Math.min(95, Math.max(25, Math.round(killFactor + distFactor + timeFactor)));

        this.screens.showDefeat(progress);
        return;
      }

      // Check Victory
      const allDead = this.enemies.length > 0 && this.enemies.every(e => e.isDead);
      if (allDead && this.player1 && !this.player1.isDead) {
        if (this.player1.state !== 'victory') {
          this.hasTriggeredEnd = true;
          this.player1.playVictory();
          setTimeout(() => {
            const elapsed = Math.round((performance.now() - this.stageStartTime) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');

            // Rank calculation
            let rank = 'A';
            if (this.player1.hp > 80 && this.maxComboAchieved >= 15) rank = 'SSS';
            else if (this.player1.hp > 60 || this.maxComboAchieved >= 10) rank = 'SS';
            else if (this.player1.hp > 40) rank = 'S';

            this.screens.showVictory({
              rank,
              time: `${mins}:${secs}`,
              kills: this.killCount,
              hp: this.player1.hp,
              maxCombo: this.maxComboAchieved
            });
          }, 1800);
        }
      }
    } else if (this.mode === 'pvp') {
      // PvP KO Check
      if (this.player1 && this.player2) {
        if (this.player1.isDead && this.player1.stateTimer > 1.2) {
          this.hasTriggeredEnd = true;
          this.hud.spawnTextPopup('PLAYER 2 (SHADOW) WINS!', 'pvp', this.player2.position);
          setTimeout(() => this.screens.showVictory({
            rank: 'P2 MVP',
            time: 'ROUND 1',
            kills: 1,
            hp: this.player2.hp,
            maxCombo: this.hud.comboCount
          }), 1500);
        } else if (this.player2.isDead && this.player2.stateTimer > 1.2) {
          this.hasTriggeredEnd = true;
          this.hud.spawnTextPopup('PLAYER 1 (ZERO) WINS!', 'pvp', this.player1.position);
          setTimeout(() => this.screens.showVictory({
            rank: 'P1 MVP',
            time: 'ROUND 1',
            kills: 1,
            hp: this.player1.hp,
            maxCombo: this.hud.comboCount
          }), 1500);
        }
      }
    }
  }

  // --- MAIN GAME LOOP ---
  loop() {
    requestAnimationFrame(this.loop);

    // Clamp dt to max 50ms (20fps floor) to prevent physics explosions & stutter spikes
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.totalTime += dt;

    // Process Hitstop & Screen Shake
    const effectiveDt = this.renderer.update(dt, this.totalTime);

    if (this.mode === 'intro') {
      this.cinematic.update(dt);
      this.particles.update(dt);
      this.renderer.render();
      this.input.clearFrame();
      return;
    }

    if (this.mode === 'menu') {
      if (this.menuHeroLeft) {
        this.menuHeroLeft.joints.spine.rotation.x = Math.sin(this.totalTime * 1.8) * 0.03;
        this.menuHeroLeft.joints.rightShoulder.rotation.x = 0.35 + Math.sin(this.totalTime * 1.8) * 0.04;
        this.menuHeroLeft.joints.weaponGroup.rotation.z = -0.35 + Math.sin(this.totalTime * 2.0) * 0.04;
        if (this.menuHeroLeft.joints.headbandRibbons) {
          this.menuHeroLeft.joints.headbandRibbons.forEach((ribbon, idx) => {
            ribbon.rotation.z = Math.sin(this.totalTime * 3.5 + idx) * 0.15 - 0.2;
            ribbon.rotation.y = Math.cos(this.totalTime * 2.5 + idx) * 0.1;
          });
        }
      }
      if (this.menuHeroRight) {
        this.menuHeroRight.joints.spine.rotation.x = Math.sin(this.totalTime * 1.8 + 1) * 0.03;
        this.menuHeroRight.joints.rightShoulder.rotation.x = 0.35 + Math.sin(this.totalTime * 1.8 + 1) * 0.04;
        this.menuHeroRight.joints.weaponGroup.rotation.z = 0.35 + Math.sin(this.totalTime * 2.0) * 0.04;
        if (this.menuHeroRight.joints.headbandRibbons) {
          this.menuHeroRight.joints.headbandRibbons.forEach((ribbon, idx) => {
            ribbon.rotation.z = Math.sin(this.totalTime * 3.5 + idx + 1.5) * 0.15 + 0.2;
            ribbon.rotation.y = Math.cos(this.totalTime * 2.5 + idx + 1.5) * 0.1;
          });
        }
      }
      if (this.menuHero) {
        this.menuHero.root.rotation.y += dt * 0.45;
        this.menuHero.joints.weaponGroup.rotation.z = Math.sin(this.totalTime * 2.5) * 0.15 + 0.3;
        this.menuHero.joints.rightShoulder.rotation.x = -0.6 + Math.sin(this.totalTime * 2.0) * 0.1;
      }
      this.particles.update(dt);
      this.stageManager.update(dt, this.totalTime);
      this.camCtrl.update(dt, this.renderer.baseCameraPos);
      this.renderer.render();
      this.input.clearFrame();
      return;
    }

    // Always poll input each frame so player buffer captures every click/press even during hitstop!
    const p1Input = this.input.getP1Input();
    const p2Input = this.input.getP2Input();

    if (!this.isPaused) {
      // 2. Update Entities
      if (this.player1) {
        this.player1.update(effectiveDt, p1Input, this.renderer);
        // Stage bounds clamping
        this.player1.position.x = THREE.MathUtils.clamp(
          this.player1.position.x,
          this.stageManager.bounds.minX,
          this.stageManager.bounds.maxX
        );
        this.camCtrl.setFollowTarget(this.player1.position);
      }

      if (this.player2) {
        this.player2.update(effectiveDt, p2Input, this.renderer);
        this.player2.position.x = THREE.MathUtils.clamp(
          this.player2.position.x,
          this.stageManager.bounds.minX,
          this.stageManager.bounds.maxX
        );
      }

      // Dynamic combat facing in PvP mode:
      // When moving, characters turn around to run in movement direction. When stopping or attacking, face opponent!
      if (this.mode === 'pvp' && this.player1 && this.player2) {
        if (p1Input.move !== 0) {
          this.player1.facing = p1Input.move > 0 ? 1 : -1;
        } else if (this.player1.state !== 'dash') {
          this.player1.facing = this.player1.position.x <= this.player2.position.x ? 1 : -1;
        }

        if (p2Input.move !== 0) {
          this.player2.facing = p2Input.move > 0 ? 1 : -1;
        } else if (this.player2.state !== 'dash') {
          this.player2.facing = this.player2.position.x <= this.player1.position.x ? 1 : -1;
        }
      }

      // Update Enemies
      for (const enemy of this.enemies) {
        const targetPos = this.player1 ? this.player1.position : new THREE.Vector3();
        enemy.update(effectiveDt, targetPos, this.renderer);
      }

      // 3. Combat & Hit Collisions (with dynamic projectile simulation)
      this.processCombat(effectiveDt);

      // 4. Particles & Stage
      this.particles.update(effectiveDt);
      this.stageManager.update(effectiveDt, this.totalTime);

      // 5. Camera & HUD
      this.camCtrl.update(effectiveDt, this.renderer.baseCameraPos);
      this.hud.update(effectiveDt, this.player1, this.player2, this.activeBoss, this.renderer.camera);

      // 6. Win / Defeat Conditions
      this.checkEndConditions();
    }

    // Clear single-frame triggered input keys AFTER reading
    this.input.clearFrame();

    // 7. Render 3D Scene with Post-Processing
    this.renderer.render();
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new StickmanRestorationGame();
});
