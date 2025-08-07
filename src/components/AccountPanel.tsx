import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePayments } from '../hooks/usePayments';
import { TransactionHistory } from './TransactionHistory';
import { PaymentMethods } from './PaymentMethods';
import { WithdrawalForm } from './WithdrawalForm';
import { RechargeModal } from './RechargeModal';
import { supabase } from '../lib/supabase';
import { 
  User,
  Camera,
  Edit3,
  Search,
  Bell,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  History,
  LogOut,
  Plus,
  Building,
  Settings,
  Home,
  BarChart3,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Headphones,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AccountPanelProps {
  onClose: () => void;
}

type TabType = 'dashboard' | 'games' | 'transactions' | 'payments' | 'settings';

export const AccountPanel: React.FC<AccountPanelProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { userBalance, loading } = usePayments();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        // Use Google avatar if available
        setProfileImage(profile.avatar_url || user.user_metadata?.avatar_url || '');
      }

      // Fetch game history
      const { data: games } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setGameHistory(games || []);

      // Fetch transactions (deposits and withdrawals)
      const { data: trans } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(trans || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const calculateStats = () => {
    if (!gameHistory || gameHistory.length === 0) {
      return { totalWins: 0, totalLosses: 0, netBalance: 0, gamesWon: 0, gamesLost: 0 };
    }

    let totalWins = 0;
    let totalLosses = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    gameHistory.forEach(game => {
      if (game.win_amount > 0) {
        totalWins += game.win_amount - game.bet_amount; // Net profit
        gamesWon++;
      } else {
        totalLosses += game.bet_amount;
        gamesLost++;
      }
    });

    return { 
      totalWins, 
      totalLosses, 
      netBalance: totalWins - totalLosses,
      gamesWon,
      gamesLost
    };
  };

  const calculateAge = (birthdate: string): number | null => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.floor(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Mi tablero', icon: Home, active: true },
    { id: 'games', label: 'Juegos', icon: BarChart3, disabled: false },
    { id: 'transactions', label: 'Transacciones', icon: History, disabled: false },
    { id: 'payments', label: 'Pagos', icon: CreditCard, disabled: false },
    { id: 'settings', label: 'Configuración', icon: Settings, disabled: true },
    { id: 'support', label: 'Soporte', icon: Headphones, disabled: true },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex-1 bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 md:p-8 flex flex-col lg:flex-row gap-6 relative overflow-visible">
            {/* Profile Card */}
            <section className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 w-full lg:w-[320px] flex flex-col items-center">
              <div className="relative mb-4 md:mb-6 w-full">
                <img 
                  alt="Foto de perfil" 
                  className="rounded-xl w-full h-48 md:h-64 object-cover border-2 border-white/20"
                  src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || user?.name || 'Usuario')}&background=6366f1&color=fff&size=280`}
                />
                <button 
                  className="absolute bottom-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full py-1 px-3 flex items-center gap-1"
                  type="button"
                >
                  <Camera size={12} />
                  Cambiar foto
                </button>
              </div>

              <div className="w-full">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-semibold text-base text-white">Mi perfil</h2>
                  <p className="text-xs text-gray-400 text-right">
                    Último login
                    <br />
                    {userProfile?.updated_at ? formatDate(userProfile.updated_at) : 'Hoy'}
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {userProfile?.full_name || user?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user?.email || 'email@ejemplo.com'}
                    </p>
                  </div>

                  {userProfile?.age && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>{userProfile.age} años</span>
                    </div>
                  )}

                  {userProfile?.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Phone size={12} />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}

                  {userProfile?.country && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin size={12} />
                      <span>{userProfile.country}</span>
                    </div>
                  )}

                  {userProfile?.kyc_verified && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <ShieldCheck size={12} />
                      <span>Cuenta verificada</span>
                    </div>
                  )}
                </div>

                <hr className="border-gray-700 mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <button className="text-xs font-semibold text-purple-400 hover:underline focus:outline-none" type="button">
                    Alertas SMS activadas
                  </button>
                  <div aria-label="Estado de alertas SMS" className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]"></div>
                </div>

                <button 
                  onClick={() => setShowPaymentMethods(true)}
                  className="w-full bg-gray-700/50 hover:bg-gray-700/70 text-white text-sm font-semibold rounded-full py-2 mb-2 flex items-center justify-center gap-2"
                >
                  <CreditCard size={14} />
                  Métodos de Pago
                </button>

                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full py-2" type="button">
                  Editar Perfil
                </button>
              </div>
            </section>

            {/* Right Cards Container */}
            <section className="flex flex-col gap-6 flex-1">
              {/* Account Balance */}
              <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h3 className="text-sm font-semibold text-white">Mi cuenta Spaceman</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowRechargeModal(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-semibold rounded-full px-3 py-1 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Recargar
                    </button>
                    <button 
                      onClick={() => setShowWithdrawalForm(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full px-3 py-1 flex items-center gap-1"
                    >
                      <Building size={12} />
                      Retirar
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  <p className="font-semibold text-white mb-1">Monto total en cuenta:</p>
                  <p className="text-2xl font-bold text-white">${formatCurrency(userBalance?.balance || 0)} pesos</p>
                </div>

                <button 
                  onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full px-3 py-1 mb-4 w-max"
                >
                  {showBalanceDetails ? 'Ocultar' : 'Mostrar'} balance de sumas y restas
                </button>

                {showBalanceDetails && (
                  <div className="text-xs text-gray-400 animate-fadeIn">
                    <div className="flex justify-between mb-2">
                      <span>Ganancias:</span>
                      <span className="font-semibold text-green-400">+ ${formatCurrency(stats.totalWins)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Pérdidas:</span>
                      <span className="font-semibold text-red-400">- ${formatCurrency(stats.totalLosses)}</span>
                    </div>
                    <hr className="border-gray-700 my-2" />
                    <div className="flex justify-between font-semibold text-white">
                      <span>Balance neto:</span>
                      <span className={stats.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${formatCurrency(Math.abs(stats.netBalance))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Games History Summary */}
              <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-white">Juegos ganados y perdidos</h3>
                  <button 
                    onClick={() => setActiveTab('games')}
                    className="bg-gray-700 text-gray-300 text-xs font-semibold rounded-full px-3 py-1"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="flex flex-col gap-4 text-xs text-gray-400">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div aria-label="Juegos ganados" className="w-3 h-3 rounded-full bg-green-500"></div>
                      <p className="font-semibold text-white">Juegos ganados</p>
                    </div>
                    <button className="bg-green-500 text-white text-xs font-semibold rounded-full px-3 py-1">
                      {stats.gamesWon} Ganados
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div aria-label="Juegos perdidos" className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <p className="font-semibold text-white">Juegos perdidos</p>
                    </div>
                    <button className="bg-pink-500 text-white text-xs font-semibold rounded-full px-3 py-1">
                      {stats.gamesLost} Perdidos
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Gradient shapes */}
            <div className="pointer-events-none select-none absolute bottom-0 right-0 -z-10 w-48 h-48 md:w-56 md:h-56 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" 
                 style={{ transform: 'translate(40%, 40%)' }}></div>
          </div>
        );

      case 'games':
        return (
          <div className="flex-1 bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Historial de Juegos</h2>
            
            <div className="space-y-4">
              {gameHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No hay juegos registrados aún</p>
                </div>
              ) : (
                gameHistory.map((game) => (
                  <div key={game.id} className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          game.win_amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {game.win_amount > 0 ? (
                            <TrendingUp size={20} className="text-green-400" />
                          ) : (
                            <TrendingDown size={20} className="text-red-400" />
                          )}
                        </div>
                        
                        <div>
                          <p className="text-white font-medium">
                            {game.win_amount > 0 ? 'Ganancia' : 'Pérdida'} en {game.multiplier.toFixed(2)}x
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(game.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-bold ${game.win_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {game.win_amount > 0 ? '+' : '-'}${formatCurrency(game.win_amount > 0 ? game.win_amount - game.bet_amount : game.bet_amount)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Apuesta: ${formatCurrency(game.bet_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="flex-1 bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Historial de Transacciones</h2>
            
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No hay transacciones registradas aún</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          {transaction.type === 'deposit' ? (
                            <ArrowDownRight size={20} className="text-green-400" />
                          ) : (
                            <ArrowUpRight size={20} className="text-blue-400" />
                          )}
                        </div>
                        
                        <div>
                          <p className="text-white font-medium">
                            {transaction.type === 'deposit' ? 'Depósito' : 'Retiro'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === 'deposit' ? 'text-green-400' : 'text-blue-400'}`}>
                          {transaction.type === 'deposit' ? '+' : '-'}${formatCurrency(transaction.amount)}
                        </p>
                        <p className={`text-xs px-2 py-1 rounded-full inline-block ${
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.status === 'completed' ? 'Completado' :
                           transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="flex-1 bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Métodos de Pago</h2>
            <PaymentMethods 
              onAddNew={() => setShowPaymentMethods(true)}
              showAddButton={true}
            />
          </div>
        );

      default:
        return (
          <div className="flex-1 bg-gray-900/50 backdrop-blur-xl rounded-3xl p-4 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">En construcción</h2>
            <p className="text-gray-400">Esta sección estará disponible próximamente.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-7xl bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header - Mobile/Desktop */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <div>
            <h1 className="text-lg font-semibold text-white">Mi panel de finanzas</h1>
            <p className="text-xs font-normal text-gray-400">Bienvenido al portal de pagos Spaceman</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button aria-label="Notificaciones" className="text-gray-400 hover:text-white transition-colors">
              <Bell size={16} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main container */}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] md:h-[85vh]">
          {/* Sidebar - Mobile horizontal / Desktop vertical */}
          <aside className={`${isMobile ? 'border-b' : 'border-r'} border-white/10 p-4 lg:p-6 lg:w-48`}>
            <nav className={`flex ${isMobile ? 'flex-row overflow-x-auto gap-3' : 'flex-col space-y-4'} w-full`}>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setActiveTab(item.id as TabType)}
                    disabled={item.disabled}
                    className={`flex items-center gap-3 text-sm font-medium rounded-full px-4 py-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500'
                        : item.disabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    <span className={isMobile ? 'hidden' : ''}>{item.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full px-4 py-2 transition-all ${
                  isMobile ? '' : 'mt-6'
                }`}
              >
                <LogOut size={16} />
                <span className={isMobile ? 'hidden' : ''}>Cerrar sesión</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWithdrawalForm && (
        <WithdrawalForm
          onClose={() => setShowWithdrawalForm(false)}
          onSuccess={() => {
            setShowWithdrawalForm(false);
            fetchUserData();
          }}
        />
      )}

      {showRechargeModal && (
        <RechargeModal
          onClose={() => {
            setShowRechargeModal(false);
            fetchUserData();
          }}
        />
      )}

      {showPaymentMethods && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">Métodos de Pago</h2>
              <button
                onClick={() => setShowPaymentMethods(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <PaymentMethods 
                onAddNew={() => {}}
                showAddButton={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};