# PRD: Web Visualisator Tablature Gitar Interaktif (Guitar Tab Visualizer)

## 1. Overview & Objective
Produk ini adalah aplikasi berbasis web (*Desktop Browser*) yang dirancang untuk memvisualisasikan *tablature* gitar dari file Guitar Pro secara menarik, interaktif, dan mudah dipahami oleh pemula. 

Tujuan utama produk adalah menjembatani kesulitan pemula dalam membaca tab tradisional dengan menyediakan visualisasi fretboard 3D yang dilengkapi panduan jari, penamaan *chord* otomatis, penjelasan teknik bermain (seperti *bending* dan *pull-off*), serta mode pemutaran melambat (*slow down*) khusus pada bagian solo lagu. Fokus utama produk ini adalah memberikan kualitas visual maksimal tanpa batasan teknologi khusus dari sisi klien.

## 2. User Personas & Pain Points
### User Persona: Pemula Gitar (*Guitar Beginner*)
*   **Karakteristik:** Pengguna yang baru belajar bermain gitar, memiliki pemahaman dasar yang terbatas tentang notasi musik/tablature tradisional, kesulitan mengenali bentuk *chord* dari deretan angka fret, serta kesulitan mengikuti tempo cepat pada bagian solo lagu.
*   **Pain Points:**
    1.  Visual *tablature* tradisional dari Guitar Pro yang kurang menarik dan kaku.
    2.  Kebingungan mengenai teknik apa yang sedang digunakan, khususnya pada bagian solo (*bending*, *pull-off*, dll.).
    3.  Kurangnya informasi *tuning* gitar yang jelas pada awal lagu.
    4.  Saat tab memainkan sebuah *chord*, informasi nama *chord* tidak ditampilkan secara langsung (hanya berupa angka-angka *note* pada *fretboard*).

## 3. Functional Requirements

| ID | Fitur | Deskripsi | Acceptance Criteria (Kriteria Uji) |
| :--- | :--- | :--- | :--- |
| FR-01 | Impor File Guitar Pro | Memungkinkan pengguna mengunggah file *tablature* Guitar Pro ke dalam sistem web. | - Pengguna dapat mengunggah file format Guitar Pro (misal: `.gp`, `.gp5`, `.gpx`).<br>- Sistem berhasil memparsing data not, *tuning*, dan tempo, lalu menampilkannya ke antarmuka. |
| FR-02 | Visualisasi Fretboard 3D Interaktif | Menampilkan model *fretboard* gitar secara 3D di *desktop browser* yang bergerak sesuai pemutaran lagu. | - *Fretboard* 3D dirender dengan lancar pada *desktop browser* (Chrome, Safari, Edge).<br>- Terdapat panduan posisi jari yang menyala pada *fretboard* sesuai dengan *note* yang sedang dimainkan. |
| FR-03 | Penamaan Chord Otomatis & Penjelasan Teknik | Menampilkan nama *chord* secara *real-time* saat rangkaian *note* membentuk *chord*, serta menampilkan visualisasi teknik (bending/pull-off). | - Sistem mendeteksi dan menampilkan label nama *chord* di layar saat bagian *chord* dimainkan.<br>- Animasi visual khusus muncul untuk teknik *bending*, *pull-off*, atau teknik lainnya saat bagian tersebut aktif. |
| FR-04 | Informasi Tuning Gitar | Menampilkan informasi pengaturan *tuning* senar gitar yang digunakan pada lagu tersebut. | - Informasi *tuning* (misal: Standard E, Drop D) terlihat jelas pada antarmuka sebelum atau selama pemutaran lagu. |
| FR-05 | Mode Pemutaran Melambat (*Slow Down*) Solo | Fitur untuk memperlambat tempo pemutaran khusus pada bagian solo lagu tanpa mengubah *pitch* suara. | - Terdapat tombol/kontrol untuk mengaktifkan mode *slow down* pada bagian solo.<br>- Tempo pemutaran melambat (misal: 50% atau 75% dari kecepatan normal) dengan kualitas audio/visual yang tetap sinkron. |

## 4. Non-Functional Requirements & Security
*   **Performance (Kinerja):** Render 3D *fretboard* harus berjalan dengan *frame rate* yang stabil (minimal 30-60 FPS) pada *desktop browser* standar tanpa *lag* yang mengganggu sinkronisasi audio-visual.
*   **Compatibility (Kompatibilitas):** Kompatibel penuh dan diuji pada *desktop browser* utama: Google Chrome, Apple Safari, dan Microsoft Edge.
*   **Visual Quality (Kualitas Visual):** Fokus pada kualitas grafis 3D maksimal sesuai permintaan pengguna tanpa batasan teknologi khusus yang mengekang aspek estetika.
*   **Security & Data (Keamanan & Data):** *Asumsi:* Pengrosesan file *tablature* dilakukan secara lokal di sisi klien (*client-side*) menggunakan JavaScript/WebAssembly untuk menjaga privasi file pengguna, kecuali ditentukan lain pada tahap pengembangan teknis lanjutan.

## 5. Recommended Tech Stack & System Architecture
*   **Frontend Framework:** React.js atau Vue.js untuk membangun antarmuka pengguna yang responsif.
*   **3D Rendering Engine:** Three.js atau Babylon.js untuk merender *fretboard* 3D interaktif di dalam *browser*.
*   **Audio/Tab Parsing Library:** Library JavaScript untuk memparsing format file Guitar Pro dan mengelola pemutaran audio/MIDI (*asumsi:* memanfaatkan library *open-source* pengurai AlphaTab atau yang sejenis untuk web).
*   **Architecture:** *Client-Side Architecture* (Single Page Application) di mana seluruh proses rendering 3D, parsing file, dan pemutaran audio/visual dieksekusi langsung di *browser* pengguna untuk memaksimalkan performa visual interaktif.

## 6. Out of Scope (Phase 1)
*   Aplikasi berbasis *mobile* (iOS/Android native atau tampilan *mobile browser* yang dioptimalkan).
*   Fitur perekaman suara atau mikrofon untuk mendengarkan permainan gitar pengguna secara langsung (*real-time audio pitch detection*).
*   Fitur komunitas, berbagi lagu, atau penyimpanan *cloud* akun pengguna (fokus Phase 1 adalah fungsionalitas pemutar dan visualisasi mandiri).

## 7. Roadmap Implementasi

### Phase 1 (MVP - Minimum Viable Product)
*   **Tujuan:** Membangun inti produk yang dapat mengimpor file Guitar Pro dan menampilkan visualisasi dasar beserta fitur utama pemula.
*   **Cakupan:** 
    - Impor file dasar (FR-01).
    - Render *fretboard* 3D interaktif di *desktop browser* (FR-02).
    - Menampilkan informasi *tuning* (FR-04).
    - Penamaan *chord* otomatis sederhana dan indikator teknik dasar (FR-03).
*   **Kriteria Selesai:** Pengguna dapat mengunggah file Guitar Pro, melihat *fretboard* 3D di Chrome/Safari/Edge, melihat informasi *tuning*, nama *chord*, serta panduan jari dasar secara sinkron.

### Phase 2 (Rekomendasi Lanjutan)
*   **Tujuan:** Meningkatkan pengalaman belajar pengguna melalui kontrol pemutaran lanjutan dan penyempurnaan visual teknik gitar.
*   **Cakupan:** 
    - Implementasi penuh Mode Pemutaran Melambat (*Slow Down*) khusus bagian solo (FR-05).
    - Penyempurnaan animasi visual untuk teknik lanjutan yang lebih kompleks (*sweep picking*, *vibrato* tingkat lanjut).
    - Optimalisasi performa rendering 3D untuk file lagu yang lebih besar dan kompleks.
*   **Kriteria Selesai:** Fitur *slow down* berfungsi mulus pada bagian solo tanpa merusak sinkronisasi, dan animasi teknik tampil lebih akurat.

### Phase 3 (Rekomendasi Lanjutan)
*   **Tujuan:** Perluasan ekosistem produk dan penambahan fitur pendukung pembelajaran jangka panjang.
*   **Cakupan:** 
    - Manajemen akun pengguna dan penyimpanan daftar lagu favorit (*library* lokal/cloud).
    - Mode latihan interaktif (*looping* bagian tertentu secara berulang untuk latihan mandiri).
    - Integrasi latihan dengan input instrumen (mendukung koneksi MIDI atau deteksi audio via mikrofon opsional).
*   **Kriteria Selesai:** Pengguna dapat menyimpan preferensi lagu, melakukan *looping* bagian solo secara otomatis untuk latihan repetitif, dan sistem siap menerima pembaruan skala besar.