import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface PaymentSheetProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultAmount: number;
  selectedPaymentMethodId?: string;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({ onClose, onSuccess, defaultAmount, selectedPaymentMethodId }) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'mxn',
          paymentMethodId: selectedPaymentMethodId,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Payment failed');
      }

      const json = await res.json();
      if (json.status !== 'succeeded' && json.status !== 'requires_action') {
        // requires_action could be handled with Stripe.js next_action if enabled
        throw new Error('Payment not completed');
      }

      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error de pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Confirmar pago</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Monto (MXN)</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl text-white px-3 py-2 focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? 'Procesando...' : `Pagar $${amount} MXN`}
          </button>
        </div>
      </div>
    </div>
  );
};