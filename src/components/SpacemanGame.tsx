import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  BarChart3,
  Volume2,
  VolumeX,
  MessageCircle,
  RotateCcw,
  History,
} from "lucide-react";
import { useGameSocket } from "../hooks/useGameSocket";

interface GameData {
  gameState: {
    gameId: string;
    phase: "waiting" | "flying" | "crashed";
    multiplier: number;
    countdown: number;
    crashPoint?: number;
  };
  activeBets: Array<{
    playerId: string;
    playerName: string;
    betAmount: number;
    cashedOut?: boolean;
    cashOutMultiplier?: number;
    winAmount?: number;
  }>;
  totalPlayers: number;
}

interface SpacemanGameProps {
  userId: string;
  userName: string;
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

const SpacemanGame: React.FC<SpacemanGameProps> = ({
  userId,
  userName,
  balance,
  onBalanceUpdate,
}) => {
  // Game state
  const { gameData, isConnected, placeBet, cashOut } = useGameSocket(
    userId,
    userName,
  );

  // UI state
  const [betAmount, setBetAmount] = useState(1);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [autoCashout50Enabled, setAutoCashout50Enabled] = useState(false);
  const [autoCashout50, setAutoCashout50] = useState(1.5);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastResults, setLastResults] = useState<number[]>([]);
  const [gameHistory, setGameHistory] = useState<
    Array<{ multiplier: number; timestamp: number }>
  >([]);
  const [stars, setStars] = useState<
    Array<{ x: number; y: number; opacity: number; size: number; id: number }>
  >([]);

  // Player state
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [currentPlayerBet, setCurrentPlayerBet] = useState<any>(null);
  const [betHistory, setBetHistory] = useState<number[]>([]);
  const [autoplayActive, setAutoplayActive] = useState(false);
  const [autoplayRounds, setAutoplayRounds] = useState(10);
  const [gameMessage, setGameMessage] = useState("");

  // Quick bet amounts
  const quickBetAmounts = [1, 5, 10, 25];

  // Generate space background
  useEffect(() => {
    const newStars = Array.from({ length: 200 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.8 + 0.2,
      size: Math.random() * 2 + 1,
      id: i,
    }));
    setStars(newStars);
  }, []);

  // Update player bet status
  useEffect(() => {
    const playerBet = gameData.activeBets.find(
      (bet) => bet.playerId === userId,
    );
    setCurrentPlayerBet(playerBet);
    setHasActiveBet(!!playerBet && !playerBet.cashedOut);
  }, [gameData.activeBets, userId]);

  // Update game messages
  useEffect(() => {
    switch (gameData.gameState.phase) {
      case "waiting":
        if (gameData.gameState.countdown > 0) {
          setGameMessage(`NEXT GAME IN ${gameData.gameState.countdown}s`);
        } else {
          setGameMessage("WAIT FOR NEXT GAME");
        }
        break;
      case "flying":
        setGameMessage("");
        break;
      case "crashed":
        setGameMessage("BETS CLOSED");
        // Add to results history
        if (gameData.gameState.crashPoint) {
          setLastResults((prev) => [
            gameData.gameState.crashPoint!,
            ...prev.slice(0, 9),
          ]);
          setGameHistory((prev) => [
            ...prev,
            {
              multiplier: gameData.gameState.crashPoint!,
              timestamp: Date.now(),
            },
          ]);
        }
        break;
    }
  }, [gameData.gameState]);

  // Auto cashout logic
  useEffect(() => {
    if (hasActiveBet && gameData.gameState.phase === "flying") {
      // 50% Auto cashout
      if (
        autoCashout50Enabled &&
        gameData.gameState.multiplier >= autoCashout50
      ) {
        // Trigger 50% cashout (would need server support)
        console.log("50% auto cashout triggered");
      }

      // Full auto cashout
      if (autoCashoutEnabled && gameData.gameState.multiplier >= autoCashout) {
        cashOut();
      }
    }
  }, [
    gameData.gameState.multiplier,
    hasActiveBet,
    autoCashoutEnabled,
    autoCashout,
    autoCashout50Enabled,
    autoCashout50,
  ]);

  // Bet amount management
  const updateBetAmount = (amount: number) => {
    setBetAmount(Math.max(0.1, Math.min(amount, balance)));
  };

  const doubleBet = () => {
    updateBetAmount(betAmount * 2);
  };

  const undoBet = () => {
    if (betHistory.length > 0) {
      const lastBet = betHistory[betHistory.length - 1];
      setBetAmount(lastBet);
      setBetHistory((prev) => prev.slice(0, -1));
    }
  };

  const handlePlaceBet = () => {
    if (canPlaceBet()) {
      setBetHistory((prev) => [...prev, betAmount]);
      placeBet(betAmount);
      onBalanceUpdate(balance - betAmount);
    }
  };

  const handleCashOut = () => {
    if (canCashOut()) {
      cashOut();
    }
  };

  const canPlaceBet = () => {
    return (
      !hasActiveBet &&
      gameData.gameState.phase === "waiting" &&
      gameData.gameState.countdown > 0 &&
      betAmount <= balance &&
      betAmount >= 0.1
    );
  };

  const canCashOut = () => {
    return (
      hasActiveBet &&
      gameData.gameState.phase === "flying" &&
      gameData.gameState.multiplier > 1.0
    );
  };

  const getCurrentWin = () => {
    if (currentPlayerBet && gameData.gameState.phase === "flying") {
      return currentPlayerBet.betAmount * gameData.gameState.multiplier;
    }
    return 0;
  };

  const getMultiplierColor = () => {
    if (gameData.gameState.multiplier < 1.5) return "text-white";
    if (gameData.gameState.multiplier < 2) return "text-green-400";
    if (gameData.gameState.multiplier < 3) return "text-yellow-400";
    if (gameData.gameState.multiplier < 5) return "text-orange-400";
    if (gameData.gameState.multiplier < 10) return "text-red-400";
    return "text-purple-400";
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black overflow-hidden">
      {/* Stars Background */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-4 z-40">
        <div className="flex items-center justify-between">
          {/* Game Title and ID */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Spaceman</h1>
            <div className="text-sm text-white/70">
              ID: {gameData.gameState.gameId || "Local"}
            </div>
            <div className="text-sm text-white/70">
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Game Limits */}
          <div className="bg-purple-600/50 px-4 py-2 rounded-lg">
            <span className="text-white font-medium">
              Spaceman 1€ - 100.00€
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
            >
              <MessageCircle size={20} />
            </button>
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
            >
              <BarChart3 size={20} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative h-full pt-20 pb-32">
        {/* Game Status Message */}
        {gameMessage && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-purple-600/80 backdrop-blur-sm px-8 py-4 rounded-xl">
              <span className="text-white text-2xl font-bold">
                {gameMessage}
              </span>
            </div>
          </div>
        )}

        {/* Central Multiplier Display */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          {gameData.gameState.phase === "flying" && (
            <div className="relative">
              {/* Planet/Multiplier Background */}
              <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-2xl">
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-300/50 to-purple-500/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center h-full">
                    <span
                      className={`text-6xl font-extrabold drop-shadow-lg ${getMultiplierColor()}`}
                    >
                      {gameData.gameState.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Rotating rays */}
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "3s" }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 bg-gradient-to-t from-transparent via-cyan-400 to-transparent opacity-60"
                    style={{
                      height: "150px",
                      left: "50%",
                      top: "-75px",
                      transformOrigin: "50% 207px",
                      transform: `rotate(${i * 30}deg)`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spaceman Character */}
        <div
          className={`absolute transition-all duration-300 ease-in-out z-30 ${
            gameData.gameState.phase === "flying" ? "animate-pulse" : ""
          }`}
          style={{
            left: "50%",
            top: gameData.gameState.phase === "flying" ? "30%" : "60%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="w-20 h-20 flex items-center justify-center">
            <img
              src="/png-png-urbanbrush-13297 copy.png"
              alt="Spaceman"
              className="w-full h-full object-contain filter drop-shadow-2xl"
              style={{
                filter:
                  gameData.gameState.phase === "flying"
                    ? "brightness(1.3) saturate(1.3) drop-shadow(0 0 20px rgba(255,165,0,0.8))"
                    : "brightness(1.1)",
              }}
            />
          </div>
        </div>

        {/* Leaderboard Panel */}
        <div className="absolute right-4 top-20 w-80 max-h-96 bg-black/60 backdrop-blur-sm rounded-xl p-4 z-30">
          <h3 className="text-white font-bold mb-4 flex items-center">
            <span className="mr-2">👥</span>
            Players ({gameData.totalPlayers})
          </h3>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {gameData.activeBets.map((bet) => (
              <div
                key={bet.playerId}
                className={`flex items-center justify-between p-2 rounded ${
                  bet.playerId === userId ? "bg-blue-600/30" : "bg-white/10"
                } ${bet.cashedOut ? "text-green-400" : "text-white"}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {bet.playerId === userId ? "👤" : ""}
                    {bet.playerName}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs">€{bet.betAmount}</div>
                  {bet.cashedOut ? (
                    <div className="text-xs text-green-400">
                      {bet.cashOutMultiplier?.toFixed(2)}x = €
                      {bet.winAmount?.toFixed(2)}
                    </div>
                  ) : gameData.gameState.phase === "flying" ? (
                    <div className="text-xs">
                      {gameData.gameState.multiplier.toFixed(2)}x = €
                      {(bet.betAmount * gameData.gameState.multiplier).toFixed(
                        2,
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 z-40">
        <div className="max-w-7xl mx-auto">
          {/* Auto Cashout Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6">
              {/* Auto Cashout */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoCashoutEnabled}
                    onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                      autoCashoutEnabled ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full mt-0.5 ml-0.5 transition-transform ${
                        autoCashoutEnabled ? "translate-x-6" : ""
                      }`}
                    />
                  </div>
                </div>
                <span className="text-white">Auto Cashout</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      setAutoCashout(Math.max(1.01, autoCashout - 0.1))
                    }
                    className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <span className="text-white min-w-20 text-center bg-gray-700 px-2 py-1 rounded">
                    {autoCashout.toFixed(2)}x
                  </span>
                  <button
                    onClick={() =>
                      setAutoCashout(Math.min(4999.99, autoCashout + 0.1))
                    }
                    className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center justify-center"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* 50% Auto Cashout */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoCashout50Enabled}
                    onChange={(e) => setAutoCashout50Enabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() =>
                      setAutoCashout50Enabled(!autoCashout50Enabled)
                    }
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                      autoCashout50Enabled ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full mt-0.5 ml-0.5 transition-transform ${
                        autoCashout50Enabled ? "translate-x-6" : ""
                      }`}
                    />
                  </div>
                </div>
                <span className="text-white">Auto Cashout 50%</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      setAutoCashout50(Math.max(1.01, autoCashout50 - 0.1))
                    }
                    className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <span className="text-white min-w-20 text-center bg-gray-700 px-2 py-1 rounded">
                    {autoCashout50.toFixed(2)}x
                  </span>
                  <button
                    onClick={() =>
                      setAutoCashout50(
                        Math.min(autoCashout - 0.01, autoCashout50 + 0.1),
                      )
                    }
                    className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center justify-center"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Betting Controls */}
          <div className="flex items-center justify-between">
            {/* Left side - Betting controls */}
            <div className="flex items-center space-x-4">
              {/* Quick bet buttons */}
              <div className="flex space-x-2">
                {quickBetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => updateBetAmount(amount)}
                    className="bg-purple-600/50 hover:bg-purple-500/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    +€{amount}
                  </button>
                ))}
              </div>

              {/* Bet amount controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={doubleBet}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  2x
                </button>
                <button
                  onClick={undoBet}
                  disabled={betHistory.length === 0}
                  className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Bet amount display */}
              <div className="bg-gray-700 px-4 py-2 rounded-lg">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) =>
                    updateBetAmount(parseFloat(e.target.value) || 0)
                  }
                  min="0.1"
                  max={balance}
                  step="0.1"
                  className="bg-transparent text-white w-20 text-center focus:outline-none"
                />
              </div>
            </div>

            {/* Center - Main action area */}
            <div className="flex items-center space-x-4">
              {hasActiveBet ? (
                <>
                  <div className="text-center">
                    <div className="text-white text-sm">Current Win</div>
                    <div className="text-green-400 text-xl font-bold">
                      €{getCurrentWin().toFixed(2)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCashOut}
                      disabled={!canCashOut()}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                    >
                      CASHOUT
                      <div className="text-sm">
                        €{getCurrentWin().toFixed(2)}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        /* TODO: Implement 50% cashout */
                      }}
                      disabled={!canCashOut()}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                    >
                      CASHOUT 50%
                      <div className="text-sm">
                        €{(getCurrentWin() / 2).toFixed(2)}
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handlePlaceBet}
                  disabled={!canPlaceBet()}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors"
                >
                  CONFIRM BET
                  <div className="text-sm">€{betAmount.toFixed(2)}</div>
                </button>
              )}
            </div>

            {/* Right side - Balance and info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-white/70 text-sm">Balance</div>
                <div className="text-white text-xl font-bold">
                  €{balance.toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-white/70 text-sm">Total Bet</div>
                <div className="text-white text-lg font-bold">
                  €{betAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Results Panel */}
      <div className="absolute bottom-32 left-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 z-30">
        <h3 className="text-white font-bold mb-2">Last Results</h3>
        <div className="flex space-x-2">
          {lastResults.slice(0, 10).map((result, index) => (
            <div
              key={index}
              className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold ${
                result < 2
                  ? "bg-red-500"
                  : result < 10
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            >
              {result.toFixed(2)}x
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="absolute top-20 left-4 z-50">
        <div
          className={`px-3 py-2 rounded-lg ${
            isConnected
              ? "bg-green-500/20 text-green-300 border border-green-400/30"
              : "bg-red-500/20 text-red-300 border border-red-400/30"
          }`}
        >
          <span className="text-sm">
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpacemanGame;
