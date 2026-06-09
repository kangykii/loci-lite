import type { ReactNode } from 'react';

type SettingsRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
};

export default function SettingsRow({ children, description, label }: SettingsRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <span className="settings-row-label">{label}</span>
        {description ? <span className="settings-row-description">{description}</span> : null}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}
