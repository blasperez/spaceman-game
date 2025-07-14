const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('./database.cjs');

const router = express.Router();

// Create payment intent for deposits
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', user_id, payment_method_id } = req.body;

    // Validate input
    if (!amount || amount < 100) { // Minimum $1.00
      return res.status(400).json({ error: 'Invalid amount. Minimum $1.00' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency,
      metadata: {
        user_id: user_id,
        type: 'deposit'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({ error: error.message });
  }
});

// Confirm payment and update user balance
router.post('/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id, user_id } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      const amount = paymentIntent.amount / 100; // Convert back to dollars

      // Update user balance in Supabase
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('balance, total_deposits')
        .eq('id', user_id)
        .single();

      if (fetchError) {
        return res.status(400).json({ error: 'User not found' });
      }

      const newBalance = (user.balance || 0) + amount;
      const newTotalDeposits = (user.total_deposits || 0) + amount;

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          total_deposits: newTotalDeposits
        })
        .eq('id', user_id);

      if (updateError) {
        return res.status(400).json({ error: 'Failed to update balance' });
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user_id,
          type: 'deposit',
          amount: amount,
          payment_method: 'stripe',
          status: 'completed',
          stripe_payment_intent_id: payment_intent_id,
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Transaction recording error:', transactionError);
      }

      res.json({ 
        success: true, 
        new_balance: newBalance,
        amount: amount
      });

    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create payout for withdrawals
router.post('/create-payout', async (req, res) => {
  try {
    const { amount, currency = 'usd', user_id, method = 'bank_account' } = req.body;

    // Validate input
    if (!amount || amount < 1000) { // Minimum $10.00
      return res.status(400).json({ error: 'Invalid amount. Minimum $10.00' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get user data to verify balance
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('balance, stripe_account_id')
      .eq('id', user_id)
      .single();

    if (fetchError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const requestedAmount = amount / 100; // Convert to dollars
    if (requestedAmount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // For now, we'll create a transfer intent (simplified)
    // In production, you'd need to set up Stripe Connect for real payouts
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: currency,
      destination: user.stripe_account_id || 'acct_default', // User's connected account
      metadata: {
        user_id: user_id,
        type: 'withdrawal'
      }
    });

    res.json({
      payoutIntent: {
        id: transfer.id,
        amount: transfer.amount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(400).json({ error: error.message });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Additional processing if needed
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`PaymentIntent for ${failedPayment.amount} failed.`);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

module.exports = router;