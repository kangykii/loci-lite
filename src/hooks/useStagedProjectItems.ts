import { useEffect, useMemo, useRef, useState } from 'react';
import { searchLeaveDurationMs } from '../lib/searchStaggerTiming';
import type { DocumentProjectItem } from '../lib/documentProjectFolders';

function itemKey(item: DocumentProjectItem): string {
  const ids = item.members.map((member) => member.id).sort().join(',');
  return `${item.representative.projectGroupLabel ?? item.representative.id}:${ids}`;
}

export function useStagedProjectItems(searchQuery: string, items: DocumentProjectItem[]) {
  const [displayedItems, setDisplayedItems] = useState(items);
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsKey = useMemo(() => items.map(itemKey).join('\0'), [items]);
  const displayedKey = useMemo(() => displayedItems.map(itemKey).join('\0'), [displayedItems]);
  const previousQueryRef = useRef(searchQuery);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const queryChanged = previousQueryRef.current !== searchQuery;
    if (!queryChanged && displayedKey === itemsKey) return;
    previousQueryRef.current = searchQuery;

    setIsLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDisplayedItems(items);
      setIsLeaving(false);
    }, searchLeaveDurationMs(displayedItems.length));
  }, [displayedItems.length, displayedKey, items, itemsKey, searchQuery]);

  return { displayedItems, isLeaving };
}
