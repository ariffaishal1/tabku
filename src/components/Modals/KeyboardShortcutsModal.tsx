import React, { useEffect } from 'react';
import { X, Play, Repeat, Music, Keyboard, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
}

interface ShortcutCategory {
  title: string;
  icon: React.ReactNode;
  items: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: 'PLAYBACK & NAVIGASI',
      icon: <Play size={13} color="var(--accent-coral)" />,
      items: [
        { keys: ['Space'], description: 'Putar / Jeda Lagu (Play/Pause)' },
        { keys: ['←', '→'], description: 'Mundur / Maju 5 detik' },
        { keys: ['Shift', '← / →'], description: 'Lompat ke Bagian Lagu (Section Prev / Next)', badge: 'Mini-Map' },
        { keys: ['-', '+'], description: 'Kecepatan Tempo (±0.1x)' },
      ],
    },
    {
      title: 'LATIHAN & LOOP A-B',
      icon: <Repeat size={13} color="#ffb86c" />,
      items: [
        { keys: ['['], description: 'Pasang Titik A (Awal Loop)' },
        { keys: [']'], description: 'Pasang Titik B (Akhir Loop)' },
        { keys: ['Backspace'], description: 'Hapus Pengaturan Loop A-B' },
        { keys: ['T'], description: 'Toggle Speed Trainer (+5% per loop)' },
        { keys: ['M'], description: 'Nyalakan / Matikan Metronom' },
      ],
    },
    {
      title: 'FRETBOARD & TEORI',
      icon: <Music size={13} color="#8be9fd" />,
      items: [
        { keys: ['S'], description: 'Buka / Tutup Scale Lab (Roadmap)', badge: 'Scale' },
        { keys: ['F'], description: 'Balik Senar (Player POV)', badge: 'Flip' },
        { keys: ['Shift', '↑'], description: 'Transpose +1 Semitone (½ nada)' },
        { keys: ['Shift', '↓'], description: 'Transpose -1 Semitone (½ nada)' },
      ],
    },
    {
      title: 'SISTEM & BANTUAN',
      icon: <Sparkles size={13} color="var(--accent-green)" />,
      items: [
        { keys: ['Z'], description: 'Stage / Fullscreen Focus Mode (Zen Mode)', badge: 'Zen' },
        { keys: ['C'], description: 'Ganti Tema Studio (Cyber / Parchment / Stealth)', badge: 'Theme' },
        { keys: ['?'], description: 'Buka Cheat Sheet Pintasan Ini' },
        { keys: ['Esc'], description: 'Tutup Jendela Modal' },
      ],
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'backdropFadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 24px var(--accent-coral-glow)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-coral-glow)',
                border: '1px solid var(--accent-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-coral)',
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: 'var(--accent-coral)',
                  letterSpacing: '1.2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>\\ SYSTEM COMMANDS</span>
                <span style={{ color: 'var(--border-strong)' }}>/</span>
                <span>QUICK REFERENCE</span>
              </div>
              <h2
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '15px',
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                  color: 'var(--text-primary)',
                }}
              >
                KEYBOARD SHORTCUTS
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="studio-btn-base"
            style={{
              background: 'var(--bg-control)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
            title="Tutup (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: 2x2 Grid of Categories */}
        <div
          style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '16px',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {categories.map((cat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-control)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '14px',
              }}
            >
              {/* Category Title */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '8px',
                }}
              >
                {cat.icon}
                <span>{cat.title}</span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.description}
                    </span>

                    {/* Keycap Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: k.length > 2 ? 'auto' : '22px',
                            padding: '2px 7px',
                            height: '22px',
                            fontSize: '10px',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-medium)',
                            borderBottom: '2px solid var(--border-strong)',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                            userSelect: 'none',
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--accent-coral)" style={{ flexShrink: 0 }} />
            <span>Tekan <kbd style={{ padding: '1px 5px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: '3px', color: 'var(--text-primary)' }}>?</kbd> kapan saja untuk membuka panduan ini.</span>
          </div>

          <button
            onClick={onClose}
            className="studio-btn-base"
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--bg-control)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '10.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            TUTUP (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
