import { useEffect, useRef, useState } from 'react';
import { searchLeaveDurationMs } from '../lib/searchStaggerTiming';

export function useSearchStagger<T>(searchQuery: string, items: T[]) {
  const [displayedItems, setDisplayedItems] = useState(items);
  const [isLeaving, setIsLeaving] = useState(false);
  const prevQueryRef = useRef(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (prevQueryRef.current === searchQuery) {
      setDisplayedItems(items);
      return;
    }

    prevQueryRef.current = searchQuery;
    setIsLeaving(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const leaveMs = searchLeaveDurationMs(displayedItems.length);

    timerRef.current = setTimeout(() => {
      setDisplayedItems(items);
      setIsLeaving(false);
    }, leaveMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [displayedItems.length, items, searchQuery]);

  return {
    displayedItems,
    isLeaving,
  };
}
