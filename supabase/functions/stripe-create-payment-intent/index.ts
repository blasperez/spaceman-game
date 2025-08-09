import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'mxn', paymentMethodId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const stripeModule = await import('https://esm.sh/stripe@12.0.0');
    const stripe = new stripeModule.default(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: stripeModule.Stripe.createFetchHttpClient(),
    });

    // Get stripe customer
    const { data: existingCustomer, error: custErr } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (custErr || !existingCustomer?.customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no paymentMethodId provided, try default from Stripe customer
    let paymentMethodToUse = paymentMethodId;
    if (!paymentMethodToUse) {
      const customer = await stripe.customers.retrieve(existingCustomer.customer_id);
      const defaultPm = (customer as any).invoice_settings?.default_payment_method as string | undefined;
      if (!defaultPm) {
        return new Response(JSON.stringify({ error: 'No default payment method' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      paymentMethodToUse = defaultPm;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: existingCustomer.customer_id,
      payment_method: paymentMethodToUse,
      confirm: true,
      off_session: true,
      automatic_payment_methods: { enabled: false },
      metadata: { userId: user.id, type: 'in_game_topup' },
    });

    // Persist transaction minimal record via admin client (optional, webhook will do full updates)
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: amount / 100,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      payment_method: 'stripe',
      stripe_payment_id: paymentIntent.id,
      currency,
    });

    return new Response(JSON.stringify({
      id: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});