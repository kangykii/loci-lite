// One job: initiate Stripe-hosted billing flows for Modern Writer.

import { ENV } from './env';
import { getSession } from './auth';
import { invokeRemoteFunction } from './supabase';
import { isTauri, openUrl, waitForLocalCallback } from './tauri';

type StripeFlowResult = {
  error: string | null;
};

type CheckoutResponse = {
  url: string;
};

type PortalResponse = {
  url: string;
};

const STRIPE_RETURN_PORT = 49329;

function billingReturnUrl(): string {
  if (isTauri()) {
    return `http://localhost:${STRIPE_RETURN_PORT}/stripe-return?status=portal`;
  }
  return window.location.href;
}

function checkoutReturnUrls(): { successUrl: string; cancelUrl: string } {
  if (!isTauri()) {
    const returnUrl = billingReturnUrl();
    return { successUrl: returnUrl, cancelUrl: returnUrl };
  }
  const base = `http://localhost:${STRIPE_RETURN_PORT}/stripe-return`;
  return {
    successUrl: `${base}?status=success`,
    cancelUrl: `${base}?status=cancel`,
  };
}

async function waitForCheckoutReturn(): Promise<void> {
  if (!isTauri()) return;
  await waitForLocalCallback(STRIPE_RETURN_PORT);
}

export async function openCustomerPortal(): Promise<StripeFlowResult> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const { data, error } = await invokeRemoteFunction<PortalResponse>('create-portal-session', {
    returnUrl: billingReturnUrl(),
  });
  if (error || !data?.url) return { error: 'Could not open portal' };
  await openUrl(data.url);
  await waitForCheckoutReturn();
  return { error: null };
}

export async function startModernWriterCheckout(): Promise<StripeFlowResult> {
  if (!ENV.stripePublishableKey) return { error: 'Stripe is not configured' };
  if (!ENV.modernWriterPriceId) return { error: 'Stripe price is not configured' };
  const session = await getSession();
  if (!session) return { error: 'Please create an account first' };

  const { data, error } = await invokeRemoteFunction<CheckoutResponse>('create-checkout', {
    priceId: ENV.modernWriterPriceId,
    ...checkoutReturnUrls(),
  });
  if (error || !data?.url) return { error: 'Checkout failed - please try again' };
  await openUrl(data.url);
  await waitForCheckoutReturn();
  return { error: null };
}

export async function startBillingPortal(): Promise<string | null> {
  const result = await openCustomerPortal();
  return result.error;
}
