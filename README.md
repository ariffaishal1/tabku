# TabKu — Interactive Guitar Tab Flow Visualizer

Visualisator tablature gitar interaktif berbasis Web dengan konsep **2D String Flow Animated Tab & Flat Fretboard** (terinspirasi dari visualizer studio *Architects – Seeing Red* karya Develop Device Studio).

---

## 📑 Dokumentasi Produk (PRD)

- **[PRD TabKu v2.0 (Terbaru)](./PRD-TabKu-v2-String-Flow.md)**: Dokumen lengkap pembaruan terkini, evaluasi transisi dari 3D ke 2D String Flow, fitur yang telah selesai, arsitektur sistem, dan roadmap kebutuhan selanjutnya.
- **[PRD Awal v1.0 (Arsip Konsep 3D)](./prd-web-visualisator-tablature-gitar-interaktif-guitar-tab-visualizer.md)**: Dokumen spesifikasi awal berbasis Three.js 3D.

---

## 🎸 Fitur Utama yang Selesai Dikerjakan

1. **String Flow Scrolling Highway**: Canvas 60fps dengan horizon look-ahead 3.0 detik, not meluncur dari kanan ke kiri, badge angka fret `[ 12 ]`, dan deteksi artikulasi (Bend, Slide, Vibrato, Palm Mute).
2. **2D Flat Fretboard (Frets 00–24)**: Fretboard horizontal dengan penanda ganda: `■ NOW` (solid) untuk nada saat ini dan `◇ NEXT` (corner diamond) untuk nada ketukan berikutnya.
3. **Multi-Track Instrument Switcher**: Dukungan multi-instrumen (Lead Guitar, Rhythm Guitar, Bass Guitar) dengan visual status track dan tuning dinamis.
4. **Koreksi Orientasi Senar Fisik**: Senar 1 (High E) di bagian paling atas dan Senar 6 (Low E) di bagian paling bawah sesuai konvensi standar partitur gitar dunia.
5. **Real-Time Telemetry Bar**: 3 kartu data langsung (`01 / PLAYING`, `02 / NEXT ATTACK`, `03 / NEXT SECTION`).
6. **AlphaTab Audio Engine**: Sintesis suara menggunakan SoundFont Sonivox GM (.sf2) dengan kontrol Play/Pause, Solo 50%, Seekbar, dan volume fader.

---

## 🚀 Menjalankan Secara Lokal

```bash
# Install dependensi
npm install

# Jalankan development server
npm run dev

# Build untuk produksi
npm run build
```
