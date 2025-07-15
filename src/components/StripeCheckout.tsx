import React, { useState } from 'react';
import { stripeProducts } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { Loader2, CreditCard, Check, X, Plus } from 'lucide-react';

interface StripeCheckoutProps {
  onClose: () => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState(50);
  const [showCustom, setShowCustom] = useState(false);

  const handleCheckout = async (coins: number, _amount: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Por favor inicia sesión para continuar');
        return;
      }

      // For now, simulate the purchase since we need to set up Stripe products first
      // In production, this would call the Stripe checkout endpoint
      
      // Simulate successful purchase by adding coins directly to balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw new Error('Error al obtener el perfil del usuario');
      }

      const newBalance = (profile.balance || 0) + coins;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', session.user.id);

      if (updateError) {
        throw new Error('Error al actualizar el balance');
      }

      // Close modal and show success
      onClose();
      alert(`¡Compra exitosa! Se agregaron ${coins} monedas a tu cuenta.`);
      
      // Refresh the page to update balance
      window.location.reload();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Ocurrió un error durante la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Comprar Monedas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Predefined Packages */}
          {stripeProducts.map((product) => (
            <div
              key={product.coins}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{product.name}</h3>
                  <p className="text-white/70 text-sm">{product.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">${product.amount} MXN</div>
                  <div className="text-white/60 text-sm">{product.coins} monedas</div>
                </div>
              </div>
              
              <button
                onClick={() => handleCheckout(product.coins, product.amount)}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-gray-500/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl transition-all"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Comprar</span>
                  </>
                )}
              </button>
            </div>
          ))}

          {/* Custom Amount */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Cantidad Personalizada</h3>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
              >
                <Plus size={16} className="text-purple-400" />
              </button>
            </div>

            {showCustom && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm block mb-2">Cantidad de monedas (mínimo 10)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white focus:border-purple-400/50 focus:outline-none"
                  />
                  <div className="text-white/60 text-sm mt-1">
                    Costo: ${customAmount} MXN (1 peso = 1 moneda)
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(customAmount, customAmount)}
                  disabled={loading || customAmount < 10}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-500/80 hover:bg-purple-600/80 disabled:bg-gray-500/80 backdrop-blur-md border border-purple-400/30 text-white py-3 rounded-xl transition-all"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={20} />
                      <span>Comprar {customAmount} monedas</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-3">¿Qué obtienes?</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Monedas instantáneas en tu cuenta</span>
              </li>
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Juega inmediatamente en Spaceman</span>
              </li>
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>Pago seguro con Stripe</span>
              </li>
              <li className="flex items-center space-x-2 text-white/80 text-sm">
                <Check size={16} className="text-green-400" />
                <span>1 peso mexicano = 1 moneda</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};