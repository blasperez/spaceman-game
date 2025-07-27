import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, CreditCard, BarChart3, Settings, Trophy, Clock, DollarSign, Upload, Download, Eye, EyeOff, X } from 'lucide-react';
import { StripeCheckout } from './StripeCheckout';

interface MobileProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
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

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const MobileProfilePanel: React.FC<MobileProfilePanelProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('balance');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('50');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);
  const [rechargeHistory, setRechargeHistory] = useState<any[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [showBirthdateModal, setShowBirthdateModal] = useState(false);
  const [birthdateInput, setBirthdateInput] = useState('');
  const [savingBirthdate, setSavingBirthdate] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
      // Intentar obtener birthdate de Google
      const googleBirthdate = user.user_metadata?.birthdate;
      if (googleBirthdate) {
        saveBirthdateIfNeeded(googleBirthdate);
      } else {
        checkBirthdate();
      }
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileError) {
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
        setGameHistory([]);
      } else {
        setGameHistory(history || []);
      }
      // Fetch recharge history
      const { data: recharges } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(20);
      setRechargeHistory(recharges || []);
      // Fetch withdrawal history
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setWithdrawalHistory(withdrawals || []);
    } catch (err) {
      setError('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userProfile || !withdrawAmount) return;
    const amount = parseFloat(withdrawAmount);
    if (amount < 50) {
      setError('El retiro mínimo es de 50 monedas');
      return;
    }
    if (amount > userProfile.balance) {
      setError('Saldo insuficiente');
      return;
    }
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: amount,
          bank_clabe: '', // Puedes pedirlo en un modal aparte
          bank_name: '',
          status: 'pending',
        });
      if (error) {
        setError('Error procesando retiro');
        return;
      }
      setWithdrawAmount('');
      setError(null);
      alert('Solicitud de retiro enviada. Será procesada en 24-48 horas.');
      fetchUserData();
    } catch (err) {
      setError('Error procesando retiro');
    }
  };

  const checkBirthdate = async () => {
    // Verifica si el usuario tiene birthdate en profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('birthdate')
      .eq('id', user.id)
      .single();
    if (!profile || !profile.birthdate) {
      setShowBirthdateModal(true);
    }
  };

  const saveBirthdateIfNeeded = async (birthdate: string) => {
    // Guarda la fecha de nacimiento si no existe
    const { data: profile } = await supabase
      .from('profiles')
      .select('birthdate')
      .eq('id', user.id)
      .single();
    if (!profile || !profile.birthdate) {
      setSavingBirthdate(true);
      await supabase
        .from('profiles')
        .update({ birthdate, age: calculateAge(birthdate) })
        .eq('id', user.id);
      setSavingBirthdate(false);
      setShowBirthdateModal(false);
      fetchUserData();
    }
  };

  const handleSaveBirthdate = async () => {
    if (!birthdateInput) return;
    setSavingBirthdate(true);
    await supabase
      .from('profiles')
      .update({ birthdate: birthdateInput, age: calculateAge(birthdateInput) })
      .eq('id', user.id);
    setSavingBirthdate(false);
    setShowBirthdateModal(false);
    fetchUserData();
  };

  if (!isOpen) return null;
  if (!user) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white/10 p-6 rounded-xl text-center text-red-500 font-bold">Error: Usuario no autenticado.</div>
    </div>
  );

  // Validar mayoría de edad
  const canRechargeOrWithdraw = userProfile && userProfile.birthdate && calculateAge(userProfile.birthdate) >= 18;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/70">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-2xl border-t border-white/20 shadow-2xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="text-blue-400" />
            Mi Perfil
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white/80 text-2xl font-bold">
            <X size={24} />
          </button>
        </div>
        <nav className="flex justify-between mb-4">
          {[
            { id: 'balance', label: 'Balance', icon: CreditCard },
            { id: 'history', label: 'Historial', icon: Clock },
            { id: 'profile', label: 'Perfil', icon: User },
            { id: 'settings', label: 'Ajustes', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-2 py-1 rounded-lg ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'text-white/70 hover:text-white'}`}
            >
              <tab.icon size={20} />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white">Cargando...</div>
          ) : error ? (
            <div className="text-red-400 text-center">{error}</div>
          ) : (
            <>
              {/* Balance Tab */}
              {activeTab === 'balance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-500/20 to-green-600/20 p-4 rounded-xl border border-green-400/30">
                    <div>
                      <div className="text-white/80 text-xs">Saldo</div>
                      <div className="text-2xl font-bold text-green-400">
                        {showBalance ? `${userProfile?.balance?.toFixed(2) || '0.00'} monedas` : '••••••'}
                      </div>
                    </div>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
                      {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                 {!canRechargeOrWithdraw && (
                   <div className="bg-red-600/80 text-white text-center rounded-lg p-2 font-bold">
                     Debes ser mayor de 18 años para recargar o retirar. Ingresa tu fecha de nacimiento.
                   </div>
                 )}
                  {/* Input para monto de recarga */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={50}
                      step={1}
                      value={rechargeAmount}
                      onChange={e => setRechargeAmount(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50"
                      placeholder="Monto a recargar (mínimo 50)"
                      disabled={!canRechargeOrWithdraw}
                    />
                    <button
                      onClick={() => setShowStripe(true)}
                      disabled={parseFloat(rechargeAmount) < 50 || !canRechargeOrWithdraw}
                      className="bg-blue-500/80 hover:bg-blue-600/80 border border-blue-400/30 p-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all disabled:bg-white/10 disabled:text-white/50"
                    >
                      <Upload size={20} />
                      Recargar monedas
                    </button>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Cantidad a retirar (mínimo 50)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50"
                        min={50}
                        max={userProfile?.balance || 0}
                        disabled={!canRechargeOrWithdraw}
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) < 50 || parseFloat(withdrawAmount) > (userProfile?.balance || 0) || !canRechargeOrWithdraw}
                        className="bg-orange-500/80 hover:bg-orange-600/80 disabled:bg-white/10 border border-orange-400/30 disabled:border-white/20 px-4 py-2 rounded-lg text-white disabled:text-white/50 flex items-center gap-2 transition-all"
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
              )}
              {/* Historial Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="text-white/80 font-semibold mb-2">Últimas partidas</div>
                  {gameHistory.length === 0 ? (
                    <div className="text-white/60 text-sm">No hay historial.</div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {gameHistory.map((g) => (
                        <li key={g.id} className="py-2 flex justify-between text-white text-sm">
                          <span>Apuesta: {g.bet_amount} | Mult: {g.multiplier}x</span>
                          <span>Ganó: {g.win_amount}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Historial de recargas */}
                  <div className="text-white/80 font-semibold mt-4">Recargas</div>
                  {rechargeHistory.length === 0 ? (
                    <div className="text-white/60 text-sm">No hay recargas.</div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {rechargeHistory.map((r) => (
                        <li key={r.id} className="py-2 flex justify-between text-white text-xs">
                          <span>{new Date(r.created_at).toLocaleString()} - ${r.amount} - {r.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Historial de retiros */}
                  <div className="text-white/80 font-semibold mt-4">Retiros</div>
                  {withdrawalHistory.length === 0 ? (
                    <div className="text-white/60 text-sm">No hay retiros.</div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {withdrawalHistory.map((w) => (
                        <li key={w.id} className="py-2 flex justify-between text-white text-xs">
                          <span>{new Date(w.created_at).toLocaleString()} - ${w.amount} - {w.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {/* Perfil Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-white/70 text-xs mb-1">Email</div>
                    <div className="bg-white/10 p-3 rounded-lg text-white">{user?.email || 'No especificado'}</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-xs mb-1">Nombre Completo</div>
                    <div className="bg-white/10 p-3 rounded-lg text-white">{userProfile?.full_name || 'No especificado'}</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-xs mb-1">País</div>
                    <div className="bg-white/10 p-3 rounded-lg text-white">{userProfile?.country || 'No especificado'}</div>
                  </div>
                  <button onClick={signOut} className="w-full mt-4 bg-red-500/80 hover:bg-red-600/80 text-white font-bold py-2 rounded-lg">Cerrar sesión</button>
                </div>
              )}
              {/* Ajustes Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4 text-white/80">
                  <div className="font-semibold">Configuración próximamente...</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Modal Stripe */}
      {showStripe && (
        <StripeCheckout 
          onClose={() => {
            setShowStripe(false);
            // Esperar un poco y luego mostrar mensaje de éxito
            setRechargeSuccess(true);
            setTimeout(() => setRechargeSuccess(false), 4000);
            fetchUserData();
          }} 
          amount={parseFloat(rechargeAmount) || 50} 
        />
      )}
      {/* Mensajes de éxito/error de recarga */}
      {rechargeSuccess && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-bold animate-bounceIn">¡Recarga exitosa!</div>
      )}
      {rechargeError && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-bold">{rechargeError}</div>
      )}
      {/* Modal para pedir fecha de nacimiento */}
      {showBirthdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl p-6 max-w-xs w-full text-center">
            <h2 className="text-lg font-bold mb-4">Fecha de nacimiento</h2>
            <p className="mb-2 text-gray-700">Debes ser mayor de 18 años para usar funciones de dinero real.</p>
            <input
              type="date"
              value={birthdateInput}
              onChange={e => setBirthdateInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              max={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={handleSaveBirthdate}
              disabled={!birthdateInput || savingBirthdate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:bg-gray-400"
            >
              {savingBirthdate ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 