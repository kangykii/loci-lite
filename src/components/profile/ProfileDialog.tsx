import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import ProfileSignIn from './ProfileSignIn';
import ProfileSetup from './ProfileSetup';

type ProfileDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export default function ProfileDialog({
  isOpen,
  onComplete,
  onClose,
}: ProfileDialogProps) {
  const titleId = useId();
  const { isAuthenticated, profile, profileReady } = useAuthContext();
  const needsSetup = isAuthenticated && profileReady && !profile?.displayName.trim();
  const title = isAuthenticated ? (needsSetup ? 'Finish setup' : 'Account') : 'Unlock cosmetics';

  useEffect(() => {
    if (isOpen && isAuthenticated && profileReady && !needsSetup) {
      onComplete();
    }
  }, [isAuthenticated, isOpen, needsSetup, onComplete, profileReady]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="profile-dialog-layer" role="presentation">
      <button
        aria-label="Close profile"
        className="profile-dialog-scrim"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="profile-dialog"
        role="dialog"
      >
        <h2 className="profile-dialog-title" id={titleId}>
          {title}
        </h2>
        {needsSetup ? (
          <ProfileSetup onComplete={onComplete} />
        ) : isAuthenticated && !profileReady ? (
          <p className="profile-dialog-message">Loading account...</p>
        ) : (
          <ProfileSignIn />
        )}
      </div>
    </div>,
    document.body,
  );
}
