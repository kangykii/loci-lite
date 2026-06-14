import type { FormEvent } from 'react';

type ProfilePasswordLoginProps = {
  email: string;
  isBusy: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent) => void;
  password: string;
};

export default function ProfilePasswordLogin({
  email,
  isBusy,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
}: ProfilePasswordLoginProps) {
  return (
    <form className="profile-form" onSubmit={onSubmit}>
      <input
        autoFocus
        className="profile-input"
        disabled={isBusy}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@example.com"
        type="email"
        value={email}
      />
      <input
        className="profile-input"
        disabled={isBusy}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="Password"
        type="password"
        value={password}
      />
      <button
        className="profile-button-primary"
        disabled={isBusy || !email.trim() || password.length < 8}
        type="submit"
      >
        {isBusy ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}
