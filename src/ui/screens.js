export class ScreenManager {
  constructor(gameApp) {
    this.app = gameApp;
    this.container = document.getElementById('screen-container');
    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <!-- MAIN MENU -->
      <div class="screen-overlay" id="screen-main-menu">
        <div class="menu-content">
          <div class="game-logo-wrapper">
            <h1 class="logo-text" data-text="STICKMAN HERO">STICKMAN HERO</h1>
            <p class="logo-subtext">KỶ NGUYÊN SIÊU CHIẾN BINH • RESTORATION 3D</p>
          </div>

          <div class="menu-buttons">
            <button class="cyber-btn primary-btn" id="btn-start-story">
              <span class="btn-icon">⚡</span>
              <span class="btn-label">CHIẾN DỊCH (CAMPAIGN)</span>
            </button>
            <button class="cyber-btn pvp-btn" id="btn-start-pvp">
              <span class="btn-icon">⚔️</span>
              <span class="btn-label">ĐỐI KHÁNG 2 NGƯỜI (LOCAL PVP)</span>
            </button>
            <button class="cyber-btn" id="btn-start-dojo">
              <span class="btn-icon">🎯</span>
              <span class="btn-label">PHÒNG LUYỆN TẬP (DOJO)</span>
            </button>
            <button class="cyber-btn lore-btn" id="btn-open-lore">
              <span class="btn-icon">📖</span>
              <span class="btn-label">CỐT TRUYỆN ĐA VŨ TRỤ (LORE)</span>
            </button>
            <button class="cyber-btn" id="btn-watch-intro">
              <span class="btn-icon">🎬</span>
              <span class="btn-label">XEM VIDEO INTRO CHÍNH THỨC</span>
            </button>
            <button class="cyber-btn" id="btn-show-controls">
              <span class="btn-icon">🎮</span>
              <span class="btn-label">HƯỚNG DẪN PHÍM CHIẾN ĐẤU</span>
            </button>
          </div>

          <div class="version-tag">STK-RESTORE SUPERHERO EDITION v2.0 • 3D WEBGL ENGINE</div>
        </div>
      </div>

      <!-- VICTORY SCREEN (MVP STYLE) -->
      <div class="screen-overlay" id="screen-victory" style="display: none;">
        <div class="victory-card">
          <div class="victory-title-glow">VICTORY</div>
          <div class="victory-sub">MÃ NGUỒN KHU VỰC ĐÃ ĐƯỢC TÁI THIẾT LẬP HOÀN TOÀN!</div>

          <div class="mvp-showcase">
            <div class="mvp-badge-container">
              <div class="mvp-rank-label">ĐÁNH GIÁ CHIẾN ĐẤU</div>
              <div class="mvp-rank-badge" id="vic-rank">SSS</div>
            </div>

            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-name">THỜI GIAN VƯỢT ẢI</div>
                <div class="stat-value" id="vic-time">01:45</div>
              </div>
              <div class="stat-box">
                <div class="stat-name">SỐ QUÁI ĐÃ DIỆT</div>
                <div class="stat-value" id="vic-kills">18</div>
              </div>
              <div class="stat-box">
                <div class="stat-name">LƯỢNG MÁU CÒN LẠI</div>
                <div class="stat-value" id="vic-hp">85%</div>
              </div>
              <div class="stat-box">
                <div class="stat-name">MAX COMBO</div>
                <div class="stat-value" id="vic-combo">24 HITS</div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="cyber-btn primary-btn pulse-btn" id="btn-vic-next">TIẾP TỤC (NEXT STAGE)</button>
            <button class="cyber-btn" id="btn-vic-replay">CHƠI LẠI (REPLAY)</button>
            <button class="cyber-btn" id="btn-vic-share">CHỤP ẢNH KHOE (SHARE)</button>
            <button class="cyber-btn" id="btn-vic-menu">VỀ MENU CHÍNH</button>
          </div>
        </div>
      </div>

      <!-- DEFEAT SCREEN -->
      <div class="screen-overlay defeat-overlay" id="screen-defeat" style="display: none;">
        <div class="defeat-card">
          <div class="defeat-title-glow">DEFEAT</div>
          <div class="defeat-sub">DỮ LIỆU CỦA ZERO ĐÃ BỊ HƯ KHÔNG ĐỒNG HÓA...</div>

          <div class="defeat-info-box">
            <div class="progress-bar-container">
              <div class="progress-label">TIẾN TRÌNH MÀN CHƠI: <span id="def-progress-pct">75%</span></div>
              <div class="progress-track">
                <div class="progress-fill" id="def-progress-fill"></div>
              </div>
            </div>

            <div class="tactical-hint">
              <span class="hint-tag">💡 MẸO CHIẾN ĐẤU:</span>
              <span class="hint-text" id="def-hint">Nhấn phím [S] hoặc [F] chuẩn xác trước đòn tấn công để kích hoạt PERFECT PARRY làm choáng kẻ thù!</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="cyber-btn defeat-retry-btn" id="btn-def-retry">PHỤC THÙ (TRY AGAIN - TỨC THÌ)</button>
            <button class="cyber-btn" id="btn-def-menu">VỀ MENU CHÍNH</button>
          </div>
        </div>
      </div>

      <!-- CONTROLS MODAL -->
      <div class="modal-backdrop" id="modal-controls" style="display: none;">
        <div class="controls-card">
          <div class="controls-header">
            <h2>HỆ THỐNG ĐIỀU KHIỂN CHIẾN ĐẤU (PC & MOUSE)</h2>
            <button class="close-btn" id="btn-close-controls">&times;</button>
          </div>

          <div class="controls-columns">
            <!-- P1 Column -->
            <div class="col-card p1-col">
              <h3>PLAYER 1 (CAPTAIN ZERO - XANH DƯƠNG)</h3>
              <ul>
                <li><span class="kbd">A</span> / <span class="kbd">D</span> : Di chuyển Trái / Phải</li>
                <li><span class="kbd">Space</span> / <span class="kbd">W</span> : Nhảy & Nhảy 2 Lần (Double Jump)</li>
                <li><span class="kbd">J</span> (hoặc Chuột Trái) : <b>Đánh Thường Combo 3 Đòn</b></li>
                <li><span class="kbd">K</span> (hoặc Chuột Phải) : <b>Cú Đấm Trời Giáng / Đập Đất</b></li>
                <li><span class="kbd">L</span> (hoặc Shift) : <b>Lướt Siêu Tốc (Dash né đòn)</b></li>
                <li><span class="kbd">U</span> (hoặc Phím Q) : <b>Kỹ Năng 1 - Chém Chớp (Blink Slash)</b></li>
                <li><span class="kbd">I</span> (hoặc Phím E) : <b>Kỹ Năng 2 - Bộc Phá (Overdrive)</b></li>
                <li><span class="kbd">O</span> (hoặc Phím R) : <b>Tuyệt Kỹ Tối Thượng (Zero-Absolute)</b></li>
                <li><span class="kbd">S</span> / <span class="kbd">C</span> : <b>Khiên Phản Đòn (Perfect Parry)</b></li>
                <li><b>Chuột</b> : Click trực tiếp vào các nút kỹ năng trên màn hình!</li>
              </ul>
            </div>

            <!-- P2 Column -->
            <div class="col-card p2-col">
              <h3>PLAYER 2 (IRON SHADOW - ĐỎ VÀNG PVP)</h3>
              <ul>
                <li><span class="kbd">Mũi tên Trái</span> / <span class="kbd">Phải</span> : Di chuyển</li>
                <li><span class="kbd">Mũi tên Lên</span> : Nhảy & Double Jump</li>
                <li><span class="kbd">Mũi tên Xuống</span> : Khiên Đỡ & Parry</li>
                <li><span class="kbd">Numpad 1</span> (hoặc phím <span class="kbd">/</span>) : <b>Đánh Thường Combo</b></li>
                <li><span class="kbd">Numpad 2</span> (hoặc phím <span class="kbd">.</span>) : <b>Đòn Nặng Đập Đất</b></li>
                <li><span class="kbd">Numpad 0</span> (hoặc phím <span class="kbd">,</span> / <span class="kbd">Shift P</span>) : <b>Lướt Dash</b></li>
                <li><span class="kbd">Numpad 7</span> (hoặc phím <span class="kbd">;</span>) : <b>Kỹ Năng 1 - Chém Chớp</b></li>
                <li><span class="kbd">Numpad 8</span> (hoặc phím <span class="kbd">'</span>) : <b>Kỹ Năng 2 - Bộc Phá</b></li>
                <li><span class="kbd">Numpad 9</span> (hoặc phím <span class="kbd">Enter</span>) : <b>Tuyệt Kỹ Tối Thượng</b></li>
              </ul>
            </div>
          </div>

          <button class="cyber-btn primary-btn close-btn-bottom" id="btn-close-controls-2">ĐÃ HIỂU - CHIẾN THÔI!</button>
        </div>
      </div>

      <!-- LORE MODAL (CỐT TRUYỆN TRƯỜNG THIÊN) -->
      <div class="modal-backdrop" id="modal-lore" style="display: none;">
        <div class="controls-card lore-card">
          <div class="controls-header">
            <h2>📜 CỐT TRUYỆN HUYỀN THOẠI: KỶ NGUYÊN CHIẾN BINH STICK-VERSE</h2>
            <button class="close-btn" id="btn-close-lore">&times;</button>
          </div>

          <div class="lore-body-scroll">
            <div class="lore-chapter">
              <h3>CHƯƠNG I: KHỞI NGUYÊN ÁNH SÁNG & LÕI ĐA VŨ TRỤ (THE PRIME CORE)</h3>
              <p>Thuở sơ khai, toàn bộ thế giới Stick-Verse không phải là những nét vẽ đơn độc mà là một mạng lưới kỹ thuật số thần thánh, nơi hàng tỷ cư dân người que cùng tồn tại dưới sự che chở của <b>Lõi Năng Lượng Tối Cao (The Prime Core)</b>. Năng lượng ánh sáng tinh khiết duy trì sự cân bằng giữa bốn chiều không gian: Thành Phố Bình Minh Neo-City, Hoang Mạc Pha Lê, Biển Ngầm Điện Tử và Vùng Đất Thánh.</p>
            </div>

            <div class="lore-chapter">
              <h3>CHƯƠNG II: VẾT NỨT HƯ KHÔNG & SỰ THA HÓA CỦA IRON SHADOW</h3>
              <p>Một thảm họa không lường trước đã xảy ra khi một thí nghiệm dịch chuyển lượng tử vượt giới hạn tạo ra một vết nứt không gian khổng lồ. Từ sâu thẳm hắc ám, <b>Chúa Tể Hư Không (Void Sovereign)</b> tràn vào, phát tán một loại virus mã hóa hắc ám cực mạnh. 99% các chiến binh người que bị biến đổi thành những cái bóng tro tàn hoặc quái thú máy.</p>
              <p>Đau lòng nhất, <b>Iron Shadow</b> - đại tướng quân áo giáp đỏ vàng kiêu dũng, người đồng đội thân thiết nhất của Zero - trong lúc cố gắng bảo vệ Lõi Năng Lượng đã bị năng lượng tà ác thao túng, trở thành cánh tay phải đắc lực của Chúa Tể Hư Không!</p>
            </div>

            <div class="lore-chapter">
              <h3>CHƯƠNG III: SỰ THỨC TỈNH CỦA CAPTAIN ZERO - CHIẾN BINH CUỐI CÙNG</h3>
              <p>Trước khi bị nuốt chửng, các nhà hiền triết cổ đại đã kích hoạt Dự Án Phòng Ngự Cuối Cùng. Họ rèn đúc cơ thể của <b>Zero</b> từ hợp kim Cobalt Titan siêu bền kết hợp cùng mảnh vỡ lõi ánh sáng thuần khiết nhất, ban cho anh thanh kiếm vạn năng <b>Glitch Blade</b> và đôi mắt <b>X-Visor</b> thấu thị mọi điểm yếu của kẻ địch.</p>
              <p>Sau giấc ngủ ngàn năm trong phong ấn, Zero thức tỉnh giữa tiếng gầm rú của binh đoàn Hư Không. Mang trên mình sắc xanh hy vọng, Zero bước vào hành trình xuyên không định mệnh!</p>
            </div>

            <div class="lore-chapter">
              <h3>CHƯƠNG IV: HÀNH TRÌNH TÁI THIẾT LẬP (THE RESTORATION MISSION)</h3>
              <p>Để cứu rỗi thế giới và đánh thức lại ý thức của Iron Shadow, Zero phải chinh phục 4 cửa ải tử thần:</p>
              <ul>
                <li><b>Chặng 1 - Neo-Neon City:</b> Giải phóng thành phố ánh sáng khỏi bầy Chó Săn Hư Không và Robot Tuần Tra bị nhiễm độc.</li>
                <li><b>Chặng 2 - Digital Wasteland:</b> Băng qua bão cát pha lê tím, vượt qua các cạm bẫy không gian để thu hồi Mảnh Lõi Năng Lượng Thứ Hai.</li>
                <li><b>Chặng 3 - The Sunken Grid:</b> Tiến sâu vào mạng lưới ngầm dưới đại dương số, giải cứu người bạn Iron Shadow bằng sức mạnh tình bạn và công lý!</li>
                <li><b>Chặng 4 - Void Citadel:</b> Trận quyết chiến một mất một còn với Chúa Tể Hư Không Void Sovereign trên ngai vàng vũ trụ để Reboot lại toàn bộ Stick-Verse!</li>
              </ul>
            </div>
          </div>

          <button class="cyber-btn primary-btn close-btn-bottom" id="btn-close-lore-2">TIẾP NHẬN SỨ MỆNH - XUẤT TRẬN NGAY!</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Main Menu
    document.getElementById('btn-start-story').addEventListener('click', () => {
      this.app.startCampaign();
    });
    document.getElementById('btn-start-pvp').addEventListener('click', () => {
      this.app.startPvP();
    });
    document.getElementById('btn-start-dojo').addEventListener('click', () => {
      this.app.startDojo();
    });
    document.getElementById('btn-open-lore').addEventListener('click', () => {
      this.showLoreModal(true);
    });
    document.getElementById('btn-watch-intro').addEventListener('click', () => {
      this.app.playIntro();
    });
    document.getElementById('btn-show-controls').addEventListener('click', () => {
      this.showControlsModal(true);
    });

    // Controls Modal
    document.getElementById('btn-close-controls').addEventListener('click', () => {
      this.showControlsModal(false);
    });
    document.getElementById('btn-close-controls-2').addEventListener('click', () => {
      this.showControlsModal(false);
    });

    // Lore Modal
    document.getElementById('btn-close-lore').addEventListener('click', () => {
      this.showLoreModal(false);
    });
    document.getElementById('btn-close-lore-2').addEventListener('click', () => {
      this.showLoreModal(false);
      this.app.startCampaign();
    });

    // Victory
    document.getElementById('btn-vic-next').addEventListener('click', () => {
      this.app.nextStage();
    });
    document.getElementById('btn-vic-replay').addEventListener('click', () => {
      this.app.restartStage();
    });
    document.getElementById('btn-vic-share').addEventListener('click', () => {
      this.toggleScreenshotMode();
    });
    document.getElementById('btn-vic-menu').addEventListener('click', () => {
      this.app.returnToMenu();
    });

    // Defeat
    document.getElementById('btn-def-retry').addEventListener('click', () => {
      this.app.restartStage();
    });
    document.getElementById('btn-def-menu').addEventListener('click', () => {
      this.app.returnToMenu();
    });
  }

  showMainMenu() {
    this.hideAllScreens();
    document.getElementById('screen-main-menu').style.display = 'flex';
    document.getElementById('hud-container').style.display = 'none';
  }

  showGameHUD() {
    this.hideAllScreens();
    document.getElementById('hud-container').style.display = 'block';
  }

  showVictory(stats) {
    this.hideAllScreens();
    const screen = document.getElementById('screen-victory');
    screen.style.display = 'flex';

    document.getElementById('vic-rank').textContent = stats.rank || 'SSS';
    document.getElementById('vic-time').textContent = stats.time || '01:30';
    document.getElementById('vic-kills').textContent = stats.kills || 15;
    document.getElementById('vic-hp').textContent = `${Math.ceil(stats.hp || 100)}%`;
    document.getElementById('vic-combo').textContent = `${stats.maxCombo || 12} HITS`;
  }

  showDefeat(progressPct = 65) {
    this.hideAllScreens();
    const screen = document.getElementById('screen-defeat');
    screen.style.display = 'flex';

    const targetPct = Math.min(100, Math.max(0, Math.round(progressPct)));
    const fillElem = document.getElementById('def-progress-fill');
    const pctElem = document.getElementById('def-progress-pct');

    if (this._defeatProgressAnim) {
      clearInterval(this._defeatProgressAnim);
      this._defeatProgressAnim = null;
    }

    if (fillElem && pctElem) {
      // Reset to 0 without transition first
      fillElem.style.transition = 'none';
      fillElem.style.width = '0%';
      pctElem.textContent = '0%';

      // Smoothly expand bar
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fillElem.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
          fillElem.style.width = `${targetPct}%`;
        });
      });

      // Smooth numeric count-up animation
      let currentVal = 0;
      const duration = 1200; // ms
      const stepTime = 30; // ms
      const stepIncrement = targetPct / (duration / stepTime);

      this._defeatProgressAnim = setInterval(() => {
        currentVal += stepIncrement;
        if (currentVal >= targetPct) {
          currentVal = targetPct;
          clearInterval(this._defeatProgressAnim);
          this._defeatProgressAnim = null;
        }
        pctElem.textContent = `${Math.round(currentVal)}%`;
      }, stepTime);
    }

    const hints = [
      'Hãy dùng phím [S] chuẩn xác trước đòn tấn công để kích hoạt PERFECT PARRY làm choáng kẻ thù!',
      'Kỹ năng [U] Chém Chớp cho phép bạn dịch chuyển né đòn và chém liên tiếp 5 nhát!',
      'Kỹ năng [I] Bộc Phá đẩy lùi toàn bộ quái vật xung quanh!',
      'Khi năng lượng đạt 100%, nhấn [O] để kích hoạt Tuyệt Kỹ Tối Thượng hủy diệt!'
    ];
    document.getElementById('def-hint').textContent = hints[Math.floor(Math.random() * hints.length)];
  }

  showControlsModal(show) {
    document.getElementById('modal-controls').style.display = show ? 'flex' : 'none';
  }

  showLoreModal(show) {
    document.getElementById('modal-lore').style.display = show ? 'flex' : 'none';
  }

  toggleScreenshotMode() {
    const card = document.querySelector('.victory-card');
    if (card) {
      card.classList.toggle('screenshot-hidden');
    }
  }

  hideAllScreens() {
    document.getElementById('screen-main-menu').style.display = 'none';
    document.getElementById('screen-victory').style.display = 'none';
    document.getElementById('screen-defeat').style.display = 'none';
    document.getElementById('modal-lore').style.display = 'none';
    document.getElementById('modal-controls').style.display = 'none';
  }
}
