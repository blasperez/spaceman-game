import React, { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../hooks/useAuth';
import {
  Building,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';

interface WithdrawalFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface AccountDetails {
  account_type: 'bank' | 'paypal' | 'crypto';
  account_number?: string;
  routing_number?: string;
  bank_name?: string;
  paypal_email?: string;
  crypto_address?: string;
  crypto_network?: string;
}

export const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { userBalance, requestWithdrawal } = usePayments();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'paypal' | 'crypto'>('bank');
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    account_type: 'bank'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userBalance) return;

    const withdrawalAmount = parseFloat(amount);
    
    if (withdrawalAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (withdrawalAmount > userBalance.balance) {
      setError('Saldo insuficiente');
      return;
    }

    if (withdrawalAmount < 10) {
      setError('El monto mínimo para retiro es $10');
      return;
    }

    // Validate account details based on payment method
    if (paymentMethod === 'bank' && (!accountDetails.account_number || !accountDetails.routing_number || !accountDetails.bank_name)) {
      setError('Por favor completa todos los campos bancarios');
      return;
    }

    if (paymentMethod === 'paypal' && !accountDetails.paypal_email) {
      setError('Por favor ingresa tu email de PayPal');
      return;
    }

    if (paymentMethod === 'crypto' && !accountDetails.crypto_address) {
      setError('Por favor ingresa tu dirección de crypto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await requestWithdrawal(withdrawalAmount, paymentMethod, accountDetails);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar el retiro');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank':
        return 'Transferencia Bancaria';
      case 'paypal':
        return 'PayPal';
      case 'crypto':
        return 'Criptomonedas';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank':
        return <Building size={20} />;
      case 'paypal':
        return <CreditCard size={20} />;
      case 'crypto':
        return <DollarSign size={20} />;
      default:
        return <CreditCard size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Solicitar Retiro</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {userBalance && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
            <div className="text-white/70 text-sm mb-2">Balance Disponible</div>
            <div className="text-green-400 text-xl font-bold">${userBalance.balance.toFixed(2)}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Monto a Retirar</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="10"
                max={userBalance?.balance || 0}
                step="0.01"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-8 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                required
              />
            </div>
            <div className="text-white/50 text-xs mt-1">
              Mínimo: $10.00 | Máximo: ${userBalance?.balance.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bank', 'paypal', 'crypto'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    setAccountDetails({ account_type: method });
                  }}
                  className={`p-3 rounded-xl border transition-colors flex flex-col items-center space-y-1 ${
                    paymentMethod === method
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                      : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {getPaymentMethodIcon(method)}
                  <span className="text-xs">{getPaymentMethodLabel(method)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3">
            {paymentMethod === 'bank' && (
              <>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Nombre del Banco</label>
                  <input
                    type="text"
                    value={accountDetails.bank_name || ''}
                    onChange={(e) => setAccountDetails({ ...accountDetails, bank_name: e.target.value })}
                    placeholder="Ej: Banco de América"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Número de Cuenta</label>
                    <input
                      type="text"
                      value={accountDetails.account_number || ''}
                      onChange={(e) => setAccountDetails({ ...accountDetails, account_number: e.target.value })}
                      placeholder="1234567890"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Número de Routing</label>
                    <input
                      type="text"
                      value={accountDetails.routing_number || ''}
                      onChange={(e) => setAccountDetails({ ...accountDetails, routing_number: e.target.value })}
                      placeholder="021000021"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'paypal' && (
              <div>
                <label className="block text-white/70 text-sm mb-2">Email de PayPal</label>
                <input
                  type="email"
                  value={accountDetails.paypal_email || ''}
                  onChange={(e) => setAccountDetails({ ...accountDetails, paypal_email: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                  required
                />
              </div>
            )}

            {paymentMethod === 'crypto' && (
              <>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Dirección de Wallet</label>
                  <input
                    type="text"
                    value={accountDetails.crypto_address || ''}
                    onChange={(e) => setAccountDetails({ ...accountDetails, crypto_address: e.target.value })}
                    placeholder="0x1234...5678"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Red (Opcional)</label>
                  <select
                    value={accountDetails.crypto_network || ''}
                    onChange={(e) => setAccountDetails({ ...accountDetails, crypto_network: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="">Seleccionar red</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="bitcoin">Bitcoin</option>
                    <option value="polygon">Polygon</option>
                    <option value="binance">Binance Smart Chain</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Info Message */}
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3">
            <div className="flex items-start space-x-2">
              <CheckCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-blue-300 text-sm">
                <div className="font-medium mb-1">Información Importante:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Los retiros se procesan en 1-3 días hábiles</li>
                  <li>• Se aplica una comisión del 2.5%</li>
                  <li>• Verificaremos tu identidad antes del procesamiento</li>
                  <li>• Recibirás una confirmación por email</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <DollarSign size={16} />
                <span>Solicitar Retiro</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};