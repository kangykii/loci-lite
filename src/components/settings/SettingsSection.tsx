import type { ReactNode } from 'react';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SettingsSection({ children, title }: SettingsSectionProps) {
  const sectionId = `settings-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section className="settings-section" aria-labelledby={sectionId}>
      <h2 className="settings-section-title" id={sectionId}>
        {title}
      </h2>
      <div className="settings-section-rows">{children}</div>
    </section>
  );
}
