# Jadwal Pengembangan Harian UI/UX - TabKu

Berdasarkan arsitektur dan fitur TabKu v2.0 yang sudah ada, berikut adalah rancangan Jadwal Pengembangan Harian (Daily Development Schedule) yang berfokus khusus pada peningkatan UI/UX (User Interface & User Experience).

Fokus utama peningkatan ini adalah membuat antarmuka terasa lebih presisi seperti DAW (Digital Audio Workstation) profesional, meningkatkan umpan balik visual (micro-interactions), serta memastikan aksesibilitas dan responsivitas layar (terutama untuk tablet).

---

## 🗓️ Jadwal Pengembangan Harian UI/UX (5 Hari)

### **Hari 1: Audit UI & Standarisasi Desain (Design System & Accessibility)**
Fokus pada merapikan fondasi CSS dan memastikan aplikasi nyaman digunakan oleh semua orang.
*   **Tugas 1:** Audit dan ekstraksi seluruh *hardcoded colors* ke CSS Variables global, memastikan tema *Obsidian* (`#120e0e`) dan *Coral Red* (`#FF7A65`) konsisten di seluruh komponen.
*   **Tugas 2:** Pengecekan kontras warna teks dan elemen *Telemetry Bar* agar mudah dibaca pada layar redup.
*   **Tugas 3:** Implementasi aksesibilitas (WAI-ARIA) dasar: penambahan `aria-labels` pada tombol tanpa teks (seperti tombol Play/Pause/Loop) dan dukungan navigasi keyboard (`tabIndex`).
*   **Tugas 4:** Membersihkan CSS/Tailwind yang redundan atau tidak terpakai.

### **Hari 2: Mikro-Interaksi & Animasi (Micro-Interactions & Feedback)**
Fokus pada memberikan *feedback* visual setiap kali pengguna melakukan aksi, agar aplikasi terasa lebih "hidup".
*   **Tugas 1:** Menambahkan transisi/animasi *hover* dan *active states* yang lebih halus (berbasis *ease-in-out* 150-200ms) pada transport controls (Play, Pause, Metronome).
*   **Tugas 2:** Membuat animasi notifikasi/Toast kecil yang elegan (*fade-in & slide-up*) setiap kali pengguna menggunakan *Keyboard Shortcuts* (misal menekan `M` untuk metronom, muncul notif "Metronome: ON").
*   **Tugas 3:** Menambahkan efek *glow* atau transisi bayangan pada *Flat Fretboard* saat nada tertentu (`■ NOW`) dimainkan agar lebih mencolok secara visual.

### **Hari 3: Penyempurnaan Responsivitas Layar & Tata Letak (Layout & Tablet Optimization)**
Fokus pada kenyamanan saat aplikasi dibuka di berbagai perangkat, terutama iPad/Tablet di *music stand*.
*   **Tugas 1:** Audit tampilan pada ukuran layar tablet (768px - 1024px). Memastikan *String Flow Highway* tidak terpotong.
*   **Tugas 2:** Merapikan tata letak (*Flexbox/Grid*) pada *Telemetry Bar* dan *Header* agar membungkus dengan rapi (*wrap*) jika layar mulai mengecil, tanpa saling bertumpuk.
*   **Tugas 3:** Optimalisasi area sentuh (*touch target size*) minimal 44x44px pada ikon metronom, solo, loop, dan *Track Selector* untuk memudahkan navigasi menggunakan jari di layar sentuh.

### **Hari 4: Peningkatan Komponen Visual Khusus (Custom UI Components)**
Fokus pada komponen-komponen unik pembentuk karakteristik "Studio DAW".
*   **Tugas 1:** Memperindah *Mini-Map Section Ribbon* (Intro, Verse, Chorus) dengan gradasi tipis, sudut membulat, dan efek transisi saat kursor berada di atas pita.
*   **Tugas 2:** Kustomisasi *Scrollbar* pada *browser* (menghilangkan *scrollbar* bawaan OS yang kaku, diganti dengan desain modern minimalis yang menyatu dengan tema gelap).
*   **Tugas 3:** Peningkatan desain (UI Polish) pada *Chord Diagram* dan *Scale Lab Bar*, memperbaiki ketebalan garis dan ukuran font agar terlihat elegan.

### **Hari 5: Cross-Browser Testing & Performa Rendering (Testing & Optimization)**
Memastikan semua penambahan UI/UX berjalan mulus tanpa merusak *framerates*.
*   **Tugas 1:** Uji coba peramban lintas platform (Chrome, Safari, Firefox) untuk memastikan konsistensi desain.
*   **Tugas 2:** *Performance Profiling* UI menggunakan React DevTools. Memastikan tidak ada *re-render* yang tidak perlu pada tombol saat lagu diputar.
*   **Tugas 3:** Verifikasi bahwa animasi CSS yang ditambahkan tidak membebani proses *rendering* CPU pada *Canvas String Flow* (harus tetap konstan 60 FPS).
*   **Tugas 4:** Merapikan kode tahap akhir dan persiapan rilis pembaruan UI/UX (Commit & Submit).
