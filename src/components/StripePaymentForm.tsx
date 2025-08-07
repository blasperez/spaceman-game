import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

// Enhanced Stripe initialization with error handling
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('❌ Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const StripePaymentForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = ({ amount, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please log in again.');
      }

      console.log('🔄 Creating Stripe checkout session...');
      
      // Create checkout session using Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'mxn',
          userId: session.user.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Checkout session creation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error('No checkout URL received from server');
      }

      console.log('✅ Redirecting to Stripe Checkout...');
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('💥 Payment process exception:', error);
      setError(`Payment failed: ${(error as Error).message}`);
      setLoading(false);
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
    <div className="space-y-4 text-white">
      <div className="bg-white/10 p-4 rounded-lg">
        <div className="text-center">
          <div className="text-white/80 text-sm mb-2">Payment Amount</div>
          <div className="text-2xl font-bold text-white">${amount.toFixed(2)} MXN</div>
          <div className="text-white/60 text-xs mt-1">Secure payment via Stripe</div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          `Pay $${amount.toFixed(2)} MXN`
        )}
      </button>
      
      <div className="text-center text-white/60 text-xs">
        <p>You will be redirected to Stripe's secure payment page</p>
      </div>
    </div>
  );
};

export { StripePaymentForm };