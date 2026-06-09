import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_STACK_NAME, resolveStackDisplayName } from '../lib/bookmarkStacks';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import {
  getStackDisplayNames,
  setStackDisplayName,
} from '../store/stackNames.store';

export function useStackDisplayNames(groupLabels: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});

  const labelKey = [...new Set(groupLabels)].sort().join('\0');

  useEffect(() => {
    if (!isTauri() || groupLabels.length === 0) {
      setNames({});
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await initDb();
        const stored = await getStackDisplayNames(groupLabels);

        if (cancelled) {
          return;
        }

        const resolved: Record<string, string> = {};

        for (const groupLabel of groupLabels) {
          resolved[groupLabel] = resolveStackDisplayName(stored[groupLabel]);
        }

        setNames(resolved);
      } catch {
        if (!cancelled) {
          setNames({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupLabels, labelKey]);

  const renameStack = useCallback(async (groupLabel: string, name: string) => {
    const trimmed = name.trim();
    const nextName = trimmed.length > 0 ? trimmed : DEFAULT_STACK_NAME;

    if (!isTauri()) {
      setNames((current) => ({ ...current, [groupLabel]: nextName }));
      return;
    }

    await initDb();
    await setStackDisplayName(groupLabel, nextName);
    setNames((current) => ({ ...current, [groupLabel]: nextName }));
  }, []);

  return { names, renameStack };
}
