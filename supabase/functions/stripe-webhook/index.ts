import Stripe from 'npm:stripe';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2026-02-25.clover',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
type StoredStatus = 'active' | 'inactive' | 'past_due' | 'canceled';
type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

function storedStatus(status: Stripe.Subscription.Status): StoredStatus {
  if (status === 'active') return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled') return 'canceled';
  return 'inactive';
}

function stripeId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

function periodEnd(subscription: Stripe.Subscription): string | null {
  const itemEnd = subscription.items.data[0]?.current_period_end;
  return itemEnd ? new Date(itemEnd * 1000).toISOString() : null;
}

async function findUserId(subscription: Stripe.Subscription): Promise<string | null> {
  const metadataUserId = subscription.metadata.user_id;
  if (metadataUserId) return metadataUserId;
  const customerId = stripeId(subscription.customer);
  if (!customerId) return null;
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function findUserIdBySubscriptionId(subscriptionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_sub_id', subscriptionId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const userId = await findUserId(subscription);
  if (!userId) throw new Error('Missing user_id for subscription');

  const status = storedStatus(subscription.status);
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeId(subscription.customer),
      stripe_sub_id: subscription.id,
      status,
      current_period_end: periodEnd(subscription),
    },
    { onConflict: 'user_id' },
  );

  await supabase
    .from('profiles')
    .update({ tier: status === 'active' ? 'modern_writer' : 'standard' })
    .eq('id', userId);
}

async function syncInvoice(invoice: InvoiceWithSubscription, status: StoredStatus): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) throw new Error('Missing invoice subscription');
  if (status === 'active') {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscription(subscription);
    return;
  }
  const userId = await findUserIdBySubscriptionId(subscriptionId);
  if (!userId) throw new Error('Missing user_id for invoice');
  await supabase.from('subscriptions').update({ status }).eq('user_id', userId);
  if (status !== 'active') {
    await supabase.from('profiles').update({ tier: 'standard' }).eq('id', userId);
  }
}

async function syncCheckout(session: Stripe.Checkout.Session): Promise<void> {
  if (typeof session.subscription !== 'string') return;
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await syncSubscription(subscription);
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) return new Response('Bad request', { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    return new Response(`Webhook error: ${String(err)}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await syncCheckout(event.data.object as Stripe.Checkout.Session);
    }
    if (event.type === 'invoice.payment_succeeded') {
      await syncInvoice(event.data.object as InvoiceWithSubscription, 'active');
    }
    if (event.type === 'invoice.payment_failed') {
      await syncInvoice(event.data.object as InvoiceWithSubscription, 'past_due');
    }
    const isSubscriptionEvent =
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted';
    if (isSubscriptionEvent) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
  } catch (err) {
    return new Response(`Webhook sync error: ${String(err)}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
