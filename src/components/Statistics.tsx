import React from 'react';
import { BarChart3, TrendingUp, Clock, Target, Users } from 'lucide-react';

interface GameHistory {
  id: number;
  multiplier: number;
  betAmount: number;
  winAmount: number;
  timestamp: Date;
}

interface StatisticsProps {
  gameHistory: GameHistory[];
  recentMultipliers: number[];
}

interface PlayerBet {
  user: string;
  bet: number;
  mult: number;
  win: number;
}

export const Statistics: React.FC<StatisticsProps> = ({ gameHistory, recentMultipliers }) => {
  const recentGames = gameHistory.slice(-10).reverse();
  
  const totalBets = gameHistory.length;
  const totalWon = gameHistory.reduce((sum, game) => sum + game.winAmount, 0);
  const totalBetAmount = gameHistory.reduce((sum, game) => sum + game.betAmount, 0);
  const winRate = totalBets > 0 ? (gameHistory.filter(g => g.winAmount > g.betAmount).length / totalBets * 100) : 0;
  const highestMultiplier = gameHistory.length > 0 ? Math.max(...gameHistory.map(g => g.multiplier)) : 0;

  // Mock active players data
  const activePlayers: PlayerBet[] = [
    { user: "Player1", bet: 25, mult: 0, win: 0 },
    { user: "CryptoKing", bet: 100, mult: 0, win: 0 },
    { user: "LuckyGamer", bet: 50, mult: 0, win: 0 },
    { user: "SpaceAce", bet: 75, mult: 0, win: 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Game Statistics */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 size={20} className="mr-2 text-blue-400" />
          Statistics
        </h3>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <Target size={16} className="text-green-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Win Rate</div>
            <div className="text-white font-semibold">{winRate.toFixed(1)}%</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <TrendingUp size={16} className="text-orange-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Best Multi</div>
            <div className="text-white font-semibold">{highestMultiplier.toFixed(2)}x</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <div className="text-white/70 text-xs">Total Won</div>
            <div className="text-green-400 font-semibold">€{totalWon.toFixed(2)}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <Clock size={16} className="text-blue-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Games</div>
            <div className="text-white font-semibold">{totalBets}</div>
          </div>
        </div>

        {/* Recent Multipliers History */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Recent Multipliers</h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {recentMultipliers.slice(-20).reverse().map((mult, index) => (
              <div
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md shadow-lg ${
                  mult < 1.5 ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  mult < 2 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  mult < 5 ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {mult.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        {/* Recent Games */}
        <div>
          <h4 className="text-white font-medium mb-3">Your Recent Games</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentGames.length === 0 ? (
              <div className="text-white/60 text-center py-4">No games played yet</div>
            ) : (
              recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      game.winAmount > game.betAmount ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span className="text-white font-mono">{game.multiplier.toFixed(2)}x</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      game.winAmount > game.betAmount ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {game.winAmount > game.betAmount ? '+' : ''}{(game.winAmount - game.betAmount).toFixed(2)}
                    </div>
                    <div className="text-white/60 text-xs">
                      €{game.betAmount.toFixed(2)} bet
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Active Players */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users size={20} className="mr-2 text-purple-400" />
          Active Players
        </h3>

        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 text-white/70 text-sm font-medium border-b border-white/20 pb-2">
            <div>User</div>
            <div className="text-right">Bet</div>
            <div className="text-right">Mult.</div>
            <div className="text-right">Win</div>
          </div>

          {/* Players List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activePlayers.length === 0 ? (
              <div className="text-white/60 text-center py-8">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>Waiting for next round...</p>
              </div>
            ) : (
              activePlayers.map((player, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-sm shadow-lg"
                >
                  <div className="text-white font-medium truncate">{player.user}</div>
                  <div className="text-right text-white/80">€{player.bet}</div>
                  <div className="text-right text-white/80">
                    {player.mult > 0 ? `${player.mult.toFixed(2)}x` : '-'}
                  </div>
                  <div className="text-right text-white/80">
                    {player.win > 0 ? `€${player.win.toFixed(2)}` : '-'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Online Players Count */}
          <div className="bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-xl p-3 text-center shadow-lg">
            <div className="text-purple-300 text-sm">Players Online</div>
            <div className="text-white text-xl font-bold">{Math.floor(Math.random() * 500) + 150}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
