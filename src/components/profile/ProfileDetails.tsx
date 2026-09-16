import { useEffect, useState, type FormEvent } from 'react';

import type { LocalProfile } from '../../store/settings.store';

type ProfileDetailsProps = {
  profile: LocalProfile;
  ready: boolean;
  onSave: (profile: LocalProfile) => Promise<boolean>;
};

function profileInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export default function ProfileDetails({ onSave, profile, ready }: ProfileDetailsProps) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setBio(profile.bio);
  }, [profile]);

  const isDirty = name.trim() !== profile.name || bio.trim() !== profile.bio;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isDirty || isBusy) return;

    setIsBusy(true);
    await onSave({ name, bio });
    setIsBusy(false);
  };

  return (
    <section className="profile-home-card" aria-labelledby="profile-details-title">
      <div className="profile-identity">
        <span aria-hidden="true" className="profile-avatar">{profileInitial(name)}</span>
        <div className="profile-identity-copy">
          <strong>{name.trim() || 'Your profile'}</strong>
          <span>Stored on this device</span>
        </div>
      </div>
      <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="profile-welcome">
          <h2 className="profile-section-title" id="profile-details-title">About you</h2>
          <p className="profile-dialog-message">Add the details you want Loci to remember.</p>
        </div>
        <label className="profile-field-label" htmlFor="profile-display-name">Name</label>
        <input
          className="profile-input"
          disabled={!ready || isBusy}
          id="profile-display-name"
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          type="text"
          value={name}
        />
        <label className="profile-field-label" htmlFor="profile-bio">Bio</label>
        <textarea
          className="profile-input profile-bio-input"
          disabled={!ready || isBusy}
          id="profile-bio"
          maxLength={280}
          onChange={(event) => setBio(event.target.value)}
          placeholder="A little about you"
          rows={4}
          value={bio}
        />
        <button className="profile-button-primary" disabled={!ready || isBusy || !isDirty} type="submit">
          {isBusy ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}
