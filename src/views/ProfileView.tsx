import ProfileDetails from '../components/profile/ProfileDetails';
import type { LocalProfile } from '../store/settings.store';

type ProfileViewProps = {
  profile: LocalProfile;
  ready: boolean;
  onSaveProfile: (profile: LocalProfile) => Promise<boolean>;
};

export default function ProfileView({ onSaveProfile, profile, ready }: ProfileViewProps) {
  return (
    <main className="app-shell profile-view">
      <div className="profile-stack">
        <h1 className="profile-page-title">Profile</h1>
        <ProfileDetails onSave={onSaveProfile} profile={profile} ready={ready} />
      </div>
    </main>
  );
}
