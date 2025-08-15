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
  const { 
    userBalance, 
    requestConnectWithdrawal, 
    getConnectStatus, 
    createConnectAccount, 
    getConnectOnboardingLink 
  } = usePayments();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'paypal' | 'crypto'>('bank');
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    account_type: 'bank'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectReady, setConnectReady] = useState<boolean | null>(null);
  const [checkingConnect, setCheckingConnect] = useState(false);

  React.useEffect(() => {
    const check = async () => {
      try {
        setCheckingConnect(true);
        const res = await getConnectStatus();
        const status = res?.status;
        setConnectReady(!!status && !!status.payouts_enabled);
      } catch {
        setConnectReady(false);
      } finally {
        setCheckingConnect(false);
      }
    };
    check();
  }, [getConnectStatus]);

  const handleSetupConnect = async () => {
    try {
      setLoading(true);
      await createConnectAccount();
      const { url } = await getConnectOnboardingLink();
      if (url) window.location.href = url;
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar la configuración de Stripe Connect');
    } finally {
      setLoading(false);
    }
  };

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

    // Stripe Connect required and preferred
    if (!connectReady) {
      setError('Tu cuenta de retiros no está lista. Configúrala con Stripe Connect.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Process withdrawal via Stripe Connect (amount in MXN)
      await requestConnectWithdrawal(withdrawalAmount);
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

        {/* Connect status banner */}
        <div className="mb-4">
          {checkingConnect ? (
            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-white/70 text-sm">Verificando estado de retiros...</div>
          ) : connectReady ? (
            <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-3 text-green-300 text-sm">Stripe Connect listo para retiros.</div>
          ) : (
            <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-xl p-3 text-yellow-300 text-sm">
              Para retirar fondos, configura tu cuenta de Stripe Connect.
              <div className="mt-2">
                <button onClick={handleSetupConnect} disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl">
                  {loading ? 'Abriendo...' : 'Configurar Stripe Connect'}
                </button>
              </div>
            </div>
          )}
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

          {/* Payment Method Selection (disabled when using Connect) */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2 opacity-50 pointer-events-none">
              {(['bank', 'paypal', 'crypto'] as const).map((method) => (
                <div key={method} className={`p-3 rounded-xl border flex flex-col items-center space-y-1 ${
                  paymentMethod === method
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'bg-white/10 border-white/20 text-white/70'
                }`}>
                  {getPaymentMethodIcon(method)}
                  <span className="text-xs">{getPaymentMethodLabel(method)}</span>
                </div>
              ))}
            </div>
            <div className="text-white/50 text-xs mt-1">Los retiros se procesan vía Stripe Connect.</div>
          </div>

          {/* Account Details (managed by Stripe Connect onboarding) */}
          <div className="space-y-3 opacity-50 pointer-events-none">
            <div className="text-white/60 text-sm">Los datos bancarios se gestionan en Stripe Connect.</div>
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
            disabled={loading || !connectReady}
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