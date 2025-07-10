import React from 'react';
import { User, DollarSign } from 'lucide-react';

interface SimpleAccountPanelProps {
  userBalance: number;
  setUserBalance: (balance: number) => void;
}

export const SimpleAccountPanel: React.FC<SimpleAccountPanelProps> = ({ 
  userBalance 
}) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4">
      <div className="flex items-center space-x-3 mb-4">
        <User className="text-blue-400" size={20} />
        <h2 className="text-white font-semibold">Cuenta</h2>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Balance</span>
            <div className="flex items-center space-x-1">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-white font-medium">{userBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
          Depositar
        </button>
        
        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
          Retirar
        </button>
      </div>
    </div>
  );
};