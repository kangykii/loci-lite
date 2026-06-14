import { useAiWelcomeMessages } from '../../hooks/useAiWelcomeMessages';

export default function WelcomeHeading() {
  const { greeting, message, sign } = useAiWelcomeMessages();

  return (
    <section className="home-hero">
      <h1 className="home-welcome">
        {greeting ? <span className="home-welcome-greeting">{greeting}</span> : null}
        <span className="home-welcome-body">{message}</span>
        {sign ? <span className="home-welcome-sign">{sign}</span> : null}
      </h1>
    </section>
  );
}
