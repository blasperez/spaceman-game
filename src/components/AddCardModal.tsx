import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface AddCardModalProps {
  onClose: () => void;
  onAdded?: () => void;
}

const AddCardInner: React.FC<AddCardModalProps> = ({ onClose, onAdded }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCard = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No session');
      }

      // Create SetupIntent via Supabase Edge Function
      const setupIntentRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!setupIntentRes.ok) {
        throw new Error('Failed to create setup intent');
      }

      const { clientSecret } = await setupIntentRes.json();

      // Confirm card setup
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (confirmError || !setupIntent || !setupIntent.payment_method) {
        throw new Error(confirmError?.message || 'Card setup failed');
      }

      // Attach PM and save in DB via Edge Function (server fetches card details securely)
      const pmId = setupIntent.payment_method as string;
      const attachRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-attach-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ paymentMethodId: pmId }),
      });

      if (!attachRes.ok) {
        throw new Error('Failed to attach payment method');
      }

      onAdded?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Agregar tarjeta</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <CardElement options={{ hidePostalCode: true }} />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAddCard}
            disabled={loading || !stripe}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? 'Guardando...' : 'Guardar tarjeta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddCardModal: React.FC<AddCardModalProps> = (props) => {
  if (!stripePromise) {
    return null;
  }
  return (
    <Elements stripe={stripePromise}>
      <AddCardInner {...props} />
    </Elements>
  );
};
