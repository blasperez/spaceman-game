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

    // get the raw body
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status === 'paid') {
      console.log(`Processing successful payment for session: ${session.id}`);
      
      try {
        // Extract payment details
        const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
        const currency = session.currency;
        const paymentIntentId = session.payment_intent as string;
        
        // Get user ID from metadata (you need to pass this when creating the checkout session)
        const userId = session.metadata?.user_id;
        
        if (!userId) {
          console.error('No user_id found in session metadata');
          return;
        }

        console.log(`Processing payment for user ${userId}, amount: ${amount} ${currency}`);

        // 1. Insert transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'deposit',
            amount: amount,
            status: 'completed',
            stripe_payment_id: paymentIntentId,
          });

        if (transactionError) {
          console.error('Error inserting transaction:', transactionError);
          return;
        }

        // 2. Update wallet balance
        const { error: walletError } = await supabase
          .from('wallets')
          .upsert({
            user_id: userId,
            balance: amount, // This will add to existing balance
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (walletError) {
          console.error('Error updating wallet:', walletError);
          return;
        }

        // 3. If wallet doesn't exist, create it with the amount
        const { data: existingWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (!existingWallet) {
          // Create new wallet with initial balance
          const { error: createWalletError } = await supabase
            .from('wallets')
            .insert({
              user_id: userId,
              balance: amount,
            });

          if (createWalletError) {
            console.error('Error creating wallet:', createWalletError);
            return;
          }
        } else {
          // Add to existing balance
          const { error: updateBalanceError } = await supabase
            .from('wallets')
            .update({ balance: existingWallet.balance + amount })
            .eq('user_id', userId);

          if (updateBalanceError) {
            console.error('Error updating balance:', updateBalanceError);
            return;
          }
        }

        console.log(`Successfully processed payment: ${amount} ${currency} for user ${userId}`);
        
      } catch (error) {
        console.error('Error processing checkout session:', error);
      }
    }
  }

  // Handle payment failures (optional)
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment failed for payment intent: ${paymentIntent.id}`);
    
    // You can add logic here to handle failed payments
    // For example, notify the user or update transaction status
  }
}