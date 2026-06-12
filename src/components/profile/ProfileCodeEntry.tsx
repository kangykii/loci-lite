import type { FormEvent, RefObject } from 'react';

type ProfileCodeEntryProps = {
  code: string;
  codeLength: number;
  codeRef: RefObject<HTMLInputElement | null>;
  email: string;
  isBusy: boolean;
  onChange: (value: string) => void;
  onResend: () => void;
  onSubmit: (event: FormEvent) => void;
  onUseDifferentEmail: () => void;
};

export default function ProfileCodeEntry({
  code,
  codeLength,
  codeRef,
  email,
  isBusy,
  onChange,
  onResend,
  onSubmit,
  onUseDifferentEmail,
}: ProfileCodeEntryProps) {
  return (
    <form className="profile-form" onSubmit={onSubmit}>
      <p className="profile-dialog-message">Check {email} - enter the {codeLength}-digit code from the email.</p>
      <input
        ref={codeRef}
        className="profile-input profile-input-code"
        disabled={isBusy}
        inputMode="numeric"
        maxLength={codeLength}
        onChange={(event) => onChange(event.target.value)}
        pattern="[0-9]*"
        placeholder="00000000"
        type="text"
        value={code}
      />
      <button className="profile-button-primary" disabled={isBusy || code.length < codeLength} type="submit">
        {isBusy ? 'Verifying...' : 'Verify code'}
      </button>
      <button className="profile-text-button" disabled={isBusy} onClick={onResend} type="button">
        Resend code
      </button>
      <button className="profile-text-button" disabled={isBusy} onClick={onUseDifferentEmail} type="button">
        Use a different email
      </button>
    </form>
  );
}
