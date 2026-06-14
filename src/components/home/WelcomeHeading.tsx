import { useEffect, useMemo, useState } from 'react';

import { useAiWelcomeMessages } from '../../hooks/useAiWelcomeMessages';

export default function WelcomeHeading() {
  const { greeting, message, sign } = useAiWelcomeMessages();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);

    return () => window.clearInterval(interval);
  }, []);

  const { dateLabel, timeLabel } = useMemo(
    () => ({
      dateLabel: new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
      }).format(now),
      timeLabel: new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(now),
    }),
    [now],
  );

  return (
    <section className="home-hero">
      <div className="home-hero-meta" aria-label={`${timeLabel}, ${dateLabel}`}>
        <time dateTime={now.toISOString()}>{timeLabel}</time>
        <time dateTime={now.toISOString()}>{dateLabel}</time>
      </div>
      <h1 className="home-welcome">
        {greeting ? <span className="home-welcome-greeting">{greeting}</span> : null}
        <span className="home-welcome-body">{message}</span>
        {sign ? <span className="home-welcome-sign">{sign}</span> : null}
      </h1>
    </section>
  );
}
