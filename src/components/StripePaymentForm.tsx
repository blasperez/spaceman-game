import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''); // Load from Vite env variable

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const CheckoutForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = ({ amount, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet.');
      setProcessing(false);
      return;
    }

    // Create payment intent on backend
    const response = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    const paymentIntentData = await response.json();

    if (!response.ok) {
      setError(paymentIntentData.error || 'Failed to create payment intent.');
      setProcessing(false);
      return;
    }

    const clientSecret = paymentIntentData.clientSecret;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      setProcessing(false);
      return;
    }

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
      onPaymentSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <CardElement options={CARD_ELEMENT_OPTIONS} />
      {error && <div className="text-red-500">{error}</div>}
      {succeeded && <div className="text-green-500">Payment succeeded!</div>}
      <button
        type="submit"
        disabled={!stripe || processing || succeeded}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export const StripePaymentForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = ({ amount, onPaymentSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
};
