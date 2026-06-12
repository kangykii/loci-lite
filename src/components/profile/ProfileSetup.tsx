import { useState, type FormEvent } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNotifications } from '../../hooks/useNotifications';

type ProfileSetupProps = {
  onComplete: () => void;
};

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { renameProfile, setPassword } = useAuthContext();
  const { notifyError, notifySaved } = useNotifications();
  const [name, setName] = useState('');
  const [password, setPasswordDraft] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const canSubmit = name.trim().length > 0 && password.length >= 8;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !canSubmit) return;
    setIsBusy(true);
    const passwordResult = await setPassword(password);
    if (passwordResult.error) {
      setIsBusy(false);
      notifyError(passwordResult.error);
      return;
    }
    const nameSaved = await renameProfile(name);
    setIsBusy(false);
    if (!nameSaved) {
      notifyError('Could not update name');
      return;
    }
    notifySaved();
    onComplete();
  };

  return (
    <form className="profile-panel" onSubmit={(event) => void handleSubmit(event)}>
      <p className="profile-dialog-message">
        Add your name and password to finish setting up this account on this device.
      </p>
      <label className="profile-field-label" htmlFor="profile-setup-name">Name</label>
      <input
        autoFocus
        className="profile-input"
        disabled={isBusy}
        id="profile-setup-name"
        maxLength={60}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        type="text"
        value={name}
      />
      <label className="profile-field-label" htmlFor="profile-setup-password">Password</label>
      <input
        className="profile-input"
        disabled={isBusy}
        id="profile-setup-password"
        onChange={(event) => setPasswordDraft(event.target.value)}
        placeholder="At least 8 characters"
        type="password"
        value={password}
      />
      <button className="profile-button-primary" disabled={isBusy || !canSubmit} type="submit">
        {isBusy ? 'Saving...' : 'Continue'}
      </button>
    </form>
  );
}
