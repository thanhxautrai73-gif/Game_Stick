import * as THREE from 'three';

export class GameCamera {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3(0, 1.8, 0);
    this.lookTarget = new THREE.Vector3(0, 1.8, 0);
    this.offset = new THREE.Vector3(0, 2.2, 11);
    this.currentLookAt = new THREE.Vector3(0, 1.8, 0);

    // Modes: 'follow', 'pvp', 'cinematic', 'menu'
    this.mode = 'follow';

    // Cinematic targets
    this.cinematicTargetPos = new THREE.Vector3();
    this.cinematicLookAt = new THREE.Vector3();
    this.cinematicLerpSpeed = 3.0;

    // PvP players
    this.p1 = null;
    this.p2 = null;

    // Menu orbit
    this.menuAngle = 0;
  }

  setFollowTarget(targetPos) {
    if (targetPos) this.target.copy(targetPos);
  }

  setPvPPlayers(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.mode = 'pvp';
  }

  setMode(mode) {
    this.mode = mode;
  }

  setMenuMode() {
    this.mode = 'menu';
    this.p1 = null;
    this.p2 = null;
    this.menuAngle = 0;
  }

  setCinematic(camPos, lookPos, speed = 4.0) {
    this.mode = 'cinematic';
    this.cinematicTargetPos.copy(camPos);
    this.cinematicLookAt.copy(lookPos);
    this.cinematicLerpSpeed = speed;
  }

  update(dt, baseCamPosOut) {
    // 1. Cinematic Mode
    if (this.mode === 'cinematic') {
      this.camera.position.lerp(this.cinematicTargetPos, dt * this.cinematicLerpSpeed);
      this.currentLookAt.lerp(this.cinematicLookAt, dt * this.cinematicLerpSpeed);
      this.camera.lookAt(this.currentLookAt);
      if (baseCamPosOut) baseCamPosOut.copy(this.camera.position);
      return;
    }

    // 2. Menu Showroom Wide Front-Facing Parallax (Keeps both champions framing the menu)
    if (this.mode === 'menu') {
      this.menuAngle += dt * 0.3;
      const camX = Math.sin(this.menuAngle) * 0.35;
      const camY = 2.0 + Math.cos(this.menuAngle * 0.8) * 0.15;
      const camZ = 10.8;

      this.camera.position.set(camX, camY, camZ);
      this.currentLookAt.set(0, 1.4, 0);
      this.camera.lookAt(this.currentLookAt);
      if (baseCamPosOut) baseCamPosOut.copy(this.camera.position);
      return;
    }

    // 3. PvP Mode
    if (this.mode === 'pvp' && this.p1 && this.p2 && !this.p1.isDead && !this.p2.isDead) {
      // Calculate midpoint between players
      const midX = (this.p1.position.x + this.p2.position.x) * 0.5;
      const midY = (this.p1.position.y + this.p2.position.y) * 0.5 + 1.6;
      const dist = Math.abs(this.p1.position.x - this.p2.position.x);

      // Dynamically zoom camera based on player distance
      const targetZ = Math.max(10, Math.min(18, 9 + dist * 0.65));
      const targetY = Math.max(2.5, midY + 0.8);

      const desiredPos = new THREE.Vector3(midX, targetY, targetZ);
      this.camera.position.lerp(desiredPos, dt * 6.0);

      this.lookTarget.set(midX, midY, 0);
      this.currentLookAt.lerp(this.lookTarget, dt * 6.0);
      this.camera.lookAt(this.currentLookAt);

      if (baseCamPosOut) baseCamPosOut.copy(this.camera.position);
      return;
    }

    // 4. Default Follow Mode
    const desiredCamPos = new THREE.Vector3(
      this.target.x,
      Math.max(1.8, this.target.y + this.offset.y),
      this.offset.z
    );

    this.camera.position.lerp(desiredCamPos, dt * 5.0);
    this.lookTarget.set(this.target.x, this.target.y + 1.5, 0);
    this.currentLookAt.lerp(this.lookTarget, dt * 7.0);
    this.camera.lookAt(this.currentLookAt);

    if (baseCamPosOut) baseCamPosOut.copy(this.camera.position);
  }
}
