import { useEffect, useState } from 'react';
import { isTauri } from '../lib/tauri';
import { listAllFiles, listRecentFiles, type FileRecord } from '../store/files.store';

const RECENT_NOTES_LIMIT = 5;
const PINNED_NOTES_LIMIT = 3;

type SidebarNotesStatus = 'loading' | 'ready' | 'error';

export function useSidebarNotes(listRefreshKey: number) {
  const [recentNotes, setRecentNotes] = useState<FileRecord[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<FileRecord[]>([]);
  const [status, setStatus] = useState<SidebarNotesStatus>('loading');

  useEffect(() => {
    let isCurrent = true;

    if (!isTauri()) {
      setRecentNotes([]);
      setPinnedNotes([]);
      setStatus('ready');
      return () => {
        isCurrent = false;
      };
    }

    setStatus('loading');

    void Promise.all([listRecentFiles(RECENT_NOTES_LIMIT), listAllFiles()])
      .then(([recent, allNotes]) => {
        if (!isCurrent) {
          return;
        }

        setRecentNotes(recent);
        setPinnedNotes(
          allNotes
            .filter((note) => note.pinned)
            .sort((left, right) => right.openedAt - left.openedAt)
            .slice(0, PINNED_NOTES_LIMIT),
        );
        setStatus('ready');
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setRecentNotes([]);
        setPinnedNotes([]);
        setStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [listRefreshKey]);

  return { pinnedNotes, recentNotes, status };
}
