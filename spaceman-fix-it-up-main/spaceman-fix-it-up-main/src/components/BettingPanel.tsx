import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface AutoBotConfig {
  isActive: boolean;
  autoCashOut: number;
  betAmount: number;
  maxRounds: number;
  maxLoss: number;
  maxWin: number;
  currentRounds: number;
  totalProfit: number;
  strategy: 'fixed' | 'martingale' | 'fibonacci';
  stopOnWin: boolean;
  stopOnLoss: boolean;
}

interface BettingPanelProps {
  balance: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  onPlaceBet: () => void;
  onCashOut: () => void;
  canBet: boolean;
  canCashOut: boolean;
  currentWin: number;
  autoCashOut: number;
  setAutoCashOut: (value: number) => void;
  autoPlay: boolean;
  setAutoPlay: (value: boolean) => void;
  hasActiveBet: boolean;
  gamePhase: 'waiting' | 'flying' | 'crashed';
  currentBet: number;
  lastBetAmount: number;
  autoBotConfig: AutoBotConfig;
  autoBetEnabled: boolean;
  setAutoBetEnabled: (value: boolean) => void;
  autoBetAmount: number;
  setAutoBetAmount: (value: number) => void;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({
  balance,
  betAmount,
  setBetAmount,
  onPlaceBet,
  onCashOut,
  canBet,
  canCashOut,
  currentWin,
  autoCashOut,
  setAutoCashOut,
  autoPlay,
  setAutoPlay,
  hasActiveBet,
  gamePhase,
  currentBet,
  lastBetAmount,
  autoBotConfig,
  autoBetEnabled,
  setAutoBetEnabled,
  autoBetAmount,
  setAutoBetAmount
}) => {
  const [lastTapTime, setLastTapTime] = useState(0);

  const handleButtonPress = (callback: () => void) => {
    const now = Date.now();
    if (now - lastTapTime > 300) {
      setLastTapTime(now);
      callback();
    }
  };

  const increaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive) {
      setBetAmount(Math.min(betAmount + 50, balance));
    }
  };

  const decreaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive) {
      setBetAmount(Math.max(betAmount - 50, 10));
    }
  };

  const isDisabled = hasActiveBet || autoBotConfig.isActive;

  return (
    <div className="space-y-4">
      {/* TRANSPARENT Bet Control - NO BACKGROUND BOXES */}
      <div className="text-center">
        <div className="text-white/90 text-sm mb-2 drop-shadow-lg">Apuesta</div>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => handleButtonPress(decreaseBet)}
            disabled={isDisabled || betAmount <= 10}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-all active:scale-95 shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-center min-w-[140px]">
            <div className="text-yellow-400 text-2xl font-bold drop-shadow-lg">${betAmount.toLocaleString('es-MX')}</div>
          </div>
          
          <button
            onClick={() => handleButtonPress(increaseBet)}
            disabled={isDisabled || betAmount >= balance}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-all active:scale-95 shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* SINGLE BUTTON - APOSTAR/RETIRAR - TRANSPARENT */}
      <div>
        <button
          onClick={canCashOut ? onCashOut : onPlaceBet}
          disabled={!canBet && !canCashOut}
          className={`w-full backdrop-blur-md border-2 rounded-2xl p-4 text-center transition-all active:scale-95 shadow-2xl ${
            canCashOut 
              ? 'bg-green-500/80 border-green-400/50 hover:bg-green-600/80' 
              : canBet
              ? 'bg-blue-500/80 border-blue-400/50 hover:bg-blue-600/80'
              : 'bg-white/20 border-white/30 cursor-not-allowed'
          }`}
        >
          <div className="text-white font-bold text-lg drop-shadow-lg">
            {canCashOut ? 'RETIRAR' : 'APOSTAR'}
          </div>
          <div className="text-white text-2xl font-bold drop-shadow-lg">
            {canCashOut 
              ? `$${currentWin.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
              : `$${betAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
          </div>
        </button>
      </div>

      {/* TRANSPARENT Side Controls - Only BarChart3 remains */}
      <div className="flex justify-center">
        <button className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl transition-all active:scale-95 shadow-lg">
          <BarChart3 size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};
