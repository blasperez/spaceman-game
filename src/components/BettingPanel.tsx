import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, Settings, Zap, ZapOff } from 'lucide-react';

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
  autoCashOutEnabled: boolean;
  setAutoCashOutEnabled: (value: boolean) => void;
  multiplier: number;
  onShowAutoBotPanel: () => void;
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
  hasActiveBet,
  autoBotConfig,
  autoCashOut,
  setAutoCashOut,
  autoCashOutEnabled,
  setAutoCashOutEnabled,
  onShowAutoBotPanel
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
      setBetAmount(Math.min(betAmount + 1, balance));
    }
  };

  const decreaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive) {
      setBetAmount(Math.max(betAmount - 1, 1));
    }
  };

  const isDisabled = hasActiveBet || autoBotConfig.isActive;

  return (
    <div className="mobile-betting-panel space-y-4 p-4">
      {/* Bet Control */}
      <div className="text-center mb-4">
        <div className="text-white/90 text-sm mb-3 drop-shadow-lg font-medium">Apuesta</div>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => handleButtonPress(decreaseBet)}
            disabled={isDisabled || betAmount <= 1}
            className="gelatin-button w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-center min-w-[140px] px-4 py-2 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-xl">
            <div className="text-yellow-400 mobile-bet-amount font-bold drop-shadow-lg">{betAmount} monedas</div>
          </div>
          
          <button
            onClick={() => handleButtonPress(increaseBet)}
            disabled={isDisabled || betAmount >= balance}
            className="gelatin-button w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-all shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Quick Bet Amounts */}
      <div className="flex justify-center space-x-2 mb-4">
        {[1, 5, 10, 25, 50].map(amount => (
          <button
            key={amount}
            onClick={() => setBetAmount(amount)}
            disabled={isDisabled || amount > balance}
            className="gelatin-button w-12 h-10 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg text-white font-bold text-xs flex items-center justify-center transition-all shadow-md"
          >
            {amount}
          </button>
        ))}
      </div>

      {/* Auto Cash Out Control */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoCashOutEnabled(!autoCashOutEnabled)}
              className={`gelatin-button w-10 h-5 rounded-full transition-all duration-300 ${
                autoCashOutEnabled 
                  ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                  : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                autoCashOutEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}>
                {autoCashOutEnabled ? (
                  <Zap size={10} className="text-green-500" />
                ) : (
                  <ZapOff size={10} className="text-gray-400" />
                )}
              </div>
            </button>
            <span className="text-white text-sm">Auto Cash Out</span>
          </div>
          
          {autoCashOutEnabled && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setAutoCashOut(Math.max(1.01, autoCashOut - 0.1))}
                className="gelatin-button w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm flex items-center justify-center font-bold"
              >
                -
              </button>
              <div className="bg-orange-500/80 px-3 py-2 rounded-lg text-white text-sm font-bold min-w-[60px] text-center shadow-md">
                {autoCashOut.toFixed(1)}x
              </div>
              <button 
                onClick={() => setAutoCashOut(autoCashOut + 0.1)}
                className="gelatin-button w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Button - FIXED: Show CASH OUT when can cash out */}
      <div className="mb-4">
        <button
          onClick={canCashOut ? onCashOut : onPlaceBet}
          disabled={!canBet && !canCashOut}
          className={`gelatin-button w-full backdrop-blur-md border-2 rounded-2xl p-4 text-center transition-all shadow-2xl min-h-[60px] ${
            canCashOut 
              ? 'bg-red-600/90 border-red-400/50 hover:bg-red-700/90' 
              : canBet
              ? 'bg-blue-500/80 border-blue-400/50 hover:bg-blue-600/80'
              : 'bg-white/20 border-white/30 cursor-not-allowed'
          }`}
        >
          <div className="text-white font-bold mobile-button-text drop-shadow-lg">
            {canCashOut ? 'RETIRAR' : 'APOSTAR'}
          </div>
          <div className="text-white mobile-bet-amount font-bold drop-shadow-lg mt-1">
            {canCashOut 
              ? `${currentWin.toFixed(2)} monedas` 
              : `${betAmount} monedas`
            }
          </div>
        </button>
      </div>

      {/* Side Controls */}
      <div className="flex justify-center space-x-2">
        <button 
          onClick={onShowAutoBotPanel}
          className="gelatin-button p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl transition-all shadow-lg min-w-[48px] min-h-[48px] flex items-center justify-center"
        >
          <Settings size={20} className="text-white" />
        </button>
        <button className="gelatin-button p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl transition-all shadow-lg min-w-[48px] min-h-[48px] flex items-center justify-center">
          <BarChart3 size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};