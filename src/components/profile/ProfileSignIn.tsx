import { useState, type FormEvent, useRef, useEffect } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import ProfileCodeEntry from './ProfileCodeEntry';
import ProfilePasswordLogin from './ProfilePasswordLogin';

type SignInStep = 'email' | 'code';
type SignInMode = 'signup' | 'password' | 'code';

const otpCodeLength = 8;

export default function ProfileSignIn() {
  const { loginWithPassword, sendCode, verifyCode } = useAuthContext();
  const { notifyError } = useNotifications();
  const [step, setStep] = useState<SignInStep>('email');
  const [mode, setMode] = useState<SignInMode>('signup');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => codeRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSendCode = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !email.trim()) return;
    setIsBusy(true);
    const result = await sendCode(email.trim(), mode === 'signup');
    setIsBusy(false);
    if (result.error) {
      notifyError(result.error);
      return;
    }
    setStep('code');
  };

  const handleResendCode = async () => {
    if (isBusy || !email.trim()) return;
    setIsBusy(true);
    const result = await sendCode(email.trim(), mode === 'signup');
    setIsBusy(false);
    if (result.error) {
      notifyError(result.error);
    }
  };

  const handleVerifyCode = async (token: string) => {
    if (isBusy) return;
    setIsBusy(true);
    const result = await verifyCode(email.trim(), token);
    setIsBusy(false);
    if (result.error) {
      notifyError(`${result.error} - check the code and try again.`);
      setCode('');
    }
  };

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !email.trim() || password.length < 8) return;
    setIsBusy(true);
    const result = await loginWithPassword(email.trim(), password);
    setIsBusy(false);
    if (result.error) {
      notifyError(result.error);
    }
  };

  const handleCodeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, otpCodeLength);
    setCode(digitsOnly);
    if (digitsOnly.length === otpCodeLength) {
      void handleVerifyCode(digitsOnly);
    }
  };

  const handleModeSwitch = (nextMode: SignInMode) => {
    if (isBusy) return;
    setMode(nextMode);
    setStep('email');
    setCode('');
    setPassword('');
  };

  const isSignup = mode === 'signup';
  const title = isSignup ? 'Create an account' : 'Log into existing account';
  const primaryLabel = isSignup ? 'Send code' : 'Send login code';
  const busyLabel = isSignup ? 'Sending...' : 'Sending login code...';

  return (
    <div className="profile-panel">
      <p className="profile-dialog-message">{title}. Writing never requires one.</p>
      {mode === 'password' ? (
        <ProfilePasswordLogin
          email={email}
          isBusy={isBusy}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={(event) => void handlePasswordLogin(event)}
          password={password}
        />
      ) : step === 'email' ? (
        <form className="profile-form" onSubmit={(event) => void handleSendCode(event)}>
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
            {isBusy ? busyLabel : primaryLabel}
          </button>
        </form>
      ) : (
        <ProfileCodeEntry
          code={code}
          codeLength={otpCodeLength}
          codeRef={codeRef}
          email={email}
          isBusy={isBusy}
          onChange={handleCodeChange}
          onResend={() => void handleResendCode()}
          onSubmit={(event) => { event.preventDefault(); void handleVerifyCode(code); }}
          onUseDifferentEmail={() => {
            setStep('email');
            setCode('');
          }}
        />
      )}
      <div className="profile-divider" role="presentation"><span>or</span></div>
      <button
        className="profile-button-secondary"
        disabled={isBusy}
        onClick={() => handleModeSwitch(mode === 'signup' ? 'password' : mode === 'password' ? 'code' : 'signup')}
        type="button"
      >
        {mode === 'signup' ? 'Log into existing account' : mode === 'password' ? 'Use login code' : 'Create new account'}
      </button>
    </div>
  );
}
