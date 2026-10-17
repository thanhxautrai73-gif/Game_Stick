import * as THREE from 'three';

export class StageManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.currentStageGroup = new THREE.Group();
    this.scene.add(this.currentStageGroup);
    this.currentChapter = 1;
    this.bounds = { minX: -20, maxX: 65 };
    this.animatedObjects = [];

    // Preload the user's high-res cyberpunk street images
    this.textureLoader = new THREE.TextureLoader();
    this.texStreet1 = this.loadTexture('/stages/cyber_street_1.jpg');
    this.texStreet2 = this.loadTexture('/stages/cyber_street_2.jpg');
    this.texStreet3 = this.loadTexture('/stages/cyber_street_3.jpg');
    this.texStreet4 = this.loadTexture('/stages/cyber_street_4.jpg');
  }

  loadTexture(path) {
    const tex = this.textureLoader.load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Helper: Create high-tech glowing holographic canvas texture
  createHoloTexture(text, color = '#00f5ff', subText = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Translucent dark glass card background
    ctx.fillStyle = 'rgba(10, 16, 26, 0.90)';
    ctx.fillRect(0, 0, 512, 160);

    // Glowing border frame
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 148);

    // Corner tech notches
    ctx.fillStyle = color;
    ctx.fillRect(6, 6, 28, 8);
    ctx.fillRect(6, 6, 8, 28);
    ctx.fillRect(512 - 34, 6, 28, 8);
    ctx.fillRect(512 - 14, 6, 8, 28);
    ctx.fillRect(6, 160 - 14, 28, 8);
    ctx.fillRect(6, 160 - 34, 8, 28);
    ctx.fillRect(512 - 34, 160 - 14, 28, 8);
    ctx.fillRect(512 - 14, 160 - 34, 8, 28);

    // Main glowing title text
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.font = '900 40px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, subText ? 62 : 80);

    // Subtitle caption
    if (subText) {
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(subText, 256, 114);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  loadStage(chapter = 1) {
    this.currentChapter = chapter;
    this.clear();

    switch (chapter) {
      case 0: // Menu Showroom
        this.buildMenuShowroom();
        this.particles.setWeather('none');
        break;
      case 1:
        this.buildNeoNeonCity();
        this.particles.setWeather('embers');
        break;
      case 2:
        this.buildDigitalWasteland();
        this.particles.setWeather('sandstorm');
        break;
      case 3:
        this.buildSunkenGrid();
        this.particles.setWeather('bubbles');
        break;
      case 4:
        this.buildVoidCitadel();
        this.particles.setWeather('embers');
        break;
      case 99: // PvP Arena
        this.buildPvPArena();
        this.particles.setWeather('none');
        break;
    }
  }

  clear() {
    this.animatedObjects = [];
    while (this.currentStageGroup.children.length > 0) {
      const obj = this.currentStageGroup.children[0];
      this.currentStageGroup.remove(obj);
      obj.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
    }
  }

  // --- MENU SHOWROOM: Dual 3D Glowing Cyber Pedestals with Cyberpunk City Backdrop ---
  buildMenuShowroom() {
    this.bounds = { minX: -15, maxX: 15 };

    // 1. Panoramic Cyberpunk Sunset Street Backdrop (matches user's image 3)
    const bgGeo = new THREE.PlaneGeometry(36, 18);
    const bgMat = new THREE.MeshBasicMaterial({
      map: this.texStreet3,
      side: THREE.DoubleSide
    });
    const bgPlane = new THREE.Mesh(bgGeo, bgMat);
    bgPlane.position.set(0, 7.5, -5.5);
    this.currentStageGroup.add(bgPlane);

    // Warm ambient lighting from street background
    const bgWarmLight = new THREE.PointLight(0xff7700, 2.5, 18);
    bgWarmLight.position.set(0, 6.0, -3.0);
    this.currentStageGroup.add(bgWarmLight);

    const podiumGeo = new THREE.CylinderGeometry(2.0, 2.3, 0.35, 32);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x1a2842,
      roughness: 0.15,
      metalness: 0.85
    });

    // 2. LEFT PODIUM (Captain Zero - Cyan Energy)
    const leftPodium = new THREE.Mesh(podiumGeo, podiumMat);
    leftPodium.position.set(-5.2, -0.2, 0.8);
    this.currentStageGroup.add(leftPodium);

    const leftRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 1.82, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide })
    );
    leftRing.rotation.x = -Math.PI / 2;
    leftRing.position.set(-5.2, 0.015, 0.8);
    this.currentStageGroup.add(leftRing);

    const leftLight = new THREE.PointLight(0x00f5ff, 1.2, 10);
    leftLight.position.set(-5.2, 2.2, 1.8);
    this.currentStageGroup.add(leftLight);

    // 3. RIGHT PODIUM (Iron Shadow - Crimson & Gold Energy)
    const rightPodium = new THREE.Mesh(podiumGeo, podiumMat);
    rightPodium.position.set(5.2, -0.2, 0.8);
    this.currentStageGroup.add(rightPodium);

    const rightRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 1.82, 32),
      new THREE.MeshBasicMaterial({ color: 0xff1755, side: THREE.DoubleSide })
    );
    rightRing.rotation.x = -Math.PI / 2;
    rightRing.position.set(5.2, 0.015, 0.8);
    this.currentStageGroup.add(rightRing);

    const rightLight = new THREE.PointLight(0xff1755, 1.2, 10);
    rightLight.position.set(5.2, 2.2, 1.8);
    this.currentStageGroup.add(rightLight);

    this.animatedObjects.push({
      mesh: leftRing,
      type: 'rotateZ',
      speed: 0.5
    });
    this.animatedObjects.push({
      mesh: rightRing,
      type: 'rotateZ',
      speed: -0.5
    });

    // 4. Wet Reflective Digital Asphalt Floor
    const floorGeo = new THREE.PlaneGeometry(60, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x121724,
      roughness: 0.12,
      metalness: 0.88
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.22, 0);
    this.currentStageGroup.add(floor);

    // Soft subtle center reflection (no blinding floor puddles under podiums)
    this.createPuddleReflection(0, -1.0, 5.0, 1.2, 0x00f5ff, 0.18);
  }

  // --- STAGE 1: NEO-NEON CITY (AUTHENTIC CYBERPUNK STREET FROM USER'S 4 IMAGES) ---
  buildNeoNeonCity() {
    this.bounds = { minX: -15, maxX: 65 };

    // 1. Continuous Panoramic Cyberpunk Street Backdrop (Images 1, 2, 3, 4)
    // Spans the full chapter length so as the hero runs forward, the street scenery evolves continuously!
    const bgSections = [
      { x: -6, tex: this.texStreet1 },
      { x: 18, tex: this.texStreet2 },
      { x: 42, tex: this.texStreet3 },
      { x: 66, tex: this.texStreet4 }
    ];

    bgSections.forEach((sec) => {
      const pGeo = new THREE.PlaneGeometry(24.5, 15.5);
      const pMat = new THREE.MeshBasicMaterial({
        map: sec.tex,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(pGeo, pMat);
      // Positioned just behind the combat layer (z = -6.2) so 3D props & characters layer on top seamlessly!
      plane.position.set(sec.x, 7.4, -6.2);
      this.currentStageGroup.add(plane);
    });

    // 2. Wet Reflective Asphalt Street (Mặt đường ướt bóng phản chiếu ánh đèn neon)
    const roadGeo = new THREE.PlaneGeometry(105, 18);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x101520,
      roughness: 0.12, // High specular gloss for rain-slicked wet tarmac
      metalness: 0.85
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(25, 0, 0);
    road.receiveShadow = true;
    this.currentStageGroup.add(road);

    // Sidewalk Curbs with warm stone texture
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x242a38, roughness: 0.3, metalness: 0.6 });
    const curbFront = new THREE.Mesh(new THREE.BoxGeometry(105, 0.35, 0.6), curbMat);
    curbFront.position.set(25, 0.15, 8.5);
    this.currentStageGroup.add(curbFront);

    const curbBack = curbFront.clone();
    curbBack.position.z = -8.5;
    this.currentStageGroup.add(curbBack);

    // 3. Wet Asphalt Puddle Neon Reflection Streaks (subtle specular gloss, no blinding glare)
    const reflectionConfigs = [
      { x: -10, z: 1.5, w: 5.5, l: 0.9, c: 0x00f5ff, op: 0.25 },
      { x: -5, z: -1.2, w: 4.8, l: 0.8, c: 0xff7700, op: 0.22 },
      { x: 3, z: 2.0, w: 6.2, l: 1.0, c: 0x00f5ff, op: 0.28 },
      { x: 10, z: -0.5, w: 5.0, l: 0.9, c: 0xff0077, op: 0.22 },
      { x: 17, z: 1.8, w: 7.0, l: 1.1, c: 0xffaa00, op: 0.25 },
      { x: 25, z: -1.5, w: 6.0, l: 0.9, c: 0x00f5ff, op: 0.22 },
      { x: 34, z: 0.8, w: 5.5, l: 1.0, c: 0xff5500, op: 0.25 },
      { x: 42, z: -1.0, w: 6.5, l: 1.0, c: 0xdf00ff, op: 0.22 },
      { x: 52, z: 1.5, w: 7.2, l: 1.2, c: 0x00f5ff, op: 0.28 },
      { x: 60, z: -0.8, w: 5.8, l: 0.9, c: 0xffaa00, op: 0.24 }
    ];

    reflectionConfigs.forEach((rc) => {
      this.createPuddleReflection(rc.x, rc.z, rc.w, rc.l, rc.c, rc.op);
    });

    // 4. Overhead Industrial Pedestrian Walkways / Bridges (matching Image 2 & 4)
    this.createOverheadBridge(16, 5.8, -1.5, 14);
    this.createOverheadBridge(48, 6.0, -1.5, 14);

    // 5. 3D Shopfronts with Warm Glowing Windows & Awnings (matching storefronts in all 4 images)
    const shopConfigs = [
      { x: -11, z: -5.0, w: 5.5, col: 0xff7700, name: 'NOODLE BAR' },
      { x: 0, z: -5.2, w: 6.0, col: 0xffaa22, name: 'CYBER MART' },
      { x: 12, z: -5.0, w: 5.0, col: 0xff4400, name: 'ELECTRONICS' },
      { x: 26, z: -5.2, w: 6.5, col: 0xff8800, name: 'NEO DINER' },
      { x: 38, z: -5.0, w: 5.5, col: 0xffaa00, name: 'ROBOTICS' },
      { x: 54, z: -5.2, w: 6.0, col: 0xff6600, name: 'MOTEL 2088' }
    ];

    shopConfigs.forEach((sc) => {
      this.createShopFront(sc.x, 2.4, sc.z, sc.w, 4.5, sc.col, sc.name);
    });

    // 6. Hanging Vertical & Horizontal Neon Signs (matching cyber street signs)
    const signConfigs = [
      { x: -8, y: 5.5, z: -4.2, text: 'ラーメン', color: '#ff2255' },
      { x: 4, y: 5.2, z: -4.0, text: 'HOTEL', color: '#00f5ff' },
      { x: 18, y: 6.2, z: -3.8, text: 'BAR 24H', color: '#ffaa00' },
      { x: 30, y: 5.8, z: -4.2, text: 'サイバー', color: '#bf00ff' },
      { x: 44, y: 5.4, z: -4.0, text: 'OPEN', color: '#00ffcc' },
      { x: 58, y: 6.0, z: -4.2, text: 'RESTORE', color: '#ff0055' }
    ];

    signConfigs.forEach((sc) => {
      this.createHangingNeonSign(sc.x, sc.y, sc.z, sc.text, sc.color);
    });

    // 7. Overhead Drooping Electrical Cables (matching cables in images 1, 2, 3, 4)
    this.createOverheadCables(-12, 10, 7.8, -4.5);
    this.createOverheadCables(10, 32, 8.2, -4.5);
    this.createOverheadCables(32, 58, 8.0, -4.5);

    // 8. Parked Retro Cyber Vehicles & Motorbikes (matching cars in images 2, 3, 4)
    this.createParkedCar(7, 0.75, 4.5, 0x1f2b3e);
    this.createParkedCar(35, 0.75, 4.5, 0x3d1a24);
    this.createParkedMotorbike(-3, 0.6, 5.0);
    this.createParkedMotorbike(22, 0.6, 4.8);

    // 9. Street Props: Vending Machines, Trash Bins, Utility Boxes
    const propPositions = [-6, 14, 28, 45, 59];
    propPositions.forEach((px, i) => {
      // Vending Machine with glowing panel
      const vmGeo = new THREE.BoxGeometry(1.0, 2.0, 0.9);
      const vmMat = new THREE.MeshStandardMaterial({ color: 0x1c2434, metalness: 0.8 });
      const vm = new THREE.Mesh(vmGeo, vmMat);
      vm.position.set(px, 1.0, -4.6);
      this.currentStageGroup.add(vm);

      const vmScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x181820,
          emissive: i % 2 === 0 ? 0x00f5ff : 0xffaa00,
          emissiveIntensity: 0.4
        })
      );
      vmScreen.position.set(px, 1.2, -4.14);
      this.currentStageGroup.add(vmScreen);

      // PointLight for vending machine glow
      const vmLight = new THREE.PointLight(i % 2 === 0 ? 0x00f5ff : 0xffaa00, 0.65, 5);
      vmLight.position.set(px, 1.2, -3.8);
      this.currentStageGroup.add(vmLight);
    });
  }

  // --- STAGE 2: DIGITAL WASTELAND ---
  buildDigitalWasteland() {
    this.bounds = { minX: -15, maxX: 65 };

    // Backdrop using vibrant purple sunset street texture
    const bgGeo = new THREE.PlaneGeometry(95, 20);
    const bgMat = new THREE.MeshBasicMaterial({ map: this.texStreet3, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(25, 9.0, -8.0);
    this.currentStageGroup.add(bg);

    // Reflective violet ground
    const groundGeo = new THREE.BoxGeometry(95, 2, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x201535,
      roughness: 0.25,
      metalness: 0.8
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(25, -1, 0);
    this.currentStageGroup.add(ground);

    // Glowing Purple Energy Lines along ground
    for (let x = -10; x <= 65; x += 5) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 18),
        new THREE.MeshBasicMaterial({ color: 0xdf00ff })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 0);
      this.currentStageGroup.add(line);
    }

    // Amethyst Data Crystals
    const crystalGeo = new THREE.ConeGeometry(0.4, 2.4, 5);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xdf00ff });
    for (let i = 0; i < 14; i++) {
      const cx = -10 + i * 5.5;
      const cz = (Math.random() - 0.5) * 8;
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(cx, 1.2, cz);
      this.currentStageGroup.add(crystal);

      if (i % 3 === 0) {
        const cLight = new THREE.PointLight(0xdf00ff, 2.8, 10);
        cLight.position.set(cx, 2.2, cz);
        this.currentStageGroup.add(cLight);
      }
    }
  }

  // --- STAGE 3: THE SUNKEN GRID ---
  buildSunkenGrid() {
    this.bounds = { minX: -15, maxX: 65 };

    // Backdrop using rain-slicked blue cyber street texture
    const bgGeo = new THREE.PlaneGeometry(95, 20);
    const bgMat = new THREE.MeshBasicMaterial({ map: this.texStreet1, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(25, 9.0, -8.0);
    this.currentStageGroup.add(bg);

    // Deep digital trench floor
    const floorGeo = new THREE.PlaneGeometry(95, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c334d,
      roughness: 0.15,
      metalness: 0.9
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(25, 0, 0);
    this.currentStageGroup.add(floor);

    // Glowing Emerald & Aqua Matrix Grid Lines
    for (let x = -10; x <= 65; x += 5) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 18),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 0);
      this.currentStageGroup.add(line);
    }
  }

  // --- STAGE 4: VOID CITADEL ---
  buildVoidCitadel() {
    this.bounds = { minX: -20, maxX: 45 };

    // Backdrop using deep moody cyber metropolis
    const bgGeo = new THREE.PlaneGeometry(80, 20);
    const bgMat = new THREE.MeshBasicMaterial({ map: this.texStreet4, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(12, 9.0, -8.5);
    this.currentStageGroup.add(bg);

    // Floating Platform Arena
    const arenaGeo = new THREE.CylinderGeometry(26, 28, 2.5, 32);
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x24183d,
      roughness: 0.22,
      metalness: 0.85
    });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(12, -1.25, 0);
    this.currentStageGroup.add(arena);

    // Blazing Molten Braziers
    const brazierPositions = [-10, 0, 12, 24, 34];
    brazierPositions.forEach((bx) => {
      const bLight = new THREE.PointLight(0xff4400, 3.8, 16);
      bLight.position.set(bx, 2.5, -4.5);
      this.currentStageGroup.add(bLight);
    });
  }

  // --- STAGE 99: PVP DUAL TOURNAMENT ARENA (CYBER STREET COLOSSEUM) ---
  buildPvPArena() {
    this.bounds = { minX: -14, maxX: 14 };

    // 1. Panoramic Cyber Street Backdrop (Images 2 & 3 blend)
    const bgGeo = new THREE.PlaneGeometry(38, 18);
    const bgMat = new THREE.MeshBasicMaterial({ map: this.texStreet2, side: THREE.DoubleSide });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(0, 7.5, -6.5);
    this.currentStageGroup.add(bg);

    // 2. Wet Reflective Tournament Cyber Platform
    const arenaGeo = new THREE.BoxGeometry(34, 2.2, 14);
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x141d2e,
      roughness: 0.12,
      metalness: 0.9
    });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(0, -1.1, 0);
    this.currentStageGroup.add(arena);

    // Left Team Strip (Player 1 - Cyan)
    const stripL = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 0.15, 13.8),
      new THREE.MeshStandardMaterial({ color: 0x12243a, roughness: 0.15, metalness: 0.85 })
    );
    stripL.position.set(-8.25, 0.06, 0);
    this.currentStageGroup.add(stripL);

    const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 13.8), new THREE.MeshBasicMaterial({ color: 0x00f5ff }));
    edgeL.position.set(-16.8, 0.1, 0);
    this.currentStageGroup.add(edgeL);

    // Right Team Strip (Player 2 - Crimson)
    const stripR = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 0.15, 13.8),
      new THREE.MeshStandardMaterial({ color: 0x361624, roughness: 0.15, metalness: 0.85 })
    );
    stripR.position.set(8.25, 0.06, 0);
    this.currentStageGroup.add(stripR);

    const edgeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 13.8), new THREE.MeshBasicMaterial({ color: 0xff1755 }));
    edgeR.position.set(16.8, 0.1, 0);
    this.currentStageGroup.add(edgeR);

    // Center divider circle
    const centerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.1, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    centerRing.rotation.x = -Math.PI / 2;
    centerRing.position.set(0, 0.12, 0);
    this.currentStageGroup.add(centerRing);

    // Puddle Reflection Decals on Arena
    this.createPuddleReflection(-8, 1.2, 5.0, 1.2, 0x00f5ff, 0.7);
    this.createPuddleReflection(8, 1.2, 5.0, 1.2, 0xff1755, 0.7);
    this.createPuddleReflection(0, -1.5, 6.0, 1.4, 0xffaa00, 0.6);

    // 4 Stadium Floodlight Towers blasting crisp illumination
    const floodlightPos = [
      { x: -14.5, z: -5.5 },
      { x: 14.5, z: -5.5 },
      { x: -14.5, z: 5.5 },
      { x: 14.5, z: 5.5 }
    ];
    floodlightPos.forEach((fl) => {
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 9, 8),
        new THREE.MeshStandardMaterial({ color: 0x2e3d54, metalness: 0.85 })
      );
      tower.position.set(fl.x, 4.5, fl.z);
      this.currentStageGroup.add(tower);

      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 0.6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      housing.position.set(fl.x, 9.0, fl.z);
      this.currentStageGroup.add(housing);

      const pLight = new THREE.PointLight(0xffffff, 1.35, 20);
      pLight.position.set(fl.x, 8.5, fl.z);
      this.currentStageGroup.add(pLight);
    });

    // Floating Holographic Championship Banner
    const tex = this.createHoloTexture('STICKMAN DUAL PVP ARENA', '#00f5ff', 'P1: ZERO (CYAN)   VS   P2: SHADOW (CRIMSON)');
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(12.0, 3.5),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    );
    board.position.set(0, 9.5, -6.0);
    this.currentStageGroup.add(board);
  }

  // --- REUSABLE PROCEDURAL CYBERPUNK 3D PROPS (Matching User Reference Art) ---

  createPuddleReflection(x, z, width, length, color, opacity = 0.7) {
    const geo = new THREE.PlaneGeometry(width, length);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.02, z);
    this.currentStageGroup.add(mesh);

    this.animatedObjects.push({
      mesh,
      type: 'puddleGlow',
      speed: 1.8 + Math.random() * 0.8,
      baseOpacity: opacity
    });
    return mesh;
  }

  createShopFront(x, y, z, width, height, glowColor = 0xff7700, title = 'STORE') {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Wall structure
    const wallGeo = new THREE.BoxGeometry(width, height, 0.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f2330, roughness: 0.4 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    group.add(wall);

    // Warm glowing storefront window (shaded with subtle emissive to eliminate blinding glare)
    const winGeo = new THREE.PlaneGeometry(width * 0.8, height * 0.55);
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x22170f,
      emissive: glowColor,
      emissiveIntensity: 0.35,
      roughness: 0.45
    });
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(0, -0.2, 0.26);
    group.add(win);

    // Window wooden/metal lattice grid
    const gridMat = new THREE.MeshStandardMaterial({ color: 0x11141c });
    for (let i = -1; i <= 1; i++) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, height * 0.55, 0.05), gridMat);
      vBar.position.set(i * (width * 0.25), -0.2, 0.28);
      group.add(vBar);
    }

    // Shop Awning
    const awningGeo = new THREE.BoxGeometry(width * 0.9, 0.15, 1.2);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0x2d1822 });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(0, height * 0.25, 0.6);
    awning.rotation.x = 0.2;
    group.add(awning);

    // Overhead shop lantern
    const lanternGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0x201510,
      emissive: glowColor,
      emissiveIntensity: 0.45,
      roughness: 0.4
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(0, height * 0.35, 1.0);
    group.add(lantern);

    // Pointlight for warm window ambiance (softened to prevent glare)
    const light = new THREE.PointLight(glowColor, 0.65, 8);
    light.position.set(0, 0, 1.5);
    group.add(light);

    this.currentStageGroup.add(group);
    return group;
  }

  createOverheadBridge(x, y, z, span = 14) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Main steel girder
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x222a3a, metalness: 0.85, roughness: 0.3 });
    const girder = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, span), bridgeMat);
    group.add(girder);

    // Underside glowing neon runway strip
    const neonGeo = new THREE.PlaneGeometry(0.3, span * 0.95);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide });
    const neon = new THREE.Mesh(neonGeo, neonMat);
    neon.rotation.x = Math.PI / 2;
    neon.position.set(0, -0.71, 0);
    group.add(neon);

    // Hanging cyber lanterns from bridge
    for (let s = -1; s <= 1; s += 2) {
      const lantern = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.5, 0.35),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      lantern.position.set(0, -1.0, s * (span * 0.3));
      group.add(lantern);

      const lLight = new THREE.PointLight(0xffaa00, 0.65, 6);
      lLight.position.set(0, -1.2, s * (span * 0.3));
      group.add(lLight);
    }

    this.currentStageGroup.add(group);
    return group;
  }

  createHangingNeonSign(x, y, z, text, colorHex = '#00f5ff') {
    const tex = this.createHoloTexture(text, colorHex);
    const signGeo = new THREE.PlaneGeometry(1.6, 2.8);
    const signMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, y, z);
    this.currentStageGroup.add(sign);

    const sLight = new THREE.PointLight(new THREE.Color(colorHex), 0.65, 5);
    sLight.position.set(x, y, z + 0.4);
    this.currentStageGroup.add(sLight);
  }

  createOverheadCables(x1, x2, y, z) {
    const length = Math.abs(x2 - x1);
    const midX = (x1 + x2) / 2;
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x111622 });

    // Sagging curve approximation with 3 segments
    const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, length * 0.52, 6), cableMat);
    seg1.rotation.z = Math.PI / 2 - 0.1;
    seg1.position.set(x1 + length * 0.25, y - 0.2, z);
    this.currentStageGroup.add(seg1);

    const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, length * 0.52, 6), cableMat);
    seg2.rotation.z = Math.PI / 2 + 0.1;
    seg2.position.set(x1 + length * 0.75, y - 0.2, z);
    this.currentStageGroup.add(seg2);
  }

  createParkedCar(x, y, z, bodyColor = 0x1f2b3e) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Car chassis
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.85, roughness: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.8), bodyMat);
    group.add(body);

    // Cabin roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 1.6), bodyMat);
    roof.position.set(-0.2, 0.75, 0);
    group.add(roof);

    // Glowing Red Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1133 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.45), tailMat);
    tailL.position.set(-1.81, 0.1, 0.55);
    group.add(tailL);

    const tailR = tailL.clone();
    tailR.position.z = -0.55;
    group.add(tailR);

    // Red taillight ground reflection
    const redLight = new THREE.PointLight(0xff1133, 0.75, 5);
    redLight.position.set(-2.2, 0.2, 0);
    group.add(redLight);

    this.currentStageGroup.add(group);
    return group;
  }

  createParkedMotorbike(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x151b26, metalness: 0.9, roughness: 0.2 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.5), bikeMat);
    group.add(frame);

    const glowHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f5ff }));
    glowHead.position.set(0.8, 0.25, 0);
    group.add(glowHead);

    this.currentStageGroup.add(group);
    return group;
  }

  update(dt, totalTime) {
    for (const obj of this.animatedObjects) {
      if (obj.type === 'rotateZ') {
        obj.mesh.rotation.z += dt * obj.speed;
      } else if (obj.type === 'puddleGlow') {
        const pulse = Math.sin(totalTime * obj.speed) * 0.15;
        obj.mesh.material.opacity = THREE.MathUtils.clamp(obj.baseOpacity + pulse, 0.2, 0.95);
      }
    }
  }
}
