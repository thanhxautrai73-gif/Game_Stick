import * as THREE from 'three';
import { StickmanBuilder } from './stickman.js';
import { soundEngine } from '../engine/audio.js';

export class Character {
  constructor(scene, particleSystem, options = {}) {
    this.scene = scene;
    this.particles = particleSystem;
    this.isPlayer = options.isPlayer ?? false;
    this.playerIndex = options.playerIndex ?? 1; // 1 or 2
    this.type = options.type || (this.playerIndex === 2 ? 'shadow' : 'zero');

    // Build 3D mesh
    const built = StickmanBuilder.build({
      type: this.type,
      scale: options.scale || 1.0
    });
    this.mesh = built.root;
    this.joints = built.joints;
    this.materials = built.materials;
    this.scene.add(this.mesh);

    // Transform & Physics
    this.position = new THREE.Vector3(options.x || 0, options.y || 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.facing = options.facing || 1; // 1 for right, -1 for left
    this.isGrounded = false;
    this.mesh.position.copy(this.position);

    // Stats
    this.maxHp = options.maxHp || 100;
    this.hp = this.maxHp;
    this.maxEnergy = 100;
    this.energy = options.initialEnergy ?? 30;
    this.isDead = false;

    // Combat State Machine
    this.state = 'idle'; // idle, run, jump, fall, dash, attack, heavy, block, hurt, defeat, victory, skill
    this.stateTimer = 0;
    this.animTime = 0;

    // Combo system
    this.comboStep = 0; // 0, 1, 2, 3
    this.comboResetTimer = 0;
    this.canQueueNextCombo = false;
    this.queuedAttack = false;

    // Skill cooldowns (in seconds)
    this.dashCooldown = 0;
    this.skill1Cooldown = 0;
    this.skill2Cooldown = 0;
    this.invulnerableTimer = 0;
    this.isParrying = false;
    this.parryWindow = 0; // 0.12s window for Perfect Parry

    // Hitbox data
    this.activeHitbox = null; // { pos, size, damage, knockback, isCrit, hasHit: Set }

    // Double Jump
    this.jumpCount = 0;
    this.maxJumps = 2;

    // Movement speed constants (Ultra-smooth & fast ninja physics)
    this.moveSpeed = 8.5;
    this.jumpForce = 14.0;
    this.gravity = -36.0;

    // Responsive Input Buffer (0.35s window prevents dropped keys)
    this.buffer = {
      attack: 0,
      heavy: 0,
      dash: 0,
      jump: 0,
      skill1: 0,
      skill2: 0,
      ult: 0
    };
  }

  update(dt, input, engineRenderer) {
    if (this.isDead && this.state !== 'defeat') {
      this.playDefeat();
      return;
    }

    this.animTime += dt;
    this.stateTimer += dt;

    // Decrement input buffers
    for (const key in this.buffer) {
      if (this.buffer[key] > 0) this.buffer[key] -= dt;
    }

    // Update cooldown timers
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.skill1Cooldown > 0) this.skill1Cooldown -= dt;
    if (this.skill2Cooldown > 0) this.skill2Cooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.parryWindow > 0) this.parryWindow -= dt;

    // Combo window countdown
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    // Process player controls if controlled by input
    if (input && !this.isDead) {
      this.handleInput(input, engineRenderer);
    }

    // Physics Integration
    if (this.state !== 'dash' && this.state !== 'skill1' && this.state !== 'ultimate') {
      this.velocity.y += this.gravity * dt;
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Ground collision (y = 0)
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
      if (this.state === 'fall' || this.state === 'jump') {
        this.state = 'idle';
      }
    } else {
      this.isGrounded = false;
      if (this.velocity.y < 0 && !this.state.startsWith('attack') && this.state !== 'heavy' && this.state !== 'dash') {
        this.state = 'fall';
      }
    }

    // Drag / deceleration
    if (this.isGrounded && this.state !== 'run' && this.state !== 'dash') {
      this.velocity.x *= Math.pow(0.001, dt);
    }

    // Update mesh transform
    this.mesh.position.copy(this.position);
    // Smooth, snappy turning rotation: 3/4 isometric perspective facing travel/attack direction
    const targetRotY = this.facing > 0 ? (Math.PI * 0.44) : (-Math.PI * 0.44);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotY, Math.min(1.0, dt * 22));

    // Turn head to look directly in travel direction
    if (this.joints && this.joints.head) {
      this.joints.head.rotation.y = THREE.MathUtils.lerp(this.joints.head.rotation.y, this.facing > 0 ? 0.14 : -0.14, Math.min(1.0, dt * 15));
    }

    // Procedural skeletal animation
    this.animateJoints(dt);
  }

  handleInput(input, engineRenderer) {
    if (this.isDead || this.state === 'defeat' || this.state === 'victory') return;

    // 1. Record incoming key presses into Input Buffer (0.35s window)
    if (input.attack) this.buffer.attack = 0.35;
    if (input.heavyAttack) this.buffer.heavy = 0.35;
    if (input.dash) this.buffer.dash = 0.35;
    if (input.jump) this.buffer.jump = 0.35;
    if (input.skill1) this.buffer.skill1 = 0.35;
    if (input.skill2) this.buffer.skill2 = 0.35;
    if (input.ult) this.buffer.ult = 0.35;

    // 2. Combo Breaker: Dash + Block when in hurt state
    if (this.state === 'hurt' && this.buffer.dash > 0 && input.block && this.energy >= 50) {
      this.buffer.dash = 0;
      this.triggerComboBreaker(engineRenderer);
      return;
    }
    if (this.state === 'hurt') {
      // Allow early dash dodge out of hurt if hit for more than 0.1s
      if (this.stateTimer > 0.1 && this.buffer.dash > 0 && this.dashCooldown <= 0) {
        this.buffer.dash = 0;
        this.performDash();
      }
      return;
    }

    // 3. Instant Direction Turning:
    // Update facing immediately when player presses left or right so all attacks face the intended direction
    if (input.move !== 0 && this.state !== 'dash' && this.state !== 'ultimate') {
      this.facing = input.move > 0 ? 1 : -1;
    }

    const isAttacking = this.state.startsWith('attack') || this.state === 'heavy' || this.state === 'skill1' || this.state === 'skill2' || this.state === 'ultimate';
    const st = this.stateTimer;

    // 4. INSTANT DASH-CANCEL: Dash cancels any attack animation immediately!
    if (this.buffer.dash > 0 && this.dashCooldown <= 0) {
      this.buffer.dash = 0;
      this.activeHitbox = null;
      this.performDash();
      return;
    }

    // 5. SKILL-CANCELS: Skills can cancel normal attacks seamlessly
    if (this.buffer.skill1 > 0 && this.skill1Cooldown <= 0 && this.energy >= 20) {
      if (!isAttacking || this.state.startsWith('attack')) {
        this.buffer.skill1 = 0;
        this.activeHitbox = null;
        this.performBlinkSlash(engineRenderer);
        return;
      }
    }

    if (this.buffer.skill2 > 0 && this.skill2Cooldown <= 0 && this.energy >= 35) {
      if (!isAttacking || this.state.startsWith('attack')) {
        this.buffer.skill2 = 0;
        this.activeHitbox = null;
        this.performOverdrive(engineRenderer);
        return;
      }
    }

    if (this.buffer.ult > 0 && this.energy >= 100) {
      this.buffer.ult = 0;
      this.activeHitbox = null;
      this.performZeroAbsolute(engineRenderer);
      return;
    }

    // 6. BLOCK / PARRY
    if (input.block && !isAttacking) {
      if (this.state !== 'block') {
        this.state = 'block';
        this.isParrying = true;
        this.parryWindow = 0.16; // Generous perfect parry window
      }
      this.velocity.x *= 0.5;
      return;
    } else if (this.state === 'block' && !input.block) {
      this.state = 'idle';
      this.isParrying = false;
    }

    // 7. ATTACKS & COMBO CHAINING (Ultra-responsive buffering)
    if (!isAttacking) {
      if (this.buffer.attack > 0) {
        this.buffer.attack = 0;
        this.performAttack();
        return;
      }
      if (this.buffer.heavy > 0) {
        this.buffer.heavy = 0;
        this.performHeavyAttack();
        return;
      }
    } else {
      // Chain out of current attack as soon as strike has landed
      if (this.state === 'attack1' && st >= 0.08) {
        if (this.buffer.attack > 0) {
          this.buffer.attack = 0;
          this.activeHitbox = null;
          this.performAttack();
          return;
        }
        if (this.buffer.heavy > 0) {
          this.buffer.heavy = 0;
          this.activeHitbox = null;
          this.performHeavyAttack();
          return;
        }
      } else if (this.state === 'attack2' && st >= 0.09) {
        if (this.buffer.attack > 0) {
          this.buffer.attack = 0;
          this.activeHitbox = null;
          this.performAttack();
          return;
        }
        if (this.buffer.heavy > 0) {
          this.buffer.heavy = 0;
          this.activeHitbox = null;
          this.performHeavyAttack();
          return;
        }
      } else if ((this.state === 'attack3' || this.state === 'heavy') && st >= 0.22) {
        if (this.buffer.attack > 0) {
          this.buffer.attack = 0;
          this.comboStep = 0;
          this.activeHitbox = null;
          this.performAttack();
          return;
        }
      }
    }

    // 8. JUMP & JUMP-CANCEL (Cancel out of attack recovery with a jump)
    if (this.buffer.jump > 0 && this.jumpCount < this.maxJumps) {
      if (!isAttacking || (this.state.startsWith('attack') && st >= 0.12)) {
        this.buffer.jump = 0;
        this.activeHitbox = null;
        this.velocity.y = this.jumpForce;
        this.jumpCount++;
        this.state = 'jump';
        soundEngine.playJump();
        this.particles.spawnHitSparks(this.position, this.type === 'shadow' ? 'crimson' : 'cyan', 6, 2);
        return;
      }
    }

    // 9. GROUND MOVEMENT & AIR CONTROL (Smooth & snappy left/right stride)
    if (!isAttacking && this.state !== 'block') {
      if (input.move !== 0) {
        this.facing = input.move > 0 ? 1 : -1;
        this.velocity.x = input.move * this.moveSpeed;
        if (this.isGrounded) {
          this.state = 'run';
        }
      } else {
        if (this.isGrounded) {
          this.velocity.x = 0;
          this.state = 'idle';
        } else {
          // Responsive air drag so character doesn't float uncontrollably
          this.velocity.x *= Math.pow(0.04, 0.016);
        }
      }
    }
  }

  performAttack() {
    this.comboStep = (this.comboStep % 3) + 1;
    this.state = `attack${this.comboStep}`;
    this.stateTimer = 0;
    this.canQueueNextCombo = false;
    this.queuedAttack = false;
    this.comboResetTimer = 0.85;

    // Forward step on attack
    this.velocity.x = this.facing * (this.comboStep === 3 ? 5.0 : 3.0);
    soundEngine.playSlash(this.comboStep);

    // Image 3 reference: Combo step 3 unleashes giant crescent blade energy wave
    if (this.comboStep === 3) {
      const slashPos = new THREE.Vector3(this.position.x + this.facing * 0.8, this.position.y, 0);
      this.particles.spawnCrescentSlashWave(slashPos, this.facing, this.type === 'shadow' ? 0xff0055 : 0x00f0ff, this, {
        damage: 28,
        knockback: this.facing * 8,
        isCrit: true,
        speed: 22.0,
        life: 1.4
      });
      const quote = soundEngine.playVoiceLine('comboFinisher');
      if (window.game?.hud && quote) {
        window.game.hud.spawnVoiceBanner(quote, this.position);
      }
    }

    // Setup active hitbox
    const damage = this.comboStep === 3 ? 24 : (this.comboStep === 2 ? 16 : 12);
    const isCrit = Math.random() < 0.22 || this.comboStep === 3;
    const reach = this.comboStep === 3 ? 2.2 : 1.7;

    this.activeHitbox = {
      center: new THREE.Vector3(this.position.x + this.facing * reach * 0.6, this.position.y + 1.2, 0),
      size: new THREE.Vector2(reach, 1.4),
      damage: isCrit ? damage * 1.8 : damage,
      isCrit,
      knockback: this.facing * (this.comboStep === 3 ? 8 : 3),
      hasHit: new Set()
    };
  }

  performHeavyAttack() {
    this.state = 'heavy';
    this.stateTimer = 0;
    this.velocity.x = this.facing * 4.0;
    this.velocity.y = 4.0;
    soundEngine.playSlash(3);

    // Image 2 reference: Massive electric ground slam dome with lightning cracks & rock debris
    const slamPos = new THREE.Vector3(this.position.x + this.facing * 1.5, Math.max(0, this.position.y), 0);
    this.particles.spawnElectricGroundSlam(slamPos, this.type === 'shadow' ? 0xff0055 : 0x00e5ff);

    const quote = soundEngine.playVoiceLine('heavy');
    if (window.game?.hud && quote) {
      window.game.hud.spawnVoiceBanner(quote, this.position);
    }

    this.activeHitbox = {
      center: new THREE.Vector3(this.position.x + this.facing * 1.8, this.position.y + 0.8, 0),
      size: new THREE.Vector2(2.5, 1.8),
      damage: 32,
      isCrit: true,
      knockback: this.facing * 10,
      hasHit: new Set()
    };
  }

  performDash() {
    this.state = 'dash';
    this.stateTimer = 0;
    this.dashCooldown = 0.32; // Snappy 0.32s cooldown for fluid dodge chaining
    this.invulnerableTimer = 0.22; // Generous i-frames
    this.velocity.x = this.facing * 19.5;
    this.velocity.y = 0;
    this.activeHitbox = null;
    soundEngine.playDash();

    // Spawn afterimage ghost
    this.particles.spawnGhost(this.mesh, this.type === 'shadow' ? 0xff0055 : 0x00f0ff);

    if (Math.random() < 0.35) {
      const quote = soundEngine.playVoiceLine('dash');
      if (window.game?.hud && quote) {
        window.game.hud.spawnVoiceBanner(quote, this.position);
      }
    }
  }

  performBlinkSlash(engineRenderer) {
    this.state = 'skill1';
    this.stateTimer = 0;
    this.skill1Cooldown = 6.0;
    this.energy = Math.max(0, this.energy - 20);
    soundEngine.playBlinkSlash();

    // Ghost at origin
    this.particles.spawnGhost(this.mesh, this.type === 'shadow' ? 0xff0055 : 0x00f0ff, 0.4);

    // Teleport forward 4.5 units in facing direction
    this.position.x += this.facing * 4.5;
    this.mesh.position.copy(this.position);

    // Image 3 reference: Giant crescent slash wave with electric lightning arcs (Active Traveling Projectile)
    const slashPos = new THREE.Vector3(this.position.x, this.position.y, 0);
    this.particles.spawnCrescentSlashWave(slashPos, this.facing, this.type === 'shadow' ? 0xff0055 : 0x00f0ff, this, {
      damage: 48,
      knockback: this.facing * 10,
      isCrit: true,
      speed: 24.0,
      life: 1.5
    });

    const quote = soundEngine.playVoiceLine('skill1');
    if (window.game?.hud && quote) {
      window.game.hud.spawnVoiceBanner(quote, this.position);
    }

    // Screen shake
    if (engineRenderer) engineRenderer.triggerScreenShake(0.2, 0.25);

    // Immediate contact melee hitbox during teleport
    this.activeHitbox = {
      center: new THREE.Vector3(this.position.x + this.facing * 1.5, this.position.y + 1.2, 0),
      size: new THREE.Vector2(4.5, 2.5),
      damage: 48,
      isCrit: true,
      knockback: this.facing * 8,
      hasHit: new Set()
    };
  }

  performOverdrive(engineRenderer) {
    this.state = 'skill2';
    this.stateTimer = 0;
    this.skill2Cooldown = 10.0;
    this.energy = Math.max(0, this.energy - 35);
    this.velocity.set(0, 0, 0);

    soundEngine.playOverdrive();

    // Image 2 reference: Massive electric ground slam dome with lightning cracks & rock debris
    const slamPos = new THREE.Vector3(this.position.x, Math.max(0, this.position.y), 0);
    this.particles.spawnElectricGroundSlam(slamPos, this.type === 'shadow' ? 0xff0055 : 0x00e5ff);

    // Send surging ground electric shockwave projectile towards opponent (Damages from range!)
    this.particles.spawnGroundShockwave(slamPos, this.facing, this.type === 'shadow' ? 0xff0055 : 0x00e5ff, this, {
      damage: 42,
      knockback: this.facing * 12,
      isCrit: true,
      speed: 18.0,
      life: 1.4
    });

    const quote = soundEngine.playVoiceLine('skill2');
    if (window.game?.hud && quote) {
      window.game.hud.spawnVoiceBanner(quote, this.position);
    }

    if (engineRenderer) {
      engineRenderer.triggerScreenShake(0.3, 0.35);
      engineRenderer.setOverdriveEffect(true);
      setTimeout(() => {
        if (engineRenderer) engineRenderer.setOverdriveEffect(false);
      }, 2000);
    }

    this.activeHitbox = {
      center: new THREE.Vector3(this.position.x, this.position.y + 0.5, 0),
      size: new THREE.Vector2(7.0, 3.0),
      damage: 42,
      isCrit: true,
      knockback: this.facing * 12,
      hasHit: new Set()
    };
  }

  performZeroAbsolute(engineRenderer) {
    this.state = 'ultimate';
    this.stateTimer = 0;
    this.energy = 0;
    this.invulnerableTimer = 1.6;

    soundEngine.playUltimateZeroAbsolute();

    const quote = soundEngine.playVoiceLine('ult');
    if (window.game?.hud && quote) {
      window.game.hud.spawnVoiceBanner(quote, this.position);
    }

    // Freeze frame hitstop
    if (engineRenderer) {
      engineRenderer.triggerHitstop(0.2);
      engineRenderer.triggerGlitch(0.4);
      engineRenderer.triggerScreenShake(0.4, 0.5);
    }

    // Spawn 12 intersecting laser cuts covering screen
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const center = new THREE.Vector3(this.position.x + (Math.random() - 0.5) * 6, this.position.y + 1.5 + (Math.random() - 0.5) * 3, 0);
        this.particles.spawnUltimateSlash(center, (Math.PI / 12) * i + Math.random() * 0.2);
      }, i * 40);
    }

    // Full arena battlefield coverage for ultimate
    this.activeHitbox = {
      center: new THREE.Vector3(0, 2.0, 0),
      size: new THREE.Vector2(55.0, 16.0),
      damage: 85,
      isCrit: true,
      knockback: this.facing * 14,
      hasHit: new Set()
    };
  }

  triggerComboBreaker(engineRenderer) {
    this.energy -= 50;
    this.state = 'idle';
    this.invulnerableTimer = 0.5;
    soundEngine.playParry();
    this.particles.spawnShockwave(this.position, 4.0, 0xffcc00, 0.3);
    if (engineRenderer) engineRenderer.triggerScreenShake(0.25, 0.2);

    this.activeHitbox = {
      center: new THREE.Vector3(this.position.x, this.position.y + 1.2, 0),
      size: new THREE.Vector2(4.5, 2.5),
      damage: 15,
      isCrit: false,
      knockback: this.facing * -9,
      hasHit: new Set()
    };
  }

  takeDamage(amount, knockbackX = 0, isCrit = false, engineRenderer = null) {
    if (this.invulnerableTimer > 0 || this.isDead) return false;

    // Check Block & Perfect Parry
    if (this.state === 'block') {
      if (this.parryWindow > 0) {
        // PERFECT PARRY!
        soundEngine.playParry();
        const quote = soundEngine.playVoiceLine('parry');
        if (window.game?.hud && quote) {
          window.game.hud.spawnVoiceBanner(quote, this.position);
        }
        this.energy = Math.min(this.maxEnergy, this.energy + 30);
        this.dashCooldown = 0; // Reset dash charge
        this.particles.spawnHitSparks(this.position, 'gold', 20, 5);
        if (engineRenderer) {
          engineRenderer.triggerHitstop(0.08);
          engineRenderer.triggerScreenShake(0.18, 0.15);
        }
        return 'parried';
      } else {
        // Regular block: 75% damage reduction
        amount *= 0.25;
        this.hp = Math.max(0, this.hp - amount);
        this.velocity.x += knockbackX * 0.3;
        soundEngine.playHit(false);
        this.particles.spawnHitSparks(this.position, 'cyan', 6, 2);
        return 'blocked';
      }
    }

    // Full damage taken
    this.hp = Math.max(0, this.hp - amount);
    this.state = 'hurt';
    this.stateTimer = 0;
    this.velocity.x = knockbackX;
    this.velocity.y = Math.abs(knockbackX) * 0.3;

    // Gain energy on taking damage
    this.energy = Math.min(this.maxEnergy, this.energy + amount * 0.35);

    soundEngine.playHit(isCrit);
    this.particles.spawnHitSparks(this.position, this.type === 'shadow' ? 'crimson' : 'cyan', isCrit ? 22 : 12, isCrit ? 6 : 3);

    if (engineRenderer) {
      engineRenderer.triggerHitstop(isCrit ? 0.06 : 0.03);
      engineRenderer.triggerScreenShake(isCrit ? 0.25 : 0.1, 0.15);
      if (this.isPlayer) engineRenderer.triggerDamageFlash();
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.playDefeat();
    }

    return true;
  }

  playDefeat() {
    this.state = 'defeat';
    this.stateTimer = 0;
    this.velocity.set(0, 0, 0);
    soundEngine.playDefeatSound();
  }

  playVictory() {
    this.state = 'victory';
    this.stateTimer = 0;
    this.velocity.set(0, 0, 0);
    soundEngine.playVictoryFanfare();
    this.particles.spawnVictoryConfetti();
  }

  // --- PROCEDURAL SKELETAL ANIMATIONS ---
  animateJoints(dt) {
    const j = this.joints;
    const t = this.animTime;
    const st = this.stateTimer;

    // Reset slash trail
    if (j.slashTrailMesh) {
      j.slashTrailMesh.material.opacity = 0;
    }

    // Default neutral poses
    let spineRotX = 0, spineRotY = 0, spineRotZ = 0;
    let lShoulderX = 0, lShoulderZ = 0, rShoulderX = 0, rShoulderZ = 0;
    let lElbowX = 0, rElbowX = 0;
    let lHipX = 0, rHipX = 0, lKneeX = 0, rKneeX = 0;
    let weaponRotX = 0, weaponRotZ = 0;

    switch (this.state) {
      case 'idle':
        // Heroic ready samurai stance (Katana held pointing down and ready, matching reference art)
        spineRotX = Math.sin(t * 2.5) * 0.03;
        lShoulderX = -0.25 + Math.sin(t * 2.5) * 0.03;
        lShoulderZ = -0.15;
        lElbowX = -0.45;
        rShoulderX = 0.35 + Math.sin(t * 2.5) * 0.03;
        rShoulderZ = 0.22;
        rElbowX = -0.65;
        weaponRotX = 0.75;
        weaponRotZ = -0.35;
        break;

      case 'run': {
        // Fast athletic run
        const runCycle = t * 14;
        spineRotX = 0.25; // Forward lean
        lShoulderX = Math.sin(runCycle) * 0.8;
        rShoulderX = -Math.sin(runCycle) * 0.8;
        rElbowX = -0.7;

        lHipX = -Math.sin(runCycle) * 0.85;
        rHipX = Math.sin(runCycle) * 0.85;
        lKneeX = Math.max(0, Math.sin(runCycle + 1.2) * 1.1);
        rKneeX = Math.max(0, -Math.sin(runCycle + 1.2) * 1.1);

        weaponRotX = -0.6;
        break;
      }

      case 'jump':
        spineRotX = -0.15;
        lShoulderX = -0.8;
        rShoulderX = -1.1;
        lHipX = -0.6;
        rHipX = 0.4;
        lKneeX = 0.8;
        rKneeX = 0.5;
        break;

      case 'fall':
        spineRotX = 0.1;
        lShoulderZ = -0.6;
        rShoulderZ = 0.6;
        lHipX = 0.3;
        rHipX = -0.2;
        break;

      case 'dash':
        spineRotX = 0.65; // Extreme horizontal forward lean
        lShoulderX = 1.2;
        rShoulderX = 1.4;
        weaponRotX = 1.2;
        lHipX = -0.8;
        rHipX = 0.9;
        if (st > 0.18) this.state = 'idle';
        break;

      case 'attack1': {
        // Quick horizontal slash (snappy 0.18s)
        const p = Math.min(1.0, st / 0.18);
        spineRotY = (p - 0.5) * 1.4;
        rShoulderX = -1.2 + p * 1.8;
        rShoulderZ = 0.5 - p * 1.2;
        rElbowX = -0.3;
        weaponRotZ = -1.2 + p * 2.2;

        if (j.slashTrailMesh) j.slashTrailMesh.material.opacity = (1 - p) * 0.8;
        if (p >= 1.0) {
          this.activeHitbox = null;
          this.state = 'idle';
        }
        break;
      }

      case 'attack2': {
        // Upward diagonal launcher (snappy 0.20s)
        const p = Math.min(1.0, st / 0.20);
        spineRotX = -0.2;
        spineRotY = 0.6 - p * 1.2;
        rShoulderX = 0.8 - p * 2.4;
        rShoulderZ = 0.4;
        weaponRotX = -p * 1.5;

        if (j.slashTrailMesh) j.slashTrailMesh.material.opacity = (1 - p) * 0.9;
        if (p >= 1.0) {
          this.activeHitbox = null;
          this.state = 'idle';
        }
        break;
      }

      case 'attack3': {
        // 360-degree spin finisher (snappy 0.28s)
        const p = Math.min(1.0, st / 0.28);
        this.mesh.rotation.y = (this.facing > 0 ? 0 : Math.PI) + p * Math.PI * 2;
        rShoulderX = -1.2;
        rShoulderZ = 0.8;
        rElbowX = -0.1;
        weaponRotZ = 1.4;

        if (j.slashTrailMesh) j.slashTrailMesh.material.opacity = (1 - p) * 1.0;
        if (p >= 1.0) {
          this.activeHitbox = null;
          this.state = 'idle';
          this.comboStep = 0;
        }
        break;
      }

      case 'heavy': {
        // Two-handed overhead smash (snappy 0.30s)
        const p = Math.min(1.0, st / 0.30);
        if (p < 0.3) {
          // Windup up
          rShoulderX = -2.2;
          lShoulderX = -2.0;
          spineRotX = -0.4;
        } else {
          // Smash down
          rShoulderX = 0.8;
          lShoulderX = 0.8;
          spineRotX = 0.5;
          if (j.slashTrailMesh) j.slashTrailMesh.material.opacity = (1 - p) * 0.9;
        }
        if (p >= 1.0) {
          this.activeHitbox = null;
          this.state = 'idle';
        }
        break;
      }

      case 'block':
        // High blade parry pose
        spineRotX = 0.1;
        rShoulderX = -1.4;
        rShoulderZ = -0.4;
        rElbowX = -1.2;
        lShoulderX = -1.1;
        lElbowX = -0.9;
        weaponRotZ = 0.8;
        break;

      case 'skill1':
        // Blink slash flurry
        rShoulderX = Math.sin(t * 30) * 1.5;
        weaponRotZ = Math.cos(t * 30) * 1.5;
        if (st > 0.25) {
          this.activeHitbox = null;
          this.state = 'idle';
        }
        break;

      case 'skill2':
        // Ground slam pose
        spineRotX = 0.7;
        rShoulderX = 1.0;
        rElbowX = -0.2;
        weaponRotX = 1.4;
        if (st > 0.28) {
          this.activeHitbox = null;
          this.state = 'idle';
        }
        break;

      case 'ultimate':
        // Raised blade levitation
        this.position.y = 2.2;
        rShoulderX = -2.5;
        lShoulderX = -1.8;
        spineRotX = -0.3;
        if (st > 1.2) {
          this.activeHitbox = null;
          this.state = 'idle';
        }
        break;

      case 'hurt':
        spineRotX = -0.5;
        rShoulderX = 0.8;
        lShoulderX = 0.8;
        if (st > 0.15) this.state = 'idle';
        break;

      case 'defeat':
        // Kneel down on ground
        j.pelvis.position.y = 0.45;
        spineRotX = 0.4;
        lHipX = 1.2;
        lKneeX = 1.4;
        rHipX = -0.6;
        rKneeX = 1.5;
        rShoulderX = 0.5;
        weaponRotX = 1.2; // Blade in ground
        break;

      case 'victory':
        // Sheathing blade animation
        if (st < 0.6) {
          rShoulderX = -1.6;
          rElbowX = -0.8;
        } else {
          // Click into scabbard
          rShoulderX = 0.1;
          rElbowX = -0.6;
          lShoulderX = 0.1;
          lElbowX = -0.6;
          weaponRotX = 0.8;
        }
        break;
    }

    // Apply joint rotations
    j.spine.rotation.set(spineRotX, spineRotY, spineRotZ);
    j.leftShoulder.rotation.set(lShoulderX, 0, lShoulderZ);
    j.leftElbow.rotation.set(lElbowX, 0, 0);
    j.rightShoulder.rotation.set(rShoulderX, 0, rShoulderZ);
    j.rightElbow.rotation.set(rElbowX, 0, 0);
    j.leftHip.rotation.set(lHipX, 0, 0);
    j.leftKnee.rotation.set(lKneeX, 0, 0);
    j.rightHip.rotation.set(rHipX, 0, 0);
    j.rightKnee.rotation.set(rKneeX, 0, 0);
    j.weaponGroup.rotation.set(weaponRotX, 0, weaponRotZ);

    // Animate Cape flutter (based on velocity & wind)
    const capeFlutter = Math.sin(t * 8 + this.position.x) * 0.15 + (this.velocity.x * -0.04 * this.facing);
    j.capeSegments.forEach((seg, i) => {
      seg.rotation.x = capeFlutter * (i + 1) * 0.3;
      seg.rotation.z = Math.sin(t * 6 + i) * 0.05;
    });

    // Animate Headband Ribbons flutter (streaming behind in the wind!)
    if (j.headbandRibbons && j.headbandRibbons.length > 0) {
      const ribbonWave = Math.sin(t * 10) * 0.25 - (this.velocity.x * 0.05 * this.facing);
      j.headbandRibbons[0].rotation.y = ribbonWave * 0.4;
      j.headbandRibbons[0].rotation.x = Math.cos(t * 8) * 0.15;
      if (j.headbandRibbons[1]) j.headbandRibbons[1].rotation.y = -0.2 + ribbonWave * 0.3;
      if (j.headbandRibbons[2]) j.headbandRibbons[2].rotation.y = 0.35 + Math.sin(t * 12) * 0.2;
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
  }
}
