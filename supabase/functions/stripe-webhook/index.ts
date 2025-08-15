import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Spaceman Game',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body (ensure no JSON.parse before signature verification)
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.log(`Processing event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
      
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'account.updated':
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const connectAccountId = account.id;
    await supabase
      .from('stripe_connect_accounts')
      .update({
        payouts_enabled: account.payouts_enabled ?? false,
        charges_enabled: account.charges_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
        requirements_due: (account.requirements as any)?.currently_due ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('connect_account_id', connectAccountId);
  } catch (error) {
    console.error('Error updating connect account status:', error);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') {
    console.log(`Payment not completed for session: ${session.id}`);
    return;
  }

  console.log(`Processing successful checkout session: ${session.id}`);
  
  try {
    const meta: any = session.metadata || {};
    const userId = meta.userId || meta.user_id;
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const coins = parseInt(meta.coins || `${amount}`, 10);
    const paymentIntentId = session.payment_intent as string;
    
    if (!userId) {
      console.error('No userId found in session metadata');
      return;
    }

    console.log(`Processing payment for user ${userId}, amount: ${amount}, coins: ${coins}`);

    // 1. Insert transaction record (triggers will update profile balances)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        payment_method: 'stripe',
        stripe_payment_id: paymentIntentId,
        currency: session.currency,
      });

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      return;
    }

    // 2. Insert order record for tracking
    const { error: orderError } = await supabase
      .from('stripe_orders')
      .insert({
        checkout_session_id: session.id,
        payment_intent_id: paymentIntentId,
        customer_id: session.customer as string,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency,
        payment_status: session.payment_status,
        status: 'completed'
      });

    if (orderError) {
      console.error('Error inserting order:', orderError);
    }

    console.log(`Successfully processed checkout session: ${amount} ${session.currency} for user ${userId}`);
    
  } catch (error) {
    console.error('Error processing checkout session:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing payment intent: ${paymentIntent.id}`);
  
  try {
    const meta: any = paymentIntent.metadata || {};
    const userId = meta.userId || meta.user_id;
    const amount = paymentIntent.amount / 100;
    
    if (!userId) {
      console.error('No userId found in payment intent metadata');
      return;
    }

    console.log(`Processing payment intent for user ${userId}, amount: ${amount}`);

    // 1. Insert transaction record (triggers will update profile balances)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        payment_method: 'stripe',
        stripe_payment_id: paymentIntent.id,
        currency: paymentIntent.currency,
      });

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      return;
    }

    console.log(`Successfully processed payment intent: ${amount} for user ${userId}`);
    
  } catch (error) {
    console.error('Error processing payment intent:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Processing subscription update: ${subscription.id}`);
  
  try {
    const customerId = subscription.customer as string;
    
    // Get user ID from stripe_customers table
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customerData) {
      console.error('Error finding customer:', customerError);
      return;
    }

    // Update subscription record
    const { error: subscriptionError } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0]?.price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id'
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return;
    }

    console.log(`Successfully updated subscription for customer ${customerId}`);
    
  } catch (error) {
    console.error('Error processing subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Processing subscription deletion: ${subscription.id}`);
  
  try {
    const customerId = subscription.customer as string;
    
    // Update subscription status to canceled
    const { error: subscriptionError } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId);

    if (subscriptionError) {
      console.error('Error updating subscription status:', subscriptionError);
      return;
    }

    console.log(`Successfully marked subscription as canceled for customer ${customerId}`);
    
  } catch (error) {
    console.error('Error processing subscription deletion:', error);
  }
}