import { useEffect, useState } from 'react';
import {
  getRemoteSessionSnapshot,
  type RemoteSessionSnapshot,
} from '../lib/remoteSessionCache';
import { syncRemoteProfile } from '../lib/syncRemoteProfile';

export function useRemoteSession(): RemoteSessionSnapshot {
  const [session, setSession] = useState(getRemoteSessionSnapshot);

  useEffect(() => {
    let cancelled = false;

    void syncRemoteProfile().then((next) => {
      if (!cancelled) {
        setSession(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}
