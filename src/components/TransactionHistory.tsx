import React, { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { 
  CreditCard, 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface TransactionHistoryProps {
  className?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ className = '' }) => {
  const { transactions, withdrawals, userBalance, loading } = usePayments();
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'games'>('all');
  const [showDetails, setShowDetails] = useState(false);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <DollarSign size={16} className="text-green-400" />;
      case 'withdrawal':
        return <Building size={16} className="text-blue-400" />;
      case 'game_win':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'game_loss':
        return <TrendingDown size={16} className="text-red-400" />;
      default:
        return <CreditCard size={16} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'pending':
        return <Clock size={14} className="text-yellow-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const isNegative = type === 'withdrawal' || type === 'game_loss';
    const sign = isNegative ? '-' : '+';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return transaction.transaction_type === 'deposit';
    if (filter === 'withdrawals') return transaction.transaction_type === 'withdrawal';
    if (filter === 'games') return transaction.transaction_type.includes('game');
    return true;
  });

  const exportTransactions = () => {
    const csvContent = [
      ['Fecha', 'Tipo', 'Monto', 'Estado', 'Método de Pago', 'Descripción'],
      ...filteredTransactions.map(t => [
        formatDate(t.created_at),
        t.transaction_type,
        formatAmount(t.amount, t.transaction_type),
        t.status,
        t.payment_method,
        t.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Historial de Transacciones</h3>
          {userBalance && (
            <div className="flex items-center space-x-4 text-sm text-white/70">
              <span>Balance: <span className="text-green-400 font-semibold">${userBalance.balance.toFixed(2)}</span></span>
              <span>Ganado: <span className="text-green-400 font-semibold">${userBalance.total_wins.toFixed(2)}</span></span>
              <span>Perdido: <span className="text-red-400 font-semibold">${userBalance.total_losses.toFixed(2)}</span></span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title={showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
          >
            {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={exportTransactions}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Exportar CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-4">
        <Filter size={16} className="text-white/70" />
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'Todo' },
            { key: 'deposits', label: 'Depósitos' },
            { key: 'withdrawals', label: 'Retiros' },
            { key: 'games', label: 'Juegos' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
            <p>No hay transacciones para mostrar</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <div className="text-white font-medium">
                      {transaction.description || transaction.transaction_type}
                    </div>
                    <div className="text-white/60 text-sm">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-semibold ${
                    transaction.transaction_type === 'deposit' || transaction.transaction_type === 'game_win'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {formatAmount(transaction.amount, transaction.transaction_type)}
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <span className={`text-xs ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                    {getStatusIcon(transaction.status)}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {showDetails && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Método:</span>
                      <span className="text-white ml-2">{transaction.payment_method}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Moneda:</span>
                      <span className="text-white ml-2">{transaction.currency.toUpperCase()}</span>
                    </div>
                    {transaction.fee_amount > 0 && (
                      <div>
                        <span className="text-white/60">Comisión:</span>
                        <span className="text-red-400 ml-2">-${transaction.fee_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {transaction.metadata && (
                      <div className="col-span-2">
                        <span className="text-white/60">Detalles:</span>
                        <div className="text-white/80 mt-1 text-xs">
                          {JSON.stringify(transaction.metadata, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Withdrawals Section */}
      {withdrawals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <h4 className="text-white font-medium mb-3">Solicitudes de Retiro</h4>
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building size={16} className="text-blue-400" />
                    <div>
                      <div className="text-white font-medium">
                        Retiro a {withdrawal.payment_method}
                      </div>
                      <div className="text-white/60 text-sm">
                        {formatDate(withdrawal.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-red-400 font-semibold">
                      -${withdrawal.amount.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <span className={`text-xs ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                      {getStatusIcon(withdrawal.status)}
                    </div>
                  </div>
                </div>

                {withdrawal.rejection_reason && (
                  <div className="mt-2 text-red-400 text-sm">
                    Razón: {withdrawal.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};