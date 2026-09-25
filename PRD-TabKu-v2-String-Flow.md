# Product Requirements Document (PRD) — TabKu v2.0
## Visualisator Tablature Gitar Interaktif Berbasis 2D "String Flow Animated Tab"

---

## 1. Metadata Dokumen & Riwayat Versi

| Properti | Detail |
| :--- | :--- |
| **Nama Produk** | **TabKu (Guitar Tab Flow Visualizer)** |
| **Versi Dokumen** | **v2.0 (Latest Update)** |
| **Status Dokumen** | **Active / Approved** |
| **Target Platform** | Web Application (Desktop Browser: Chrome, Safari, Edge, Firefox) |
| **Tanggal Pembaruan**| 19 September 2026 |
| **Arsitektur Utama** | React + TypeScript + Vite + AlphaTab + HTML5 Canvas (Client-Side) |

### Riwayat Revisi:
- **v1.0 (Initial Draft):** Konsep awal visualisasi 3D Fretboard miring dengan Three.js.
- **v2.0 (Current Update):** **Pivoting total dari 3D ke 2D String Flow Animated Tab** berbasis analisis video studio *Architects – Seeing Red (Develop Device Studio)*. Menghilangkan oklusi/distorsi 3D, menambahkan horizon look-ahead 3 detik, fretboard 2D 00–24 dengan indikator `NOW` vs `NEXT`, multi-track instrument switcher, kartu tuning Coral Red, dan telemetri studio real-time.

---

## 2. Executive Summary & Latar Belakang Evolusi

### Mengapa Berpindah dari 3D ke 2D String Flow?
Pada pengujian awal versi 1.0 (3D Three.js), ditemukan kelemahan fundamental bagi pengguna:
1. **Oklusi & Sudut Buta (*Blind Spots*):** Perspektif kamera 3D miring menyebabkan senar dan fret saling menutupi, terutama saat memainkan chord atau melompat antar posisi fret tinggi dan rendah.
2. **Tidak Ada Antisipasi Not (*No Look-Ahead Horizon*):** Pada model 3D, not hanya menyala saat dipetik. Gitaris tidak memiliki waktu reaksi untuk mempersiapkan jari sebelum not tiba.
3. **Penyederhanaan Visual Kelas Studio:** Gitaris profesional dan pemula membutuhkan informasi yang presisi, bukan grafis dekoratif yang membebani mata.

Dengan mengadopsi konsep **Cyber Studio DAW Grid (Develop Device Studio style)**:
- Not mengalir horizontal dari kanan ke kiri pada **Highway Look-Ahead 3.0 detik** menuju garis merah `PLAY`.
- Fretboard horizontal 2D 00–24 menampilkan penanda ganda: **`■ NOW`** (kotak solid untuk nada saat ini) dan **`◇ NEXT`** (kotak sudut diamond untuk not pada ketukan berikutnya) sehingga pemain dapat mengantisipasi posisi jari lebih awal.

---

## 3. User Persona & Analisis Kebutuhan

### Persona 1: Gitaris Pemula (*Beginner Player*)
* **Kebutuhan:** Memahami letak nada pada fretboard tanpa harus menghitung fret satu per satu, mengetahui nama chord secara otomatis, dan melihat teknik bermain (seperti bend dan slide).
* **Solusi TabKu:** Penanda `NOW` vs `NEXT` memandu jari berpindah tempat dengan mulus; sub-panel `SOUNDING NOTES` dan `ACTIVE FRETS` menampilkan huruf not dan nomor fret berukuran raksasa.

### Persona 2: Gitaris Menengah / Pemain Lagu Rumit (*Intermediate / Metal & Rock Player*)
* **Kebutuhan:** Mempelajari bagian solo gitar bertempo tinggi, tuning alternatif (Drop B, Drop D, Half Step Down), dan perpindahan antar trek (Lead vs Rhythm Guitar).
* **Solusi TabKu:** Mode **SOLO 50%** untuk memperlambat bagian sulit tanpa merusak nada, serta **Multi-Track Instrument Switcher** untuk memilih bagian gitaris 1 (Lead), gitaris 2 (Rhythm), atau Bass.

---

## 4. Status Terkini: Fitur yang SUDAH SELESAI Dikerjakan

Semua modul berikut telah diimplementasikan, lulus pengujian build TypeScript, dan terverifikasi secara fungsional melalui pengetesan peramban (*browser testing*):

| Modul / Fitur | Status | Deskripsi & Implementasi | Acceptance Criteria Terpenuhi |
| :--- | :---: | :--- | :--- |
| **Engine Audio & Tablature Parser** | **DONE** | Mengintegrasikan `@coderline/alphatab` dengan plugin Vite (`@coderline/alphatab-vite`) dan SoundFont Sonivox (`/soundfont/sonivox.sf2`). Memperbaiki bug recursif getter bawaan library (`_loadedMidiInfo`). | Pemutaran audio lancar tanpa error `RangeError`, sinkronisasi posisi milidetik presisi. |
| **Impor File Guitar Pro & Preset** | **DONE** | Mendukung file `.gp`, `.gp5`, `.gpx`, `.gp4`, `.gp3`, serta format string AlphaTex. Dilengkapi 3 preset lagu studio: *Neon Horizon*, *Midnight Blues Jam*, dan *Titanium Drop*. | File dapat diunggah melalui tombol `BUKA .GP` atau dipilih langsung dari dropdown preset. |
| **Multi-Track Instrument Switcher** | **DONE** | Bilah *Track Flow* horizontal untuk berganti instrumen secara dinamis (Lead Guitar, Rhythm Guitar, Bass Guitar) dilengkapi indikator jumlah senar (`6S`, `4S`), tombol Mute, dan Solo. | Berpindah instrumen memperbarui seluruh data visualisator (tuning, not, dan tab) secara instan. |
| **Header Studio & Kartu Tuning Coral Red** | **DONE** | Header modern dengan breadcrumb `\\ 6-STRING / STRING FLOW / [TRACK]`, judul lagu besar, dan kartu tuning berwarna Coral Red (`#FF7A65`) yang menampilkan nama tuning, susunan nada senar, tempo, dan birama. | Tampilan identik dengan estetika video *Develop Device Studio*. |
| **String Flow Scrolling Highway** | **DONE** | Canvas 6 senar horizontal 60fps dengan horizon look-ahead 3.0 detik. Not mengalir dari kanan ke kiri dengan badge angka fret `[ 12 ]`, efek glowing saat menyentuh garis merah `PLAY`, serta anotasi teknik (BEND, SLIDE, VIB, P.M.). | Not mengalir mulus tanpa lag; sub-panel `SOUNDING NOTES` menampilkan huruf not raksasa secara sinkron. |
| **2D Flat Fretboard (Frets 00–24)** | **DONE** | Fretboard horizontal 2D presisi meliputi 25 kolom fret (`00` s/d `24`) dengan inlay dot standar (3, 5, 7, 9, 15, 17, 19, 21) dan double dot (12 & 24). Menggunakan indikator `■ NOW` (solid) dan `◇ NEXT` (diamond corner). | Posisi nada aktif dan nada berikutnya menyala akurat sesuai ketukan; sub-panel `ACTIVE FRETS` menampilkan fret raksasa. |
| **Koreksi Orientasi Senar Fisik** | **DONE** | Mengonversi indeks internal AlphaTab ke penomoran fisik standar: $\text{physicalString} = \text{numStrings} - n.\text{string} + 1$. Senar 1 (High E / nada tertinggi) berada di **paling atas**, senar 6 (Low E / nada terendah) di **paling bawah**. | Akord ritmik seperti Em (`0.6 2.5 2.4 0.3 0.2 0.1`) dan melodi solo tampil 100% pada posisi senar yang benar. |
| **Real-Time Telemetry Bar** | **DONE** | Menampilkan 3 kartu telemetri: `01 / PLAYING` (nada, senar/fret, artikulasi), `02 / NEXT ATTACK` (nada/chord berikutnya, panduan jari), `03 / NEXT SECTION` (bagian lagu, nomor bar, tempo). | Data telemetri diperbarui secara real-time pada setiap perubahan ketukan. |
| **Studio Transport Controls** | **DONE** | Kontrol terintegrasi: Play/Pause (shortcut `Spacebar`), Stop, Solo Slow-Down 50% (`SOLO 50%`), badge kecepatan (`1.0x` / `0.5x`), Loop toggle, seekbar interaktif, volume fader, dan tombol Partitur 2D. | Audio melambat ke 50% tanpa mengubah pitch nada; partitur notasi 2D dapat dibuka/tutup sesuai kebutuhan. |

---

## 5. Arsitektur Teknis & Struktur Proyek

```
tabku/
├── public/
│   ├── font/                    # Font bravura & musik untuk AlphaTab
│   └── soundfont/               # SoundFont Sonivox GM (.sf2) untuk sintesis audio
├── src/
│   ├── components/
│   │   ├── FlatFretboard/
│   │   │   └── FlatFretboard2D.tsx    # Fretboard 2D 00-24 dengan penanda NOW & NEXT
│   │   ├── Header/
│   │   │   ├── TopNav.tsx             # Header studio & Kartu Tuning Coral Red
│   │   │   └── TrackSelector.tsx      # Multi-track switcher (Lead, Rhythm, Bass)
│   │   ├── Modals/
│   │   │   └── KeyboardShortcutsModal.tsx # Modal cheat sheet keyboard shortcuts
│   │   ├── Overlays/
│   │   │   ├── CountInOverlay.tsx      # HUD overlay visual count-in (1-2-3-4)
│   │   │   └── SpeedTrainerHUD.tsx     # Floating notifikasi speed trainer
│   │   ├── Player/
│   │   │   └── AlphaTabSheet.tsx      # Engine AlphaTab, sintesis audio, parser event
│   │   ├── ScaleLab/
│   │   │   └── ScaleLabBar.tsx        # Kontrol bar Scale Lab (root, scale, posisi)
│   │   ├── StringFlow/
│   │   │   └── StringFlowHighway.tsx  # Canvas scrolling highway not 3.0 detik
│   │   └── Telemetry/
│   │       └── TelemetryBar.tsx       # Kontrol transport DAW & info telemetri
│   ├── hooks/
│   │   ├── usePlayback.ts             # State playback: play/pause, speed, volume, seek
│   │   ├── useMetronome.ts            # Click track, count-in, penjadwalan beat RAF
│   │   ├── useABLoop.ts               # A-B range looper, deteksi batas otomatis
│   │   ├── useSpeedTrainer.ts         # Peningkatan tempo bertahap per siklus loop
│   │   └── useScaleLab.ts             # Scale overlay, root/type/posisi, backing track
│   ├── services/
│   │   ├── chordDetector.ts           # Deteksi nama akord otomatis dari nada aktif
│   │   ├── metronome.ts               # Service Web Audio API untuk klik metronom
│   │   ├── presetTabs.ts              # Bank data lagu multi-instrumen (Lead + Rhythm + Bass)
│   │   ├── scaleTheory.ts             # Teori skala, tangga nada, backing track generator
│   │   └── timelineExtractor.ts       # Ekstraksi timeline beat, durasi ms, dan not AlphaTab
│   ├── types/
│   │   └── guitar.ts                  # Interface TabNote, TrackInfo, ActiveChord, dll.
│   ├── utils/
│   │   └── guitarMath.ts              # Konversi MIDI, estimasi jari, transpose, format waktu
│   ├── App.tsx                        # Orchestrator tipis (~600 baris), menghubungkan hooks
│   └── index.css                      # Tema warna obsidian (#120e0e) & coral red (#FF7A65)
```

---

## 6. Kebutuhan & Backlog Selanjutnya (Next Phase Requirements)

Berdasarkan pencapaian v2.0, berikut adalah daftar kebutuhan fungsional dan teknis untuk iterasi berikutnya yang diprioritaskan:

### ✅ Prioritas 1 (SELESAI): Fitur Latihan & Ergonomi Pemain

#### FR-NEXT-01: A-B Looper Interaktif (Range Looping) — ✅ DONE
* Shortcut `[` (set A) dan `]` (set B), auto-seek, bayangan Coral Red pada seekbar dan highway.

#### FR-NEXT-02: Opsi Pembalik Senar ("Flip Strings / Player POV") — ✅ DONE
* Toggle `FLIP STRINGS` pada transport bar, membalik Highway dan Fretboard secara instan.

#### FR-NEXT-03: Metronome Click Track & Count-In — ✅ DONE
* Toggle metronom + volume terpisah, Count-In 1 birama dengan HUD visual, shortcut `M`.

---

### ✅ Prioritas 2 (SELESAI): Teori Musik & Visual Guide Lanjutan

#### FR-NEXT-04: Transpose & Virtual Pitch Shifter — ✅ DONE
* Kontrol -12 hingga +12 semitone, audio dan visual bergeser sinkron, shortcut `Shift+↑/↓`.

#### FR-NEXT-05: Fretboard Scale & Chord Roadmap Overlay — ✅ DONE
* Scale Lab dengan pemilih root/scale/posisi, degree & note name toggle, backing track generator.

#### FR-NEXT-06: Speed Trainer (Peningkatan Tempo Bertahap) — ✅ DONE
* Auto-increment +5%/loop dari 50% ke 100%, notifikasi HUD floating, shortcut `T`.

---

### Prioritas 3 (Future Scope): Pembelajaran Interaktif & Gamifikasi

#### FR-NEXT-07: Deteksi Nada via Mikrofon (Interactive Practice Mode)
* **Kebutuhan:** Aplikasi mendengarkan permainan gitar fisik pengguna melalui mikrofon laptop/komputer dan mencocokkannya dengan not pada tab.
* **Acceptance Criteria:**
  - Memanfaatkan Web Audio API Pitch Detection (YIN / McLeod Pitch Method).
  - Memberikan umpan balik visual langsung: *Hit / Perfect* (hijau), *Late / Early* (kuning), atau *Miss* (merah).

#### FR-NEXT-08: Responsivitas Layar Tablet & Custom Themes
* **Kebutuhan:** Optimalisasi tata letak untuk tablet (iPad / Android Tablet) saat diletakkan di atas *music stand*, serta pilihan tema warna kustom (e.g. Cyber Neon, Classic Parchment, Stealth Black).

---

## 7. Kebutuhan Non-Fungsional (*Non-Functional Requirements*)

1. **Performa Rendering:**
   - Animasi pada String Flow Highway dan Fretboard 2D wajib berjalan stabil pada 60 FPS pada monitor 60Hz/120Hz standar.
   - Penggunaan CPU untuk proses rendering canvas tidak boleh melebihi 15% pada perangkat laptop modern.
2. **Latensi Audio:**
   - Latensi pemicuan audio melalui Web Audio Worklet harus < 20 ms untuk menjaga ketepatan ritme.
3. **Privasi & Keamanan Klien:**
   - Pemrosesan file Guitar Pro pengguna dilakukan 100% di browser lokal (*client-side*). Tidak ada data file tab pengguna yang dikirim atau disimpan ke server eksternal.
4. **Kualitas Kode:**
   - Bebas dari error linting dan lolos uji kompilasi `tsc -b && vite build` tanpa peringatan kritis.

---

## 8. Ringkasan Rencana Aksi Segera (*Next Action Plan*)

```
[SELESAI]  Fase 1: Implementasi 2D String Flow + Flat Fretboard + Telemetri + AlphaTab Audio
[SELESAI]  Fase 2: A-B Looper + Flip Strings + Count-In Metronome + Keyboard Shortcuts Modal
[SELESAI]  Fase 3: Transpose + Scale Map Overlay + Speed Trainer
[SELESAI]  Refactor: Dekomposisi App.tsx ke 5 custom hooks + 3 komponen UI terpisah
[BERIKUTNYA] Fase 4: Mic Interactive Pitch Detection (FR-NEXT-07)
[MENDATANG]  Fase 5: Responsivitas Tablet + Custom Themes (FR-NEXT-08)
```

Dokumen ini menjadi acuan utama pengembangan teknis dan penambahan fitur lanjutan untuk proyek **TabKu**.
