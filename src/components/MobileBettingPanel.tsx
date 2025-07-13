import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Plus, Minus, Settings, Zap, ZapOff } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [showAutoControls, setShowAutoControls] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-collapse when betting
  useEffect(() => {
    if (hasActiveBet && gamePhase === 'flying') {
      setIsCollapsed(true);
    }
  }, [hasActiveBet, gamePhase]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touchY = e.touches[0].clientY;
    setCurrentY(touchY);
    
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50; // Minimum drag distance
    
    if (deltaY > threshold) {
      // Dragged down - collapse
      setIsCollapsed(true);
    } else if (deltaY < -threshold) {
      // Dragged up - expand
      setIsCollapsed(false);
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
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

  const handleMainAction = () => {
    if (canCashOut) {
      onCashOut();
    } else if (canBet) {
      onPlaceBet();
      setIsCollapsed(true); // Auto-collapse after betting
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Main Panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-xl border-t border-white/20 transition-all duration-300 ease-out ${
          isCollapsed ? 'translate-y-[calc(100%-80px)]' : 'translate-y-0'
        }`}
        style={{
          transform: isDragging 
            ? `translateY(${Math.max(0, currentY - startY)}px)` 
            : undefined
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="w-12 h-1 bg-white/40 rounded-full" />
        </div>

        {/* Collapsed View - Always Visible */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            {/* Left - Bet Amount */}
            <div className="flex items-center space-x-2">
              <div className="text-center">
                <div className="text-white/70 text-xs">Apuesta</div>
                <div className="text-white font-bold text-sm">€{hasActiveBet ? currentBet.toFixed(2) : betAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Center - Main Action Button */}
            <button
              onClick={handleMainAction}
              disabled={!canBet && !canCashOut}
              className={`px-8 py-3 rounded-2xl font-bold text-white transition-all ${
                canCashOut 
                  ? 'bg-green-500/90 hover:bg-green-600/90 shadow-lg shadow-green-500/30' 
                  : canBet
                  ? 'bg-blue-500/90 hover:bg-blue-600/90 shadow-lg shadow-blue-500/30'
                  : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              {canCashOut ? 'COBRAR' : 'APOSTAR'}
            </button>

            {/* Right - Win Amount */}
            <div className="text-center">
              <div className="text-white/70 text-xs">Ganancia</div>
              <div className="text-white font-bold text-sm">
                {canCashOut ? `€${currentWin.toFixed(2)}` : `${multiplier.toFixed(2)}x`}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <div className={`px-4 pb-6 space-y-4 transition-all duration-300 ${
          isCollapsed ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-96'
        }`}>
          {/* Bet Amount Controls */}
          <div className="space-y-3">
            <div className="text-white/90 text-sm font-medium text-center">Controles de Apuesta</div>
            
            {/* Quick Bet Amounts */}
            <div className="flex justify-center space-x-2">
              {[1, 5, 10, 25, 50].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={hasActiveBet || autoBotConfig.isActive || gamePhase !== 'waiting'}
                  className="w-12 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg text-white font-bold text-xs flex items-center justify-center transition-all"
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
                className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center transition-all"
              >
                <Minus size={18} />
              </button>
              
              <div className="bg-purple-500/80 px-6 py-3 rounded-xl min-w-[120px] text-center">
                <div className="text-white/80 text-xs">Apuesta Actual</div>
                <div className="text-white font-bold text-lg">€{betAmount}</div>
              </div>
              
              <button 
                onClick={increaseBet}
                disabled={hasActiveBet || autoBotConfig.isActive || gamePhase !== 'waiting'}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Auto Controls Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-white/90 text-sm font-medium">Controles Automáticos</div>
              <button
                onClick={() => setShowAutoControls(!showAutoControls)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {showAutoControls ? <ChevronUp size={16} className="text-white" /> : <ChevronDown size={16} className="text-white" />}
              </button>
            </div>

            {/* Auto Cash Out Toggle */}
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAutoCashOutEnabled(!autoCashOutEnabled)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${
                    autoCashOutEnabled 
                      ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                      : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                    autoCashOutEnabled ? 'translate-x-6' : 'translate-x-0.5'
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
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm flex items-center justify-center"
                  >
                    -
                  </button>
                  <div className="bg-orange-500/80 px-3 py-1 rounded-lg min-w-[60px] text-center">
                    <div className="text-white font-bold text-sm">{autoCashOut.toFixed(1)}x</div>
                  </div>
                  <button 
                    onClick={() => setAutoCashOut(autoCashOut + 0.1)}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Advanced Auto Controls */}
            {showAutoControls && (
              <div className="space-y-2">
                <button
                  onClick={onShowAutoBotPanel}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-500/80 hover:bg-purple-600/80 backdrop-blur-md border border-purple-400/30 text-white font-medium py-3 rounded-xl transition-all"
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
            )}
          </div>

          {/* Balance Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center">
            <div className="text-white/70 text-xs">Saldo Disponible</div>
            <div className="text-white font-bold text-lg">€{balance.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </>
  );
};
