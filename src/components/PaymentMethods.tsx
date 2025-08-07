import React, { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { 
  CreditCard, 
  Bank, 
  DollarSign, 
  Star, 
  Trash2, 
  Plus,
  Shield,
  AlertCircle
} from 'lucide-react';

interface PaymentMethodsProps {
  onAddNew?: () => void;
  onSelect?: (paymentMethodId: string) => void;
  showAddButton?: boolean;
  showSelectButton?: boolean;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ 
  onAddNew, 
  onSelect, 
  showAddButton = true,
  showSelectButton = false 
}) => {
  const { paymentMethods, deletePaymentMethod, setDefaultPaymentMethod } = usePayments();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) return;
    
    setLoading(paymentMethodId);
    try {
      await deletePaymentMethod(paymentMethodId);
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    setLoading(paymentMethodId);
    try {
      await setDefaultPaymentMethod(paymentMethodId);
    } catch (error) {
      console.error('Error setting default payment method:', error);
    } finally {
      setLoading(null);
    }
  };

  const getPaymentMethodIcon = (type: string, brand?: string) => {
    switch (type) {
      case 'card':
        return <CreditCard size={20} className="text-blue-400" />;
      case 'bank_account':
        return <Bank size={20} className="text-green-400" />;
      case 'paypal':
        return <DollarSign size={20} className="text-yellow-400" />;
      default:
        return <CreditCard size={20} className="text-gray-400" />;
    }
  };

  const getPaymentMethodLabel = (type: string, brand?: string, last4?: string) => {
    switch (type) {
      case 'card':
        return `${brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : 'Tarjeta'} •••• ${last4 || '****'}`;
      case 'bank_account':
        return `Cuenta Bancaria •••• ${last4 || '****'}`;
      case 'paypal':
        return 'PayPal';
      default:
        return 'Método de Pago';
    }
  };

  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Métodos de Pago</h3>
        {showAddButton && (
          <button
            onClick={onAddNew}
            className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 px-3 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Agregar</span>
          </button>
        )}
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard size={48} className="mx-auto mb-4 text-white/30" />
          <p className="text-white/60 mb-4">No tienes métodos de pago guardados</p>
          {showAddButton && (
            <button
              onClick={onAddNew}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus size={16} />
              <span>Agregar Método de Pago</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg transition-all duration-200 ${
                method.is_default ? 'border-blue-400/50 bg-blue-500/10' : 'hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPaymentMethodIcon(method.type, method.brand)}
                  <div>
                    <div className="text-white font-medium">
                      {getPaymentMethodLabel(method.type, method.brand, method.last4)}
                    </div>
                    <div className="text-white/60 text-sm">
                      {method.type === 'card' && method.expiry_month && method.expiry_year && (
                        <span>Expira {formatExpiry(method.expiry_month, method.expiry_year)}</span>
                      )}
                      {method.type === 'bank_account' && 'Cuenta bancaria'}
                      {method.type === 'paypal' && 'PayPal'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {method.is_default && (
                    <div className="flex items-center space-x-1 text-blue-400 text-sm">
                      <Star size={14} className="fill-current" />
                      <span>Predeterminado</span>
                    </div>
                  )}

                  {showSelectButton && onSelect && (
                    <button
                      onClick={() => onSelect(method.id)}
                      className="bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Seleccionar
                    </button>
                  )}

                  {!method.is_default && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      disabled={loading === method.id}
                      className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
                      title="Establecer como predeterminado"
                    >
                      {loading === method.id ? '...' : 'Predeterminado'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(method.id)}
                    disabled={loading === method.id}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 p-2 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar método de pago"
                  >
                    {loading === method.id ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center space-x-2 text-white/50 text-xs">
                  <Shield size={12} />
                  <span>Información segura • Encriptada con SSL</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-blue-300 text-sm">
            <div className="font-medium mb-1">Información de Seguridad</div>
            <ul className="space-y-1 text-xs">
              <li>• Todos los datos de pago están encriptados</li>
              <li>• No almacenamos información completa de tarjetas</li>
              <li>• Cumplimos con los estándares PCI DSS</li>
              <li>• Puedes eliminar métodos de pago en cualquier momento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};