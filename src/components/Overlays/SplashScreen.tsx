import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface SplashScreenProps {
  isLoading: boolean;
  progress: number; // 0 to 100
  statusText: string;
  error?: string | null;
  onRetry?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  progress,
  statusText,
  error,
  onRetry,
}) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !error) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 600); // 600ms match fade transition
      return () => clearTimeout(timer);
    } else if (isLoading) {
      setShouldRender(true);
      setIsFadingOut(false);
    }
  }, [isLoading, error]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#120e0e',
        background: 'radial-gradient(circle at 50% 40%, #1e1616 0%, #120e0e 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s ease',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        userSelect: 'none',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#8c7d7d',
            marginBottom: '10px',
          }}
        >
          <span style={{ color: '#FF7A65' }}>\\</span>
          <span>CYBER AUDIO STUDIO</span>
          <span style={{ color: '#524545' }}>/</span>
          <span style={{ color: '#FF7A65' }}>DEVELOP DEVICE STYLE</span>
        </div>

        {/* Big Brand Title */}
        <h1
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '36px',
            fontWeight: 900,
            letterSpacing: '1px',
            color: '#ffffff',
            margin: '0 0 6px 0',
            textShadow: '0 0 30px rgba(255, 122, 101, 0.25)',
          }}
        >
          TAB<span style={{ color: '#FF7A65' }}>KU</span>
        </h1>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#c5b8b8',
            letterSpacing: '1px',
            marginBottom: '32px',
          }}
        >
          2D STRING FLOW ANIMATED TAB VISUALIZER
        </div>

        {error ? (
          /* Error State */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              padding: '20px',
              backgroundColor: 'rgba(255, 85, 85, 0.1)',
              border: '1px solid #ff5555',
              borderRadius: '8px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <AlertCircle size={28} color="#ff5555" />
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#ff8888',
              }}
            >
              Gagal Memuat Audio Engine
            </div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '11.5px',
                color: '#c5b8b8',
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="studio-btn-coral"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#FF7A65',
                  color: '#120e0e',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                <RefreshCw size={13} />
                <span>COBA LAGI</span>
              </button>
            )}
          </div>
        ) : (
          /* Loading State */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Progress Bar Container */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#221919',
                border: '1px solid #3d2f2f',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '14px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(5, Math.min(100, progress))}%`,
                  backgroundColor: '#FF7A65',
                  boxShadow: '0 0 14px rgba(255, 122, 101, 0.8)',
                  borderRadius: '3px',
                  transition: 'width 0.25s ease-out',
                }}
              />
            </div>

            {/* Readout Status & Percentage */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#a09191',
                marginBottom: '28px',
              }}
            >
              <span style={{ color: '#FF7A65', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="spin-anim" style={{ display: 'inline-block' }}>⚙️</span>
                <span>{statusText}</span>
              </span>
              <span style={{ color: '#ffffff', fontWeight: 900 }}>
                {Math.round(progress)}%
              </span>
            </div>

            {/* Tip pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid #2b2222',
                color: '#8c7d7d',
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
              }}
            >
              <span style={{ color: '#ffb86c' }}>💡 TIP:</span>
              <span>Tekan <strong style={{ color: '#ffffff' }}>[Spasi]</strong> untuk Play/Pause, <strong style={{ color: '#ffffff' }}>[?]</strong> untuk panduan keyboard</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
