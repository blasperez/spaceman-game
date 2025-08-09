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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Client with Auth context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    // Admin client for DB writes bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Import Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Stripe key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeModule = await import('https://esm.sh/stripe@12.0.0');
    const stripe = new stripeModule.default(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: stripeModule.Stripe.createFetchHttpClient(),
    });

    // Ensure Stripe customer exists
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      const { error: insertError } = await supabaseAdmin
        .from('stripe_customers')
        .insert({ user_id: user.id, customer_id: customer.id });

      if (insertError) {
        console.error('Failed to insert stripe customer:', insertError);
      }
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { userId: user.id, type: 'card_setup' },
    });

    return new Response(
      JSON.stringify({ clientSecret: setupIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
