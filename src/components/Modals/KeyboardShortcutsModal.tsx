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
      icon: <Play size={13} color="#FF7A65" />,
      items: [
        { keys: ['Space'], description: 'Putar / Jeda Lagu (Play/Pause)' },
        { keys: ['←', '→'], description: 'Mundur / Maju 5 detik' },
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
      icon: <Sparkles size={13} color="#50fa7b" />,
      items: [
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
        backgroundColor: 'rgba(12, 9, 9, 0.78)',
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
          backgroundColor: '#161212',
          border: '1px solid #362c2c',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 24px rgba(255, 122, 101, 0.12)',
          color: '#ffffff',
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
            backgroundColor: '#1c1616',
            borderBottom: '1px solid #2a2020',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 122, 101, 0.15)',
                border: '1px solid rgba(255, 122, 101, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF7A65',
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#FF7A65',
                  letterSpacing: '1.2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>\\ SYSTEM COMMANDS</span>
                <span style={{ color: '#524545' }}>/</span>
                <span>QUICK REFERENCE</span>
              </div>
              <h2
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '15px',
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                  color: '#ffffff',
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
              background: '#241b1b',
              border: '1px solid #3d3030',
              borderRadius: '4px',
              color: '#c5b8b8',
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
                backgroundColor: '#1b1515',
                border: '1px solid #282020',
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
                  color: '#c5b8b8',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                  borderBottom: '1px solid #231b1b',
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
                        color: '#9e9191',
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
                            color: '#ffffff',
                            backgroundColor: '#261e1e',
                            border: '1px solid #453737',
                            borderBottom: '2px solid #5a4747',
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
            backgroundColor: '#191313',
            borderTop: '1px solid #282020',
            fontSize: '10px',
            color: '#7a6e6e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#FF7A65' }}>💡</span>
            <span>Tekan <kbd style={{ padding: '1px 5px', background: '#251e1e', border: '1px solid #3d3030', borderRadius: '3px', color: '#fff' }}>?</kbd> kapan saja untuk membuka panduan ini.</span>
          </div>

          <button
            onClick={onClose}
            className="studio-btn-base"
            style={{
              padding: '6px 14px',
              backgroundColor: '#261e1e',
              border: '1px solid #3d3030',
              borderRadius: '4px',
              color: '#d4c7c7',
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
