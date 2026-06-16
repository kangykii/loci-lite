import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveProjectFolderName } from '../lib/documentProjectFolders';
import { isTauri } from '../lib/tauri';
import { getProjectFolderNames, setProjectFolderName } from '../store/projectFolderNames.store';

export function useProjectFolderNames(groupLabels: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});
  const labelKey = useMemo(() => [...new Set(groupLabels)].sort().join('\0'), [groupLabels]);

  useEffect(() => {
    if (!isTauri() || groupLabels.length === 0) {
      setNames({});
      return;
    }

    let cancelled = false;
    void getProjectFolderNames(groupLabels).then((stored) => {
      if (!cancelled) {
        setNames(stored);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [groupLabels, labelKey]);

  const renameProjectFolder = useCallback(async (groupLabel: string, name: string) => {
    const nextName = resolveProjectFolderName(name);
    setNames((current) => ({ ...current, [groupLabel]: nextName }));
    await setProjectFolderName(groupLabel, nextName);
  }, []);

  return { names, renameProjectFolder };
}
