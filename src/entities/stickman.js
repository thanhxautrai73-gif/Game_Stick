import * as THREE from 'three';

export class StickmanBuilder {
  /**
   * Build 3D Stickman Hero matching the clean, slender, iconic style of media_1792227663146.png:
   * - Slender athletic ninja silhouette (not chunky or bloomed out)
   * - Matte deep-black carbon fiber body with razor-sharp neon circuitry insets
   * - Clean spherical black head with a glowing horizontal visor slit
   * - Glowing circular arc reactor in center chest
   * - Glowing circuit joint bands at wrists, elbows, knees, ankles
   * - Tattered cyber cape trailing behind
   * - Plasma Katana with circular tsuba held firmly in hand
   * - ZERO bloated outer hulls or blurry bubble shields!
   */
  static build(options = {}) {
    const type = options.type || 'zero';
    const isSovereign = type === 'sovereign';
    const isShadow = type === 'shadow';

    const root = new THREE.Group();
    root.name = `Stickman_${type}`;

    // --- COLOR PALETTES ---
    let bodyColor, armorColor, glowColor, metalColor, bladeColor;

    if (isSovereign) {
      bodyColor = 0x141822;
      armorColor = 0x222a38;
      glowColor = 0xff2200;
      metalColor = 0x4d5668;
      bladeColor = 0xff2200;
    } else if (isShadow) {
      bodyColor = 0x0c0d14;
      armorColor = 0x22141e;
      glowColor = 0xff1755;
      metalColor = 0xffaa00;
      bladeColor = 0xff1755;
    } else {
      // Captain Zero - Iconic Cyan Ninja Stickman Hero
      bodyColor = 0x0a0e18;     // Matte deep black carbon fiber
      armorColor = 0x141e2e;    // Dark alloy armor plates
      glowColor = 0x00f0ff;     // Pure electric neon cyan
      metalColor = 0x00c8e6;
      bladeColor = 0x00f0ff;
    }

    // --- MATERIALS ---
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.38,
      metalness: 0.65
    });

    const armorMat = new THREE.MeshStandardMaterial({
      color: armorColor,
      roughness: 0.28,
      metalness: 0.82
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: metalColor,
      roughness: 0.20,
      metalness: 0.88
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor
    });

    const whiteCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    // Helper: Add clean, thin neon circuit ring band at joints
    const addJointGlowRing = (parent, y, radius, thickness = 0.025) => {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, thickness, 16),
        glowMat
      );
      ring.position.y = y;
      parent.add(ring);
      return ring;
    };

    // --- SKELETON HIERARCHY ---
    // Pelvis (Center root)
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.98;
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.18, 16), armorMat);
    pelvis.add(pelvisMesh);

    // Cyber Utility Belt with Glowing Clasp
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 16), bodyMat);
    pelvis.add(belt);

    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), glowMat);
    beltBuckle.position.set(0, 0, 0.20);
    pelvis.add(beltBuckle);

    // Spine & Torso
    const spine = new THREE.Group();
    spine.position.y = 0.10;
    pelvis.add(spine);

    // Slender Athletic Torso
    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.48, 16), bodyMat);
    chestMesh.position.y = 0.25;
    spine.add(chestMesh);

    // Glowing Chest Arc Reactor Core
    const coreRadius = isSovereign ? 0.22 : 0.08;
    const coreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(coreRadius, coreRadius, 0.03, 20),
      glowMat
    );
    coreMesh.rotation.x = Math.PI / 2;
    coreMesh.position.set(0, 0.28, 0.18);
    spine.add(coreMesh);

    const coreInner = new THREE.Mesh(
      new THREE.CylinderGeometry(coreRadius * 0.55, coreRadius * 0.55, 0.04, 16),
      whiteCoreMat
    );
    coreInner.rotation.x = Math.PI / 2;
    coreInner.position.set(0, 0.28, 0.19);
    spine.add(coreInner);

    // Vertical neon circuit line down chest
    const chestTrace = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.02), glowMat);
    chestTrace.position.set(0, 0.14, 0.17);
    spine.add(chestTrace);

    // Neck & Collar
    const neck = new THREE.Group();
    neck.position.y = 0.50;
    spine.add(neck);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), armorMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.04;
    neck.add(collar);

    // Head
    const headRadius = isSovereign ? 0.36 : 0.24;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 24, 24), bodyMat);
    headMesh.position.y = headRadius + 0.02;
    neck.add(headMesh);

    const headbandRibbons = [];

    if (isSovereign) {
      // Void Sovereign: Curved Demon Horns & Flaming Skull Face
      const hornGeo = new THREE.ConeGeometry(0.12, 0.80, 8);
      const leftHorn = new THREE.Mesh(hornGeo, metalMat);
      leftHorn.position.set(-0.30, headRadius + 0.40, 0.05);
      leftHorn.rotation.z = 0.60;
      neck.add(leftHorn);

      const rightHorn = leftHorn.clone();
      rightHorn.position.x = 0.30;
      rightHorn.rotation.z = -0.60;
      neck.add(rightHorn);

      // Fiery glowing demon eyes
      const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 0.05), glowMat);
      eyeL.position.set(-0.10, headRadius + 0.05, headRadius * 0.96);
      neck.add(eyeL);

      const eyeR = eyeL.clone();
      eyeR.position.x = 0.10;
      neck.add(eyeR);
    } else {
      // Iconic Stickman Ninja Visor (Clean horizontal glowing bar matching media_1792227663146.png)
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(headRadius * 1.4, 0.045, 0.03),
        glowMat
      );
      visor.position.set(0, headRadius + 0.03, headRadius * 0.96);
      neck.add(visor);

      const visorCore = new THREE.Mesh(
        new THREE.BoxGeometry(headRadius * 0.8, 0.02, 0.04),
        whiteCoreMat
      );
      visorCore.position.set(0, headRadius + 0.03, headRadius * 0.97);
      neck.add(visorCore);

      // Headband ring
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(headRadius * 1.01, headRadius * 1.01, 0.05, 24),
        armorMat
      );
      band.position.y = headRadius + 0.03;
      neck.add(band);

      // Two sleek trailing ribbons behind (Pinned at back of head, trailing HORIZONTALLY back & down)
      const ribbonGroup = new THREE.Group();
      ribbonGroup.position.set(0, headRadius + 0.03, -headRadius);
      neck.add(ribbonGroup);

      const r1 = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.45), glowMat);
      r1.position.set(-0.04, -0.15, -0.15);
      r1.rotation.x = -0.4;
      ribbonGroup.add(r1);

      const r2 = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.52), glowMat);
      r2.position.set(0.04, -0.18, -0.22);
      r2.rotation.x = -0.55;
      ribbonGroup.add(r2);

      headbandRibbons.push(r1, r2);
    }

    // --- SHOULDERS & ARMS ---
    // Left Arm
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.32, 0.48, 0);
    spine.add(leftShoulder);

    // Sleek compact shoulder pauldron
    const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.16), armorMat);
    leftPauldron.position.set(-0.04, 0.04, 0);
    leftShoulder.add(leftPauldron);
    addJointGlowRing(leftShoulder, 0.04, 0.08);

    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.32, 12), bodyMat);
    leftBicep.position.y = -0.16;
    leftShoulder.add(leftBicep);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.32;
    leftShoulder.add(leftElbow);
    addJointGlowRing(leftElbow, 0, 0.065);

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.32, 12), armorMat);
    leftForearm.position.y = -0.16;
    leftElbow.add(leftForearm);
    addJointGlowRing(leftElbow, -0.30, 0.07);

    // Right Arm (Weapon Arm)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.32, 0.48, 0);
    spine.add(rightShoulder);

    const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.16), armorMat);
    rightPauldron.position.set(0.04, 0.04, 0);
    rightShoulder.add(rightPauldron);
    addJointGlowRing(rightShoulder, 0.04, 0.08);

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.32, 12), bodyMat);
    rightBicep.position.y = -0.16;
    rightShoulder.add(rightBicep);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.32;
    rightShoulder.add(rightElbow);
    addJointGlowRing(rightElbow, 0, 0.065);

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.32, 12), armorMat);
    rightForearm.position.y = -0.16;
    rightElbow.add(rightForearm);
    addJointGlowRing(rightElbow, -0.30, 0.07);

    const weaponHand = new THREE.Group();
    weaponHand.position.y = -0.34;
    rightElbow.add(weaponHand);

    // --- LEGS ---
    // Left Leg
    const leftHip = new THREE.Group();
    leftHip.position.set(-0.16, -0.08, 0);
    pelvis.add(leftHip);

    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.44, 12), bodyMat);
    leftThigh.position.y = -0.22;
    leftHip.add(leftThigh);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.44;
    leftHip.add(leftKnee);
    addJointGlowRing(leftKnee, 0, 0.075);

    const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.44, 12), armorMat);
    leftShin.position.y = -0.22;
    leftKnee.add(leftShin);
    addJointGlowRing(leftKnee, -0.42, 0.075);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.20), armorMat);
    leftFoot.position.set(0, -0.44, 0.05);
    leftKnee.add(leftFoot);

    // Right Leg
    const rightHip = new THREE.Group();
    rightHip.position.set(0.16, -0.08, 0);
    pelvis.add(rightHip);

    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.44, 12), bodyMat);
    rightThigh.position.y = -0.22;
    rightHip.add(rightThigh);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.44;
    rightHip.add(rightKnee);
    addJointGlowRing(rightKnee, 0, 0.075);

    const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.44, 12), armorMat);
    rightShin.position.y = -0.22;
    rightKnee.add(rightShin);
    addJointGlowRing(rightKnee, -0.42, 0.075);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.20), armorMat);
    rightFoot.position.set(0, -0.44, 0.05);
    rightKnee.add(rightFoot);

    // --- CYBER CAPE ---
    const capeSegments = [];
    if (!isSovereign) {
      const capeGroup = new THREE.Group();
      capeGroup.position.set(0, 0.48, -0.14);
      spine.add(capeGroup);

      const capeMat = new THREE.MeshStandardMaterial({
        color: 0x090e18,
        roughness: 0.55,
        metalness: 0.2,
        side: THREE.DoubleSide
      });

      for (let s = 0; s < 3; s++) {
        const seg = new THREE.Mesh(
          new THREE.PlaneGeometry(0.42 - s * 0.04, 0.32),
          capeMat
        );
        seg.position.set(0, -0.16 - s * 0.28, -s * 0.05);
        seg.rotation.x = 0.22 + s * 0.1;
        capeGroup.add(seg);
        capeSegments.push(seg);
      }
    }

    // --- WEAPON (LIGHTNING PLASMA KATANA) ---
    const weaponGroup = new THREE.Group();
    weaponHand.add(weaponGroup);

    if (!isSovereign) {
      // Hilt
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.32, 8), armorMat);
      hilt.position.y = 0.16;
      weaponGroup.add(hilt);

      // Pommel
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), glowMat);
      pommel.position.y = 0.01;
      weaponGroup.add(pommel);

      // Circular Ring Tsuba (Crossguard)
      const tsuba = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 16), glowMat);
      tsuba.rotation.x = Math.PI / 2;
      tsuba.position.y = 0.32;
      weaponGroup.add(tsuba);

      // Slender Laser Katana Blade
      const bladeGeo = new THREE.BoxGeometry(0.028, 1.35, 0.06);
      const blade = new THREE.Mesh(bladeGeo, glowMat);
      blade.position.y = 1.0;
      weaponGroup.add(blade);

      const bladeCore = new THREE.Mesh(new THREE.BoxGeometry(0.014, 1.32, 0.03), whiteCoreMat);
      bladeCore.position.y = 1.0;
      weaponGroup.add(bladeCore);
    }

    // Slash Trail Mesh
    const trailGeo = new THREE.RingGeometry(0.6, 1.6, 24, 1, 0, Math.PI * 0.85);
    const trailMat = new THREE.MeshBasicMaterial({
      color: bladeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const slashTrailMesh = new THREE.Mesh(trailGeo, trailMat);
    slashTrailMesh.rotation.x = Math.PI / 2;
    slashTrailMesh.position.set(0, 0.9, 0);
    weaponGroup.add(slashTrailMesh);

    // Total scale
    const totalScale = options.scale || (isSovereign ? 2.8 : 1.0);
    root.scale.set(totalScale, totalScale, totalScale);

    return {
      root,
      joints: {
        pelvis,
        spine,
        neck,
        head: headMesh,
        leftShoulder,
        leftElbow,
        rightShoulder,
        rightElbow,
        weaponHand,
        leftHip,
        leftKnee,
        rightHip,
        rightKnee,
        capeSegments,
        headbandRibbons,
        weaponGroup,
        slashTrailMesh,
        auraMesh: null // Aura mesh eliminated to prevent blob silhouette
      },
      materials: {
        bodyMat,
        armorMat,
        glowMat,
        metalMat
      }
    };
  }
}
