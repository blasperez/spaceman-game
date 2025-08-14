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
    const { amount, currency = 'mxn' } = await req.json();

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

    if (!amount || amount < 1000) { // 10.00 MXN mínimo
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check connect account
    const { data: sca } = await supabase
      .from('stripe_connect_accounts')
      .select('connect_account_id, payouts_enabled')
      .eq('user_id', user.id)
      .single();

    if (!sca?.connect_account_id || !sca.payouts_enabled) {
      return new Response(JSON.stringify({ error: 'Connect account not ready for payouts' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    const withdrawAmount = amount / 100;
    if (!profile || (profile.balance ?? 0) < withdrawAmount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create transfer (platform balance → connect account)
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const stripeModule = await import('https://esm.sh/stripe@12.0.0');
    const stripe = new stripeModule.default(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: stripeModule.Stripe.createFetchHttpClient(),
    });

    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: sca.connect_account_id,
      metadata: { userId: user.id, type: 'withdrawal_request' },
    });

    // Insert withdrawal record (trigger will adjust balances when marked completed by ops or after payout webhook)
    const { data: withdrawal, error: werr } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: withdrawAmount,
        status: 'pending',
        payment_method: 'stripe_connect',
        account_details: { connect_account_id: sca.connect_account_id },
        currency,
        connect_account_id: sca.connect_account_id,
        connect_transfer_id: transfer.id,
      })
      .select()
      .single();

    if (werr) {
      return new Response(JSON.stringify({ error: werr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ transferId: transfer.id, withdrawal }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error requesting withdrawal via Connect:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
