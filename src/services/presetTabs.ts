export interface PresetSong {
  id: string;
  title: string;
  artist: string;
  tempo: number;
  description: string;
  genre: string;
  tex: string;
}

export const PRESET_SONGS: PresetSong[] = [
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
  }
];
