import { Check, Lock } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { notebookThemes, type NotebookTheme, type Theme } from '../../lib/theme';
import ProfileSubscription from './ProfileSubscription';

type ProfileAccountProps = {
  onThemeSelect: (theme: Theme) => void;
  theme: Theme;
};

function profileInitial(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || '?';
  return source.charAt(0).toUpperCase();
}

function canUseNotebookTheme(theme: NotebookTheme, isModernWriter: boolean, cosmetics: string[]): boolean {
  if (theme.access === 'free') return true;
  if (isModernWriter) return true;
  return Boolean(theme.cosmeticSlug && cosmetics.includes(theme.cosmeticSlug));
}

export default function ProfileAccount({ onThemeSelect, theme }: ProfileAccountProps) {
  const { cosmetics, email, profile, isModernWriter, renameProfile, signOut } = useAuthContext();
  const { notifySaved, notifyError } = useNotifications();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const savedName = profile?.displayName.trim() ?? '';
  const draftName = name.trim();
  const needsName = savedName.length === 0;
  const isDirty = draftName !== savedName && draftName.length > 0;

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !isDirty) return;
    setIsBusy(true);
    const ok = await renameProfile(draftName);
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
      <section className="profile-home-card" aria-labelledby="profile-welcome-title">
        <div className="profile-home-topline">
          <div className="profile-welcome">
            <h3 id="profile-welcome-title">{savedName ? `Welcome, ${savedName}` : 'Welcome'}</h3>
            {needsName ? (
              <p className="profile-dialog-message">Choose a name for your Loci Notepad account.</p>
            ) : (
              <p className="profile-dialog-message">Your writing room is ready.</p>
            )}
          </div>
          <span className="profile-tier">{isModernWriter ? 'Modern Writer' : 'Standard'}</span>
        </div>
        <div className="profile-identity">
          <span aria-hidden="true" className="profile-avatar">
            {profileInitial(savedName, email)}
          </span>
          <div className="profile-identity-copy">
            <strong>{savedName || 'Writer'}</strong>
            <span>{email ?? ''}</span>
          </div>
        </div>
        <form className="profile-form" onSubmit={(event) => void handleRename(event)}>
          <label className="profile-field-label" htmlFor="profile-display-name">
            Name
          </label>
          <div className="profile-field-row">
            <input
              autoFocus={needsName}
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
                {isBusy ? 'Saving...' : 'Save'}
              </button>
            ) : null}
          </div>
        </form>
      </section>
      <ProfileSubscription />
      <section className="profile-notebooks-section" aria-labelledby="profile-notebooks-title">
        <div className="profile-section-header">
          <div>
            <h3 className="profile-section-title" id="profile-notebooks-title">
              Notebooks
            </h3>
            <p className="profile-dialog-message">Pick the surface you write on.</p>
          </div>
        </div>
        <div className="profile-notebook-shelf">
          {notebookThemes.map((notebookTheme) => {
            const isActive = theme === notebookTheme.id;
            const isUnlocked = canUseNotebookTheme(notebookTheme, isModernWriter, cosmetics);
            return (
              <button
                aria-pressed={isActive}
                className={`profile-notebook-cover ${notebookTheme.coverClass}${isActive ? ' is-active' : ''}`}
                disabled={!isUnlocked}
                key={notebookTheme.id}
                onClick={() => onThemeSelect(notebookTheme.id)}
                type="button"
              >
                <span className="profile-notebook-spine" aria-hidden="true" />
                <span className="profile-notebook-page-edge" aria-hidden="true" />
                <span className="profile-notebook-rule profile-notebook-rule--top" aria-hidden="true" />
                <span className="profile-notebook-rule profile-notebook-rule--bottom" aria-hidden="true" />
                <span className="profile-notebook-copy">
                  <span className="profile-notebook-title-row">
                    <strong>{notebookTheme.name}</strong>
                    {isActive ? (
                      <span className="profile-notebook-check" aria-hidden="true">
                        <Check size={14} strokeWidth={2} />
                      </span>
                    ) : null}
                    {!isUnlocked ? (
                      <span className="profile-notebook-lock" aria-hidden="true">
                        <Lock size={13} strokeWidth={1.8} />
                      </span>
                    ) : null}
                  </span>
                  <span>{notebookTheme.description}</span>
                  {!isUnlocked ? <em>Modern Writer or owned notebook</em> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <div className="profile-footer-actions">
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
