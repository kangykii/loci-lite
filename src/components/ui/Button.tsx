import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({ children, disabled, onClick }: ButtonProps) {
  return (
    <button disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  );
}
