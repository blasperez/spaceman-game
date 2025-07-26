import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Enhanced Stripe initialization with error handling
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('❌ Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

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
  hidePostalCode: false,
  iconStyle: 'solid' as const,
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

    console.log('💳 Starting payment process...', { amount });

    if (!stripe || !elements) {
      const errorMsg = 'Stripe has not loaded yet. Please refresh and try again.';
      console.error('❌ Stripe not loaded:', { stripe: !!stripe, elements: !!elements });
      setError(errorMsg);
      setProcessing(false);
      return;
    }

    try {
      // Enhanced payment intent creation with better error handling
      console.log('🔄 Creating payment intent...');
      
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'mxn'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Payment intent creation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const paymentIntentData = await response.json();
      console.log('✅ Payment intent created:', paymentIntentData);

      if (!paymentIntentData.clientSecret) {
        throw new Error('No client secret received from server');
      }

      const clientSecret = paymentIntentData.clientSecret;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('💳 Confirming card payment...');
      
      const payload = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Spaceman Player'
          }
        },
      });

      if (payload.error) {
        console.error('❌ Payment confirmation failed:', payload.error);
        
        // Provide user-friendly error messages
        let userMessage = 'Payment failed. ';
        switch (payload.error.code) {
          case 'card_declined':
            userMessage += 'Your card was declined. Please try a different card.';
            break;
          case 'insufficient_funds':
            userMessage += 'Insufficient funds. Please check your account balance.';
            break;
          case 'invalid_cvc':
            userMessage += 'Invalid security code. Please check your CVC.';
            break;
          case 'expired_card':
            userMessage += 'Your card has expired. Please use a different card.';
            break;
          default:
            userMessage += payload.error.message || 'Please try again.';
        }
        
        setError(userMessage);
        setProcessing(false);
      } else {
        console.log('✅ Payment successful:', payload.paymentIntent);
        setError(null);
        setProcessing(false);
        setSucceeded(true);
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('💥 Payment process exception:', error);
      setError(`Payment failed: ${(error as Error).message}`);
      setProcessing(false);
    }
  };

  // Show loading state if Stripe hasn't loaded
  if (!stripePromise) {
    return (
      <div className="text-center p-4">
        <div className="text-red-400 mb-2">Stripe configuration error</div>
        <div className="text-white/70 text-sm">Please contact support</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <div className="bg-white/10 p-4 rounded-lg">
        <label className="block text-white/80 text-sm mb-2">Card Information</label>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      
      {error && <div className="text-red-500">{error}</div>}
      {succeeded && <div className="text-green-500">Payment succeeded!</div>}
      
      <button
        type="submit"
        disabled={!stripe || processing || succeeded}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : succeeded ? (
          'Payment Successful!'
        ) : (
          `Pay $${amount.toFixed(2)} MXN`
        )}
      </button>
    </form>
  );
};

export const StripePaymentForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = ({ amount, onPaymentSuccess }) => {
  if (!stripePromise) {
    return (
      <div className="text-center p-4">
        <div className="text-red-400 mb-2">Payment system unavailable</div>
        <div className="text-white/70 text-sm">Please try again later or contact support</div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
};