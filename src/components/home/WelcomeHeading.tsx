import { useAiWelcomeMessages } from '../../hooks/useAiWelcomeMessages';

export default function WelcomeHeading() {
  const { message } = useAiWelcomeMessages();

  return (
    <section className="home-hero">
      <h1 className="home-welcome">{message}</h1>
    </section>
  );
}
