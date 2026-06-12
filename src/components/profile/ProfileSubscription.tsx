import { Check, CreditCard, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { openCustomerPortal, startModernWriterCheckout } from '../../lib/stripe';

export default function ProfileSubscription() {
  const { isModernWriter, refreshProfile } = useAuthContext();
  const { notifyError, notifySaved } = useNotifications();
  const [isBusy, setIsBusy] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setUpgradeError(null);
    const { error } = await startModernWriterCheckout();
    setIsBusy(false);
    if (error) {
      setUpgradeError(error);
      notifyError(error);
      return;
    }
    await refreshProfile();
  };

  const handlePortal = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setUpgradeError(null);
    const { error } = await openCustomerPortal();
    setIsBusy(false);
    if (error) {
      setUpgradeError(error);
      notifyError(error);
      return;
    }
    await refreshProfile();
    notifySaved();
  };

  const benefits = isModernWriter
    ? ['Plugins unlocked', 'Custom themes and exports', 'Priority writer support']
    : ['Unlimited plugins', 'Distraction-free focus mode', 'Custom themes and exports', 'Priority writer support'];

  return (
    <section
      className={`profile-subscription-card${isModernWriter ? ' is-active' : ''}`}
      aria-labelledby="profile-subscription-title"
    >
      <div className="profile-subscription-card-header">
        <span className="profile-subscription-kicker">
          <Sparkles size={15} strokeWidth={1.7} aria-hidden="true" />
          {isModernWriter ? 'Owned' : 'Upgrade'}
        </span>
        <div className="profile-subscription-price" aria-label={isModernWriter ? 'Modern Writer active' : '$2.99 per month'}>
          {isModernWriter ? (
            <span className="profile-active-badge">Active</span>
          ) : (
            <>
              <strong>$2.99</strong>
              <span>/ month</span>
              <small>Cancel anytime</small>
            </>
          )}
        </div>
      </div>
      <div className="profile-subscription-copy">
        <h3 className="profile-subscription-title" id="profile-subscription-title">
          Modern Writer
        </h3>
        <p>
          {isModernWriter
            ? 'Your writing room has the good tools on the shelf.'
            : 'Extend Loci with plugins built for writers. Connect your workflow, automate the repetitive parts, keep the writing yours.'}
        </p>
      </div>
      <ul className="profile-subscription-benefits" aria-label="Modern Writer benefits">
        {benefits.map((benefit) => (
          <li key={benefit}>
            <Check size={15} strokeWidth={2} aria-hidden="true" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      {upgradeError ? (
        <p className="profile-subscription-error" role="alert">
          {upgradeError}
        </p>
      ) : null}
      <div className="profile-subscription-actions">
        <button
          className="profile-button-primary profile-subscription-button"
          disabled={isBusy}
          onClick={() => void (isModernWriter ? handlePortal() : handleCheckout())}
          type="button"
        >
          {isModernWriter ? (
            <CreditCard size={16} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" />
          )}
          {isBusy ? 'Opening...' : isModernWriter ? 'Manage subscription' : 'Upgrade to Modern Writer'}
        </button>
        {!isModernWriter ? <span>Compare plans</span> : null}
      </div>
    </section>
  );
}
