import Stripe from 'npm:stripe';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2026-02-25.clover',
  httpClient: Stripe.createFetchHttpClient(),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanReturnUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  } catch {
    return fallback;
  }
  return fallback;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const priceId = typeof body.priceId === 'string'
    ? body.priceId
    : Deno.env.get('STRIPE_MODERN_WRITER_PRICE_ID');
  if (!priceId) return json({ error: 'Missing price id' }, 400);

  const returnUrl = cleanReturnUrl(body.returnUrl, 'http://localhost:5173');
  const successUrl = cleanReturnUrl(body.successUrl, returnUrl);
  const cancelUrl = cleanReturnUrl(body.cancelUrl, returnUrl);
  const userId = authData.user.id;
  const email = authData.user.email ?? undefined;

  await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: '' }, { onConflict: 'id' });

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: existing?.stripe_customer_id ?? undefined,
    customer_email: existing?.stripe_customer_id ? undefined : email,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: userId },
    subscription_data: { metadata: { user_id: userId } },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return json({ url: session.url });
});
