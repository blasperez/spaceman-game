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

    const { data: sca } = await supabase
      .from('stripe_connect_accounts')
      .select('connect_account_id')
      .eq('user_id', user.id)
      .single();

    if (!sca?.connect_account_id) {
      return new Response(JSON.stringify({ error: 'No connect account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appUrl = Deno.env.get('VITE_APP_URL') ?? '';
    const link = await stripe.accountLinks.create({
      account: sca.connect_account_id,
      refresh_url: `${appUrl}/connect/refresh`,
      return_url: `${appUrl}/connect/return`,
      type: 'account_onboarding',
    });

    // Update status snapshot
    const acct = await stripe.accounts.retrieve(sca.connect_account_id as string);
    await supabaseAdmin
      .from('stripe_connect_accounts')
      .update({
        payouts_enabled: (acct as any).payouts_enabled ?? false,
        charges_enabled: (acct as any).charges_enabled ?? false,
        details_submitted: (acct as any).details_submitted ?? false,
        requirements_due: (acct as any).requirements?.currently_due ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ url: link.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});