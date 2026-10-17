# ⚡ STICKMAN HERO: CYBER REVOLUTION (Stick-Hero)

> **Siêu phẩm Game Đối Kháng & Hành Động 3D Stickman phong cách Cyberpunk** được phát triển trên nền tảng WebGL (Three.js & Vite).

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Đồ họa 3D Cyberpunk & Hậu kỳ Điện Ảnh**:
   - Nhân vật Stickman Ninja thiết kế theo phong cách sợi carbon bóng mờ, viền mạch điện neon phát quang, kính ngắm sắc bén và lõi Arc Reactor ở ngực.
   - Chiến trường đường phố Cyberpunk 3D hoành tráng, mặt đường nhựa ướt phản chiếu ánh đèn neon chân thực.
   - Hiệu ứng Bloom, Hitstop, Camera Shake, Glitch và vệt kiếm chém laser sống động.

2. **Hệ thống Chiến đấu & Khí công Đạn đạo (Projectile Combat)**:
   - Hệ thống đạn đạo thời gian thực: tung chiêu sóng kiếm khí (*Crescent Slash Wave*), địa chấn xung kích (*Ground Shockwave*) gây sát thương, hất tung đối thủ từ xa.
   - Combo đa tầng: Chuỗi chém 3 đòn nhanh, đòn nện phá giáp, lướt né siêu tốc.
   - Cơ chế **Perfect Parry** phản đòn chuẩn xác khi canh thời điểm đỡ đòn.

3. **Chế độ Chơi Đa dạng**:
   - **Chiến Dịch (Campaign - 4 Chương)**: Thám hiểm đường phố Neo-Neon, Vùng đất dữ liệu, Lưới điện ngầm và Đại chiến Trùm Cuối *Void Sovereign*.
   - **Đối Kháng 2 Người (Local 2-Player PvP)**: Đấu solo 1v1 giữa *Captain Zero (Cyan)* và *Iron Shadow (Crimson)* với phím điều khiển độc lập.
   - **Võ Đường Luyện Tập (Training Dojo)**: Thử nghiệm combo và chiêu thức không giới hạn.

4. **Âm thanh & Lồng tiếng Sôi động**:
   - Nhạc nền Cyberpunk điện tử hào hùng.
   - Hệ thống âm thanh chém kiếm, va chạm kim loại và giọng thoại chiến đấu tiếng Việt miền Nam lôi cuốn.

---

## 🎮 HƯỚNG DẪN ĐIỀU KHIỂN

### 🟦 Người chơi 1 (Player 1 - Captain Zero)
- **A / D**: Di chuyển Trái / Phải
- **W / Space**: Nhảy (Nhấn 2 lần để Nhảy đôi)
- **S**: Khiên phòng thủ / Perfect Parry
- **L / Shift**: Lướt né siêu tốc
- **J / Chuột Trái**: Đánh thường / Chuỗi combo 3 đòn
- **K / Chuột Phải**: Đòn nặng phá giáp
- **U / Q**: Chiêu 1 - Chém Chớp (Sóng kiếm khí từ xa)
- **I / E**: Chiêu 2 - Bộc Phá Địa Chấn
- **O / R**: Tuyệt Kỹ Tối Thượng (Zero-Absolute)

### 🟥 Người chơi 2 (Player 2 - Iron Shadow)
- **Phím Mũi tên ◀ / ▶**: Di chuyển Trái / Phải
- **Mũi tên ▲**: Nhảy cao
- **Mũi tên ▼**: Khiên phòng thủ / Perfect Parry
- **Numpad 0 / Dấu Phẩy (,)**: Lướt né
- **Numpad 1 / 4 / Gạch chéo (/)**: Đánh thường / Combo
- **Numpad 2 / 5 / Dấu chấm (.)**: Đòn nặng phá giáp
- **Numpad 7 / Chấm phẩy (;)**: Chiêu 1 - Chém Chớp (Sóng kiếm khí từ xa)
- **Numpad 8 / Dấu nháy đơn (')**: Chiêu 2 - Bộc Phá Địa Chấn
- **Numpad 9 / Enter**: Tuyệt Kỹ Tối Thượng

---

## 🚀 CÀI ĐẶT & CHẠY LOCAL

Yêu cầu: [Node.js](https://nodejs.org/) (phiên bản 18+).

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Mở trình duyệt và truy cập
http://localhost:5173
```

Để đóng gói phiên bản sản phẩm (Production Build):
```bash
npm run build
npm run preview
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Three.js**: Engine dựng hình 3D WebGL
- **Vite**: Bundler và dev server siêu tốc
- **Web Audio API**: Bộ máy xử lý âm thanh thời gian thực và tổng hợp nhạc
- **HTML5 Canvas / CSS3**: Giao diện HUD Cyberpunk tương tác cao
