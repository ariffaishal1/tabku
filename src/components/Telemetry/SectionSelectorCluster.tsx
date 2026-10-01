import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { SectionMarker } from '../../services/timelineExtractor';
import { getSectionStyle, SectionIcon } from '../../utils/sectionColors';
import { formatTime } from '../../utils/guitarMath';

interface SectionSelectorClusterProps {
  barIndex: number;
  tempo: number;
  timeSignature?: string;
  sections?: SectionMarker[];
  activeSection: SectionMarker | null;
  activeSectionDisplayName: string;
  onPrevSection?: () => void;
  onNextSection?: () => void;
  onSeek: (seconds: number) => void;
}

/**
 * DAW cluster displaying the active Bar number and an interactive Section selector
 * with previous/next buttons and a popover dropdown of all song sections.
 */
export const SectionSelectorCluster: React.FC<SectionSelectorClusterProps> = ({
  barIndex,
  tempo,
  timeSignature = '4/4',
  sections,
  activeSection,
  activeSectionDisplayName,
  onPrevSection,
  onNextSection,
  onSeek,
}) => {
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const sectionMenuRef = useRef<HTMLDivElement>(null);

  const formattedBar = barIndex < 10 ? `00${barIndex}` : barIndex < 100 ? `0${barIndex}` : `${barIndex}`;
  const activeStyle = getSectionStyle(activeSectionDisplayName);
  const hasSections = Boolean(sections && sections.length > 0);

  // Dismiss section jump popover on outside click or Escape
  useEffect(() => {
    if (!isSectionMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionMenuRef.current && !sectionMenuRef.current.contains(event.target as Node)) {
        setIsSectionMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSectionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSectionMenuOpen]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        position: 'relative',
      }}
      ref={sectionMenuRef}
    >
      {/* Bar Badge */}
      <div
        style={{
          backgroundColor: 'var(--bg-control)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '2px 6px',
          fontSize: '9.5px',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-coral)',
          letterSpacing: '0.4px',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          boxSizing: 'border-box',
        }}
        title={`Birama aktif: Bar ${barIndex}\nTempo: ${tempo} BPM · ${timeSignature}`}
      >
        BAR {formattedBar}
      </div>

      {/* Section Switcher & Popover Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-control)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '1px',
          height: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Prev Section Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevSection?.();
          }}
          disabled={!hasSections}
          title="Bagian Sebelumnya (Shift + ←)"
          style={{
            width: '18px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '2px',
            color: hasSections ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: hasSections ? 'pointer' : 'not-allowed',
            opacity: hasSections ? 1 : 0.4,
            padding: 0,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (hasSections) e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            if (hasSections) e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <ChevronLeft size={11} />
        </button>

        {/* Active Section Pill (Dropdown Trigger) */}
        <button
          onClick={() => {
            if (hasSections) {
              setIsSectionMenuOpen((prev) => !prev);
            }
          }}
          disabled={!hasSections}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 5px',
            height: '20px',
            backgroundColor: isSectionMenuOpen ? 'var(--bg-surface-elevated)' : 'transparent',
            border: '1px solid',
            borderColor: isSectionMenuOpen ? activeStyle.color : 'transparent',
            borderRadius: '2px',
            cursor: hasSections ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
          }}
          title={
            hasSections
              ? `Bagian Lagu: ${activeSectionDisplayName} (Klik untuk daftar section)\nBirama: ${barIndex}\nTempo: ${tempo} BPM · ${timeSignature}`
              : undefined
          }
        >
          <SectionIcon category={activeStyle.category} size={11} color={activeStyle.color} />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: activeStyle.color,
              maxWidth: '85px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeSectionDisplayName}
          </span>
          {hasSections && (
            <ChevronDown
              size={10}
              style={{
                color: 'var(--text-muted)',
                transform: isSectionMenuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }}
            />
          )}
        </button>

        {/* Next Section Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNextSection?.();
          }}
          disabled={!hasSections}
          title="Bagian Berikutnya (Shift + →)"
          style={{
            width: '18px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '2px',
            color: hasSections ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: hasSections ? 'pointer' : 'not-allowed',
            opacity: hasSections ? 1 : 0.4,
            padding: 0,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (hasSections) e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            if (hasSections) e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <ChevronRight size={11} />
        </button>
      </div>

      {/* Section Jump Popover */}
      {isSectionMenuOpen && sections && sections.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            width: '240px',
            maxHeight: '260px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.15)',
            padding: '6px',
            zIndex: 100,
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px 6px 6px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '2px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                letterSpacing: '0.8px',
              }}
            >
              BAGIAN LAGU ({sections.length})
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              Shift + ← / →
            </span>
          </div>

          {sections.map((sec, idx) => {
            const isCurrent = activeSection?.name === sec.name && activeSection?.startMs === sec.startMs;
            const secStyle = getSectionStyle(sec.name);
            return (
              <button
                key={`popover-sec-${idx}`}
                onClick={() => {
                  onSeek(sec.startMs / 1000);
                  setIsSectionMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '5px',
                  border: isCurrent ? `1px solid ${secStyle.color}` : '1px solid transparent',
                  backgroundColor: isCurrent ? secStyle.bg : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '8px',
                  transition: 'all 0.12s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-control)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <SectionIcon category={secStyle.category} size={13} color={secStyle.color} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isCurrent ? 800 : 600,
                        color: isCurrent ? secStyle.color : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sec.name}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Bar {sec.barIndex}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: isCurrent ? secStyle.color : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  {formatTime(sec.startMs / 1000)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
