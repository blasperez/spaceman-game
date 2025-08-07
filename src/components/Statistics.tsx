import React from 'react';
import { useGameData } from '../hooks/useGameData';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, TrendingUp, Clock, Target, Users, DollarSign, Trophy, Zap } from 'lucide-react';

interface StatisticsProps {
  recentMultipliers: number[];
}

interface PlayerBet {
  user: string;
  bet: number;
  mult: number;
  win: number;
}

export const Statistics: React.FC<StatisticsProps> = ({ recentMultipliers }) => {
  const { user } = useAuth();
  const { gameStats, getRecentGames } = useGameData(user?.id);
  const { userBalance } = usePayments();
  
  const recentGames = getRecentGames(10);

  // Mock active players data (in a real app, this would come from the server)
  const activePlayers: PlayerBet[] = [
    { user: "Player1", bet: 25, mult: 0, win: 0 },
    { user: "CryptoKing", bet: 100, mult: 0, win: 0 },
    { user: "LuckyGamer", bet: 50, mult: 0, win: 0 },
    { user: "SpaceAce", bet: 75, mult: 0, win: 0 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Game Statistics */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 size={20} className="mr-2 text-blue-400" />
          Estadísticas del Juego
        </h3>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <Target size={16} className="text-green-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Win Rate</div>
            <div className="text-white font-semibold">
              {gameStats ? formatPercentage(gameStats.win_rate) : '0.0%'}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <Trophy size={16} className="text-orange-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Mejor Multi</div>
            <div className="text-white font-semibold">
              {gameStats ? `${gameStats.highest_multiplier.toFixed(2)}x` : '0.00x'}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <DollarSign size={16} className="text-green-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Total Ganado</div>
            <div className="text-green-400 font-semibold">
              {gameStats ? formatCurrency(gameStats.total_wins) : '$0.00'}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
            <Clock size={16} className="text-blue-400 mx-auto mb-1" />
            <div className="text-white/70 text-xs">Partidas</div>
            <div className="text-white font-semibold">
              {gameStats ? gameStats.total_games : 0}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        {gameStats && gameStats.total_games > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
              <Zap size={16} className="text-purple-400 mx-auto mb-1" />
              <div className="text-white/70 text-xs">Apuesta Promedio</div>
              <div className="text-white font-semibold">
                {formatCurrency(gameStats.average_bet)}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center shadow-lg">
              <TrendingUp size={16} className="text-yellow-400 mx-auto mb-1" />
              <div className="text-white/70 text-xs">Mejor Ganancia</div>
              <div className="text-green-400 font-semibold">
                {formatCurrency(gameStats.best_win)}
              </div>
            </div>
          </div>
        )}

        {/* Recent Multipliers History */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Multiplicadores Recientes</h4>
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
          <h4 className="text-white font-medium mb-3">Tus Partidas Recientes</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentGames.length === 0 ? (
              <div className="text-white/60 text-center py-4">No has jugado aún</div>
            ) : (
              recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      game.win_amount > game.bet_amount ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span className="text-white font-mono">{game.multiplier.toFixed(2)}x</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      game.win_amount > game.bet_amount ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {game.win_amount > game.bet_amount ? '+' : ''}{formatCurrency(game.win_amount - game.bet_amount)}
                    </div>
                    <div className="text-white/60 text-xs">
                      {formatCurrency(game.bet_amount)} apuesta
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Financial Overview & Active Players */}
      <div className="space-y-6">
        {/* Financial Overview */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <DollarSign size={20} className="mr-2 text-green-400" />
            Resumen Financiero
          </h3>

          {userBalance ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-green-300 text-sm">Balance Actual</div>
                  <div className="text-green-400 text-xl font-bold">
                    {formatCurrency(userBalance.balance)}
                  </div>
                </div>
                
                <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-blue-300 text-sm">Total Depositado</div>
                  <div className="text-blue-400 text-xl font-bold">
                    {formatCurrency(userBalance.total_deposits)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-green-300 text-sm">Total Ganado</div>
                  <div className="text-green-400 text-lg font-bold">
                    {formatCurrency(userBalance.total_wins)}
                  </div>
                </div>
                
                <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-red-300 text-sm">Total Perdido</div>
                  <div className="text-red-400 text-lg font-bold">
                    {formatCurrency(userBalance.total_losses)}
                  </div>
                </div>
              </div>

              {userBalance.total_withdrawals > 0 && (
                <div className="bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-xl p-3 text-center shadow-lg">
                  <div className="text-purple-300 text-sm">Total Retirado</div>
                  <div className="text-purple-400 text-lg font-bold">
                    {formatCurrency(userBalance.total_withdrawals)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/60 text-center py-8">
              <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
              <p>Cargando datos financieros...</p>
            </div>
          )}
        </div>

        {/* Active Players */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users size={20} className="mr-2 text-purple-400" />
            Jugadores Activos
          </h3>

          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 text-white/70 text-sm font-medium border-b border-white/20 pb-2">
              <div>Usuario</div>
              <div className="text-right">Apuesta</div>
              <div className="text-right">Mult.</div>
              <div className="text-right">Ganancia</div>
            </div>

            {/* Players List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activePlayers.length === 0 ? (
                <div className="text-white/60 text-center py-8">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Esperando la siguiente ronda...</p>
                </div>
              ) : (
                activePlayers.map((player, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-sm shadow-lg"
                  >
                    <div className="text-white font-medium truncate">{player.user}</div>
                    <div className="text-right text-white/80">{formatCurrency(player.bet)}</div>
                    <div className="text-right text-white/80">
                      {player.mult > 0 ? `${player.mult.toFixed(2)}x` : '-'}
                    </div>
                    <div className="text-right text-white/80">
                      {player.win > 0 ? formatCurrency(player.win) : '-'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Online Players Count */}
            <div className="bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-xl p-3 text-center shadow-lg">
              <div className="text-purple-300 text-sm">Jugadores Online</div>
              <div className="text-white text-xl font-bold">{Math.floor(Math.random() * 500) + 150}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
