import { generateBackingTrackTex } from './scaleTheory';

export interface PresetSong {
  id: string;
  title: string;
  artist: string;
  tempo: number;
  description: string;
  genre: string;
  tex: string;
}

const defaultScaleBacking = generateBackingTrackTex(9, 'minor_pentatonic', 90);

export const PRESET_SONGS: PresetSong[] = [
  {
    id: 'scale-practice-empty',
    title: 'Tab Kosong · Latihan Scale',
    artist: 'TabKu Practice Studio',
    tempo: 90,
    genre: 'Scale Lab / Jam',
    description: 'Canvas bersih untuk latihan tangga nada (scales), senam jari, dan improvisasi solo di seluruh fretboard 2D.',
    tex: defaultScaleBacking.tex,
  },
  {
    id: 'rock-anthem-solo',
    title: 'Neon Horizon (Solo & Rhythm)',
    artist: 'TabKu Studio Sessions',
    tempo: 105,
    genre: 'Rock / Melodic Lead',
    description: 'Menampilkan 2 gitaris: Lead Guitar dengan teknik Bending, Slide, Hammer-on, dan Vibrato, serta Rhythm Guitar dengan progresi chord Em - G - D - Cadd9.',
    tex: `\\title "Neon Horizon"
\\artist "TabKu Studio Sessions"
\\tempo 105
.
\\track "Lead Guitar (Solo)" "Lead"
\\instrument 29
\\tuning E4 B3 G3 D3 A2 E2
:4 12.1 14.1 15.1 17.1{b (0 4)} | 17.1{b (0 4 0)} 15.1 14.1 12.1 | 12.2 15.2{b (0 4)} 15.2 12.2 | 14.3{v} 12.3 14.3{sl} 16.3 |
:8 15.2 17.2 15.1 17.1 19.1{b (0 4)} 19.1 17.1 15.1 | :4 17.1{v} 15.1 14.1{h} 15.1 | 12.1{v} r :2 r |
.
\\track "Rhythm Guitar (Chords)" "Rhythm"
\\instrument 25
\\tuning E4 B3 G3 D3 A2 E2
:1 (0.6 2.5 2.4 0.3 0.2 0.1) | :1 (3.6 2.5 0.4 0.3 3.2 3.1) | :1 (x.6 0.5 0.4 2.3 3.2 2.1) | :1 (x.6 3.5 2.4 0.3 3.2 3.1) |
:1 (0.6 2.5 2.4 0.3 0.2 0.1) | :1 (3.6 2.5 0.4 0.3 3.2 3.1) | :1 (x.6 3.5 2.4 0.3 3.2 3.1) |
.
\\track "Bass Guitar" "Bass"
\\instrument 33
\\tuning G2 D2 A1 E1
:4 0.4 0.4 0.4 0.4 | 3.4 3.4 3.4 3.4 | 0.3 0.3 0.3 0.3 | 3.3 3.3 3.3 3.3 |
:4 0.4 0.4 0.4 0.4 | 3.4 3.4 3.4 3.4 | 3.3 3.3 3.3 3.3 |
`
  },
  {
    id: 'blues-shuffle-lead',
    title: 'Midnight Blues Jam',
    artist: 'TabKu Studio Sessions',
    tempo: 90,
    genre: 'Blues / Rock',
    description: 'Progresi Blues 12-bar di nada dasar A. Lead Guitar memainkan blues box fret 5 & 7 dengan vibrato dan micro-bending, Rhythm memainkan shuffle boogie rhythm.',
    tex: `\\title "Midnight Blues Jam"
\\artist "TabKu Studio Sessions"
\\tempo 90
.
\\track "Lead Blues Guitar" "Lead"
\\instrument 29
\\tuning E4 B3 G3 D3 A2 E2
:4 r 5.1 8.1{b (0 4)} 5.1 | 8.2 5.2 7.3{b (0 2)} 5.3 | 7.4 5.3 7.3{v} r | :8 5.1 8.1 5.1 8.2 7.3 5.3 :4 7.4{v} |
:4 8.1{b (0 4)} 8.1 5.1 7.2 | 8.2{b (0 4)} 5.2 7.3{v} 5.3 | :2 5.1{v} r |
.
\\track "Rhythm Guitar (Boogie)" "Rhythm"
\\instrument 27
\\tuning E4 B3 G3 D3 A2 E2
:8 (0.5 2.4) (0.5 2.4) (0.5 4.4) (0.5 4.4) (0.5 2.4) (0.5 2.4) (0.5 4.4) (0.5 4.4) |
:8 (0.5 2.4) (0.5 2.4) (0.5 4.4) (0.5 4.4) (0.5 2.4) (0.5 2.4) (0.5 4.4) (0.5 4.4) |
:8 (0.4 2.3) (0.4 2.3) (0.4 4.3) (0.4 4.3) (0.4 2.3) (0.4 2.3) (0.4 4.3) (0.4 4.3) |
:8 (0.5 2.4) (0.5 2.4) (0.5 4.4) (0.5 4.4) (0.5 2.4) (0.5 2.4) (0.5 4.4) (0.5 4.4) |
:8 (2.5 4.4) (2.5 4.4) (0.4 2.3) (0.4 2.3) :2 (0.5 2.4 2.3 2.2 0.1) |
.
\\track "Bass Guitar" "Bass"
\\instrument 33
\\tuning G2 D2 A1 E1
:4 0.3 4.3 2.2 4.3 | 0.3 4.3 2.2 4.3 | 0.2 4.2 2.1 4.2 | 0.3 4.3 2.2 4.3 | :2 2.3 0.2 |
`
  },
  {
    id: 'heavy-drop-d',
    title: 'Titanium Drop (Drop D Heavy)',
    artist: 'TabKu Studio Sessions',
    tempo: 128,
    genre: 'Modern Metal / Heavy Rock',
    description: 'Tuning Drop D (D A D G B E) dengan riff power chord tebal pada Rhythm Guitar dan solo sweep / octave licks pada Lead Guitar.',
    tex: `\\title "Titanium Drop"
\\artist "TabKu Studio Sessions"
\\tempo 128
.
\\track "Lead Guitar" "Lead"
\\instrument 30
\\tuning E4 B3 G3 D3 A2 D2
:8 12.3 14.1 12.3 15.1 12.3 14.1 12.3 17.1 | 15.1{b (0 4)} 15.1 14.1 12.1 15.2 14.2 12.2 10.2 |
:8 12.3{sl} 14.3 12.2 14.2 15.2 17.2 15.1 17.1 | :4 19.1{b (0 4)} 19.1{v} :2 r |
.
\\track "Rhythm Guitar (Drop D)" "Rhythm"
\\instrument 30
\\tuning E4 B3 G3 D3 A2 D2
:8 (0.6 0.5 0.4) (0.6 0.5 0.4) 3.6 (0.6 0.5 0.4) 5.6 (0.6 0.5 0.4) 6.6 5.6 |
:8 (0.6 0.5 0.4) (0.6 0.5 0.4) 3.6 (0.6 0.5 0.4) (5.6 5.5 5.4) (3.6 3.5 3.4) (0.6 0.5 0.4) (0.6 0.5 0.4) |
:8 (0.6 0.5 0.4) (0.6 0.5 0.4) 3.6 (0.6 0.5 0.4) 5.6 (0.6 0.5 0.4) 6.6 5.6 |
:8 (8.6 8.5 8.4) (7.6 7.5 7.4) (5.6 5.5 5.4) (3.6 3.5 3.4) :2 (0.6 0.5 0.4) |
.
\\track "Bass (Drop D)" "Bass"
\\instrument 34
\\tuning G2 D2 A1 D1
:8 0.4 0.4 3.4 0.4 5.4 0.4 6.4 5.4 | 0.4 0.4 3.4 0.4 5.4 3.4 0.4 0.4 |
:8 0.4 0.4 3.4 0.4 5.4 0.4 6.4 5.4 | 8.4 7.4 5.4 3.4 :2 0.4 |
`
  },
  {
    id: 'acoustic-fingerstyle',
    title: 'Autumn Reverie (Fingerstyle Acoustic)',
    artist: 'TabKu Studio Sessions',
    tempo: 84,
    genre: 'Acoustic / Fingerstyle',
    description: 'Petikan arpeggio folk yang lembut (Am - Fmaj7 - C - G/B) dengan kombinasi petikan bass jempol dan melodi senar atas (E, B, G). Sangat memukau di String Flow Highway.',
    tex: `\\title "Autumn Reverie"
\\artist "TabKu Studio Sessions"
\\tempo 84
.
\\track "Acoustic Fingerstyle" "Acoustic"
\\instrument 25
\\tuning E4 B3 G3 D3 A2 E2
:8 0.5 2.4 0.3 0.2 1.2 0.2 0.3 2.4 | 1.6 3.5 2.4 2.3 0.2 2.3 2.4 3.5 | 3.5 2.4 0.3 1.2 3.1 1.2 0.3 2.4 | 2.5 0.4 0.3 0.2 3.1 0.2 0.3 0.4 |
:8 0.5 2.4 0.3 0.2 0.2{h} 1.2 0.2 2.4 | 1.6 3.5 2.4 2.3 0.2 2.3 2.4 3.5 | 3.6 0.4 0.3 1.2 3.6 0.4 0.3 0.2 | :2 (3.5 2.4 0.3 1.2 0.1) :2 r |
.
\\track "Acoustic Bass" "Bass"
\\instrument 32
\\tuning G2 D2 A1 E1
:2 0.3 :4 2.3 3.3 | :2 1.4 :4 3.4 0.3 | :2 3.3 :4 2.3 0.3 | :2 2.3 :4 0.3 2.4 |
:2 0.3 :4 2.3 3.3 | :2 1.4 :4 3.4 0.3 | :2 3.4 :4 2.4 1.4 | :1 3.3 |
`
  },
  {
    id: 'funk-neo-soul',
    title: 'Neon Groove (Funk & Neo-Soul)',
    artist: 'TabKu Studio Sessions',
    tempo: 96,
    genre: 'Funk / Neo-Soul Groove',
    description: 'Ritme funk 16th-note dengan chord 9th (Em9, Am7, D9), dead notes (x) berdenyut, dan lick pentatonik clean. Cocok untuk mengasah akurasi tangan kanan dan Speed Trainer.',
    tex: `\\title "Neon Groove"
\\artist "TabKu Studio Sessions"
\\tempo 96
.
\\track "Funk Rhythm Guitar" "Rhythm"
\\instrument 27
\\tuning E4 B3 G3 D3 A2 E2
:16 r (7.5 5.4 7.3 7.2) r (x.4 x.3 x.2) (7.5 5.4 7.3 7.2) (x.4 x.3 x.2) (7.5 5.4 7.3 7.2) (x.4 x.3 x.2) :8 (7.5 5.4 7.3 7.2) :16 (x.4 x.3) (x.4 x.3) :4 (7.5 5.4 7.3 7.2) |
:16 r (5.4 5.3 5.2 7.1) r (x.4 x.3 x.2) (5.4 5.3 5.2 7.1) (x.4 x.3 x.2) (5.4 5.3 5.2 7.1) (x.4 x.3 x.2) :8 (5.4 5.3 5.2 7.1) :16 (x.4 x.3) (x.4 x.3) :4 (5.4 5.3 5.2 7.1) |
:16 r (5.5 4.4 5.3 5.2) r (x.4 x.3 x.2) (5.5 4.4 5.3 5.2) (x.4 x.3 x.2) (5.5 4.4 5.3 5.2) (x.4 x.3 x.2) :8 (5.5 4.4 5.3 5.2) :16 (x.4 x.3) (x.4 x.3) :4 (5.5 4.4 5.3 5.2) |
:16 r (3.6 2.5 4.4 4.3 3.2) r (x.4 x.3 x.2) (3.6 2.5 4.4 4.3 3.2) (x.4 x.3 x.2) (3.6 2.5 4.4 4.3 3.2) (x.4 x.3 x.2) :8 (3.6 2.5 4.4 4.3 3.2) :16 (x.4 x.3) (x.4 x.3) :4 (3.6 2.5 4.4 4.3 3.2) |
.
\\track "Lead Licks" "Lead"
\\instrument 26
\\tuning E4 B3 G3 D3 A2 E2
:2 r :8 r 7.3 9.3 7.2 | :16 8.2{h} 10.2 8.2 7.2 :8 9.3 7.3 :4 9.4{v} :4 r |
:2 r :8 r 12.1 10.1 12.2 | :8 10.2 12.2 9.3 7.3 :4 9.4{v} :4 r |
.
\\track "Slap Bass" "Bass"
\\instrument 33
\\tuning G2 D2 A1 E1
:8 0.4 0.4 :16 r 0.4 :8 2.2 :8 0.4 :16 r 0.4 :8 2.2 0.4 | :8 5.4 5.4 :16 r 5.4 :8 7.2 :8 5.4 :16 r 5.4 :8 7.2 5.4 |
:8 0.4 0.4 :16 r 0.4 :8 2.2 :8 0.4 :16 r 0.4 :8 2.2 0.4 | :8 3.4 3.4 2.4 2.4 :2 0.4 |
`
  },
  {
    id: 'shred-velocity',
    title: 'Velocity Odyssey (Shred & Arpeggio)',
    artist: 'TabKu Studio Sessions',
    tempo: 135,
    genre: 'Metal / Shred Technique',
    description: 'Latihan arpeggio sweep 3-senar (Dm - C - Bb - A), alternate picking berkecepatan tinggi, dan unison bend untuk menguji kelincahan jari di tempo tinggi.',
    tex: `\\title "Velocity Odyssey"
\\artist "TabKu Studio Sessions"
\\tempo 135
.
\\track "Lead Guitar (Sweep & Shred)" "Lead"
\\instrument 30
\\tuning E4 B3 G3 D3 A2 E2
:16 14.3 15.2 13.1 17.1 13.1 15.2 14.3 15.2 14.3 15.2 13.1 17.1 13.1 15.2 14.3 15.2 |
:16 12.3 13.2 12.1 15.1 12.1 13.2 12.3 13.2 12.3 13.2 12.1 15.1 12.1 13.2 12.3 13.2 |
:16 10.3 11.2 10.1 13.1 10.1 11.2 10.3 11.2 10.3 11.2 10.1 13.1 10.1 11.2 10.3 11.2 |
:16 9.3 10.2 9.1 12.1 9.1 10.2 9.3 10.2 9.3 10.2 9.1 12.1 9.1 10.2 9.3 10.2 |
:8 12.1 15.1 :4 17.1{b (0 4)} :2 17.1{v} |
.
\\track "Rhythm Guitar (Power Chords)" "Rhythm"
\\instrument 29
\\tuning E4 B3 G3 D3 A2 E2
:1 (x.6 5.5 7.4 7.3) | :1 (x.6 3.5 5.4 5.3) | :1 (x.6 1.5 3.4 3.3) | :1 (x.6 0.5 2.4 2.3) | :2 (x.6 0.5 2.4 2.3) :2 r |
.
\\track "Bass Guitar" "Bass"
\\instrument 34
\\tuning G2 D2 A1 E1
:8 5.3 5.3 5.3 5.3 5.3 5.3 5.3 5.3 | :8 3.3 3.3 3.3 3.3 3.3 3.3 3.3 3.3 | :8 1.3 1.3 1.3 1.3 1.3 1.3 1.3 1.3 | :8 0.3 0.3 0.3 0.3 0.3 0.3 0.3 0.3 | :4 0.3 0.3 :2 0.3 |
`
  }
];
