import { useCallback, useEffect, useRef, useState } from 'react';

export type ViewName = 'home' | 'editor' | 'documents' | 'atoms' | 'settings';

export type TransitionType = 'tab' | 'open' | 'close' | 'none';

type ViewState = 'idle' | 'leaving' | 'entering';

export interface ViewConfig {
  name: ViewName;
  state: ViewState;
  transition: TransitionType;
}

// Exit durations — must match CSS leave tokens exactly
const EXIT_DURATION: Record<TransitionType, number> = {
  tab: 180,
  open: 200,
  close: 200,
  none: 0,
};

// Enter durations — must match CSS enter tokens exactly
const ENTER_DURATION: Record<TransitionType, number> = {
  tab: 220,
  open: 280,
  close: 300,
  none: 0,
};

function resolveTransition(from: ViewName, to: ViewName): TransitionType {
  if (to === 'editor') return 'open';
  if (from === 'editor') return 'close';
  return 'tab';
}

export function useViewTransition(initial: ViewName = 'home') {
  const [current, setCurrent] = useState<ViewConfig>({
    name: initial,
    state: 'idle',
    transition: 'none',
  });
  const [leaving, setLeaving] = useState<ViewConfig | null>(null);
  const [pendingTarget, setPendingTarget] = useState<ViewName | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const navigate = useCallback(
    (to: ViewName, override?: TransitionType) => {
      setCurrent((prev) => {
        if (prev.name === to && prev.state === 'idle') {
          return prev;
        }

        const transition = override ?? resolveTransition(prev.name, to);
        const exitDuration = EXIT_DURATION[transition];
        const enterDuration = ENTER_DURATION[transition];

        setLeaving({ ...prev, state: 'leaving', transition });
        setPendingTarget(to);
        clearTimers();

        exitTimerRef.current = setTimeout(() => {
          setLeaving(null);
          setCurrent({ name: to, state: 'entering', transition });

          enterTimerRef.current = setTimeout(() => {
            setCurrent((config) =>
              config.name === to ? { ...config, state: 'idle' } : config,
            );
            setPendingTarget(null);
          }, enterDuration);
        }, exitDuration);

        return prev;
      });
    },
    [clearTimers],
  );

  const displayView = pendingTarget ?? current.name;

  return { current, leaving, navigate, displayView };
}
