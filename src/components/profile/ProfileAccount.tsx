import { useEffect, useState, type FormEvent } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNotifications } from '../../hooks/useNotifications';

function profileInitial(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || '?';
  return source.charAt(0).toUpperCase();
}

export default function ProfileAccount() {
  const { email, profile, isModernWriter, renameProfile, signOut } = useAuthContext();
  const { notifySaved, notifyError } = useNotifications();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const savedName = profile?.displayName ?? '';
  const isDirty = name.trim() !== savedName && name.trim().length > 0;

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !isDirty) return;
    setIsBusy(true);
    const ok = await renameProfile(name);
    setIsBusy(false);
    if (ok) {
      notifySaved();
    } else {
      notifyError('Could not update name');
    }
  };

  const handleSignOut = async () => {
    if (isBusy) return;
    setIsBusy(true);
    await signOut();
    setIsBusy(false);
  };

  return (
    <div className="profile-panel">
      <div className="profile-identity">
        <span aria-hidden="true" className="profile-avatar">
          {profileInitial(savedName, email)}
        </span>
        <div className="profile-identity-copy">
          <strong>{savedName || 'Writer'}</strong>
          <span>{email ?? ''}</span>
        </div>
        <span className="profile-tier">{isModernWriter ? 'Modern Writer' : 'Standard'}</span>
      </div>
      <form className="profile-form" onSubmit={(event) => void handleRename(event)}>
        <label className="profile-field-label" htmlFor="profile-display-name">
          Display name
        </label>
        <div className="profile-field-row">
          <input
            className="profile-input"
            disabled={isBusy}
            id="profile-display-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            type="text"
            value={name}
          />
          {isDirty ? (
            <button className="profile-button-primary" disabled={isBusy} type="submit">
              {isBusy ? 'Saving…' : 'Save'}
            </button>
          ) : null}
        </div>
      </form>
      <div className="profile-actions">
        <button
          className="profile-signout"
          disabled={isBusy}
          onClick={() => void handleSignOut()}
          type="button"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
