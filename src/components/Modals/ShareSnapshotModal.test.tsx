// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ShareSnapshotModal } from './ShareSnapshotModal';

describe('ShareSnapshotModal component', () => {
  let defaultProps: any;

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      meta: {
        songTitle: 'Neon Horizon',
        songArtist: 'TabKu Studio Sessions',
        activeTrackName: 'Lead Guitar',
        tempo: 105,
        tuningName: 'STANDARD E',
        tuningNotesFormatted: 'E B G D A E',
        currentTimeMs: 12000,
        speed: 1.0,
        transpose: 0,
      },
      urlParams: {
        presetId: 'rock-anthem-solo',
        seconds: 12,
        speed: 1.0,
        transpose: 0,
      },
      onShowToast: vi.fn(),
    };
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ShareSnapshotModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header, title, and tabs when open', () => {
    render(<ShareSnapshotModal {...defaultProps} />);

    expect(screen.getByText('BAGIKAN / EKSPOR SNAPSHOT')).toBeDefined();
    expect(screen.getByText(/Neon Horizon/)).toBeDefined();
    expect(screen.getByText('KARTU GAMBAR (PNG)')).toBeDefined();
    expect(screen.getByText('TAUTAN SESI LATIHAN')).toBeDefined();
  });

  it('switches between image tab and link tab', () => {
    render(<ShareSnapshotModal {...defaultProps} />);

    // Click link tab
    fireEvent.click(screen.getByText('TAUTAN SESI LATIHAN'));
    expect(screen.getByText('POSISI WAKTU')).toBeDefined();
    expect(screen.getByText('TEMPO / SPEED')).toBeDefined();

    // Click image tab
    fireEvent.click(screen.getByText('KARTU GAMBAR (PNG)'));
    expect(screen.getByText('UNDUH PNG')).toBeDefined();
  });

  it('calls onClose when close button or Escape is pressed', () => {
    render(<ShareSnapshotModal {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
