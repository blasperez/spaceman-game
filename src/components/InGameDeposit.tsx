import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { CreditCard, X, Loader2, DollarSign, Plus } from 'lucide-react';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface InGameDepositProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
}

interface DepositFormProps {
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
}

const DepositForm: React.FC<DepositFormProps> = ({ onClose, onSuccess, currentBalance }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);

  const quickAmounts = [5, 10, 25, 50, 100, 250];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está cargado');
      return;
    }

    if (amount < 5) {
      setError('Monto mínimo: $5');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Debes iniciar sesión');
        return;
      }

      // Crear Payment Intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convertir a centavos
          currency: 'usd',
          user_id: session.user.id,
          save_payment_method: saveCard
        }),
      });

      const { client_secret, error: paymentError } = await response.json();

      if (paymentError) {
        setError(paymentError);
        return;
      }

      // Confirmar pago con la tarjeta
      const cardElement = elements.getElement(CardElement);
      
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement!,
          billing_details: {
            email: session.user.email,
          },
        }
      });

      if (confirmError) {
        setError(confirmError.message || 'Error procesando pago');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirmar en el backend
        const confirmResponse = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            user_id: session.user.id
          }),
        });

        const { success, new_balance } = await confirmResponse.json();

        if (success) {
          onSuccess(amount);
          onClose();
        } else {
          setError('Error confirmando pago');
        }
      }

    } catch (err: any) {
      setError(err.message || 'Error procesando pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <DollarSign className="text-green-400 mr-2" size={24} />
          <h3 className="text-xl font-bold text-white">Depósito Rápido</h3>
        </div>
        <p className="text-white/60 text-sm">
          Balance actual: <span className="text-green-400 font-bold">${currentBalance.toFixed(2)}</span>
        </p>
      </div>

      {/* Quick Amount Selection */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-3">
          Cantidad a depositar
        </label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(quickAmount)}
              className={`p-3 rounded-xl font-bold transition-all btn-elastic ${
                amount === quickAmount
                  ? 'bg-blue-500 text-white border-2 border-blue-300'
                  : 'bg-white/10 text-white/80 border-2 border-white/20 hover:bg-white/20'
              }`}
            >
              ${quickAmount}
            </button>
          ))}
        </div>
        
        {/* Custom Amount */}
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <input
              type="number"
              min="5"
              max="1000"
              step="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:bg-white/20 focus:border-blue-400 transition-all"
              placeholder="Monto personalizado"
            />
          </div>
          <div className="text-white/60 font-medium">USD</div>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-3">
          Información de la tarjeta
        </label>
        <div className="p-4 bg-white/10 border border-white/30 rounded-xl">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#ffffff80',
                  },
                  iconColor: '#ffffff',
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Save Card Option */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="saveCard"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="w-4 h-4 text-blue-400 bg-white/10 border-white/30 rounded focus:ring-blue-400"
        />
        <label htmlFor="saveCard" className="text-white/80 text-sm">
          Guardar tarjeta para futuros depósitos
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-white font-medium transition-all btn-elastic"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing || amount < 5}
          className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all btn-bet flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2" size={16} />
              Depositar ${amount}
            </>
          )}
        </button>
      </div>

      {/* Security Info */}
      <div className="text-center">
        <p className="text-white/40 text-xs">
          🔒 Pago seguro procesado por Stripe • Datos encriptados
        </p>
      </div>
    </form>
  );
};

export const InGameDeposit: React.FC<InGameDepositProps> = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Plus className="mr-2 text-green-400" size={20} />
            Agregar Fondos
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors btn-elastic"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Elements stripe={stripePromise}>
            <DepositForm 
              onClose={onClose} 
              onSuccess={onSuccess} 
              currentBalance={currentBalance}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};