import React from 'react';
import type { SectionMarker } from '../../services/timelineExtractor';
import { getSectionStyle, SectionIcon } from '../../utils/sectionColors';
import { formatTime } from '../../utils/guitarMath';

interface SectionRibbonProps {
  sections?: SectionMarker[];
  duration: number;
  activeSection: SectionMarker | null;
  onSeek: (seconds: number) => void;
}

/**
 * DAW-grade arrangement overview ribbon showing colored blocks for each song section.
 */
export const SectionRibbon: React.FC<SectionRibbonProps> = ({
  sections,
  duration,
  activeSection,
  onSeek,
}) => {
  if (!sections || sections.length === 0 || duration <= 0) return null;

  return (
    <div
      className="telemetry-section-ribbon"
      style={{
        width: '100%',
        height: '13px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {sections.map((sec, idx) => {
        const startPct = (sec.startMs / (duration * 1000)) * 100;
        const durMs =
          sec.durationMs ??
          (idx < sections.length - 1 ? sections[idx + 1].startMs - sec.startMs : duration * 1000 - sec.startMs);
        const widthPct = Math.max(0.5, (durMs / (duration * 1000)) * 100);
        const isCurrent = activeSection?.name === sec.name && activeSection?.startMs === sec.startMs;
        const style = getSectionStyle(sec.name);

        return (
          <div
            key={`ribbon-sec-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(sec.startMs / 1000);
            }}
            title={`Lompat ke ${sec.name} (${formatTime(sec.startMs / 1000)}) · Bar ${sec.barIndex}`}
            style={{
              position: 'absolute',
              left: `${startPct}%`,
              width: `${widthPct}%`,
              height: '100%',
              backgroundColor: isCurrent ? style.bg : 'transparent',
              borderTop: isCurrent ? `2px solid ${style.color}` : `1px solid ${style.color}55`,
              borderRight: idx < sections.length - 1 ? '1px solid var(--border-medium)' : 'none',
              boxSizing: 'border-box',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0 3px',
              gap: '2px',
              overflow: 'hidden',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              boxShadow: isCurrent ? `inset 0 0 6px ${style.bg}` : 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isCurrent ? style.bg : 'var(--bg-control)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isCurrent ? style.bg : 'transparent';
            }}
          >
            <SectionIcon
              category={style.category}
              size={8}
              color={isCurrent ? style.color : 'var(--text-secondary)'}
            />
            <span
              style={{
                fontSize: '8px',
                fontFamily: 'var(--font-mono)',
                fontWeight: isCurrent ? 800 : 600,
                color: isCurrent ? style.color : 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '13px',
              }}
            >
              {sec.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
