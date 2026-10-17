// Unified Keyboard & Mouse Input Manager supporting Player 1, Player 2 and On-Screen Clickable Action Buttons

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouseButtons = new Set();
    this.mouseJustPressed = new Set();
    this.virtualTriggers = new Set();
    this.virtualHeld = new Set();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('contextmenu', this.onContextMenu);
  }

  onKeyDown(e) {
    if (!this.keys.has(e.code)) {
      this.justPressed.add(e.code);
    }
    this.keys.add(e.code);
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
  }

  onMouseDown(e) {
    // Only capture canvas clicks, let UI buttons receive normal DOM click
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('.skill-btn') || e.target.closest('.cyber-btn'))) {
      return;
    }
    if (!this.mouseButtons.has(e.button)) {
      this.mouseJustPressed.add(e.button);
    }
    this.mouseButtons.add(e.button);
  }

  onMouseUp(e) {
    this.mouseButtons.delete(e.button);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasJustPressed(code) {
    return this.justPressed.has(code);
  }

  isMouseDown(btn = 0) {
    return this.mouseButtons.has(btn);
  }

  wasMouseJustPressed(btn = 0) {
    return this.mouseJustPressed.has(btn);
  }

  triggerVirtual(action) {
    this.virtualTriggers.add(action);
  }

  setVirtualHeld(action, held) {
    if (held) this.virtualHeld.add(action);
    else this.virtualHeld.delete(action);
  }

  checkVirtual(action) {
    return this.virtualTriggers.has(action);
  }

  // Clear single-frame triggered presses at end of frame
  clearFrame() {
    this.justPressed.clear();
    this.mouseJustPressed.clear();
    this.virtualTriggers.clear();
  }

  // Helper for Player 1 state (WASD, Mouse, J/K/L/U/I/O, Space, Shift - strictly isolated from P2)
  getP1Input() {
    const left = this.isDown('KeyA');
    const right = this.isDown('KeyD');

    const jump = this.wasJustPressed('Space') || this.wasJustPressed('KeyW') || this.checkVirtual('jump');
    const jumpHeld = this.isDown('Space') || this.isDown('KeyW') || this.virtualHeld.has('jump');

    const block = this.isDown('KeyS') || this.virtualHeld.has('block');
    const blockJustPressed = this.wasJustPressed('KeyS') || this.checkVirtual('block');

    const dash = this.wasJustPressed('ShiftLeft') || this.wasJustPressed('KeyL') || this.checkVirtual('dash');
    const attack = this.wasMouseJustPressed(0) || this.wasJustPressed('KeyJ') || this.checkVirtual('attack');
    const heavyAttack = this.wasMouseJustPressed(2) || this.wasJustPressed('KeyK') || this.checkVirtual('heavyAttack');

    const skill1 = this.wasJustPressed('KeyU') || this.wasJustPressed('KeyQ') || this.checkVirtual('skill1');
    const skill2 = this.wasJustPressed('KeyI') || this.wasJustPressed('KeyE') || this.checkVirtual('skill2');
    const ult = this.wasJustPressed('KeyO') || this.wasJustPressed('KeyR') || this.checkVirtual('ult');

    return {
      move: (right ? 1 : 0) - (left ? 1 : 0),
      jump,
      jumpHeld,
      block,
      blockJustPressed,
      dash,
      attack,
      heavyAttack,
      skill1,
      skill2,
      ult
    };
  }

  // Helper for Player 2 state (Arrow keys, Numpad & Non-numpad punctuation keys - zero overlap with P1)
  getP2Input() {
    const left = this.isDown('ArrowLeft');
    const right = this.isDown('ArrowRight');
    const jump = this.wasJustPressed('ArrowUp');
    const jumpHeld = this.isDown('ArrowUp');
    const block = this.isDown('ArrowDown');
    const blockJustPressed = this.wasJustPressed('ArrowDown');

    // Numpad OR laptop keyboard (, . / ; ' Enter)
    const dash = this.wasJustPressed('Numpad0') || this.wasJustPressed('ShiftRight') || this.wasJustPressed('Comma');
    const attack = this.wasJustPressed('Numpad1') || this.wasJustPressed('Numpad4') || this.wasJustPressed('Slash');
    const heavyAttack = this.wasJustPressed('Numpad2') || this.wasJustPressed('Numpad5') || this.wasJustPressed('Period');
    const skill1 = this.wasJustPressed('Numpad7') || this.wasJustPressed('Semicolon');
    const skill2 = this.wasJustPressed('Numpad8') || this.wasJustPressed('Quote');
    const ult = this.wasJustPressed('Numpad9') || this.wasJustPressed('Enter') || this.wasJustPressed('Backslash');

    return {
      move: (right ? 1 : 0) - (left ? 1 : 0),
      jump,
      jumpHeld,
      block,
      blockJustPressed,
      dash,
      attack,
      heavyAttack,
      skill1,
      skill2,
      ult
    };
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }
}
