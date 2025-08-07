import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePayments } from '../hooks/usePayments';
import { TransactionHistory } from './TransactionHistory';
import { PaymentMethods } from './PaymentMethods';
import { WithdrawalForm } from './WithdrawalForm';
import { Statistics } from './Statistics';
import { RechargeModal } from './RechargeModal';
import { supabase } from '../lib/supabase';
import { 
  User, 
  CreditCard, 
  DollarSign, 
  History, 
  Settings, 
  LogOut,
  Plus,
  Building,
  TrendingUp,
  Shield,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface AccountPanelProps {
  onClose: () => void;
}

type TabType = 'overview' | 'payments' | 'history' | 'withdrawals' | 'settings';

export const AccountPanel: React.FC<AccountPanelProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { userBalance, loading } = usePayments();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showBirthdateModal, setShowBirthdateModal] = useState(false);
  const [birthdateInput, setBirthdateInput] = useState('');
  const [savingBirthdate, setSavingBirthdate] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [rechargeHistory, setRechargeHistory] = useState<any[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

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
        
        // Check if user needs birthdate
        if (!profile.birthdate) {
          setShowBirthdateModal(true);
        }
      }

      // Fetch recharge history (deposits)
      const { data: deposits } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(10);

      setRechargeHistory(deposits || []);

      // Fetch withdrawal history
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setWithdrawalHistory(withdrawals || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const calculateAge = (birthdate: string): number => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const canRechargeOrWithdraw = userProfile && userProfile.birthdate && calculateAge(userProfile.birthdate) >= 18;

  const handleSaveBirthdate = async () => {
    if (!user || !birthdateInput) return;

    setSavingBirthdate(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ birthdate: birthdateInput })
        .eq('id', user.id);

      if (error) throw error;

      setShowBirthdateModal(false);
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Error saving birthdate:', error);
    } finally {
      setSavingBirthdate(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: User },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'withdrawals', label: 'Retiros', icon: Building },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
  return (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
        </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {user?.email || 'Usuario'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    Miembro desde {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  {userProfile?.birthdate && (
                    <p className="text-white/60 text-sm">
                      Edad: {calculateAge(userProfile.birthdate)} años
                    </p>
                  )}
          </div>
                        </div>
                      </div>

            {/* Balance Overview */}
            {userBalance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-6 text-center">
                  <DollarSign size={24} className="text-green-400 mx-auto mb-2" />
                  <div className="text-green-300 text-sm mb-1">Balance Actual</div>
                  <div className="text-green-400 text-2xl font-bold">
                    {formatCurrency(userBalance.balance)}
                      </div>
                    </div>

                <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-6 text-center">
                  <TrendingUp size={24} className="text-blue-400 mx-auto mb-2" />
                  <div className="text-blue-300 text-sm mb-1">Total Ganado</div>
                  <div className="text-blue-400 text-2xl font-bold">
                    {formatCurrency(userBalance.total_wins)}
                      </div>
                    </div>
                  </div>
                )}

            {/* Age Warning */}
            {!canRechargeOrWithdraw && (
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-yellow-300">
                  <AlertCircle size={16} />
                  <span className="text-sm">
                    {!userProfile?.birthdate 
                      ? 'Necesitas agregar tu fecha de nacimiento para recargar o retirar'
                      : 'Debes ser mayor de 18 años para recargar o retirar dinero'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowRechargeModal(true)}
                disabled={!canRechargeOrWithdraw}
                className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center space-y-2 ${
                  canRechargeOrWithdraw
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={20} />
                <span className="text-sm font-medium">Recargar Saldo</span>
              </button>
              
              <button
                onClick={() => setShowWithdrawalForm(true)}
                disabled={!canRechargeOrWithdraw}
                className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center space-y-2 ${
                  canRechargeOrWithdraw
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Building size={20} />
                <span className="text-sm font-medium">Solicitar Retiro</span>
              </button>
            </div>

            {/* Statistics */}
            <Statistics recentMultipliers={[1.2, 1.5, 2.1, 1.8, 3.2, 1.1, 4.5, 2.8, 1.3, 6.7]} />
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <PaymentMethods 
              onAddNew={() => setShowAddPaymentMethod(true)}
              showAddButton={true}
            />
          </div>
        );

      case 'history':
        return (
                  <div className="space-y-6">
            <TransactionHistory />
                        </div>
        );

      case 'withdrawals':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
                <Building size={20} className="mr-2 text-blue-400" />
                Solicitar Retiro
              </h3>
              
              <div className="text-white/70 mb-6">
                <p className="mb-4">
                  Puedes solicitar retiros a tu cuenta bancaria, PayPal o dirección de crypto.
                  Los retiros se procesan en 1-3 días hábiles.
                </p>
                
                <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
                  <h4 className="text-blue-300 font-medium mb-2">Información Importante:</h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Monto mínimo: $50.00 MXN</li>
                    <li>• Comisión: 2.5%</li>
                    <li>• Verificación de identidad requerida</li>
                    <li>• Confirmación por email</li>
                  </ul>
                        </div>
                      </div>

              <button
                onClick={() => setShowWithdrawalForm(true)}
                disabled={!canRechargeOrWithdraw}
                className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                  canRechargeOrWithdraw
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Building size={20} />
                <span>Solicitar Retiro</span>
              </button>
            </div>

            {/* Withdrawal History */}
            {withdrawalHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Historial de Retiros</h3>
                <div className="space-y-3">
                  {withdrawalHistory.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-white font-medium">
                          {formatCurrency(withdrawal.amount)}
                        </div>
                        <div className="text-white/60 text-sm">
                          {formatDate(withdrawal.created_at)}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {withdrawal.status === 'completed' ? 'Completado' :
                         withdrawal.status === 'pending' ? 'Pendiente' :
                         'Rechazado'}
                      </div>
                    </div>
                  ))}
                          </div>
                        </div>
                      )}
                    </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
                <Settings size={20} className="mr-2 text-blue-400" />
                Configuración de Cuenta
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white font-medium">Notificaciones</div>
                    <div className="text-white/60 text-sm">Recibir notificaciones de pagos y retiros</div>
                  </div>
                  <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                    <div className="text-white font-medium">Verificación en dos pasos</div>
                    <div className="text-white/60 text-sm">Aumentar la seguridad de tu cuenta</div>
                  </div>
                  <button className="w-12 h-6 bg-white/20 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-all"></div>
                  </button>
                        </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                    <div className="text-white font-medium">Auto Cash Out</div>
                    <div className="text-white/60 text-sm">Retirar automáticamente en multiplicador específico</div>
                          </div>
                  <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                  </button>
                          </div>
                        </div>
                      </div>
                      
            <div className="bg-red-500/10 backdrop-blur-md border border-red-400/20 rounded-xl p-6">
              <h3 className="text-red-300 font-semibold text-lg mb-4 flex items-center">
                <Shield size={20} className="mr-2" />
                Zona de Peligro
              </h3>
              
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
                          </div>
                        </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Panel de Cuenta</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
                          </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
                        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                          </div>
          ) : (
            renderTabContent()
          )}
                        </div>
                      </div>

      {/* Modals */}
      {showWithdrawalForm && (
        <WithdrawalForm
          onClose={() => setShowWithdrawalForm(false)}
          onSuccess={() => {
            setShowWithdrawalForm(false);
            setActiveTab('history');
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

      {/* Birthdate Modal */}
      {showBirthdateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-blue-400" />
                Fecha de Nacimiento
              </h3>
              
              <p className="text-white/70 mb-4">
                Para poder recargar y retirar dinero, necesitamos verificar tu edad. 
                Debes ser mayor de 18 años.
              </p>
              
              <div className="space-y-4">
                        <div>
                  <label className="block text-white/80 text-sm mb-2">Fecha de Nacimiento:</label>
                  <input
                    type="date"
                    value={birthdateInput}
                    onChange={(e) => setBirthdateInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
                  />
                    </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowBirthdateModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </button>
                      <button
                    onClick={handleSaveBirthdate}
                    disabled={!birthdateInput || savingBirthdate}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                    {savingBirthdate ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};