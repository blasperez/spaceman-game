import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface GameHistory {
  multiplier: number;
  won: number;
  bet: number;
}

interface SimpleStatsProps {
  gameHistory: GameHistory[];
  totalWon: number;
}

export const SimpleStats: React.FC<SimpleStatsProps> = ({ 
  gameHistory, 
  totalWon 
}) => {
  const totalGames = gameHistory.length;
  const avgMultiplier = gameHistory.length > 0 
    ? gameHistory.reduce((sum, game) => sum + game.multiplier, 0) / gameHistory.length 
    : 0;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4">
      <div className="flex items-center space-x-3 mb-4">
        <BarChart3 className="text-green-400" size={20} />
        <h2 className="text-white font-semibold">Estadísticas</h2>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Ganancia Total</span>
            <div className="flex items-center space-x-1">
              <TrendingUp size={16} className={totalWon >= 0 ? "text-green-400" : "text-red-400"} />
              <span className={`font-medium ${totalWon >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${totalWon.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Juegos Totales</span>
            <span className="text-white font-medium">{totalGames}</span>
          </div>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Mult. Promedio</span>
            <span className="text-white font-medium">{avgMultiplier.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};