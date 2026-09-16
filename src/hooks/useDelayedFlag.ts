import { useEffect, useState } from 'react';

/** Below this, a fetch feels instant and showing a loading state would just flicker. */
export const LOADING_SKELETON_DELAY_MS = 200;

/**
 * Flips true only after `active` has stayed true continuously for `delayMs`.
 * If `active` goes false again before the delay elapses, this never flips —
 * no loading UI is shown at all.
 *
 * Every browse view (Home, Documents, sidebar library, Atoms) fully unmounts
 * on navigation and remounts — with fresh hook state — when revisited, so its
 * data-fetch effect reruns and sets `status: 'loading'` again even though the
 * same list was just shown moments ago against a warm local SQLite/fs read.
 * Without this buffer, that flips the skeleton on for a handful of
 * milliseconds on nearly every navigation — a flash of loading state, not a
 * loading state.
 */
export function useDelayedFlag(active: boolean, delayMs: number = LOADING_SKELETON_DELAY_MS): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setVisible(true), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [active, delayMs]);

  return visible;
}
