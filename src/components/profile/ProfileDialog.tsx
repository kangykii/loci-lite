import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import ProfileAccount from './ProfileAccount';
import ProfileSignIn from './ProfileSignIn';

type ProfileDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const titleId = useId();
  const { isAuthenticated } = useAuthContext();

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
          {isAuthenticated ? 'Account' : 'Unlock cosmetics'}
        </h2>
        {isAuthenticated ? <ProfileAccount /> : <ProfileSignIn />}
      </div>
    </div>,
    document.body,
  );
}
