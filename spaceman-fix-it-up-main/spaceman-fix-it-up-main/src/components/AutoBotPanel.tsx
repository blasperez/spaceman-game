import React, { useState } from 'react';
import { X, Bot, Play, Square, TrendingUp, TrendingDown, Settings, AlertTriangle, DollarSign, Target, RotateCcw } from 'lucide-react';

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

interface AutoBotPanelProps {
  config: AutoBotConfig;
  onConfigChange: (config: AutoBotConfig) => void;
  onClose: () => void;
  balance: number;
}

export const AutoBotPanel: React.FC<AutoBotPanelProps> = ({
  config,
  onConfigChange,
  onClose,
  balance
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'stats' | 'strategies'>('config');

  const handleConfigChange = (key: keyof AutoBotConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const toggleBot = () => {
    if (config.isActive) {
      // Stop bot
      onConfigChange({ 
        ...config, 
        isActive: false 
      });
    } else {
      // Start bot - reset counters
      onConfigChange({ 
        ...config, 
        isActive: true,
        currentRounds: 0,
        totalProfit: 0
      });
    }
  };

  const resetStats = () => {
    onConfigChange({
      ...config,
      currentRounds: 0,
      totalProfit: 0
    });
  };

  const canStartBot = config.betAmount <= balance && config.betAmount > 0 && config.autoCashOut > 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border shadow-lg ${
              config.isActive ? 'bg-green-500/80 border-green-400/30' : 'bg-white/10 border-white/20'
            }`}>
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Auto Betting Bot</h2>
              <p className="text-white/70 text-sm">
                {config.isActive ? '🟢 Active' : '🔴 Inactive'} • Balance: €{balance.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-colors shadow-lg"
          >
            <X size={24} className="text-white/70" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'stats', label: 'Statistics', icon: TrendingUp },
            { id: 'strategies', label: 'Strategies', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-4 font-medium transition-colors whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Auto Cash Out Settings */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-orange-400" />
                  Auto Cash Out Settings
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Cash Out Multiplier</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={config.autoCashOut}
                        onChange={(e) => handleConfigChange('autoCashOut', Number(e.target.value))}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white focus:border-orange-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                        min="1.01"
                        step="0.01"
                        disabled={config.isActive}
                      />
                      <span className="text-white/60">x</span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      Bot will cash out automatically at this multiplier
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 mb-2">Bet Amount per Round</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/60">€</span>
                      <input
                        type="number"
                        value={config.betAmount}
                        onChange={(e) => handleConfigChange('betAmount', Number(e.target.value))}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white focus:border-orange-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                        min="1"
                        max={balance}
                        disabled={config.isActive}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      Fixed amount to bet each round (modified by strategy)
                    </p>
                  </div>
                </div>
              </div>

              {/* Stop Conditions */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <AlertTriangle size={20} className="mr-2 text-red-400" />
                  Stop Conditions
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Maximum Rounds</label>
                    <input
                      type="number"
                      value={config.maxRounds}
                      onChange={(e) => handleConfigChange('maxRounds', Number(e.target.value))}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white focus:border-red-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                      min="1"
                      disabled={config.isActive}
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Bot stops after this many rounds
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 mb-2">Maximum Loss (€)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={config.maxLoss}
                        onChange={(e) => handleConfigChange('maxLoss', Number(e.target.value))}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white focus:border-red-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                        min="1"
                        disabled={config.isActive}
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.stopOnLoss}
                          onChange={(e) => handleConfigChange('stopOnLoss', e.target.checked)}
                          className="mr-1"
                          disabled={config.isActive}
                        />
                        <span className="text-xs text-white/60">Enable</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 mb-2">Maximum Win (€)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={config.maxWin}
                        onChange={(e) => handleConfigChange('maxWin', Number(e.target.value))}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white focus:border-green-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                        min="1"
                        disabled={config.isActive}
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.stopOnWin}
                          onChange={(e) => handleConfigChange('stopOnWin', e.target.checked)}
                          className="mr-1"
                          disabled={config.isActive}
                        />
                        <span className="text-xs text-white/60">Enable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Target size={20} className="mr-2 text-purple-400" />
                  Betting Strategy
                </h3>
                
                <div className="space-y-3">
                  {[
                    { 
                      id: 'fixed', 
                      name: 'Fixed Bet', 
                      description: 'Same bet amount every round',
                      risk: 'Low'
                    },
                    { 
                      id: 'martingale', 
                      name: 'Martingale', 
                      description: 'Double bet after each loss',
                      risk: 'High'
                    },
                    { 
                      id: 'fibonacci', 
                      name: 'Fibonacci', 
                      description: 'Follow Fibonacci sequence',
                      risk: 'Medium'
                    }
                  ].map(strategy => (
                    <label
                      key={strategy.id}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-md shadow-lg ${
                        config.strategy === strategy.id
                          ? 'border-purple-400/50 bg-purple-400/10'
                          : 'border-white/20 hover:border-white/30 bg-white/5'
                      } ${config.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={strategy.id}
                        checked={config.strategy === strategy.id}
                        onChange={(e) => handleConfigChange('strategy', e.target.value)}
                        className="mr-3"
                        disabled={config.isActive}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{strategy.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-lg backdrop-blur-sm ${
                            strategy.risk === 'Low' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            strategy.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {strategy.risk} Risk
                          </span>
                        </div>
                        <p className="text-white/70 text-sm">{strategy.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={toggleBot}
                  disabled={!canStartBot && !config.isActive}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all backdrop-blur-md shadow-lg ${
                    config.isActive
                      ? 'bg-red-500/80 hover:bg-red-600/80 border border-red-400/30 text-white'
                      : canStartBot
                      ? 'bg-green-500/80 hover:bg-green-600/80 border border-green-400/30 text-white'
                      : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/20'
                  }`}
                >
                  {config.isActive ? <Square size={20} /> : <Play size={20} />}
                  <span>{config.isActive ? 'Stop Bot' : 'Start Bot'}</span>
                </button>

                <button
                  onClick={resetStats}
                  disabled={config.isActive}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-md border border-white/20 text-white rounded-xl transition-colors shadow-lg"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Warnings */}
              {!canStartBot && !config.isActive && (
                <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={20} className="text-yellow-400" />
                    <div>
                      <p className="text-yellow-200 font-medium">Cannot start bot:</p>
                      <ul className="text-yellow-300 text-sm mt-1 space-y-1">
                        {config.betAmount <= 0 && <li>• Bet amount must be greater than 0</li>}
                        {config.betAmount > balance && <li>• Bet amount exceeds balance</li>}
                        {config.autoCashOut <= 1 && <li>• Cash out multiplier must be greater than 1.00x</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Current Session Stats */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl p-6 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-blue-400" />
                  Current Session
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-white/70 text-sm">Rounds Played</div>
                    <div className="text-white text-2xl font-bold">{config.currentRounds}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-white/70 text-sm">Total Profit</div>
                    <div className={`text-2xl font-bold ${
                      config.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {config.totalProfit >= 0 ? '+' : ''}€{config.totalProfit.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-white/70 text-sm">Rounds Left</div>
                    <div className="text-white text-2xl font-bold">
                      {config.maxRounds - config.currentRounds}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-white/70 text-sm">Status</div>
                    <div className={`text-sm font-bold ${
                      config.isActive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {config.isActive ? 'RUNNING' : 'STOPPED'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Rounds Progress</span>
                    <span className="text-white/60">{config.currentRounds} / {config.maxRounds}</span>
                  </div>
                  <div className="w-full bg-white/10 backdrop-blur-md rounded-full h-2 shadow-lg">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((config.currentRounds / config.maxRounds) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {config.stopOnLoss && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/80">Loss Limit</span>
                      <span className="text-white/60">€{Math.abs(Math.min(config.totalProfit, 0)).toFixed(2)} / €{config.maxLoss}</span>
                    </div>
                    <div className="w-full bg-white/10 backdrop-blur-md rounded-full h-2 shadow-lg">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((Math.abs(Math.min(config.totalProfit, 0)) / config.maxLoss) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {config.stopOnWin && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/80">Win Target</span>
                      <span className="text-white/60">€{Math.max(config.totalProfit, 0).toFixed(2)} / €{config.maxWin}</span>
                    </div>
                    <div className="w-full bg-white/10 backdrop-blur-md rounded-full h-2 shadow-lg">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((Math.max(config.totalProfit, 0) / config.maxWin) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Info */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg">
                <h4 className="text-white font-medium mb-3">Current Strategy: {config.strategy.charAt(0).toUpperCase() + config.strategy.slice(1)}</h4>
                <div className="text-white/80 text-sm">
                  {config.strategy === 'fixed' && (
                    <p>Betting €{config.betAmount} every round regardless of wins or losses.</p>
                  )}
                  {config.strategy === 'martingale' && (
                    <p>Starting with €{config.betAmount}, doubling bet after each loss, resetting after wins.</p>
                  )}
                  {config.strategy === 'fibonacci' && (
                    <p>Following Fibonacci sequence: €{config.betAmount}, advancing on loss, retreating on win.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Strategies Tab */}
          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg">
                <h3 className="text-white font-semibold mb-4">Betting Strategies Explained</h3>
                
                <div className="space-y-6">
                  {/* Fixed Strategy */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="text-green-400 font-medium mb-2">Fixed Bet Strategy</h4>
                    <p className="text-white/80 text-sm mb-2">
                      The safest approach - bet the same amount every round regardless of previous results.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-xs shadow-lg">
                      <div className="text-white/60 mb-1">Example with €5 base bet:</div>
                      <div className="text-white font-mono">Round 1: €5 → Round 2: €5 → Round 3: €5</div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-green-400">✓ Pros:</span> <span className="text-white/70">Low risk, predictable losses</span><br/>
                      <span className="text-red-400">✗ Cons:</span> <span className="text-white/70">Slower profit recovery</span>
                    </div>
                  </div>

                  {/* Martingale Strategy */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="text-red-400 font-medium mb-2">Martingale Strategy</h4>
                    <p className="text-white/80 text-sm mb-2">
                      Double your bet after each loss, reset to base amount after a win. High risk, high reward.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-xs shadow-lg">
                      <div className="text-white/60 mb-1">Example with €5 base bet:</div>
                      <div className="text-white font-mono">Loss: €5 → Loss: €10 → Win: €20 → Reset: €5</div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-green-400">✓ Pros:</span> <span className="text-white/70">Quick loss recovery</span><br/>
                      <span className="text-red-400">✗ Cons:</span> <span className="text-white/70">Exponential bet growth, high risk</span>
                    </div>
                  </div>

                  {/* Fibonacci Strategy */}
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="text-yellow-400 font-medium mb-2">Fibonacci Strategy</h4>
                    <p className="text-white/80 text-sm mb-2">
                      Follow the Fibonacci sequence (1,1,2,3,5,8...). Move forward on loss, back two steps on win.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-xs shadow-lg">
                      <div className="text-white/60 mb-1">Example with €5 base bet:</div>
                      <div className="text-white font-mono">€5 → €5 → €10 → €15 → Win: back to €5</div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-green-400">✓ Pros:</span> <span className="text-white/70">Moderate risk, mathematical progression</span><br/>
                      <span className="text-red-400">✗ Cons:</span> <span className="text-white/70">Complex, slower than Martingale</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle size={20} className="text-red-400" />
                  <h4 className="text-red-400 font-medium">Risk Warning</h4>
                </div>
                <ul className="text-red-300 text-sm space-y-1">
                  <li>• Auto betting can lead to rapid losses</li>
                  <li>• Always set strict stop-loss limits</li>
                  <li>• Never bet more than you can afford to lose</li>
                  <li>• Monitor the bot closely during operation</li>
                  <li>• Past performance doesn't guarantee future results</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
