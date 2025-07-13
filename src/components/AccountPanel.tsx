import React, { useState } from 'react';
import { X, CreditCard, Plus, History, TrendingUp, TrendingDown, LogOut, Wallet, Shield, Settings, DollarSign, ArrowDownToLine, Ban as Bank, User, AlertCircle, Target, Zap, ZapOff } from 'lucide-react';

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
  autoCashOutEnabled: boolean;
  setAutoCashOutEnabled: (enabled: boolean) => void;
  autoCashOut: number;
  setAutoCashOut: (multiplier: number) => void;
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
  onWithdrawal,
  autoCashOutEnabled,
  setAutoCashOutEnabled,
  autoCashOut,
  setAutoCashOut
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history' | 'settings' | 'autocashout'>('overview');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddPayPal, setShowAddPayPal] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Mock bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const depositAmounts = [100, 500, 1000, 2000, 5000];
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

  // Simplified deposit process - 1 peso mexicano = 1 moneda
  const handleQuickDeposit = async (amount: number) => {
    if (user.isDemo) return;
    
    setProcessingPayment(true);
    
    try {
      // Simulate Stripe payment processing
      console.log('🔒 Initiating Stripe payment for $', amount);
      
      // Simulate Stripe Checkout redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would integrate with Stripe
      // const stripe = await stripePromise;
      // const { error } = await stripe.redirectToCheckout({
      //   sessionId: session.id
      // });
      
      onDeposit(amount, 'quick_payment');
      
      // Show success message
      alert(`¡Depósito exitoso con Stripe! Se agregaron ${amount} monedas a tu cuenta por $${amount} USD`);
      
    } catch (error) {
      alert('Error en el procesamiento con Stripe. Intenta nuevamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleWithdrawal = () => {
    if (withdrawalAmount && selectedBankAccount && !user.isDemo && withdrawalAmount <= balance) {
      const bankAccount = bankAccounts.find(b => b.id === selectedBankAccount);
      if (!bankAccount) return;

      const transactionData = {
        amount: withdrawalAmount,
        method: `${bankAccount.bankName} **** ${bankAccount.accountNumber.slice(-4)}`
      };

      if (onWithdrawal) {
        onWithdrawal(transactionData.amount, transactionData.method);
      }

      alert(`Retiro de ${withdrawalAmount} monedas solicitado ($${withdrawalAmount} MXN). Será procesado en 1-3 días hábiles.`);
      
      setWithdrawalAmount(0);
      setSelectedBankAccount('');
    }
  };

  const totalWon = gameHistory.reduce((sum, game) => sum + game.winAmount, 0);
  const totalBet = gameHistory.reduce((sum, game) => sum + game.betAmount, 0);
  const netProfit = totalWon - totalBet;

  const minWithdrawal = 100;
  const canWithdraw = balance >= minWithdrawal && !user.isDemo && user.kyc_verified;
  const canDeposit = selectedAmount && selectedAmount > 0 && selectedMethod && selectedMethod !== '' && !user.isDemo;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
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

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: 'overview', label: 'Resumen', icon: Wallet },
            { id: 'deposit', label: 'Recargar', icon: Plus },
            { id: 'withdraw', label: 'Retirar', icon: ArrowDownToLine },
            { id: 'autocashout', label: 'Auto Cashout', icon: Target },
            { id: 'history', label: 'Historial', icon: History },
            { id: 'settings', label: 'Cuenta', icon: Settings }
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

        {/* Content */}
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
                      {balance.toFixed(0)} monedas {user.isDemo && '(Demo)'}
                    </p>
                    <p className="text-blue-200 text-xs">≈ ${balance.toFixed(0)} MXN</p>
                  </div>
                  <Wallet size={24} className="text-blue-300 sm:w-8 sm:h-8" />
                </div>
              </div>

              {/* Casino Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="text-green-400" size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Total Ganado</p>
                      <p className="text-white font-bold text-sm sm:text-base">{(user.total_won || 0).toFixed(0)} monedas</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="text-red-400" size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Total Apostado</p>
                      <p className="text-white font-bold text-sm sm:text-base">{(user.total_wagered || 0).toFixed(0)} monedas</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <DollarSign className={`${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} size={20} />
                    <div>
                      <p className="text-white/70 text-xs sm:text-sm">Ganancia Neta</p>
                      <p className={`font-bold text-sm sm:text-base ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {netProfit.toFixed(0)} monedas
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

              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-4 shadow-lg">
                <h3 className="text-white font-semibold mb-2 flex items-center">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 2h8v2H6V8zm0 4h12v2H6v-2z"/>
                  </svg>
                  💰 Compra Segura con Stripe
                </h3>
                <p className="text-blue-200 text-sm">1 USD = 1 Moneda del juego</p>
                <p className="text-blue-200 text-xs mt-1">
                  🔒 Pago seguro con Stripe • Tarjetas de crédito/débito • PayPal • Apple Pay
                </p>
                <p className="text-green-300 text-xs mt-1">
                  ⚡ Procesamiento instantáneo • Retiros a cuenta bancaria en 1-3 días
                </p>
                  {gameHistory.slice(-5).reverse().map(game => (
                    <div key={game.id} className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  Compra Rápida con Stripe
                </h3>
                        }`} />
                        <span className="text-white text-sm sm:text-base">{game.multiplier.toFixed(2)}x</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm sm:text-base ${
                          game.winAmount > game.betAmount ? 'text-green-400' : 'text-red-400'
                      className="bg-gradient-to-r from-green-500/80 to-blue-500/80 hover:from-green-600/80 hover:to-blue-600/80 disabled:from-gray-500/80 disabled:to-gray-600/80 backdrop-blur-md border border-green-400/30 rounded-2xl p-4 transition-all active:scale-95 shadow-lg relative overflow-hidden"
                          {game.winAmount > game.betAmount ? '+' : ''}{(game.winAmount - game.betAmount).toFixed(0)}
                      <div className="relative z-10">
                        <div className="text-white font-bold text-lg">{amount} monedas</div>
                        <div className="text-green-200 text-sm">${amount} USD</div>
                        <div className="text-green-300 text-xs mt-1">
                          {amount >= 100 ? '🎁 +5% bonus' : '⚡ Instantáneo'}
                        </div>
                      </div>
                      {amount >= 100 && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                          POPULAR
                        </div>
                      )}
                          {game.timestamp.toLocaleTimeString()}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Stripe Features */}
                <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
                  <h4 className="text-white font-medium mb-2 text-sm">✨ Métodos de Pago Aceptados</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Visa, Mastercard, Amex
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      PayPal, Apple Pay
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Google Pay, Samsung Pay
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      Transferencia bancaria
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deposit Tab - Simplified */}
          {activeTab === 'deposit' && (
            <div className="space-y-4 sm:space-y-6">
              {user.isDemo ? (
                <div className="text-center py-8">
                  <Shield size={32} className="text-white/60 mx-auto mb-4 sm:w-12 sm:h-12" />
                  <h3 className="text-white font-semibold mb-2">Modo Demo Activo</h3>
                  <p className="text-white/70 text-sm">
                    Inicia sesión con una cuenta real para comprar monedas
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-4 shadow-lg">
                    <h3 className="text-white font-semibold mb-2">💰 Compra de Monedas</h3>
                    <p className="text-blue-200 text-sm">1 Peso Mexicano = 1 Moneda del juego</p>
                    <p className="text-blue-200 text-xs mt-1">Pago seguro con tarjeta de crédito/débito</p>
                  </div>

                  {/* Quick Purchase Options */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 sm:mb-4">Compra Rápida</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {depositAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => handleQuickDeposit(amount)}
                          disabled={processingPayment}
                          className="bg-gradient-to-r from-green-500/80 to-blue-500/80 hover:from-green-600/80 hover:to-blue-600/80 disabled:from-gray-500/80 disabled:to-gray-600/80 backdrop-blur-md border border-green-400/30 rounded-2xl p-4 transition-all active:scale-95 shadow-lg"
                        >
                          <div className="text-white font-bold text-lg">{amount} monedas</div>
                          <div className="text-green-200 text-sm">${amount} MXN</div>
                          {processingPayment && (
                            <div className="text-white/70 text-xs mt-1">Procesando...</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {processingPayment && (
                    <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                        <div>
                          <p className="text-yellow-200 font-medium">Procesando pago...</p>
                          <p className="text-yellow-300 text-sm">Por favor espera mientras procesamos tu transacción</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Auto Cashout Tab */}
          {activeTab === 'autocashout' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-md border border-orange-400/30 rounded-2xl p-4 sm:p-6 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Target size={20} className="mr-2 text-orange-400" />
                  Configuración de Auto Cashout
                </h3>
                
                {/* Auto Cashout Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-white font-medium">Activar Auto Cashout</h4>
                    <p className="text-white/70 text-sm">Retira automáticamente cuando se alcance el multiplicador</p>
                  </div>
                  <button
                    onClick={() => setAutoCashOutEnabled(!autoCashOutEnabled)}
                    className={`w-16 h-8 rounded-full transition-all duration-300 ${
                      autoCashOutEnabled 
                        ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                        : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-7 h-7 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                      autoCashOutEnabled ? 'translate-x-8' : 'translate-x-0.5'
                    }`}>
                      {autoCashOutEnabled ? (
                        <Zap size={14} className="text-green-500" />
                      ) : (
                        <ZapOff size={14} className="text-gray-400" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Multiplier Setting */}
                {autoCashOutEnabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Multiplicador de Auto Cashout</label>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setAutoCashOut(Math.max(1.01, autoCashOut - 0.1))}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        
                        <div className="flex-1 bg-orange-500/80 px-6 py-3 rounded-xl text-center">
                          <div className="text-white font-bold text-xl">{autoCashOut.toFixed(2)}x</div>
                        </div>
                        
                        <button 
                          onClick={() => setAutoCashOut(autoCashOut + 0.1)}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Multiplier Buttons */}
                    <div>
                      <p className="text-white/70 text-sm mb-2">Multiplicadores rápidos:</p>
                      <div className="flex space-x-2">
                        {[1.5, 2.0, 3.0, 5.0, 10.0].map(mult => (
                          <button
                            key={mult}
                            onClick={() => setAutoCashOut(mult)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              autoCashOut === mult
                                ? 'bg-orange-500/80 text-white'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {mult}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-3">
                      <p className="text-blue-200 text-sm">
                        ℹ️ El auto cashout se activará cuando el multiplicador alcance {autoCashOut.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Tips */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
                <h4 className="text-white font-medium mb-3">💡 Consejos de Estrategia</h4>
                <div className="space-y-2 text-sm text-white/80">
                  <p>• <strong>Conservador:</strong> 1.5x - 2.0x (Mayor probabilidad, menor ganancia)</p>
                  <p>• <strong>Moderado:</strong> 2.0x - 5.0x (Balance entre riesgo y recompensa)</p>
                  <p>• <strong>Arriesgado:</strong> 5.0x+ (Menor probabilidad, mayor ganancia)</p>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Tab */}
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
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4 shadow-lg">
                    <h3 className="text-white font-semibold mb-2 flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                      </svg>
                      💸 Retiro con Stripe Connect
                    </h3>
                    <p className="text-green-200 text-sm">1 Moneda = 1 USD directo a tu cuenta</p>
                    <p className="text-green-200 text-xs mt-1">
                      🏦 Retiros automáticos a cuenta bancaria • 1-3 días hábiles
                    </p>
                    <p className="text-blue-300 text-xs mt-1">
                      ⚡ Sin comisiones ocultas • Tipo de cambio real
                    </p>
                  </div>

                  {/* Withdrawal Amounts */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      Retiro Rápido
                    </h3>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {withdrawalAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => setWithdrawalAmount(amount)}
                          disabled={amount > balance}
                          className={`p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 backdrop-blur-md shadow-lg relative ${
                            withdrawalAmount === amount
                              ? 'border-blue-400/50 bg-blue-400/10'
                              : amount > balance
                              ? 'border-gray-500/30 bg-gray-500/10 opacity-50 cursor-not-allowed'
                              : 'border-white/20 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <div className="text-white font-bold text-base sm:text-lg">{amount} monedas</div>
                          <div className="text-white/70 text-xs sm:text-sm">${amount} USD</div>
                          <div className="text-green-400 text-xs mt-1">
                            {amount >= 500 ? '🚀 Express' : '⚡ Rápido'}
                          </div>
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
                          💳 Se procesará el retiro de {withdrawalAmount} monedas (${withdrawalAmount} MXN) a tu cuenta bancaria
                        </p>
                      </div>
                      
                      <button
                        onClick={handleWithdrawal}
                        className="w-full bg-gradient-to-r from-green-500/90 to-blue-500/90 hover:from-green-600/90 hover:to-blue-600/90 backdrop-blur-md border border-green-400/30 text-white font-bold py-3 sm:py-4 rounded-2xl transition-all transform active:scale-95 shadow-2xl"
                      >
                        💳 Retirar {withdrawalAmount} monedas
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* History Tab */}
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
                            {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toFixed(0)} monedas
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

          {/* Settings Tab */}
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
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 shadow-lg">
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Verificación KYC:</span>
                      <p className="text-yellow-200 font-medium">🔒 Procesando pago con Stripe...</p>
                      <p className="text-yellow-300 text-sm">Conexión segura SSL • Tu información está protegida</p>
                    </span>
                  </div>
                </div>
              </div>

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

        {/* Modals */}
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