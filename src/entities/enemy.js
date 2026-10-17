import * as THREE from 'three';
import { Character } from './character.js';
import { soundEngine } from '../engine/audio.js';

export class Enemy {
  constructor(scene, particles, type = 'hound', spawnX = 12) {
    this.scene = scene;
    this.particles = particles;
    this.type = type; // 'hound', 'drone', 'echo', 'sovereign'
    this.isDead = false;
    this.isBoss = (type === 'echo' || type === 'sovereign');

    this.position = new THREE.Vector3(spawnX, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.facing = -1;

    // Build specific 3D mesh for each enemy type matching user reference image
    this.mesh = this.buildMesh(type);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // AI Stats & Timers
    this.initStats(type);

    this.activeHitbox = null;
    this.invulnerableTimer = 0;
    this.aiTimer = Math.random() * 0.5;
    this.attackCooldown = 0;
    this.animTime = 0;
  }

  initStats(type) {
    switch (type) {
      case 'hound':
        this.maxHp = 70;
        this.hp = this.maxHp;
        this.speed = 5.2;
        this.attackRange = 3.0;
        this.attackDelay = 1.3;
        this.damage = 15;
        this.name = 'Chiến Binh Quỷ Máy (Demon Trooper)';
        break;

      case 'drone':
        this.maxHp = 50;
        this.hp = this.maxHp;
        this.speed = 3.8;
        this.attackRange = 7.5;
        this.attackDelay = 2.0;
        this.damage = 14;
        this.position.y = 2.4;
        this.name = 'Quỷ Cơ Khí Có Cánh (Winged Demon)';
        break;

      case 'echo':
        this.maxHp = 350;
        this.hp = this.maxHp;
        this.speed = 7.0;
        this.attackRange = 2.2;
        this.attackDelay = 1.0;
        this.damage = 22;
        this.name = 'Bản Sao Hắc Ám (Corrupted Echo)';
        break;

      case 'sovereign':
        this.maxHp = 950;
        this.hp = this.maxHp;
        this.speed = 4.2;
        this.attackRange = 5.0;
        this.attackDelay = 1.6;
        this.damage = 35;
        this.name = 'Chúa Tể Cơ Khí Hư Không (Void Sovereign)';
        break;
    }
  }

  buildMesh(type) {
    const group = new THREE.Group();

    // Shared demonic mecha materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x222834,
      roughness: 0.35,
      metalness: 0.8
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x11141c,
      roughness: 0.5,
      metalness: 0.6
    });

    const glowRedMat = new THREE.MeshBasicMaterial({
      color: 0xff1e00
    });

    const whiteCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    const outlineRedMat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      side: THREE.BackSide
    });

    const addRedOutline = (m, s = 1.08) => {
      if (!m.geometry) return;
      const o = new THREE.Mesh(m.geometry, outlineRedMat);
      o.scale.set(s, s, s);
      m.add(o);
    };

    if (type === 'hound') {
      // === GROUND MECHA DEMON TROOPER (Foreground Demon Soldier from reference art!) ===
      // 1. Torso & Pelvis
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.20, 0.24), darkMat);
      pelvis.position.y = 0.85;
      group.add(pelvis);

      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.30), steelMat);
      chest.position.y = 1.15;
      addRedOutline(chest, 1.06);
      group.add(chest);

      // Glowing Red Chest Arc Reactor Core
      const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.04, 16), glowRedMat);
      chestCore.rotation.x = Math.PI / 2;
      chestCore.position.set(0, 1.15, 0.16);
      group.add(chestCore);

      // 2. Demonic Horned Skull Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 16, 16), steelMat);
      head.position.y = 1.50;
      addRedOutline(head, 1.06);
      group.add(head);

      // Spiked Horns
      const hornGeo = new THREE.ConeGeometry(0.06, 0.32, 6);
      const hornL = new THREE.Mesh(hornGeo, steelMat);
      hornL.position.set(-0.16, 1.72, 0);
      hornL.rotation.z = 0.45;
      group.add(hornL);

      const hornR = hornL.clone();
      hornR.position.x = 0.16;
      hornR.rotation.z = -0.45;
      group.add(hornR);

      // Glowing Red Demon Eyes & Jaw
      const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), glowRedMat);
      eyeL.position.set(-0.08, 1.52, 0.19);
      eyeL.rotation.z = 0.2;
      group.add(eyeL);

      const eyeR = eyeL.clone();
      eyeR.position.x = 0.08;
      eyeR.rotation.z = -0.2;
      group.add(eyeR);

      const maw = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), glowRedMat);
      maw.position.set(0, 1.40, 0.19);
      group.add(maw);

      // 3. Spiked Shoulders & Arms
      const spikeGeo = new THREE.ConeGeometry(0.05, 0.28, 4);
      for (let s = -1; s <= 1; s += 2) {
        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.18), steelMat);
        pauldron.position.set(s * 0.32, 1.32, 0);
        group.add(pauldron);

        const spike = new THREE.Mesh(spikeGeo, glowRedMat);
        spike.position.set(s * 0.34, 1.46, 0);
        group.add(spike);
      }

      // Left Arm: Razor Blade Claw Hand
      const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.50, 8), darkMat);
      lArm.position.set(-0.35, 1.0, 0);
      group.add(lArm);

      const lClaw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 4), glowRedMat);
      lClaw.position.set(-0.35, 0.65, 0.1);
      lClaw.rotation.x = Math.PI / 2;
      group.add(lClaw);

      // Right Arm: Cybernetic Blaster Pistol
      const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.50, 8), darkMat);
      rArm.position.set(0.35, 1.0, 0);
      group.add(rArm);

      const rBlaster = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.12, 0.32), steelMat);
      rBlaster.position.set(0.35, 0.72, 0.16);
      group.add(rBlaster);

      const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.10, 8), glowRedMat);
      rBarrel.rotation.x = Math.PI / 2;
      rBarrel.position.set(0.35, 0.72, 0.34);
      group.add(rBarrel);

      // 4. Bipedal Armored Legs
      const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8);
      const legL = new THREE.Mesh(legGeo, steelMat);
      legL.position.set(-0.16, 0.42, 0);
      group.add(legL);

      const legR = legL.clone();
      legR.position.x = 0.16;
      group.add(legR);

      this.legs = [legL, legR];

    } else if (type === 'drone') {
      // === WINGED CYBER DEMON (Flying Demon from reference art!) ===
      // 1. Sleek Torso with Glowing Red Core
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.40, 0.28), steelMat);
      chest.position.y = 0.35;
      addRedOutline(chest, 1.06);
      group.add(chest);

      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), glowRedMat);
      core.rotation.x = Math.PI / 2;
      core.position.set(0, 0.35, 0.15);
      group.add(core);

      // 2. Horned Demon Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), steelMat);
      head.position.y = 0.65;
      addRedOutline(head, 1.06);
      group.add(head);

      const hornGeo = new THREE.ConeGeometry(0.05, 0.28, 6);
      const hornL = new THREE.Mesh(hornGeo, steelMat);
      hornL.position.set(-0.14, 0.85, 0);
      hornL.rotation.z = 0.45;
      group.add(hornL);

      const hornR = hornL.clone();
      hornR.position.x = 0.14;
      hornR.rotation.z = -0.45;
      group.add(hornR);

      const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.05), glowRedMat);
      eye.position.set(0, 0.65, 0.17);
      group.add(eye);

      // 3. Mechanical Jet Wings on Back!
      const wingGroup = new THREE.Group();
      wingGroup.position.set(0, 0.45, -0.16);
      group.add(wingGroup);

      const wingBladeGeo = new THREE.BoxGeometry(0.65, 0.14, 0.04);
      const wingL = new THREE.Mesh(wingBladeGeo, steelMat);
      wingL.position.set(-0.45, 0.15, 0);
      wingL.rotation.z = 0.45;
      addRedOutline(wingL, 1.08);
      wingGroup.add(wingL);

      const wingR = wingL.clone();
      wingR.position.x = 0.45;
      wingR.rotation.z = -0.45;
      wingGroup.add(wingR);

      this.wingGroup = wingGroup;

      // 4. Underside Dual Energy Blasters
      const gunL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), steelMat);
      gunL.rotation.x = Math.PI / 2;
      gunL.position.set(-0.20, 0.15, 0.15);
      group.add(gunL);

      const gunR = gunL.clone();
      gunR.position.x = 0.20;
      group.add(gunR);

    } else if (type === 'echo') {
      // Corrupted Shadow Ninja
      this.charDelegate = new Character(this.scene, this.particles, {
        type: 'shadow',
        isPlayer: false,
        x: this.position.x,
        y: this.position.y,
        maxHp: 350
      });
      return this.charDelegate.mesh;

    } else if (type === 'sovereign') {
      // Colossal Demonic Cyber Mech Final Boss!
      this.charDelegate = new Character(this.scene, this.particles, {
        type: 'sovereign',
        scale: 2.8,
        isPlayer: false,
        x: this.position.x,
        y: this.position.y,
        maxHp: 950
      });
      return this.charDelegate.mesh;
    }

    return group;
  }

  update(dt, playerPos, engineRenderer) {
    if (this.isDead) return;

    this.animTime += dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // If delegate character exists (Echo & Sovereign)
    if (this.charDelegate) {
      this.updateDelegateBoss(dt, playerPos, engineRenderer);
      return;
    }

    // Direction to player
    const dx = playerPos.x - this.position.x;
    const dist = Math.abs(dx);
    this.facing = dx > 0 ? 1 : -1;
    const targetEnemyRotY = this.facing > 0 ? (Math.PI * 0.44) : (-Math.PI * 0.44);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetEnemyRotY, Math.min(1.0, dt * 18));

    // Movement & AI
    if (this.type === 'hound') {
      // Ground Mecha Demon Trooper
      if (dist > this.attackRange) {
        this.position.x += this.facing * this.speed * dt;
        // Bipedal running leg animation
        if (this.legs && this.legs.length >= 2) {
          const run = this.animTime * 10;
          this.legs[0].rotation.x = Math.sin(run) * 0.6;
          this.legs[1].rotation.x = -Math.sin(run) * 0.6;
        }
      } else if (this.attackCooldown <= 0) {
        // Lunge slash & blaster shot attack
        this.attackCooldown = this.attackDelay;
        this.velocity.x = this.facing * 8.5;
        this.velocity.y = 3.2;
        soundEngine.playSlash(1);

        this.activeHitbox = {
          center: new THREE.Vector3(this.position.x + this.facing * 1.6, this.position.y + 0.8, 0),
          size: new THREE.Vector2(2.0, 1.4),
          damage: this.damage,
          isCrit: false,
          knockback: this.facing * 6,
          hasHit: new Set()
        };

        // Red spark hit-flash
        this.particles.spawnHitSparks(
          new THREE.Vector3(this.position.x + this.facing * 1.2, this.position.y + 0.8, 0),
          'crimson',
          12,
          4
        );
      }

      // Physics
      this.velocity.y += -28.0 * dt;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = 0;
        this.velocity.x *= 0.5;
      }

    } else if (this.type === 'drone') {
      // Winged Cyber Demon
      this.position.y = 2.4 + Math.sin(this.animTime * 3) * 0.35;
      if (this.wingGroup) {
        this.wingGroup.rotation.y = Math.sin(this.animTime * 12) * 0.3;
      }

      if (dist > 4.5) {
        this.position.x += this.facing * this.speed * dt;
      } else if (this.attackCooldown <= 0) {
        this.attackCooldown = this.attackDelay;
        soundEngine.playSlash(2);

        this.activeHitbox = {
          center: new THREE.Vector3(this.position.x + this.facing * 3.2, this.position.y, 0),
          size: new THREE.Vector2(5.0, 1.2),
          damage: this.damage,
          isCrit: false,
          knockback: this.facing * 4,
          hasHit: new Set()
        };

        // Red energy blaster burst
        this.particles.spawnShockwave(this.position, 2.2, 0xff1e00, 0.25);
        this.particles.spawnHitSparks(this.position, 'crimson', 14, 5);
      }
    }

    this.mesh.position.copy(this.position);

    // Expire hitboxes
    if (this.activeHitbox && this.attackCooldown < this.attackDelay - 0.25) {
      this.activeHitbox = null;
    }
  }

  updateDelegateBoss(dt, playerPos, engineRenderer) {
    const cd = this.charDelegate;
    const dx = playerPos.x - cd.position.x;
    const dist = Math.abs(dx);
    cd.facing = dx > 0 ? 1 : -1;

    // Boss AI decision loop
    this.aiTimer += dt;
    const simulatedInput = {
      move: 0,
      jump: false,
      dash: false,
      attack: false,
      heavyAttack: false,
      skill1: false,
      skill2: false,
      ult: false,
      block: false
    };

    if (dist > (this.type === 'sovereign' ? 5.0 : 2.5)) {
      simulatedInput.move = cd.facing;
    }

    if (this.attackCooldown <= 0) {
      if (this.type === 'sovereign') {
        // Colossal Demonic Cyber Mech: Cannon Blasts & Quakes
        const rnd = Math.random();
        if (dist <= 7.5 && rnd < 0.45) {
          simulatedInput.attack = true;
          this.attackCooldown = 1.4;
          soundEngine.playOverdrive();
          const cannonPos = new THREE.Vector3(cd.position.x + cd.facing * 2.4, cd.position.y + 2.0, 0);
          this.particles.spawnHitSparks(cannonPos, 'crimson', 30, 8);
          // Giant horizontal crimson beam slash wave matching row 5 of reference image!
          this.particles.spawnCrescentSlashWave(cannonPos, cd.facing, 0xff2200, this, {
            damage: 38,
            knockback: cd.facing * 9,
            speed: 20.0
          });
        } else if (rnd < 0.75) {
          simulatedInput.heavyAttack = true; // Demonic Claw Ground Slam!
          this.attackCooldown = 2.2;
          if (engineRenderer) engineRenderer.triggerScreenShake(0.4, 0.35);
          const slamPos = new THREE.Vector3(cd.position.x + cd.facing * 2.0, 0, 0);
          this.particles.spawnElectricGroundSlam(slamPos, 0xff2200);
          this.particles.spawnShockwave(slamPos, 6.5, 0xff2200, 0.5);
        } else if (cd.energy >= 35) {
          simulatedInput.skill2 = true; // Molten Overdrive Quake
          this.attackCooldown = 3.2;
          soundEngine.playMassiveExplosion();
          if (engineRenderer) {
            engineRenderer.triggerScreenShake(0.55, 0.5);
            engineRenderer.triggerExplosionFlash(0.35);
          }
          this.particles.spawnElectricGroundSlam(cd.position, 0xff5500);
          this.particles.spawnShockwave(cd.position, 9.0, 0xff1100, 0.6);
        }
      } else {
        // Echo Mini-boss
        const rnd = Math.random();
        if (dist <= 3.2 && rnd < 0.5) {
          simulatedInput.attack = true;
          this.attackCooldown = 0.9;
        } else if (rnd < 0.8 && cd.energy >= 20) {
          simulatedInput.skill1 = true;
          this.attackCooldown = 2.5;
        } else if (rnd < 0.95 && dist < 2.0) {
          simulatedInput.block = true;
          this.attackCooldown = 0.6;
        }
      }
    }

    cd.update(dt, simulatedInput, engineRenderer);

    this.position.copy(cd.position);
    this.hp = cd.hp;
    this.activeHitbox = cd.activeHitbox;

    if (cd.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.particles.spawnSupernovaExplosion(this.position);
      soundEngine.playMassiveExplosion();
    }
  }

  takeDamage(amount, knockbackX = 0, isCrit = false, engineRenderer = null) {
    if (this.isDead) return false;

    if (this.charDelegate) {
      const res = this.charDelegate.takeDamage(amount, knockbackX, isCrit, engineRenderer);
      this.hp = this.charDelegate.hp;
      if (this.hp <= 0) {
        this.isDead = true;
        this.particles.spawnSupernovaExplosion(this.position);
        soundEngine.playMassiveExplosion();
      }
      return res;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.velocity.x += knockbackX * 0.8;
    this.invulnerableTimer = 0.08;

    soundEngine.playHit(isCrit);
    this.particles.spawnHitSparks(this.position, 'crimson', isCrit ? 22 : 12, isCrit ? 6 : 4);

    if (engineRenderer) {
      engineRenderer.triggerHitstop(isCrit ? 0.06 : 0.02);
      engineRenderer.triggerScreenShake(isCrit ? 0.22 : 0.08, 0.1);
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.particles.spawnHitSparks(this.position, 'crimson', 35, 8);
      this.particles.spawnBinaryDissolve(this.position, 35);
      this.destroy();
    }

    return true;
  }

  destroy() {
    if (this.charDelegate) {
      this.charDelegate.destroy();
    } else if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
    }
  }
}
