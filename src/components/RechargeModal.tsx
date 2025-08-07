import React, { useState } from 'react';
import { StripeCheckout } from './StripeCheckout';
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react';

interface RechargeModalProps {
  onClose: () => void;
}

const RECHARGE_AMOUNTS = [1, 5, 10, 50, 100, 200, 500, 1000, 2000];

export const RechargeModal: React.FC<RechargeModalProps> = ({ onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [error, setError] = useState('');

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(0);
    setError('');
  };

  const handleRecharge = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 1) {
      setError('El monto mínimo es de 1 peso mexicano');
      return;
    }

    if (amount > 10000) {
      setError('El monto máximo es de 10,000 pesos mexicanos');
      return;
    }

    setShowStripeCheckout(true);
  };

  const handlePaymentSuccess = () => {
    onClose();
    // Opcional: mostrar mensaje de éxito
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CreditCard size={20} className="mr-2 text-blue-400" />
            Recargar Saldo
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Selection */}
          <div>
            <h3 className="text-white font-medium mb-4">Selecciona el monto:</h3>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {RECHARGE_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    selectedAmount === amount && !customAmount
                      ? 'bg-blue-500/30 border-blue-400 text-blue-300'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <div className="text-lg font-bold">${amount}</div>
                  <div className="text-xs text-white/60">MXN</div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="block text-white/80 text-sm">O ingresa un monto personalizado:</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="10000"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm mt-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Amount Info */}
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mt-4">
              <div className="text-blue-300 text-sm">
                <div className="font-medium mb-2">Información importante:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Monto mínimo: $1 MXN (para pruebas)</li>
                  <li>• Monto máximo: $10,000 MXN</li>
                  <li>• Conversión: 1 peso = 1 moneda virtual</li>
                  <li>• Procesamiento seguro con Stripe</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleRecharge}
              disabled={!selectedAmount && !customAmount}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Recargar ${selectedAmount || customAmount || 0} MXN
            </button>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      {showStripeCheckout && (
        <StripeCheckout 
          onClose={() => setShowStripeCheckout(false)} 
          amount={selectedAmount || parseFloat(customAmount)} 
        />
      )}
    </div>
  );
};
