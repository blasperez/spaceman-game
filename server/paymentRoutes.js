import express from 'express';
import Stripe from 'stripe';
import { pool } from './database.js';
import { verifyToken } from './auth.js';

// Enhanced Stripe initialization with validation
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ Missing Stripe secret key in environment variables');
  throw new Error('Stripe secret key is required');
}

console.log('🔑 Stripe configuration:', {
  keyPresent: !!stripeSecretKey,
  keyPrefix: stripeSecretKey?.substring(0, 7),
  environment: stripeSecretKey?.includes('_test_') ? 'test' : 'live'
});

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const router = express.Router();

// Add payment intent creation endpoint
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { amount, currency = 'mxn' } = req.body;
    const userId = req.userId;

    console.log('💳 Creating payment intent:', { amount, currency, userId });

    if (!amount || amount < 50) {
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum is 50 MXN.' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount should already be in cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: userId,
        type: 'game_credit'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Payment intent creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// 1. Endpoint para crear una sesión de pago en Stripe
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const { priceId, amount, coins } = req.body;
  const userId = req.userId;

  console.log('🛒 Creating checkout session:', { priceId, amount, coins, userId });

  if (amount < 50) {
    return res.status(400).json({ error: 'El importe mínimo es de 50 MXN.' });
  }

  try {
    // Enhanced session creation with better error handling
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `${coins} Monedas`,
              description: 'Créditos para el juego Spaceman',
            },
            unit_amount: amount * 100, // Stripe espera el monto en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_SITE_URL || process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_SITE_URL || process.env.VITE_APP_URL}/cancel`,
      metadata: {
        userId: userId,
        coins: coins,
        type: 'checkout_session'
      }
    });

    console.log('✅ Checkout session created:', session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error('❌ Checkout session creation failed:', error);
    res.status(500).json({ 
      error: 'Error al crear la sesión de pago.',
      details: error.message 
    });
  }
});

// 2. Endpoint para manejar webhooks de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.VITE_STRIPE_WEBHOOK_SECRET;
  
  console.log('🔔 Webhook received:', {
    hasSignature: !!sig,
    hasSecret: !!webhookSecret,
    bodyLength: req.body?.length
  });

  let event;

  try {
    if (!webhookSecret) {
      console.error('❌ Missing webhook secret');
      return res.status(400).send('Webhook secret not configured');
    }

    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  const userId = paymentIntent.metadata.userId;
  const amount = paymentIntent.amount / 100; // Convert from cents
  
  console.log('💰 Payment intent succeeded:', { userId, amount });

  try {
    await pool.query('BEGIN');
    
    // Add credits to user balance
    await pool.query(
      'UPDATE users SET balance_deposited = balance_deposited + $1 WHERE id = $2',
      [amount, userId]
    );

    // Record transaction
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, status, stripe_charge_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'deposit', amount, 'completed', paymentIntent.id]
    );
    
    await pool.query('COMMIT');
    console.log(`✅ Payment processed for user ${userId}: ${amount} MXN`);

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Payment processing failed:', error);
    throw error;
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.userId;
  const coins = parseInt(session.metadata.coins);
  
  console.log('🛒 Checkout session completed:', { userId, coins });

  try {
    await pool.query('BEGIN');
    
    // Update user balance
    await pool.query(
      'UPDATE users SET balance_deposited = balance_deposited + $1 WHERE id = $2',
      [coins, userId]
    );

    // Record transaction
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, status, stripe_charge_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'deposit', coins, 'completed', session.payment_intent]
    );
    
    await pool.query('COMMIT');
    console.log(`✅ Checkout completed for user ${userId}: ${coins} coins`);

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Checkout processing failed:', error);
    throw error;
  }
}

// 3. Endpoint para solicitar un retiro
router.post('/withdraw', verifyToken, async (req, res) => {
    const { amount, method, details } = req.body;
    const userId = req.userId;

    if (amount < 50) {
        return res.status(400).json({ error: 'El retiro mínimo es de 50 MXN.' });
    }

    try {
        await pool.query('BEGIN');

        // Verificar que el usuario tenga suficientes ganancias
        const userResult = await pool.query('SELECT balance_winnings FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (!user || user.balance_winnings < amount) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Fondos insuficientes para el retiro.' });
        }

        // Restar el monto de las ganancias y crear la solicitud de retiro
        await pool.query(
            'UPDATE users SET balance_winnings = balance_winnings - $1 WHERE id = $2',
            [amount, userId]
        );

        await pool.query(
            'INSERT INTO withdrawals (user_id, amount, status, withdrawal_method, withdrawal_details) VALUES ($1, $2, $3, $4, $5)',
            [userId, amount, 'pending', method, details]
        );
        
        await pool.query('COMMIT');
        res.status(201).json({ message: 'Solicitud de retiro creada exitosamente.' });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error al crear la solicitud de retiro:', error);
        res.status(500).json({ error: 'Error interno al procesar el retiro.' });
    }
});

// 4. Endpoint para obtener los balances del usuario
router.get('/balance', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT balance_deposited, balance_winnings, balance_demo FROM users WHERE id = $1',
            [req.userId]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener el balance:', error);
        res.status(500).json({ error: 'Error interno al obtener el balance.' });
    }
});
 

export default router;
