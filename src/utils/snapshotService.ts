export interface PracticeSnapshotParams {
  songTitle: string;
  songArtist: string;
  activeTrackName: string;
  tempo: number;
  timeSignature?: string;
  tuningName: string;
  tuningNotesFormatted: string;
  currentTimeMs: number;
  currentBar?: number;
  speed: number;
  transpose: number;
  loopAMs?: number;
  loopBMs?: number;
  activeTechnique?: string;
  soundingNoteText?: string;
  themeName?: string;
}

export interface PracticeUrlParams {
  presetId?: string;
  trackIndex?: number;
  seconds?: number;
  speed?: number;
  transpose?: number;
  loopA?: number;
  loopB?: number;
  theme?: string;
}

/** Formats milliseconds into mm:ss.f display string */
export function formatSnapshotTime(ms: number): string {
  const totalSec = Math.max(0, ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = (totalSec % 60).toFixed(1);
  return `${mins < 10 ? '0' : ''}${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
}

/**
 * Builds a shareable URL containing the current practice state as query parameters.
 */
export function generateShareableUrl(baseUrl: string, params: PracticeUrlParams): string {
  const url = new URL(baseUrl);
  if (params.presetId) url.searchParams.set('song', params.presetId);
  if (params.trackIndex !== undefined && params.trackIndex > 0) {
    url.searchParams.set('track', params.trackIndex.toString());
  }
  if (params.seconds !== undefined && params.seconds > 0) {
    url.searchParams.set('t', (Math.round(params.seconds * 10) / 10).toString());
  }
  if (params.speed !== undefined && params.speed !== 1.0) {
    url.searchParams.set('speed', params.speed.toString());
  }
  if (params.transpose !== undefined && params.transpose !== 0) {
    url.searchParams.set('transpose', params.transpose.toString());
  }
  if (params.loopA !== undefined) {
    url.searchParams.set('loopA', (Math.round(params.loopA * 10) / 10).toString());
  }
  if (params.loopB !== undefined) {
    url.searchParams.set('loopB', (Math.round(params.loopB * 10) / 10).toString());
  }
  if (params.theme) {
    url.searchParams.set('theme', params.theme);
  }
  return url.toString();
}

/**
 * Parses practice query parameters from a URL search string.
 */
export function parsePracticeUrlParams(search: string): PracticeUrlParams {
  const sp = new URLSearchParams(search);
  const params: PracticeUrlParams = {};

  const song = sp.get('song');
  if (song) params.presetId = song;

  const track = sp.get('track');
  if (track !== null) {
    const parsed = parseInt(track, 10);
    if (!isNaN(parsed)) params.trackIndex = parsed;
  }

  const t = sp.get('t');
  if (t !== null) {
    const parsed = parseFloat(t);
    if (!isNaN(parsed)) params.seconds = parsed;
  }

  const speed = sp.get('speed');
  if (speed !== null) {
    const parsed = parseFloat(speed);
    if (!isNaN(parsed)) params.speed = parsed;
  }

  const transpose = sp.get('transpose');
  if (transpose !== null) {
    const parsed = parseInt(transpose, 10);
    if (!isNaN(parsed)) params.transpose = parsed;
  }

  const loopA = sp.get('loopA');
  if (loopA !== null) {
    const parsed = parseFloat(loopA);
    if (!isNaN(parsed)) params.loopA = parsed;
  }

  const loopB = sp.get('loopB');
  if (loopB !== null) {
    const parsed = parseFloat(loopB);
    if (!isNaN(parsed)) params.loopB = parsed;
  }

  const theme = sp.get('theme');
  if (theme) params.theme = theme;

  return params;
}

/**
 * Merges Highway and Fretboard HTMLCanvasElements into a unified, high-res studio practice card image.
 */
export function renderSnapshotCardToCanvas(
  highwayCanvas: HTMLCanvasElement | null,
  fretboardCanvas: HTMLCanvasElement | null,
  meta: PracticeSnapshotParams,
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  const dpr = 2; // High-res capture for crisp text
  const cardWidth = 1200;
  const headerHeight = 90;
  const footerHeight = 44;

  const hwHeight = highwayCanvas ? 320 : 0;
  const fbHeight = fretboardCanvas ? 260 : 0;
  const cardHeight = headerHeight + hwHeight + fbHeight + footerHeight;

  outputCanvas.width = cardWidth * dpr;
  outputCanvas.height = cardHeight * dpr;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return outputCanvas;

  ctx.scale(dpr, dpr);

  // Background Studio Obsidian
  ctx.fillStyle = '#0f0c0c';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Subtle outer border
  ctx.strokeStyle = '#2d2424';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, cardWidth, cardHeight);

  // 1. Header Bar
  ctx.fillStyle = '#161212';
  ctx.fillRect(0, 0, cardWidth, headerHeight);
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(cardWidth, headerHeight);
  ctx.strokeStyle = '#2d2424';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Branding Pill
  ctx.fillStyle = '#FF7A65';
  ctx.beginPath();
  ctx.roundRect(24, 20, 76, 22, 4);
  ctx.fill();
  ctx.fillStyle = '#120e0e';
  ctx.font = '900 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TABKU', 62, 31);

  // Song Title & Artist
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(meta.songTitle, 112, 32);

  ctx.fillStyle = '#9e8f8f';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText(`${meta.songArtist} · ${meta.activeTrackName}`, 112, 54);

  // Right Header Telemetry Chips
  const timeFormatted = formatSnapshotTime(meta.currentTimeMs);
  const barText = meta.currentBar !== undefined ? `BAR ${meta.currentBar}` : '';
  const rightChips = [
    barText,
    timeFormatted,
    `${meta.tempo} BPM`,
    meta.tuningName,
    meta.speed !== 1.0 ? `${meta.speed}x` : '',
    meta.transpose !== 0 ? `${meta.transpose > 0 ? '+' : ''}${meta.transpose}st` : '',
  ].filter(Boolean);

  let curX = cardWidth - 24;
  for (let i = rightChips.length - 1; i >= 0; i--) {
    const text = rightChips[i];
    ctx.font = '800 11px "JetBrains Mono", monospace';
    const textW = ctx.measureText(text).width;
    const chipW = textW + 16;
    const chipX = curX - chipW;

    ctx.fillStyle = i === 1 ? '#FF7A65' : '#221919';
    ctx.strokeStyle = i === 1 ? '#FF7A65' : '#3d2e2e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(chipX, 26, chipW, 26, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = i === 1 ? '#120e0e' : '#e0d5d5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, chipX + chipW / 2, 39);

    curX = chipX - 8;
  }

  // 2. Highway Canvas Image
  let nextY = headerHeight;
  if (highwayCanvas) {
    ctx.drawImage(highwayCanvas, 0, nextY, cardWidth, hwHeight);
    nextY += hwHeight;

    // Divider line
    ctx.beginPath();
    ctx.moveTo(0, nextY);
    ctx.lineTo(cardWidth, nextY);
    ctx.strokeStyle = '#2d2424';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. Fretboard Canvas Image
  if (fretboardCanvas) {
    ctx.drawImage(fretboardCanvas, 0, nextY, cardWidth, fbHeight);
    nextY += fbHeight;

    // Divider line
    ctx.beginPath();
    ctx.moveTo(0, nextY);
    ctx.lineTo(cardWidth, nextY);
    ctx.strokeStyle = '#2d2424';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 4. Footer Bar
  ctx.fillStyle = '#141010';
  ctx.fillRect(0, nextY, cardWidth, footerHeight);

  ctx.fillStyle = '#786b6b';
  ctx.font = '600 10.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const loopInfo =
    meta.loopAMs !== undefined && meta.loopBMs !== undefined
      ? ` · A-B Loop: ${formatSnapshotTime(meta.loopAMs)} s/d ${formatSnapshotTime(meta.loopBMs)}`
      : '';
  ctx.fillText(
    `STRING FLOW 2D GUITAR TAB VISUALIZER${loopInfo}`,
    24,
    nextY + footerHeight / 2,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FF7A65';
  ctx.font = '800 10.5px "JetBrains Mono", monospace';
  ctx.fillText('tabku.app · PRACTICE SNAPSHOT', cardWidth - 24, nextY + footerHeight / 2);

  return outputCanvas;
}
