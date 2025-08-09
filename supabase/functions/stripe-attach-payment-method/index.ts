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
    const { paymentMethodId } = await req.json();

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

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const stripeModule = await import('https://esm.sh/stripe@12.0.0');
    const stripe = new stripeModule.default(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: stripeModule.Stripe.createFetchHttpClient(),
    });

    // Get or create customer
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
      await supabaseAdmin.from('stripe_customers').insert({ user_id: user.id, customer_id: customer.id });
    }

    // Attach payment method to customer and set as default for off_session
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId! });
    await stripe.customers.update(customerId!, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Fetch payment method details securely
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const card = (pm as any).card || {};

    // Persist masked card data in payment_methods
    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        stripe_payment_method_id: paymentMethodId,
        type: 'card',
        brand: card.brand ?? null,
        last4: card.last4 ?? null,
        expiry_month: card.exp_month ?? null,
        expiry_year: card.exp_year ?? null,
        is_default: true,
      });

    if (insertError) {
      console.error('Failed to insert payment method:', insertError);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
