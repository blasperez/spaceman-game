import React, { useState } from 'react';
import { X, CreditCard, Plus, History, TrendingUp, TrendingDown, LogOut, Wallet, Shield, Settings, DollarSign, ArrowDownToLine, Ban as Bank, User, Globe, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'facebook' | 'twitter' | 'demo';
  balance: number;
  isDemo: boolean;
  // Casino specific fields
  age?: number;
  country?: string;
  phone?: string;
  kyc_verified?: boolean;
  withdrawal_methods?: any[];
  deposit_limit?: number;
  withdrawal_limit?: number;
  total_deposits?: number;
  total_withdrawals?: number;
  games_played?: number;
  total_wagered?: number;
  total_won?: number;
}

interface GameHistory {
  id: number;
  multiplier: number;
  betAmount: number;
  winAmount: number;
  timestamp: Date;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  email?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

interface AccountPanelProps {
  user: UserProfile;
  balance: number;
  gameHistory: GameHistory[];
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onLogout: () => void;
  onAddPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  onDeposit: (amount: number, methodId: string) => void;
  onWithdrawal?: (amount: number, method: string) => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({
  user,
  balance,
  gameHistory,
  transactions,
  paymentMethods,
  onClose,
  onLogout,
  onAddPaymentMethod,
  onDeposit,
  onWithdrawal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history' | 'settings'>('overview');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddPayPal, setShowAddPayPal] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [showKYCForm, setShowKYCForm] = useState(false);
  
  // Mock bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const depositAmounts = [100, 500, 1000];
  const withdrawalAmounts = [100, 500, 1000];

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const cardNumber = formData.get('cardNumber') as string;
    
    onAddPaymentMethod({
      type: 'card',
      last4: cardNumber.slice(-4),
      brand: 'Visa' // Mock brand detection
    });
    
    setShowAddCard(false);
  };

  const handleAddPayPal = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    
    onAddPaymentMethod({
      type: 'paypal',
      email
    });
    
    setShowAddPayPal(false);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const newBankAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      accountHolder: formData.get('accountHolder') as string
    };
    
    setBankAccounts(prev => [...prev, newBankAccount]);
    setShowAddBank(false);
  };

  const handleDeposit = () => {
    if (selectedAmount && selectedMethod && !user.isDemo) {
      onDeposit(selectedAmount, selectedMethod);
      setSelectedAmount(null);
      setSelectedMethod('');
    }
  };

  const handleWithdrawal = () => {
    if (withdrawalAmount && selectedBankAccount && !user.isDemo && withdrawalAmount <= balance) {
      const bankAccount = bankAccounts.find(b => b.id === selectedBankAccount);
      if (!bankAccount) return;

      // Create withdrawal transaction
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: 'withdrawal',
        amount: withdrawalAmount,
        method: `${bankAccount.bankName} **** ${bankAccount.accountNumber.slice(-4)}`,
        status: 'pending',
        timestamp: new Date()
      };

      // Call parent withdrawal handler if provided
      if (onWithdrawal) {
        onWithdrawal(withdrawalAmount, `${bankAccount.bankName} **** ${bankAccount.accountNumber.slice(-4)}`);
      }

      // In a real app, this would be handled by the parent component
      // For now, we'll simulate the withdrawal
      alert(`Retiro de $${withdrawalAmount} solicitado. Será procesado en 1-3 días hábiles.`);
      
      setWithdrawalAmount(0);
      setSelectedBankAccount('');
    }
  };

  const totalWon = gameHistory.reduce((sum, game) => sum + game.winAmount, 0);
  const totalBet = gameHistory.reduce((sum, game) => sum + game.betAmount, 0);
  const netProfit = totalWon - totalBet;

  // Calculate minimum withdrawal (must have positive balance and minimum amount)
  const minWithdrawal = 100;
  const canWithdraw = balance >= minWithdrawal && !user.isDemo && user.kyc_verified;

  // FIXED: Proper validation for deposit button
  const canDeposit = selectedAmount && selectedAmount > 0 && selectedMethod && selectedMethod !== '' && !user.isDemo;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header - Mobile optimized */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{user.name}</h2>
              <p className="text-white/70 text-xs sm:text-sm">{user.email}</p>
              {user.isDemo && (
                <span className="inline-block bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 text-xs px-2 py-1 rounded-lg mt-1">
                  Modo Demo
                </span>
              )}
              {user.kyc_verified && (
                <span className="inline-block bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 text-xs px-2 py-1 rounded-lg mt-1">
                  ✓ Verificado
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-colors shadow-lg"
          >
            <X size={20} className="text-white/70 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tabs - Mobile optimized with horizontal scroll */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: 'overview', label: 'Resumen', icon: Wallet },
            { id: 'deposit', label: 'Recargar', icon: Plus },
            { id: 'withdraw', label: 'Retirar', icon: ArrowDownToLine },
            { id: 'history', label: 'Historial', icon: History },
            { id: 'settings', label: 'Detalles de Cuenta', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} className="sm:w-5 sm:h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content - Mobile optimized */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[60vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Saldo Actual</p>
                    <p className="text-2xl sm:text-3xl font-bold">
                      ${balance.toFixed(2)} {user.isDemo && '(Demo)'}
                    </p>
                  </div>
                  <Wallet size={24} className="text-blue-300 sm:w-8 sm:h-8" />
                </div>
              </div>

              {/* Casino Stats Grid - Mobile responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="text-green-400" size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Total Ganado</p>
                      <p className="text-white font-bold text-sm sm:text-base">${(user.total_won || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="text-red-400" size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Total Apostado</p>
                      <p className="text-white font-bold text-sm sm:text-base">${(user.total_wagered || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <DollarSign className={`${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Ganancia Neta</p>
                      <p className={`font-bold text-sm sm:text-base ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${netProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <User className="text-blue-400" size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Juegos Jugados</p>
                      <p className="text-white font-bold text-sm sm:text-base">{user.games_played || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Games */}
              <div>
                <h3 className="text-white font-semibold mb-3 sm:mb-4">Juegos Recientes</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gameHistory.slice(-5).reverse().map(game => (
                    <div key={game.id} className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          game.winAmount > game.betAmount ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className="text-white text-sm sm:text-base">{game.multiplier.toFixed(2)}x</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm sm:text-base ${
                          game.winAmount > game.betAmount ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {game.winAmount > game.betAmount ? '+' : ''}{(game.winAmount - game.betAmount).toFixed(2)}
                        </div>
                        <div className="text-white/60 text-xs">
                          {game.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Deposit Tab - Mobile optimized */}
          {activeTab === 'deposit' && (
            <div className="space-y-4 sm:space-y-6">
              {user.isDemo ? (
                <div className="text-center py-8">
                  <Shield size={32} className="text-white/60 mx-auto mb-4 sm:w-12 sm:h-12" />
                  <h3 className="text-white font-semibold mb-2">Modo Demo Activo</h3>
                  <p className="text-white/70 text-sm">
                    Inicia sesión con una cuenta real para recargar dinero
                  </p>
                </div>
              ) : (
                <>
                  {/* Deposit Amounts - Mobile grid */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 sm:mb-4">Selecciona Monto</h3>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {depositAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => setSelectedAmount(amount)}
                          className={`p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 backdrop-blur-md shadow-lg ${
                            selectedAmount === amount
                              ? 'border-blue-400/50 bg-blue-400/10'
                              : 'border-white/20 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <div className="text-white font-bold text-base sm:text-lg">${amount}</div>
                          <div className="text-white/70 text-xs sm:text-sm">USD</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Show selected amount */}
                    {selectedAmount && (
                      <div className="mt-4 p-3 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl shadow-lg">
                        <p className="text-blue-300 text-sm">✅ Monto seleccionado: <span className="font-bold">${selectedAmount} USD</span></p>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods - Mobile optimized */}
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-white font-semibold">Métodos de Pago</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowAddCard(true)}
                          className="px-2 sm:px-3 py-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white text-xs sm:text-sm rounded-xl transition-colors active:scale-95 shadow-lg"
                        >
                          + Tarjeta
                        </button>
                        <button
                          onClick={() => setShowAddPayPal(true)}
                          className="px-2 sm:px-3 py-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white text-xs sm:text-sm rounded-xl transition-colors active:scale-95 shadow-lg"
                        >
                          + PayPal
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-white/60">
                          <CreditCard size={24} className="mx-auto mb-2 sm:w-8 sm:h-8" />
                          <p className="text-sm">No tienes métodos de pago registrados</p>
                          <p className="text-xs">Agrega una tarjeta o PayPal para recargar</p>
                        </div>
                      ) : (
                        paymentMethods.map(method => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 backdrop-blur-md shadow-lg ${
                              selectedMethod === method.id
                                ? 'border-blue-400/50 bg-blue-400/10'
                                : 'border-white/20 hover:border-white/30 bg-white/5'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <CreditCard size={16} className="text-white/70 sm:w-5 sm:h-5" />
                              <div className="text-left">
                                <div className="text-white font-medium text-sm sm:text-base">
                                  {method.type === 'card' ? `**** ${method.last4}` : method.email}
                                </div>
                                <div className="text-white/60 text-xs sm:text-sm">
                                  {method.type === 'card' ? method.brand : 'PayPal'}
                                </div>
                              </div>
                            </div>
                            {selectedMethod === method.id && (
                              <div className="text-blue-400">✓</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                    
                    {/* Show selected method */}
                    {selectedMethod && (
                      <div className="mt-4 p-3 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl shadow-lg">
                        <p className="text-green-300 text-sm">
                          ✅ Método seleccionado: <span className="font-bold">
                            {paymentMethods.find(m => m.id === selectedMethod)?.type === 'card' 
                              ? `**** ${paymentMethods.find(m => m.id === selectedMethod)?.last4}`
                              : paymentMethods.find(m => m.id === selectedMethod)?.email
                            }
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Deposit Button - Mobile optimized */}
                  {canDeposit && (
                    <div className="space-y-4">
                      <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-3 sm:p-4 shadow-lg">
                        <p className="text-yellow-200 text-sm">
                          💳 Se procesará el pago de ${selectedAmount} USD usando tu método seleccionado
                        </p>
                      </div>
                      
                      <button
                        onClick={handleDeposit}
                        className="w-full bg-gradient-to-r from-green-500/90 to-blue-500/90 hover:from-green-600/90 hover:to-blue-600/90 backdrop-blur-md border border-green-400/30 text-white font-bold py-3 sm:py-4 rounded-2xl transition-all transform active:scale-95 shadow-2xl"
                      >
                        💳 Recargar ${selectedAmount} USD
                      </button>
                    </div>
                  )}

                  {/* Help text when requirements not met */}
                  {!canDeposit && selectedAmount && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 shadow-lg">
                      <p className="text-white/80 text-sm">
                        {!selectedMethod ? '👆 Selecciona un método de pago para continuar' : 'Completa todos los campos'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Withdraw Tab - Mobile optimized */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4 sm:space-y-6">
              {user.isDemo ? (
                <div className="text-center py-8">
                  <Shield size={32} className="text-white/60 mx-auto mb-4 sm:w-12 sm:h-12" />
                  <h3 className="text-white font-semibold mb-2">Modo Demo Activo</h3>
                  <p className="text-white/70 text-sm">
                    Inicia sesión con una cuenta real para retirar dinero
                  </p>
                </div>
              ) : !user.kyc_verified ? (
                <div className="text-center py-8">
                  <AlertCircle size={32} className="text-yellow-400 mx-auto mb-4 sm:w-12 sm:h-12" />
                  <h3 className="text-white font-semibold mb-2">Verificación Requerida</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Necesitas verificar tu identidad para retirar fondos
                  </p>
                  <button
                    onClick={() => setShowKYCForm(true)}
                    className="bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white font-medium py-2 px-4 rounded-xl transition-colors active:scale-95 shadow-lg"
                  >
                    Verificar Identidad
                  </button>
                </div>
              ) : (
                <>
                  {/* Withdrawal Amounts - Mobile grid */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 sm:mb-4">Selecciona Monto</h3>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {withdrawalAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => setWithdrawalAmount(amount)}
                          disabled={amount > balance}
                          className={`p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 backdrop-blur-md shadow-lg ${
                            withdrawalAmount === amount
                              ? 'border-blue-400/50 bg-blue-400/10'
                              : amount > balance
                              ? 'border-gray-500/30 bg-gray-500/10 opacity-50 cursor-not-allowed'
                              : 'border-white/20 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <div className="text-white font-bold text-base sm:text-lg">${amount}</div>
                          <div className="text-white/70 text-xs sm:text-sm">USD</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom amount input */}
                    <div className="mt-4">
                      <input
                        type="number"
                        placeholder="Monto personalizado"
                        value={withdrawalAmount || ''}
                        onChange={(e) => setWithdrawalAmount(Number(e.target.value) || 0)}
                        className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                        min={minWithdrawal}
                        max={balance}
                      />
                    </div>
                  </div>

                  {/* Bank Accounts */}
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-white font-semibold">Cuentas Bancarias</h3>
                      <button
                        onClick={() => setShowAddBank(true)}
                        className="px-2 sm:px-3 py-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white text-xs sm:text-sm rounded-xl transition-colors active:scale-95 shadow-lg"
                      >
                        + Banco
                      </button>
                    </div>

                    <div className="space-y-2">
                      {bankAccounts.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-white/60">
                          <Bank size={24} className="mx-auto mb-2 sm:w-8 sm:h-8" />
                          <p className="text-sm">No tienes cuentas bancarias registradas</p>
                          <p className="text-xs">Agrega una cuenta bancaria para retirar</p>
                        </div>
                      ) : (
                        bankAccounts.map(account => (
                          <button
                            key={account.id}
                            onClick={() => setSelectedBankAccount(account.id)}
                            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 backdrop-blur-md shadow-lg ${
                              selectedBankAccount === account.id
                                ? 'border-blue-400/50 bg-blue-400/10'
                                : 'border-white/20 hover:border-white/30 bg-white/5'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Bank size={16} className="text-white/70 sm:w-5 sm:h-5" />
                              <div className="text-left">
                                <div className="text-white font-medium text-sm sm:text-base">
                                  {account.bankName}
                                </div>
                                <div className="text-white/60 text-xs sm:text-sm">
                                  **** {account.accountNumber.slice(-4)}
                                </div>
                              </div>
                            </div>
                            {selectedBankAccount === account.id && (
                              <div className="text-blue-400">✓</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Withdrawal Button */}
                  {canWithdraw && withdrawalAmount > 0 && selectedBankAccount && (
                    <div className="space-y-4">
                      <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-3 sm:p-4 shadow-lg">
                        <p className="text-yellow-200 text-sm">
                          💳 Se procesará el retiro de ${withdrawalAmount} USD a tu cuenta bancaria
                        </p>
                      </div>
                      
                      <button
                        onClick={handleWithdrawal}
                        className="w-full bg-gradient-to-r from-green-500/90 to-blue-500/90 hover:from-green-600/90 hover:to-blue-600/90 backdrop-blur-md border border-green-400/30 text-white font-bold py-3 sm:py-4 rounded-2xl transition-all transform active:scale-95 shadow-2xl"
                      >
                        💳 Retirar ${withdrawalAmount} USD
                      </button>
                    </div>
                  )}

                  {/* Help text when requirements not met */}
                  {!canWithdraw && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 shadow-lg">
                      <p className="text-white/80 text-sm">
                        {balance < minWithdrawal 
                          ? `Saldo mínimo requerido: $${minWithdrawal} USD`
                          : !user.kyc_verified
                          ? 'Verificación de identidad requerida'
                          : 'Completa todos los campos para continuar'
                        }
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* History Tab - Mobile optimized */}
          {activeTab === 'history' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-3 sm:mb-4">Historial de Transacciones</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <History size={32} className="mx-auto mb-4 sm:w-12 sm:h-12" />
                      <p className="text-sm">No hay transacciones registradas</p>
                      <p className="text-xs">Realiza depósitos o retiros para ver el historial</p>
                    </div>
                  ) : (
                    transactions.slice().reverse().map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.type === 'deposit' ? 'bg-green-400' : 'bg-blue-400'
                          }`} />
                          <div>
                            <div className="text-white font-medium text-sm sm:text-base">
                              {transaction.type === 'deposit' ? 'Depósito' : 'Retiro'}
                            </div>
                            <div className="text-white/60 text-xs sm:text-sm">
                              {transaction.method}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold text-sm sm:text-base ${
                            transaction.type === 'deposit' ? 'text-green-400' : 'text-blue-400'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </div>
                          <div className={`text-xs ${
                            transaction.status === 'completed' ? 'text-green-400' :
                            transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {transaction.status === 'completed' ? 'Completado' :
                             transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                          </div>
                          <div className="text-white/60 text-xs">
                            {transaction.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab - Mobile optimized */}
          {activeTab === 'settings' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-3 sm:mb-4">Información de Cuenta</h3>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Nombre:</span>
                    <span className="text-white text-sm">{user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Email:</span>
                    <span className="text-white text-sm">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Proveedor:</span>
                    <span className="text-white text-sm capitalize">{user?.provider || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Tipo de Cuenta:</span>
                    <span className="text-white text-sm">{user?.isDemo ? 'Demo' : 'Real'}</span>
                  </div>
                  {user?.age && (
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Edad:</span>
                      <span className="text-white text-sm">{user.age} años</span>
                    </div>
                  )}
                  {user?.country && (
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">País:</span>
                      <span className="text-white text-sm">{user.country}</span>
                    </div>
                  )}
                  {user?.phone && (
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Teléfono:</span>
                      <span className="text-white text-sm">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Verificación KYC:</span>
                    <span className={`text-sm ${user?.kyc_verified ? 'text-green-400' : 'text-red-400'}`}>
                      {user?.kyc_verified ? '✓ Verificado' : '✗ Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Casino Statistics */}
              <div>
                <h3 className="text-white font-semibold mb-3 sm:mb-4">Estadísticas del Casino</h3>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Total Depositos:</span>
                    <span className="text-white text-sm">${(user?.total_deposits || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Total Retiros:</span>
                    <span className="text-white text-sm">${(user?.total_withdrawals || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Juegos Jugados:</span>
                    <span className="text-white text-sm">{user?.games_played || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Total Apostado:</span>
                    <span className="text-white text-sm">${(user?.total_wagered || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Total Ganado:</span>
                    <span className="text-white text-sm">${(user?.total_won || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Account Limits */}
              <div>
                <h3 className="text-white font-semibold mb-3 sm:mb-4">Límites de Cuenta</h3>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Límite de Depósito:</span>
                    <span className="text-white text-sm">${(user?.deposit_limit || 1000).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Límite de Retiro:</span>
                    <span className="text-white text-sm">${(user?.withdrawal_limit || 1000).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* KYC Verification Button */}
              {!user?.kyc_verified && (
                <div>
                  <h3 className="text-white font-semibold mb-3 sm:mb-4">Verificación de Identidad</h3>
                  <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-2xl p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <AlertCircle size={20} className="text-yellow-400" />
                      <span className="text-yellow-300 text-sm font-medium">Verificación Pendiente</span>
                    </div>
                    <p className="text-white/70 text-sm mb-3">
                      Para poder retirar fondos, necesitas completar la verificación de identidad (KYC).
                    </p>
                    <button
                      onClick={() => setShowKYCForm(true)}
                      className="w-full bg-yellow-500/80 hover:bg-yellow-600/80 backdrop-blur-md border border-yellow-400/30 text-white font-medium py-2 rounded-xl transition-colors active:scale-95 shadow-lg"
                    >
                      Completar Verificación
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-md border border-red-400/30 text-white font-medium py-3 rounded-2xl transition-colors active:scale-95 shadow-lg"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* KYC Form Modal */}
        {showKYCForm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Verificación de Identidad</h3>
              <form className="space-y-4">
                <input
                  type="number"
                  placeholder="Edad"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="País"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowKYCForm(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Verificar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Card Modal - Mobile optimized */}
        {showAddCard && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Agregar Tarjeta</h3>
              <form onSubmit={handleAddCard} className="space-y-4">
                <input
                  name="cardNumber"
                  type="text"
                  placeholder="Número de tarjeta"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="expiry"
                    type="text"
                    placeholder="MM/YY"
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                    required
                  />
                  <input
                    name="cvv"
                    type="text"
                    placeholder="CVV"
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                    required
                  />
                </div>
                <input
                  name="name"
                  type="text"
                  placeholder="Nombre en la tarjeta"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add PayPal Modal - Mobile optimized */}
        {showAddPayPal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Agregar PayPal</h3>
              <form onSubmit={handleAddPayPal} className="space-y-4">
                <input
                  name="email"
                  type="email"
                  placeholder="Email de PayPal"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPayPal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Bank Modal - Mobile optimized */}
        {showAddBank && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Agregar Cuenta Bancaria</h3>
              <form onSubmit={handleAddBank} className="space-y-4">
                <input
                  name="bankName"
                  type="text"
                  placeholder="Nombre del Banco"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <input
                  name="accountNumber"
                  type="text"
                  placeholder="Número de Cuenta"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <input
                  name="accountHolder"
                  type="text"
                  placeholder="Titular de la Cuenta"
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none shadow-lg"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBank(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl active:scale-95 shadow-lg"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
