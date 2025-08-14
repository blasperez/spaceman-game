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
  return res.status(410).json({ error: 'Deprecated. Use Supabase Edge Function /functions/v1/stripe-checkout' });
});

// 2. Endpoint para manejar webhooks de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  return res.status(410).send('Deprecated. Use Supabase Edge Function /functions/v1/stripe-webhook');
});

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  // Deprecated (handled by Supabase webhook)
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  // Deprecated (handled by Supabase webhook)
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
