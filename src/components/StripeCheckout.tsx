import React, { useState } from 'react';
import { stripeProducts } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { Loader2, CreditCard, Check } from 'lucide-react';

interface StripeCheckoutProps {
  onClose: () => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, mode: 'payment' | 'subscription') => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Please log in to continue');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/cancel`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Purchase Space Money</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <span className="text-white text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {stripeProducts.map((product) => (
            <div
              key={product.priceId}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{product.name}</h3>
                <div className="flex items-center space-x-2">
                  {product.mode === 'subscription' ? (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg">
                      Subscription
                    </span>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-lg">
                      One-time
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-white/70 text-sm mb-4">{product.description}</p>
              
              <button
                onClick={() => handleCheckout(product.priceId, product.mode)}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-gray-500/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl transition-all"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Purchase</span>
                  </>
                )}
              </button>
            </div>
          ))}

          {/* Features */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-3">What you get:</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Instant space money credit</span>
              </li>
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Play Spaceman game</span>
              </li>
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Secure payment processing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};