import { useState } from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';


import { User, Shield, CreditCard, X, Crown } from 'lucide-react';

// Mock data for demonstration purposes
const mockGameHistory = [
  { id: 1, type: 'win', amount: 50, multiplier: 2.5 },
  { id: 2, type: 'loss', amount: -20, multiplier: 0 },
  { id: 3, type: 'win', amount: 100, multiplier: 5.0 },
  { id: 4, type: 'loss', amount: -10, multiplier: 0 },
  { id: 5, type: 'win', amount: 25, multiplier: 1.5 },
];

const mockReloadHistory = [
  { id: 1, amount: 500, date: '2023-10-26', method: 'Credit Card' },
  { id: 2, amount: 200, date: '2023-10-24', method: 'PayPal' },
  { id: 3, amount: 1000, date: '2023-10-20', method: 'Credit Card' },
];

// Define the UserProfile interface
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  age?: number;
  phone?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [gameHistoryFilter, setGameHistoryFilter] = useState('all');

  const filteredGameHistory = mockGameHistory.filter(game => {
    if (gameHistoryFilter === 'wins') return game.type === 'win';
    if (gameHistoryFilter === 'losses') return game.type === 'loss';
    return true;
  });

  const modalTransition: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    when: "beforeChildren",
    staggerChildren: 0.1,
  };

  const modalVariants: Variants = {

    hidden: { opacity: 0, scale: 0.9, y: "-50px" },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: modalTransition
    },

    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: "50px",
      transition: { duration: 0.2 }
    },
  };

  const itemVariants: Variants = {

    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gray-900/70 border border-purple-500/50 rounded-2xl shadow-2xl w-full max-w-4xl h-[70vh] flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Navigation */}
            <motion.div variants={itemVariants} className="w-1/4 bg-black/30 p-6 flex flex-col space-y-4 border-r border-purple-500/30">
              <div className="text-center mb-6">
                <motion.img
                    src={user.avatar}
                    alt="User Avatar"
                    className="w-24 h-24 rounded-full mx-auto border-4 border-purple-500 shadow-lg"
                    initial={{ scale: 0.5, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                />
                <h2 className="text-white font-bold text-xl mt-4">{user.name}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              <button onClick={() => setActiveTab('profile')} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${activeTab === 'profile' ? 'bg-purple-600/50 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}>
                <User size={20} />
                <span>Perfil</span>
              </button>
              <button onClick={() => setActiveTab('games')} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${activeTab === 'games' ? 'bg-purple-600/50 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}>
                <Shield size={20} />
                <span>Historial de Partidas</span>
              </button>
              <button onClick={() => setActiveTab('reloads')} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${activeTab === 'reloads' ? 'bg-purple-600/50 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}>
                <CreditCard size={20} />
                <span>Historial de Recargas</span>
              </button>
            </motion.div>

            {/* Right Content */}
            <motion.div variants={itemVariants} className="w-3/4 p-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'profile' && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Información del Perfil</h3>
                      <div className="space-y-4 text-gray-200">
                        <div className="bg-gray-800/50 p-4 rounded-lg"><strong>Nombre:</strong> {user.name}</div>
                        <div className="bg-gray-800/50 p-4 rounded-lg"><strong>Email:</strong> {user.email}</div>
                        <div className="bg-gray-800/50 p-4 rounded-lg"><strong>Edad:</strong> {user.age || 'No especificada'}</div>
                        <div className="bg-gray-800/50 p-4 rounded-lg"><strong>Teléfono:</strong> {user.phone || 'No especificado'}</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'games' && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Historial de Partidas</h3>
                      <div className="flex space-x-2 mb-4">
                        <button onClick={() => setGameHistoryFilter('all')} className={`px-4 py-2 rounded-lg text-sm ${gameHistoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Todas</button>
                        <button onClick={() => setGameHistoryFilter('wins')} className={`px-4 py-2 rounded-lg text-sm ${gameHistoryFilter === 'wins' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Ganadas</button>
                        <button onClick={() => setGameHistoryFilter('losses')} className={`px-4 py-2 rounded-lg text-sm ${gameHistoryFilter === 'losses' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Perdidas</button>
                      </div>
                      <ul className="space-y-3">
                        {filteredGameHistory.map(game => (
                          <li key={game.id} className={`p-4 rounded-lg flex justify-between items-center ${game.type === 'win' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <span className="font-bold">{game.type === 'win' ? 'Victoria' : 'Derrota'}</span>
                            <span>Multiplicador: {game.multiplier}x</span>
                            <span className={game.type === 'win' ? 'text-green-400' : 'text-red-400'}>{game.amount.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeTab === 'reloads' && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6">Historial de Recargas</h3>
                      <p className="text-sm text-gray-400 mb-4">Mostrando datos de ejemplo. La funcionalidad real se conectará al historial de pagos.</p>
                      <ul className="space-y-3">
                        {mockReloadHistory.map(reload => (
                          <li key={reload.id} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white">${reload.amount.toFixed(2)}</p>
                              <p className="text-sm text-gray-400">{reload.method}</p>
                            </div>
                            <p className="text-gray-400">{reload.date}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
            
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
