import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus, Settings, Zap, ZapOff } from 'lucide-react';

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

interface MobileBettingPanelProps {
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
  hasActiveBet: boolean;
  gamePhase: 'waiting' | 'flying' | 'crashed';
  currentBet: number;
  autoBotConfig: AutoBotConfig;
  autoCashOutEnabled: boolean;
  setAutoCashOutEnabled: (value: boolean) => void;
  multiplier: number;
  onShowAutoBotPanel: () => void;
}

export const MobileBettingPanel: React.FC<MobileBettingPanelProps> = ({
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
  hasActiveBet,
  gamePhase,
  currentBet,
  autoBotConfig,
  autoCashOutEnabled,
  setAutoCashOutEnabled,
  multiplier,
  onShowAutoBotPanel
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-collapse when betting starts
  useEffect(() => {
    if (hasActiveBet && gamePhase === 'flying') {
      setIsExpanded(false);
    }
  }, [hasActiveBet, gamePhase]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touchX = e.touches[0].clientX;
    setCurrentX(touchX);
    
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 50; // Minimum drag distance
    
    if (deltaX < -threshold) {
      // Dragged left - expand
      setIsExpanded(true);
    } else if (deltaX > threshold) {
      // Dragged right - collapse
      setIsExpanded(false);
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const increaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive && gamePhase === 'waiting') {
      setBetAmount(Math.min(betAmount + 5, balance));
    }
  };

  const decreaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive && gamePhase === 'waiting') {
      setBetAmount(Math.max(betAmount - 5, 1));
    }
  };

  const handlePlaceBet = () => {
    onPlaceBet();
    setIsExpanded(false); // Auto-collapse after betting
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Cash Out Button - Only show when can cash out */}
      {canCashOut && !isExpanded && (
        <button
          onClick={onCashOut}
          className="floating-cash-out cash-out-button gelatin-button"
        >
          <div className="text-center">
            <div className="text-lg font-bold">RETIRAR</div>
            <div className="text-xl font-extrabold">€{currentWin.toFixed(2)}</div>
            <div className="text-sm opacity-90">{multiplier.toFixed(2)}x</div>
          </div>
        </button>
      )}

      {/* Main Sliding Panel */}
      <div
        ref={panelRef}
        className={`mobile-betting-panel bg-black/60 backdrop-blur-xl border-l border-white/20 ${
          isExpanded ? 'expanded' : 'collapsed'
        }`}
        style={{
          transform: isDragging 
            ? `translateX(${Math.max(0, currentX - startX)}px)` 
            : undefined
        }}
      >
        {/* Drag Handle */}
        <div
          className="panel-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="panel-drag-arrow">
            <ChevronLeft size={20} />
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-white text-xl font-bold mb-2">Panel de Apuestas</h2>
            <div className="text-white/70 text-sm">
              Saldo: €{balance.toFixed(2)}
            </div>
          </div>

          {/* Bet Amount Controls */}
          <div className="space-y-4 mb-6">
            <div className="text-white/90 text-sm font-medium text-center">Cantidad de Apuesta</div>
            
            {/* Quick Bet Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 5, 10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={hasActiveBet || autoBotConfig.isActive || gamePhase !== 'waiting' || amount > balance}
                  className="gelatin-button h-12 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-xl text-white font-bold text-sm flex items-center justify-center transition-all"
                >
                  €{amount}
                </button>
              ))}
            </div>

            {/* Fine Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={decreaseBet}
                disabled={hasActiveBet || autoBotConfig.isActive || gamePhase !== 'waiting'}
                className="gelatin-button w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center transition-all"
              >
                <Minus size={20} />
              </button>
              
              <div className="bg-purple-500/80 px-6 py-4 rounded-xl min-w-[140px] text-center">
                <div className="text-white/80 text-xs">Apuesta Actual</div>
                <div className="text-white font-bold text-xl">€{betAmount}</div>
              </div>
              
              <button 
                onClick={increaseBet}
                disabled={hasActiveBet || autoBotConfig.isActive || gamePhase !== 'waiting'}
                className="gelatin-button w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Auto Cash Out Controls */}
          <div className="space-y-4 mb-6">
            <div className="text-white/90 text-sm font-medium text-center">Auto Cash Out</div>
            
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAutoCashOutEnabled(!autoCashOutEnabled)}
                  className={`gelatin-button w-14 h-7 rounded-full transition-all duration-300 ${
                    autoCashOutEnabled 
                      ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                      : 'bg-white/20'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                    autoCashOutEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`}>
                    {autoCashOutEnabled ? (
                      <Zap size={12} className="text-green-500" />
                    ) : (
                      <ZapOff size={12} className="text-gray-400" />
                    )}
                  </div>
                </button>
                <div>
                  <div className="text-white text-sm font-medium">Auto Cash Out</div>
                  <div className="text-white/60 text-xs">Retiro automático</div>
                </div>
              </div>
              
              {autoCashOutEnabled && (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setAutoCashOut(Math.max(1.01, autoCashOut - 0.1))}
                    className="gelatin-button w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm flex items-center justify-center"
                  >
                    -
                  </button>
                  <div className="bg-orange-500/80 px-4 py-2 rounded-lg min-w-[70px] text-center">
                    <div className="text-white font-bold text-sm">{autoCashOut.toFixed(1)}x</div>
                  </div>
                  <button 
                    onClick={() => setAutoCashOut(autoCashOut + 0.1)}
                    className="gelatin-button w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Action Button - Only show when can bet */}
          {canBet && !hasActiveBet && (
            <button
              onClick={handlePlaceBet}
              disabled={!canBet}
              className="gelatin-button w-full bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-white/20 disabled:cursor-not-allowed backdrop-blur-md border border-blue-400/30 text-white font-bold py-4 rounded-xl transition-all mb-6"
            >
              <div className="text-center">
                <div className="text-lg">APOSTAR</div>
                <div className="text-xl font-bold">€{betAmount}</div>
              </div>
            </button>
          )}

          {/* Advanced Controls */}
          <div className="space-y-3">
            <button
              onClick={onShowAutoBotPanel}
              className="gelatin-button w-full flex items-center justify-center space-x-2 bg-purple-500/80 hover:bg-purple-600/80 backdrop-blur-md border border-purple-400/30 text-white font-medium py-3 rounded-xl transition-all"
            >
              <Settings size={18} />
              <span>Configuración Avanzada</span>
            </button>
            
            {autoBotConfig.isActive && (
              <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl p-3">
                <div className="text-green-300 text-sm font-medium mb-1">🤖 Auto Bot Activo</div>
                <div className="text-white/80 text-xs">
                  Rondas: {autoBotConfig.currentRounds}/{autoBotConfig.maxRounds} | 
                  Ganancia: €{autoBotConfig.totalProfit.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Current Bet Info */}
          {hasActiveBet && (
            <div className="mt-6 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-4">
              <div className="text-blue-300 text-sm font-medium mb-2">Apuesta Activa</div>
              <div className="text-white">
                <div>Apostado: €{currentBet.toFixed(2)}</div>
                <div>Multiplicador: {multiplier.toFixed(2)}x</div>
                <div className="font-bold text-lg">Ganancia Potencial: €{currentWin.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};