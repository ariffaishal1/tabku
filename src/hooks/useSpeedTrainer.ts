import { useState, useRef, useCallback, useEffect } from 'react';

export function useSpeedTrainer(
  changeSpeed: (speed: number) => void,
  speedRef: React.RefObject<number>,
) {
  // State
  const [isSpeedTrainer, setIsSpeedTrainer] = useState(false);
  const [step, setStep] = useState(0.05);       // +5% (0.05x)
  const [target, setTarget] = useState(1.0);     // 100% (1.0x)
  const [loopCount, setLoopCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Refs for high-frequency RAF access
  const isSpeedTrainerRef = useRef(false);
  const stepRef = useRef(0.05);
  const targetRef = useRef(1.0);
  const triggerStepRef = useRef<() => void>(() => {});

  // Keep refs in sync
  useEffect(() => { isSpeedTrainerRef.current = isSpeedTrainer; }, [isSpeedTrainer]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { targetRef.current = target; }, [target]);

  // Auto-clear notification toast after 2.2s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2200);
    return () => clearTimeout(timer);
  }, [notification]);

  /** Bump speed by one step (called from RAF via triggerStepRef). */
  const triggerStep = useCallback(() => {
    const currentSpeed = speedRef.current ?? 1.0;
    const s = stepRef.current;
    const t = targetRef.current;

    if (currentSpeed < t) {
      const nextSpeed = Math.round(Math.min(t, currentSpeed + s) * 100) / 100;
      changeSpeed(nextSpeed);
      setLoopCount(prev => {
        const newCount = prev + 1;
        if (nextSpeed >= t) {
          setNotification(`🎯 TARGET TERCAPAI: ${Math.round(nextSpeed * 100)}% (Siklus ${newCount}x)!`);
        } else {
          setNotification(`⚡ TEMPO NAIK: ${Math.round(nextSpeed * 100)}% (+${Math.round(s * 100)}%) · Loop ${newCount}x`);
        }
        return newCount;
      });
    } else {
      setLoopCount(prev => {
        const newCount = prev + 1;
        setNotification(`🎯 SIKLUS ${newCount}x: TEMPO PENUH ${Math.round(t * 100)}%`);
        return newCount;
      });
    }
  }, [changeSpeed, speedRef]);

  // Keep triggerStepRef always pointing to the latest triggerStep
  useEffect(() => {
    triggerStepRef.current = triggerStep;
  }, [triggerStep]);

  return {
    // State
    isSpeedTrainer, setIsSpeedTrainer,
    step, setStep,
    target, setTarget,
    loopCount, setLoopCount,
    notification, setNotification,
    // Refs (for RAF loop)
    isSpeedTrainerRef,
    triggerStepRef,
  };
}
