import { useEffect } from 'react';
import ProfileAccount from '../components/profile/ProfileAccount';
import { useAuthContext } from '../hooks/useAuthContext';
import type { Theme } from '../lib/theme';

type AccountViewProps = {
  onOpenProfile: () => void;
  onThemeSelect: (theme: Theme) => void;
  theme: Theme;
};

export default function AccountView({ onOpenProfile, onThemeSelect, theme }: AccountViewProps) {
  const { isAuthenticated, refreshProfile } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) void refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  return (
    <main className="app-shell account-view">
      <div className="account-stack">
        <h1 className="account-page-title">Account</h1>
        {isAuthenticated ? (
          <ProfileAccount onThemeSelect={onThemeSelect} theme={theme} />
        ) : (
          <section className="profile-panel" aria-labelledby="account-anonymous-title">
            <div className="profile-welcome">
              <h3 id="account-anonymous-title">Create a free account</h3>
              <p className="profile-dialog-message">
                Save your profile, then upgrade when you are ready for Modern Writer.
              </p>
            </div>
            <button className="profile-button-primary account-auth-button" onClick={onOpenProfile} type="button">
              Create a free account
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
