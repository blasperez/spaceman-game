const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('./database');
const { verifyToken } = require('./auth');

const router = express.Router();

// 1. Endpoint para crear una sesión de pago en Stripe
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const { priceId, amount, coins } = req.body;
  const userId = req.userId;

  if (amount < 50) {
    return res.status(400).json({ error: 'El importe mínimo es de 50 MXN.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `${coins} Monedas`,
            },
            unit_amount: amount * 100, // Stripe espera el monto en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_SITE_URL}/payment-cancelled`,
      metadata: {
        userId: userId,
        coins: coins,
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: 'Error al crear la sesión de pago.' });
  }
});

// 2. Endpoint para manejar webhooks de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const coins = parseInt(session.metadata.coins);

    try {
      await pool.query('BEGIN');
      
      // Actualizar el balance depositado del usuario
      await pool.query(
        'UPDATE users SET balance_deposited = balance_deposited + $1 WHERE id = $2',
        [coins, userId]
      );

      // Registrar la transacción
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, status, stripe_charge_id) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'deposit', coins, 'completed', session.payment_intent]
      );
      
      await pool.query('COMMIT');
      console.log(`✅ Depósito exitoso para el usuario ${userId} por ${coins} monedas.`);

    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error procesando depósito desde webhook:', error);
    }
  }

  res.json({ received: true });
});

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


module.exports = router;
