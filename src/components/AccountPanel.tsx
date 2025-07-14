import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, CreditCard, BarChart3, Settings, Trophy, Clock, DollarSign, Download, Upload, Eye, EyeOff, X } from 'lucide-react';

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowStripeCheckout: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  total_wagered: number;
  total_won: number;
  games_played: number;
  total_deposits: number;
  total_withdrawals: number;
  deposit_limit: number;
  withdrawal_limit: number;
  kyc_verified: boolean;
  created_at: string;
  country: string | null;
  phone: string | null;
  age: number | null;
}

interface GameHistory {
  id: string;
  bet_amount: number;
  multiplier: number;
  win_amount: number;
  created_at: string;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ isOpen, onClose, onShowStripeCheckout }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('balance');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Error cargando perfil');
        return;
      }

      setUserProfile(profile);

      // Fetch game history (last 20 games)
      const { data: history, error: historyError } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyError) {
        console.error('Error fetching game history:', historyError);
      } else {
        setGameHistory(history || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userProfile || !withdrawAmount) return;
    
    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > userProfile.balance) {
      setError('Cantidad inválida');
      return;
    }

    try {
      // Create withdrawal transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'withdrawal',
          amount: amount,
          payment_method: 'pending',
          status: 'pending'
        });

      if (error) {
        setError('Error procesando retiro');
        return;
      }

      setWithdrawAmount('');
      setError(null);
      alert('Solicitud de retiro enviada. Será procesada en 24-48 horas.');
      fetchUserData(); // Refresh data
    } catch (err) {
      setError('Error procesando retiro');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-blue-400" />
            Panel de Usuario
          </h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white/80 text-2xl font-bold"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row h-full">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 border-r border-white/20 p-4">
            <nav className="space-y-2">
              {[
                { id: 'balance', label: 'Balance & Depósitos', icon: CreditCard },
                { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
                { id: 'history', label: 'Historial', icon: Clock },
                { id: 'profile', label: 'Perfil', icon: User },
                { id: 'settings', label: 'Configuración', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-white text-lg">Cargando...</div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center">{error}</div>
            ) : (
              <>
                {/* Balance & Deposits Tab */}
                {activeTab === 'balance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Balance */}
                      <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">Balance Actual</h3>
                          <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="text-white/60 hover:text-white"
                          >
                            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                          </button>
                        </div>
                        <div className="text-3xl font-bold text-green-400">
                          {showBalance ? `${userProfile?.balance?.toFixed(2) || '0.00'} monedas` : '••••••'}
                        </div>
                        <div className="text-green-300 text-sm mt-1">
                          ≈ ${userProfile?.balance?.toFixed(2) || '0.00'} MXN
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-4">
                        <button
                          onClick={onShowStripeCheckout}
                          className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 p-4 rounded-xl text-white flex items-center justify-center gap-2 transition-all"
                        >
                          <Upload size={20} />
                          Depositar Fondos
                        </button>
                        
                        <div className="bg-white/10 p-4 rounded-xl">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Cantidad a retirar"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50"
                              max={userProfile?.balance || 0}
                            />
                            <button
                              onClick={handleWithdraw}
                              disabled={!withdrawAmount || parseFloat(withdrawAmount) > (userProfile?.balance || 0)}
                              className="bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-white/10 border border-orange-400/30 disabled:border-white/20 px-4 py-2 rounded-lg text-white disabled:text-white/50 flex items-center gap-2 transition-all"
                            >
                              <Download size={16} />
                              Retirar
                            </button>
                          </div>
                          <div className="text-xs text-white/50 mt-2">
                            Límite de retiro: {userProfile?.withdrawal_limit || 1000} monedas/día
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/10 p-4 rounded-xl">
                        <div className="text-white/60 text-sm">Total Apostado</div>
                        <div className="text-white font-bold">{userProfile?.total_wagered?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl">
                        <div className="text-white/60 text-sm">Total Ganado</div>
                        <div className="text-white font-bold">{userProfile?.total_won?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl">
                        <div className="text-white/60 text-sm">Depósitos</div>
                        <div className="text-white font-bold">{userProfile?.total_deposits?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl">
                        <div className="text-white/60 text-sm">Retiros</div>
                        <div className="text-white font-bold">{userProfile?.total_withdrawals?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 p-6 rounded-xl border border-purple-400/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Trophy className="text-purple-400" size={24} />
                          <h3 className="text-white font-semibold">Juegos Jugados</h3>
                        </div>
                        <div className="text-3xl font-bold text-purple-400">
                          {userProfile?.games_played || 0}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-400/30">
                        <div className="flex items-center gap-3 mb-3">
                          <BarChart3 className="text-blue-400" size={24} />
                          <h3 className="text-white font-semibold">Ratio Ganancia</h3>
                        </div>
                        <div className="text-3xl font-bold text-blue-400">
                          {userProfile?.total_wagered && userProfile.total_wagered > 0 
                            ? ((userProfile.total_won / userProfile.total_wagered) * 100).toFixed(1) 
                            : '0.0'
                          }%
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-400/30">
                        <div className="flex items-center gap-3 mb-3">
                          <DollarSign className="text-green-400" size={24} />
                          <h3 className="text-white font-semibold">Ganancia Neta</h3>
                        </div>
                        <div className="text-3xl font-bold text-green-400">
                          {((userProfile?.total_won || 0) - (userProfile?.total_wagered || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-white text-xl font-semibold">Historial de Juegos</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {gameHistory.length > 0 ? gameHistory.map(game => (
                        <div key={game.id} className="bg-white/10 p-4 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              Apuesta: {game.bet_amount} monedas
                            </div>
                            <div className="text-white/60 text-sm">
                              {new Date(game.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">
                              {game.multiplier.toFixed(2)}x
                            </div>
                            <div className={`text-sm font-medium ${
                              game.win_amount > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {game.win_amount > 0 ? '+' : ''}{(game.win_amount - game.bet_amount).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-white/60 text-center py-8">
                          No hay historial de juegos disponible
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">Email</label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">{user?.email}</div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">Nombre Completo</label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">
                            {userProfile?.full_name || 'No especificado'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">País</label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">
                            {userProfile?.country || 'No especificado'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">Teléfono</label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">
                            {userProfile?.phone || 'No especificado'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">Edad</label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">
                            {userProfile?.age || 'No especificado'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">Verificación KYC</label>
                          <div className={`p-3 rounded-lg font-medium ${
                            userProfile?.kyc_verified 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {userProfile?.kyc_verified ? 'Verificado' : 'Pendiente'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-white/10 p-6 rounded-xl">
                      <h3 className="text-white text-lg font-semibold mb-4">Límites de Cuenta</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">
                            Límite de Depósito Diario
                          </label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">
                            {userProfile?.deposit_limit || 1000} monedas
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">
                            Límite de Retiro Diario
                          </label>
                          <div className="bg-white/10 p-3 rounded-lg text-white">
                            {userProfile?.withdrawal_limit || 1000} monedas
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-400/30 p-6 rounded-xl">
                      <h3 className="text-red-400 text-lg font-semibold mb-4">Zona de Peligro</h3>
                      <button
                        onClick={signOut}
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 py-3 px-6 rounded-lg font-medium transition-all"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPanel;