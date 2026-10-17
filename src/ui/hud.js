export class HUD {
  constructor() {
    this.container = document.getElementById('hud-container');
    this.damagePopups = [];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboRank = 'D';

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <!-- P1 HUD (TOP-LEFT) -->
      <div class="player-hud p1-hud" id="p1-hud">
        <div class="avatar p1-avatar">
          <div class="avatar-hero">🛡️</div>
        </div>
        <div class="bars-container">
          <div class="name-tag">CAPTAIN ZERO <span class="badge-tag">COBALT HERO</span></div>
          <div class="bar-frame hp-frame">
            <div class="ghost-bar" id="p1-hp-ghost"></div>
            <div class="fill-bar hp-fill" id="p1-hp-fill"></div>
            <div class="bar-text" id="p1-hp-text">100 / 100</div>
          </div>
          <div class="bar-frame energy-frame">
            <div class="fill-bar energy-fill" id="p1-energy-fill"></div>
            <div class="bar-text" id="p1-energy-text">ENERGY: 0%</div>
          </div>
        </div>
      </div>

      <!-- P2 HUD (PVP TOP-RIGHT) -->
      <div class="player-hud p2-hud" id="p2-hud" style="display: none;">
        <div class="bars-container p2-bars">
          <div class="name-tag p2-name">IRON SHADOW <span class="badge-tag crimson-badge">CRIMSON MECHA</span></div>
          <div class="bar-frame hp-frame">
            <div class="ghost-bar" id="p2-hp-ghost"></div>
            <div class="fill-bar hp-fill crimson-fill" id="p2-hp-fill"></div>
            <div class="bar-text" id="p2-hp-text">100 / 100</div>
          </div>
          <div class="bar-frame energy-frame">
            <div class="fill-bar energy-fill crimson-fill" id="p2-energy-fill"></div>
            <div class="bar-text" id="p2-energy-text">ENERGY: 0%</div>
          </div>
        </div>
        <div class="avatar p2-avatar">
          <div class="avatar-hero">⚡</div>
        </div>
      </div>

      <!-- BOSS HUD (TOP-CENTER) -->
      <div class="boss-hud" id="boss-hud" style="display: none;">
        <div class="boss-title" id="boss-title">VOID SOVEREIGN - CHÚA TỂ HƯ KHÔNG</div>
        <div class="boss-frame">
          <div class="ghost-bar" id="boss-hp-ghost"></div>
          <div class="fill-bar boss-hp-fill" id="boss-hp-fill"></div>
          <div class="bar-text" id="boss-hp-text">100%</div>
        </div>
      </div>

      <!-- COMBO COUNTER -->
      <div class="combo-container" id="combo-container" style="display: none;">
        <div class="combo-rank" id="combo-rank">S</div>
        <div class="combo-hits"><span id="combo-num">0</span> HITS</div>
        <div class="combo-style" id="combo-style">SENSATIONAL!</div>
      </div>

      <!-- ON-SCREEN ACTION SKILL BAR (BOTTOM-CENTER) -->
      <div class="action-skill-bar" id="action-skill-bar">
        <div class="combo-hint-banner">
          💡 GỢI Ý: <b>[J + J + J]</b> Combo 3 Đòn • <b>[K]</b> Cú Đấm Trời Giáng • <b>[L]</b> Lướt Né • <b>[U]</b> Chém Chớp • <b>[S]</b> Khiên Phản Đòn
        </div>
        <div class="action-buttons-grid">
          <!-- Normal Attack [J] -->
          <button class="action-btn" id="act-btn-attack" title="Đánh Thường / Combo 3 Đòn">
            <span class="act-key">J</span>
            <span class="act-icon">⚔️</span>
            <span class="act-name">ĐÁNH COMBO</span>
            <span class="act-alt">[Chuột L]</span>
          </button>

          <!-- Heavy Attack [K] -->
          <button class="action-btn" id="act-btn-heavy" title="Đòn Nặng Phá Giáp">
            <span class="act-key">K</span>
            <span class="act-icon">💥</span>
            <span class="act-name">ĐẬP ĐẤT</span>
            <span class="act-alt">[Chuột R]</span>
          </button>

          <!-- Dash [L] -->
          <button class="action-btn" id="act-btn-dash" title="Lướt Siêu Tốc Né Đòn">
            <span class="act-key">L</span>
            <span class="act-icon">💨</span>
            <span class="act-name">LƯỚT NÉ</span>
            <span class="act-alt">[Shift]</span>
            <div class="cd-overlay" id="p1-cd-dash"></div>
          </button>

          <!-- Skill 1 [U] Blink Slash -->
          <button class="action-btn" id="act-btn-skill1" title="Dịch Chuyển Chém Liên Hoàn">
            <span class="act-key">U</span>
            <span class="act-icon">⚡</span>
            <span class="act-name">CHÉM CHỚP</span>
            <span class="act-alt">[Phím Q]</span>
            <div class="cd-overlay" id="p1-cd-1"></div>
          </button>

          <!-- Skill 2 [I] Overdrive -->
          <button class="action-btn" id="act-btn-skill2" title="Bộc Phá Sóng Chấn">
            <span class="act-key">I</span>
            <span class="act-icon">🌀</span>
            <span class="act-name">BỘC PHÁ</span>
            <span class="act-alt">[Phím E]</span>
            <div class="cd-overlay" id="p1-cd-2"></div>
          </button>

          <!-- Ultimate [O] Zero-Absolute -->
          <button class="action-btn ult-action-btn" id="act-btn-ult" title="Tuyệt Kỹ Tối Thượng Hủy Diệt">
            <span class="act-key ult-key">O</span>
            <span class="act-icon">🌟</span>
            <span class="act-name">TUYỆT KỸ</span>
            <span class="act-alt">[Phím R]</span>
            <div class="cd-overlay" id="p1-cd-ult"></div>
          </button>

          <!-- Block / Parry [S] -->
          <button class="action-btn parry-action-btn" id="act-btn-parry" title="Bật Khiên & Perfect Parry">
            <span class="act-key">S</span>
            <span class="act-icon">🛡️</span>
            <span class="act-name">KHIÊN PARRY</span>
            <span class="act-alt">[Phím C]</span>
          </button>

          <!-- Jump [SPACE] -->
          <button class="action-btn" id="act-btn-jump" title="Nhảy / Nhảy 2 Lần">
            <span class="act-key">SPACE</span>
            <span class="act-icon">🦘</span>
            <span class="act-name">NHẢY CAO</span>
            <span class="act-alt">[Phím W]</span>
          </button>
        </div>
      </div>

      <!-- DAMAGE POPUPS CONTAINER -->
      <div class="popups-container" id="popups-container"></div>
    `;

    // Cache elements
    this.p1HpFill = document.getElementById('p1-hp-fill');
    this.p1HpGhost = document.getElementById('p1-hp-ghost');
    this.p1HpText = document.getElementById('p1-hp-text');
    this.p1EnergyFill = document.getElementById('p1-energy-fill');
    this.p1EnergyText = document.getElementById('p1-energy-text');

    this.p2Hud = document.getElementById('p2-hud');
    this.p2HpFill = document.getElementById('p2-hp-fill');
    this.p2HpGhost = document.getElementById('p2-hp-ghost');
    this.p2HpText = document.getElementById('p2-hp-text');
    this.p2EnergyFill = document.getElementById('p2-energy-fill');
    this.p2EnergyText = document.getElementById('p2-energy-text');

    this.bossHud = document.getElementById('boss-hud');
    this.bossTitle = document.getElementById('boss-title');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossHpGhost = document.getElementById('boss-hp-ghost');
    this.bossHpText = document.getElementById('boss-hp-text');

    this.comboContainer = document.getElementById('combo-container');
    this.comboRankEl = document.getElementById('combo-rank');
    this.comboNumEl = document.getElementById('combo-num');
    this.comboStyleEl = document.getElementById('combo-style');

    this.popupsContainer = document.getElementById('popups-container');

    // Cooldown elements
    this.p1CdDash = document.getElementById('p1-cd-dash');
    this.p1Cd1 = document.getElementById('p1-cd-1');
    this.p1Cd2 = document.getElementById('p1-cd-2');
    this.p1CdUlt = document.getElementById('p1-cd-ult');
    this.comboHintBanner = this.container.querySelector('.combo-hint-banner');

    // Bind Virtual Click Actions
    this.bindActionButtons();
  }

  bindActionButtons() {
    const bindBtn = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const trigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.game && window.game.input) {
          window.game.input.triggerVirtual(action);
        }
      };

      // Pointerdown provides instant millisecond response without waiting for click/release
      el.addEventListener('pointerdown', trigger);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    };

    bindBtn('act-btn-attack', 'attack');
    bindBtn('act-btn-heavy', 'heavyAttack');
    bindBtn('act-btn-dash', 'dash');
    bindBtn('act-btn-skill1', 'skill1');
    bindBtn('act-btn-skill2', 'skill2');
    bindBtn('act-btn-ult', 'ult');
    bindBtn('act-btn-parry', 'block');
    bindBtn('act-btn-jump', 'jump');
  }

  update(dt, p1, p2, activeBoss, camera) {
    // 1. Update Player 1
    if (p1) {
      const hpPct = Math.max(0, (p1.hp / p1.maxHp) * 100);
      this.p1HpFill.style.width = `${hpPct}%`;
      this.p1HpText.textContent = `${Math.ceil(p1.hp)} / ${p1.maxHp}`;

      // Lerp ghost bar
      const curGhost = parseFloat(this.p1HpGhost.style.width) || 100;
      this.p1HpGhost.style.width = `${curGhost + (hpPct - curGhost) * dt * 4}%`;

      const energyPct = Math.max(0, (p1.energy / p1.maxEnergy) * 100);
      this.p1EnergyFill.style.width = `${energyPct}%`;
      this.p1EnergyText.textContent = energyPct >= 100 ? '⚡ SẴN SÀNG TUYỆT KỸ!' : `NĂNG LƯỢNG: ${Math.floor(energyPct)}%`;

      if (energyPct >= 100) {
        this.p1EnergyFill.classList.add('energy-ready');
      } else {
        this.p1EnergyFill.classList.remove('energy-ready');
      }

      // Skill Cooldowns (Dash cooldown is now snappy 0.32s)
      this.p1CdDash.style.height = `${Math.min(100, (p1.dashCooldown / 0.32) * 100)}%`;
      this.p1Cd1.style.height = `${Math.min(100, (p1.skill1Cooldown / 6.0) * 100)}%`;
      this.p1Cd2.style.height = `${Math.min(100, (p1.skill2Cooldown / 10.0) * 100)}%`;
      this.p1CdUlt.style.height = energyPct < 100 ? '100%' : '0%';
    }

    // 2. Update Player 2 (in PvP)
    if (p2) {
      this.p2Hud.style.display = 'flex';
      const hpPct = Math.max(0, (p2.hp / p2.maxHp) * 100);
      this.p2HpFill.style.width = `${hpPct}%`;
      this.p2HpText.textContent = `${Math.ceil(p2.hp)} / ${p2.maxHp}`;

      const curGhost = parseFloat(this.p2HpGhost.style.width) || 100;
      this.p2HpGhost.style.width = `${curGhost + (hpPct - curGhost) * dt * 4}%`;

      const energyPct = Math.max(0, (p2.energy / p2.maxEnergy) * 100);
      this.p2EnergyFill.style.width = `${energyPct}%`;
      this.p2EnergyText.textContent = energyPct >= 100 ? 'MAX READY!' : `ENERGY: ${Math.floor(energyPct)}%`;

      if (this.comboHintBanner) {
        this.comboHintBanner.innerHTML = '⚔️ <b>PVP 2 NGƯỜI:</b> [P1] A/D Di Chuyển • J Đánh • K Đập • U Chém Xa • I Bộc Phá | [P2] ◀/▶ Di Chuyển • 1/Slash Đánh • 2/Period Đập • 7/Semicolon Chém Xa • 8/Quote Bộc Phá';
      }
    } else {
      this.p2Hud.style.display = 'none';
      if (this.comboHintBanner && !this.comboHintBanner.innerHTML.includes('COMBO 3 ĐÒN')) {
        this.comboHintBanner.innerHTML = '💡 GỢI Ý: <b>[J + J + J]</b> Combo 3 Đòn • <b>[K]</b> Cú Đấm Trời Giáng • <b>[L]</b> Lướt Né • <b>[U]</b> Chém Chớp • <b>[S]</b> Khiên Phản Đòn';
      }
    }

    // 3. Update Boss Bar
    if (activeBoss && !activeBoss.isDead) {
      this.bossHud.style.display = 'block';
      this.bossTitle.textContent = activeBoss.name.toUpperCase();
      const bossHpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
      this.bossHpFill.style.width = `${bossHpPct}%`;
      this.bossHpText.textContent = `${Math.ceil(bossHpPct)}%`;

      const curGhost = parseFloat(this.bossHpGhost.style.width) || 100;
      this.bossHpGhost.style.width = `${curGhost + (bossHpPct - curGhost) * dt * 3}%`;
    } else {
      this.bossHud.style.display = 'none';
    }

    // 4. Update Combo Counter
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      this.comboContainer.style.display = 'block';
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboContainer.style.display = 'none';
      }
    }

    // 5. Update Floating Combat Damage Popups
    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      const pop = this.damagePopups[i];
      pop.elapsed += dt;
      pop.pos.y += dt * 1.5;

      if (pop.elapsed >= pop.duration) {
        pop.el.remove();
        this.damagePopups.splice(i, 1);
        continue;
      }

      // Project 3D position to 2D screen coordinate
      if (camera) {
        const v = pop.pos.clone().project(camera);
        const sx = ((v.x + 1) * window.innerWidth) / 2;
        const sy = ((-v.y + 1) * window.innerHeight) / 2;
        pop.el.style.left = `${sx}px`;
        pop.el.style.top = `${sy}px`;
        pop.el.style.opacity = `${1 - pop.elapsed / pop.duration}`;
      }
    }
  }

  registerHit(amount, isCrit, worldPos) {
    this.comboCount++;
    this.comboTimer = 2.5;

    // Determine style rank
    if (this.comboCount >= 25) {
      this.comboRank = 'SSS';
      this.comboStyleEl.textContent = 'SIÊU CẤP CHIẾN THẦN!';
    } else if (this.comboCount >= 18) {
      this.comboRank = 'SS';
      this.comboStyleEl.textContent = 'TUYỆT ĐỈNH CÔNG PHU!';
    } else if (this.comboCount >= 12) {
      this.comboRank = 'S';
      this.comboStyleEl.textContent = 'LIÊN HOÀN CUỒNG BẠO!';
    } else if (this.comboCount >= 7) {
      this.comboRank = 'A';
      this.comboStyleEl.textContent = 'DŨNG MÃNH!';
    } else if (this.comboCount >= 4) {
      this.comboRank = 'B';
      this.comboStyleEl.textContent = 'SẮC BÉN!';
    } else {
      this.comboRank = 'C';
      this.comboStyleEl.textContent = 'TRÚNG ĐÍCH!';
    }

    this.comboRankEl.textContent = this.comboRank;
    this.comboNumEl.textContent = this.comboCount;

    // Bump animation
    this.comboContainer.classList.remove('combo-bump');
    void this.comboContainer.offsetWidth;
    this.comboContainer.classList.add('combo-bump');

    // Spawn damage popup
    this.spawnDamagePopup(Math.round(amount), isCrit, worldPos);
  }

  spawnDamagePopup(text, isCrit, worldPos) {
    const el = document.createElement('div');
    el.className = `damage-popup ${isCrit ? 'crit-popup' : ''}`;
    el.textContent = isCrit ? `${text} CHÍ MẠNG!` : text;
    this.popupsContainer.appendChild(el);

    this.damagePopups.push({
      el,
      pos: worldPos.clone(),
      elapsed: 0,
      duration: isCrit ? 0.75 : 0.5
    });
  }

  spawnTextPopup(text, type = 'info', worldPos) {
    const el = document.createElement('div');
    el.className = `damage-popup special-popup ${type}-popup`;
    el.textContent = text;
    this.popupsContainer.appendChild(el);

    this.damagePopups.push({
      el,
      pos: worldPos.clone(),
      elapsed: 0,
      duration: 0.8
    });
  }

  spawnVoiceBanner(text, worldPos) {
    if (!text || !worldPos) return;
    const el = document.createElement('div');
    el.className = 'voice-shout-banner';
    el.innerHTML = `<span class="voice-ico">⚡</span><span class="voice-txt">"${text}"</span>`;
    this.popupsContainer.appendChild(el);

    const pos = worldPos.clone();
    pos.y += 2.3;

    this.damagePopups.push({
      el,
      pos,
      elapsed: 0,
      duration: 1.35
    });
  }

  reset() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboContainer.style.display = 'none';
    this.damagePopups.forEach(p => p.el.remove());
    this.damagePopups = [];
  }
}
