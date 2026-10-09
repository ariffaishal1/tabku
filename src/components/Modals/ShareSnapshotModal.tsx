import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Copy, Check, Share2, Image, Link2 } from 'lucide-react';
import {
  type PracticeSnapshotParams,
  type PracticeUrlParams,
  formatSnapshotTime,
  generateShareableUrl,
  renderSnapshotCardToCanvas,
} from '../../utils/snapshotService';

interface ShareSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: PracticeSnapshotParams;
  urlParams: PracticeUrlParams;
  onShowToast?: (title: string, msg: string) => void;
}

export const ShareSnapshotModal: React.FC<ShareSnapshotModalProps> = ({
  isOpen,
  onClose,
  meta,
  urlParams,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'link'>('image');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const shareableUrl = generateShareableUrl(
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://tabku.app/',
    urlParams,
  );

  // Generate preview image when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const canvases = document.querySelectorAll('canvas');
    // Canvas 0: StringFlowHighway, Canvas 1: FlatFretboard2D
    const highwayCanvas = canvases.length > 0 ? canvases[0] : null;
    const fretboardCanvas = canvases.length > 1 ? canvases[1] : null;

    const out = renderSnapshotCardToCanvas(highwayCanvas, fretboardCanvas, meta);
    snapshotCanvasRef.current = out;
    const frameId = requestAnimationFrame(() => {
      setPreviewDataUrl(out.toDataURL('image/png'));
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, meta]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDownload = useCallback(() => {
    if (!snapshotCanvasRef.current) return;
    const link = document.createElement('a');
    const safeTitle = meta.songTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timeStr = formatSnapshotTime(meta.currentTimeMs).replace(':', '_');
    link.download = `TabKu_${safeTitle}_${timeStr}.png`;
    link.href = snapshotCanvasRef.current.toDataURL('image/png');
    link.click();
    onShowToast?.('Snapshot Diunduh', `Tersimpan sebagai TabKu_${safeTitle}_${timeStr}.png`);
  }, [meta, onShowToast]);

  const handleCopyImage = useCallback(async () => {
    if (!snapshotCanvasRef.current) return;
    try {
      snapshotCanvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setIsImageCopied(true);
          setTimeout(() => setIsImageCopied(false), 2000);
          onShowToast?.('Gambar Disalin', 'Snapshot kartu studio telah disalin ke clipboard!');
        } else {
          // Fallback download if clipboard image write not supported
          handleDownload();
        }
      }, 'image/png');
    } catch {
      handleDownload();
    }
  }, [handleDownload, onShowToast]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onShowToast?.('Tautan Disalin', 'Link sesi latihan berhasil disalin!');
    } catch {
      // Fallback
      onShowToast?.('Gagal Menyalin', 'Silakan salin tautan secara manual.');
    }
  }, [shareableUrl, onShowToast]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.18s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(255, 122, 101, 0.12)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 122, 101, 0.14)',
                border: '1px solid rgba(255, 122, 101, 0.3)',
                color: 'var(--accent-coral)',
              }}
            >
              <Share2 size={14} />
            </span>
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.4px',
                }}
              >
                BAGIKAN / EKSPOR SNAPSHOT
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                {meta.songTitle} · {formatSnapshotTime(meta.currentTimeMs)} · {meta.activeTrackName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Tutup (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '8px 18px 0',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <button
            onClick={() => setActiveTab('image')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'image' ? '2px solid var(--accent-coral)' : '2px solid transparent',
              color: activeTab === 'image' ? 'var(--accent-coral)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            <Image size={13} />
            <span>KARTU GAMBAR (PNG)</span>
          </button>

          <button
            onClick={() => setActiveTab('link')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'link' ? '2px solid var(--accent-coral)' : '2px solid transparent',
              color: activeTab === 'link' ? 'var(--accent-coral)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            <Link2 size={13} />
            <span>TAUTAN SESI LATIHAN</span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '16px 18px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {activeTab === 'image' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Image Preview Box */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: '#0a0808',
                  padding: '8px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                }}
              >
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="TabKu Practice Snapshot"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '360px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                      display: 'block',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Membuat kartu gambar resolusi tinggi...
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCopyImage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-control)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  {isImageCopied ? <Check size={13} color="#50fa7b" /> : <Copy size={13} />}
                  <span>{isImageCopied ? 'TERSALIN!' : 'SALIN GAMBAR'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid var(--accent-coral)',
                    backgroundColor: 'var(--accent-coral)',
                    color: 'var(--text-inverse)',
                    fontSize: '11px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    boxShadow: '0 0 10px var(--accent-coral-glow)',
                  }}
                >
                  <Download size={13} />
                  <span>UNDUH PNG</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Tautan ini menyimpan lagu, posisi detik latihan, kecepatan tempo, dan rentang loop A-B saat ini.
                Siapapun yang membuka tautan ini akan langsung diarahkan ke titik latihan yang sama.
              </div>

              {/* URL Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--accent-coral)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                  }}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: isCopied ? '#50fa7b' : 'var(--accent-coral)',
                    color: '#120e0e',
                    fontSize: '10px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{isCopied ? 'TERSALIN' : 'SALIN'}</span>
                </button>
              </div>

              {/* Settings Summary Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-control)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>POSISI WAKTU</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-coral)', fontFamily: 'var(--font-mono)' }}>
                    {formatSnapshotTime(meta.currentTimeMs)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-control)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TEMPO / SPEED</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {meta.tempo} BPM ({meta.speed}x)
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-control)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PITCH SHIFTER</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {meta.transpose !== 0 ? `${meta.transpose > 0 ? '+' : ''}${meta.transpose} st` : 'Original'}
                  </div>
                </div>

                {meta.loopAMs !== undefined && meta.loopBMs !== undefined && (
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(80, 250, 123, 0.08)',
                      border: '1px solid rgba(80, 250, 123, 0.25)',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: '#50fa7b', fontFamily: 'var(--font-mono)' }}>LOOP A-B AKTIF</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#50fa7b', fontFamily: 'var(--font-mono)' }}>
                      {formatSnapshotTime(meta.loopAMs)} → {formatSnapshotTime(meta.loopBMs)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
