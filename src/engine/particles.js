import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.shockwaves = [];
    this.slashTrails = [];
    this.matrixCodes = [];

    // Pre-create shared geometries and materials
    this.sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.sparkMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.sparkMatCrimson = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    this.sparkMatGold = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    this.sparkMatPurple = new THREE.MeshBasicMaterial({ color: 0xb026ff });

    // Weather particle container
    this.weatherPoints = null;
    this.weatherType = null;
  }

  // Spawn hit sparks on impact
  spawnHitSparks(pos, colorType = 'cyan', count = 16, spread = 6) {
    let mat = this.sparkMatCyan;
    if (colorType === 'crimson') mat = this.sparkMatCrimson;
    if (colorType === 'gold') mat = this.sparkMatGold;
    if (colorType === 'purple') mat = this.sparkMatPurple;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(pos);
      mesh.position.x += (Math.random() - 0.5) * 0.2;
      mesh.position.y += (Math.random() - 0.5) * 0.2;
      mesh.position.z += (Math.random() - 0.5) * 0.2;

      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.5 + 0.5) * spread;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        (Math.random() * 0.8 + 0.2) * speed,
        (Math.sin(angle) * 0.4) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 1.0,
        decay: Math.random() * 2.0 + 2.5,
        gravity: -14.0
      });
    }
  }

  // Superhero Clash Spark (Matching user reference image clash blast!)
  spawnClashSpark(pos) {
    const geo = new THREE.RingGeometry(0.2, 0.6, 32, 1, 0, Math.PI * 1.6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
    const clashMesh = new THREE.Mesh(geo, mat);
    clashMesh.position.copy(pos);
    clashMesh.rotation.z = Math.random() * Math.PI * 2;
    this.scene.add(clashMesh);

    this.shockwaves.push({
      mesh: clashMesh,
      mat,
      maxRadius: 3.8,
      duration: 0.35,
      elapsed: 0
    });

    this.spawnShockwave(pos, 3.5, 0xffd700, 0.32);
    this.spawnHitSparks(pos, 'gold', 20, 8);
    this.spawnHitSparks(pos, 'cyan', 16, 7);
  }

  // Giant Cinematic Supernova Explosion with expanding fireball sphere, multi-shockwaves and 120+ particles!
  spawnSupernovaExplosion(pos) {
    // 1. Core White-Hot Glowing Fireball Sphere
    const sphereGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const fireball = new THREE.Mesh(sphereGeo, sphereMat);
    fireball.position.copy(pos);
    this.scene.add(fireball);

    this.shockwaves.push({
      mesh: fireball,
      mat: sphereMat,
      maxRadius: 6.5,
      duration: 0.75,
      elapsed: 0
    });

    // 2. Secondary Fiery Golden Corona Sphere
    const coronaGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.75,
      wireframe: true
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.position.copy(pos);
    this.scene.add(corona);

    this.shockwaves.push({
      mesh: corona,
      mat: coronaMat,
      maxRadius: 9.0,
      duration: 0.9,
      elapsed: 0
    });

    // 3. Huge Horizontal & Vertical Shockwave Rings
    this.spawnShockwave(pos, 11.0, 0xffd700, 0.65);
    this.spawnShockwave(pos, 8.5, 0x00f5ff, 0.55);

    // 4. Over 120 3D Sparks & Debris
    this.spawnHitSparks(pos, 'gold', 55, 14);
    this.spawnHitSparks(pos, 'cyan', 45, 12);
    this.spawnHitSparks(pos, 'crimson', 40, 10);

    // 5. Chain burst aftershocks
    setTimeout(() => {
      this.spawnShockwave(new THREE.Vector3(pos.x + 0.8, pos.y - 0.4, pos.z), 6.0, 0xffea00, 0.4);
      this.spawnHitSparks(pos, 'gold', 25, 9);
    }, 120);

    setTimeout(() => {
      this.spawnShockwave(new THREE.Vector3(pos.x - 0.8, pos.y + 0.4, pos.z), 6.5, 0x00ffff, 0.45);
      this.spawnHitSparks(pos, 'cyan', 25, 9);
    }, 250);
  }

  // Expanding shockwave ring (for Overdrive and Heavy attacks)
  spawnShockwave(pos, maxRadius = 4.5, color = 0x00f0ff, duration = 0.45) {
    const geo = new THREE.RingGeometry(0.1, 0.35, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.05;
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      mat,
      maxRadius,
      duration,
      elapsed: 0
    });
  }

  // Image 2: Massive Electric Lightning Dome Shockwave & Flying Rock Debris Ground Slam
  spawnElectricGroundSlam(pos, colorHex = 0x00f5ff) {
    // 1. Hemispherical Electric Dome (expanding upward dome)
    const domeGeo = new THREE.SphereGeometry(0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      wireframe: true
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.copy(pos);
    domeMesh.position.y += 0.05;
    this.scene.add(domeMesh);

    this.shockwaves.push({
      mesh: domeMesh,
      mat: domeMat,
      maxRadius: 8.5,
      duration: 0.65,
      elapsed: 0
    });

    // 2. Concentric Ground Rings
    this.spawnShockwave(pos, 9.5, colorHex, 0.55);
    this.spawnShockwave(pos, 6.0, 0xffffff, 0.40);

    // 3. Ground Lightning Fissures (8 Jagged crack lines spreading outwards on ground)
    const lightningMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const length = 3.5 + Math.random() * 3.0;
      const boltGeo = new THREE.PlaneGeometry(0.08, length);
      boltGeo.rotateX(-Math.PI / 2);
      const bolt = new THREE.Mesh(boltGeo, lightningMat);
      bolt.position.set(pos.x + Math.cos(angle) * (length * 0.5), pos.y + 0.04, pos.z + Math.sin(angle) * (length * 0.5));
      bolt.rotation.y = -angle + Math.PI / 2;
      this.scene.add(bolt);

      this.shockwaves.push({
        mesh: bolt,
        mat: lightningMat,
        maxRadius: 1.0,
        duration: 0.45,
        elapsed: 0
      });
    }

    // 4. Exploding Flying Concrete/Rock Debris
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1f2736, roughness: 0.8 });
    for (let r = 0; r < 20; r++) {
      const rockSize = 0.08 + Math.random() * 0.14;
      const rock = new THREE.Mesh(new THREE.BoxGeometry(rockSize, rockSize, rockSize), rockMat);
      rock.position.copy(pos);
      rock.position.x += (Math.random() - 0.5) * 1.2;
      rock.position.z += (Math.random() - 0.5) * 1.0;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6.0 + 3.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 8.0 + 5.0, // Launch upwards
        Math.sin(angle) * (speed * 0.4)
      );

      this.scene.add(rock);
      this.particles.push({
        mesh: rock,
        vel,
        rotVel: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        life: 1.0,
        decay: 1.4,
        gravity: -24.0
      });
    }

    // 5. Electric sparks
    this.spawnHitSparks(pos, 'cyan', 45, 10);
  }

  // Image 3: Giant Crescent Energy Slash Wave with Lightning Arcs (Active Damaging Projectile)
  spawnCrescentSlashWave(pos, facing = 1, colorHex = 0x00f5ff, owner = null, options = {}) {
    const waveGroup = new THREE.Group();
    const startY = (pos.y !== undefined ? pos.y : 0) + 1.1;
    waveGroup.position.set(pos.x + facing * 0.8, startY, 0);

    // Giant Arcing Crescent Blade (Matching Image 3!)
    const crescentGeo = new THREE.RingGeometry(1.2, 2.8, 36, 1, 0, Math.PI * 0.85);
    const crescentMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const crescentMesh = new THREE.Mesh(crescentGeo, crescentMat);
    crescentMesh.rotation.y = facing > 0 ? 0 : Math.PI;
    crescentMesh.rotation.z = -Math.PI / 4;
    waveGroup.add(crescentMesh);

    // Inner White-Hot Core Blade Arc
    const coreGeo = new THREE.RingGeometry(1.8, 2.2, 36, 1, 0, Math.PI * 0.85);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.rotation.y = facing > 0 ? 0 : Math.PI;
    coreMesh.rotation.z = -Math.PI / 4;
    waveGroup.add(coreMesh);

    // Trailing Lightning Arcs
    const arcColor = (colorHex === 0xff1755 || colorHex === 0xff0055 || colorHex === 0xff2200) ? 0xff3366 : 0x00ffff;
    for (let a = 0; a < 4; a++) {
      const arc = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.2), new THREE.MeshBasicMaterial({ color: arcColor, transparent: true, opacity: 0.85 }));
      arc.position.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 0.3);
      arc.rotation.z = (Math.random() - 0.5) * 1.2;
      waveGroup.add(arc);
    }

    this.scene.add(waveGroup);

    // Flying rock debris & sparks from the ground slash
    const sparkColor = (colorHex === 0xff1755 || colorHex === 0xff0055 || colorHex === 0xff2200) ? 'crimson' : 'cyan';
    this.spawnHitSparks(pos, sparkColor, 20, 6);

    // Register active damaging projectile in game combat manager
    if (window.game && window.game.spawnProjectile) {
      window.game.spawnProjectile({
        owner,
        position: waveGroup.position,
        velocity: new THREE.Vector3(facing * (options.speed || 22.0), 0, 0),
        mesh: waveGroup,
        damage: options.damage || 35,
        knockback: facing * (options.knockback || 9),
        isCrit: options.isCrit ?? true,
        radius: 2.0,
        life: options.life || 1.4,
        color: sparkColor,
        type: 'crescent'
      });
    } else {
      this.slashTrails.push({
        mesh: waveGroup,
        mat: crescentMat,
        velX: facing * 18.0,
        life: 1.2,
        decay: 1.2,
        isWave: true
      });
    }

    return waveGroup;
  }

  // Ground Electric Shockwave Pulse (Active Damaging Ground Projectile for Skill 2)
  spawnGroundShockwave(pos, facing = 1, colorHex = 0x00f5ff, owner = null, options = {}) {
    const shockGroup = new THREE.Group();
    shockGroup.position.set(pos.x + facing * 1.0, 0.1, 0);

    // Crackling ground wave wedge
    const waveMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const waveMesh = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 8), waveMat);
    waveMesh.rotation.x = Math.PI / 2;
    waveMesh.rotation.z = facing > 0 ? -Math.PI / 2 : Math.PI / 2;
    shockGroup.add(waveMesh);

    // Vertical electric pillar
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 2.2, 8), pillarMat);
    pillar.position.y = 1.1;
    shockGroup.add(pillar);

    this.scene.add(shockGroup);

    const sparkColor = (colorHex === 0xff1755 || colorHex === 0xff0055 || colorHex === 0xff2200) ? 'crimson' : 'cyan';

    if (window.game && window.game.spawnProjectile) {
      window.game.spawnProjectile({
        owner,
        position: shockGroup.position,
        velocity: new THREE.Vector3(facing * (options.speed || 18.0), 0, 0),
        mesh: shockGroup,
        damage: options.damage || 40,
        knockback: facing * (options.knockback || 12),
        isCrit: options.isCrit ?? true,
        radius: 2.2,
        life: options.life || 1.4,
        color: sparkColor,
        type: 'shockwave'
      });
    }

    return shockGroup;
  }

  // Dash ghost afterimage
  spawnGhost(meshGroup, colorHex = 0x00f0ff, duration = 0.25) {
    const ghost = meshGroup.clone(true);
    ghost.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.55,
          wireframe: true
        });
      }
    });
    this.scene.add(ghost);

    this.particles.push({
      mesh: ghost,
      vel: new THREE.Vector3(0, 0, 0),
      life: 1.0,
      decay: 1 / duration,
      gravity: 0,
      isGhost: true
    });
  }

  // Ultimate Zero-Absolute laser slash plane
  spawnUltimateSlash(centerPos, angle) {
    const geo = new THREE.PlaneGeometry(16, 0.15);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(centerPos);
    mesh.position.z += (Math.random() - 0.5) * 1.5;
    mesh.rotation.z = angle;
    mesh.scale.set(0.1, 1, 1);
    this.scene.add(mesh);

    this.slashTrails.push({
      mesh,
      mat,
      life: 1.0,
      decay: 4.0,
      grow: true
    });
  }

  // Spawn falling 0101 binary code fragments (for disintegrating enemies)
  spawnBinaryDissolve(pos, count = 25) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.random() > 0.5 ? '0' : '1', 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95
    });

    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.4, 0.4, 0.4);
      sprite.position.copy(pos);
      sprite.position.x += (Math.random() - 0.5) * 1.2;
      sprite.position.y += Math.random() * 2.0;
      sprite.position.z += (Math.random() - 0.5) * 0.8;

      this.scene.add(sprite);
      this.particles.push({
        mesh: sprite,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 1.5 + 0.5,
          (Math.random() - 0.5) * 0.5
        ),
        life: 1.0,
        decay: 1.2,
        gravity: 0
      });
    }
  }

  // Victory Confetti Fireworks
  spawnVictoryConfetti() {
    const colors = [0x00f0ff, 0xff0077, 0xffd700, 0x00ff88, 0xffffff];
    for (let i = 0; i < 70; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set((Math.random() - 0.5) * 14, 8 + Math.random() * 4, (Math.random() - 0.5) * 4);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -Math.random() * 3 - 1,
          (Math.random() - 0.5) * 1
        ),
        rotVel: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        life: 1.0,
        decay: 0.35,
        gravity: -1.0
      });
    }
  }

  // Setup Stage Weather
  setWeather(type) {
    if (this.weatherPoints) {
      this.scene.remove(this.weatherPoints);
      this.weatherPoints.geometry.dispose();
      this.weatherPoints.material.dispose();
      this.weatherPoints = null;
    }
    this.weatherType = type;

    if (!type || type === 'none') return;

    const count = type === 'rain' ? 800 : 400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    let col = 0x00f0ff;
    let size = 0.12;
    if (type === 'sandstorm') {
      col = 0xb026ff;
      size = 0.2;
    } else if (type === 'bubbles') {
      col = 0x00ffcc;
      size = 0.25;
    } else if (type === 'void') {
      col = 0xff0055;
      size = 0.18;
    } else if (type === 'embers') {
      col = 0xff4400;
      size = 0.22;
    }

    const mat = new THREE.PointsMaterial({
      color: col,
      size,
      transparent: true,
      opacity: 0.65
    });

    this.weatherPoints = new THREE.Points(geo, mat);
    this.scene.add(this.weatherPoints);
  }

  update(dt) {
    // Safety cap on particles to prevent GPU memory spikes & garbage collector hitches
    if (this.particles.length > 160) {
      const removed = this.particles.splice(0, this.particles.length - 160);
      removed.forEach(p => {
        this.scene.remove(p.mesh);
        if (p.mesh.traverse) {
          p.mesh.traverse(c => {
            if (c.geometry && !p.isSharedGeo) c.geometry.dispose();
            if (c.material && !p.isSharedMat) c.material.dispose();
          });
        }
      });
    }

    // Update sparks & general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.traverse) {
          p.mesh.traverse((c) => {
            if (c.geometry && !p.isSharedGeo) c.geometry.dispose();
            if (c.material && !p.isSharedMat) {
              if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
              else c.material.dispose();
            }
          });
        }
        this.particles.splice(i, 1);
        continue;
      }

      p.vel.y += p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      if (p.rotVel) {
        p.mesh.rotation.x += p.rotVel.x * dt;
        p.mesh.rotation.y += p.rotVel.y * dt;
        p.mesh.rotation.z += p.rotVel.z * dt;
      }

      if (p.mesh.material) {
        p.mesh.material.opacity = Math.max(0, p.life);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.elapsed += dt;
      const progress = sw.elapsed / sw.duration;

      if (progress >= 1.0) {
        this.scene.remove(sw.mesh);
        if (sw.mesh.geometry) sw.mesh.geometry.dispose();
        if (sw.mat) sw.mat.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const radius = progress * sw.maxRadius;
      sw.mesh.scale.set(radius, radius, 1);
      sw.mat.opacity = (1 - progress) * 0.9;
    }

    // Update ultimate slash lines & crescent waves
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      const sl = this.slashTrails[i];
      sl.life -= sl.decay * dt;

      if (sl.life <= 0) {
        this.scene.remove(sl.mesh);
        if (sl.mesh.traverse) {
          sl.mesh.traverse((c) => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
              if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
              else c.material.dispose();
            }
          });
        }
        this.slashTrails.splice(i, 1);
        continue;
      }

      if (sl.grow) {
        sl.mesh.scale.x = Math.min(1.0, sl.mesh.scale.x + dt * 10);
      }
      if (sl.isWave) {
        sl.mesh.position.x += sl.velX * dt;
        sl.mesh.scale.multiplyScalar(1.0 + dt * 0.9);
      }
      if (sl.mat) sl.mat.opacity = sl.life;
    }

    // Update weather
    if (this.weatherPoints) {
      const pos = this.weatherPoints.geometry.attributes.position.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        if (this.weatherType === 'rain') {
          pos[i * 3 + 1] -= dt * 28;
          if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 25;
        } else if (this.weatherType === 'sandstorm') {
          pos[i * 3] += dt * 12;
          pos[i * 3 + 1] += (Math.random() - 0.5) * dt * 4;
          if (pos[i * 3] > 25) pos[i * 3] = -25;
        } else if (this.weatherType === 'bubbles') {
          pos[i * 3 + 1] += dt * 4;
          pos[i * 3] += Math.sin(pos[i * 3 + 1] * 2) * dt * 0.5;
          if (pos[i * 3 + 1] > 25) pos[i * 3 + 1] = 0;
        } else if (this.weatherType === 'void') {
          pos[i * 3 + 1] -= dt * 6;
          pos[i * 3] += Math.cos(pos[i * 3 + 1]) * dt * 2;
          if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 25;
        } else if (this.weatherType === 'embers') {
          pos[i * 3 + 1] += dt * 3.5;
          pos[i * 3] += Math.sin(pos[i * 3 + 1] * 1.5) * dt * 2.2;
          if (pos[i * 3 + 1] > 25) pos[i * 3 + 1] = 0;
        }
      }
      this.weatherPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
    this.shockwaves.forEach(sw => this.scene.remove(sw.mesh));
    this.shockwaves = [];
    this.slashTrails.forEach(sl => this.scene.remove(sl.mesh));
    this.slashTrails = [];
    if (this.weatherPoints) {
      this.scene.remove(this.weatherPoints);
      this.weatherPoints = null;
    }
  }
}
