import { useState, type FormEvent } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';

type SignInStep = 'email' | 'code';

export default function ProfileSignIn() {
  const { signInWithMagicLink, signInWithGoogle, verifyEmailCode } = useAuthContext();
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSendLink = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !email.trim()) return;
    setIsBusy(true);
    setError(null);
    const result = await signInWithMagicLink(email.trim());
    setIsBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep('code');
  };

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !code.trim()) return;
    setIsBusy(true);
    setError(null);
    const result = await verifyEmailCode(email.trim(), code.trim());
    setIsBusy(false);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleGoogle = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    const result = await signInWithGoogle();
    setIsBusy(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="profile-panel">
      <p className="profile-dialog-message">
        An account syncs cosmetics across devices. Writing never requires one.
      </p>
      {step === 'email' ? (
        <form className="profile-form" onSubmit={(event) => void handleSendLink(event)}>
          <input
            autoFocus
            className="profile-input"
            disabled={isBusy}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <button className="profile-button-primary" disabled={isBusy || !email.trim()} type="submit">
            {isBusy ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      ) : (
        <form className="profile-form" onSubmit={(event) => void handleVerifyCode(event)}>
          <p className="profile-dialog-message">
            Check {email} — click the link, or enter the code from the email.
          </p>
          <input
            autoFocus
            className="profile-input"
            disabled={isBusy}
            inputMode="numeric"
            onChange={(event) => setCode(event.target.value)}
            placeholder="6-digit code"
            type="text"
            value={code}
          />
          <button className="profile-button-primary" disabled={isBusy || !code.trim()} type="submit">
            {isBusy ? 'Verifying…' : 'Verify code'}
          </button>
          <button
            className="profile-text-button"
            disabled={isBusy}
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            type="button"
          >
            Use a different email
          </button>
        </form>
      )}
      <div className="profile-divider" role="presentation">
        <span>or</span>
      </div>
      <button
        className="profile-button-secondary"
        disabled={isBusy}
        onClick={() => void handleGoogle()}
        type="button"
      >
        {isBusy ? 'Waiting…' : 'Continue with Google'}
      </button>
      {error ? (
        <p className="profile-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
