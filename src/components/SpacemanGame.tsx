import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  BarChart3,
  Volume2,
  VolumeX,
  MessageCircle,
  RotateCcw,
  History,
  Repeat,
  HelpCircle,
} from "lucide-react";
import { useGameSocket } from "../hooks/useGameSocket";
import StatisticsPanel from "./StatisticsPanel";
import ChatPanel from "./ChatPanel";
import SettingsPanel from "./SettingsPanel";

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
  // Dynamic styles for multiplier effects
  const dynamicStyles = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
      50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
    }
    .glow-effect {
      animation: glowPulse 2s infinite ease-in-out;
    }
  `;
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
  const [showHelp, setShowHelp] = useState(false);
  const [showAutoplay, setShowAutoplay] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [language, setLanguage] = useState("en");
  const [lastResults, setLastResults] = useState<number[]>([]);
  const [gameHistory, setGameHistory] = useState<
    Array<{ multiplier: number; timestamp: number; gameId: string }>
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

  // Space elements state
  const [spaceElements, setSpaceElements] = useState<
    Array<{
      x: number;
      y: number;
      size: number;
      type: "planet" | "moon" | "comet" | "asteroid" | "star";
      speed: number;
      opacity: number;
      id: number;
      color: string;
    }>
  >([]);

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

    // Generate space elements
    const newSpaceElements = Array.from({ length: 20 }, (_, i) => {
      const types = ["planet", "moon", "comet", "asteroid", "star"] as const;
      const colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
        "#FFB347",
      ];
      return {
        x: 110 + Math.random() * 20, // Start from right
        y: Math.random() * 100,
        size: Math.random() * 40 + 10,
        type: types[Math.floor(Math.random() * types.length)],
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.6 + 0.3,
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setSpaceElements(newSpaceElements);
  }, []);

  // Animate space elements
  useEffect(() => {
    const interval = setInterval(() => {
      setSpaceElements((prev) =>
        prev.map((element) => ({
          ...element,
          x:
            element.x <= -20
              ? 110 + Math.random() * 20
              : element.x - element.speed,
        })),
      );
    }, 50);

    return () => clearInterval(interval);
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
              gameId: gameData.gameState.gameId,
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
      {/* Dynamic Styles */}
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />

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

      {/* Moving Space Elements */}
      {spaceElements.map((element) => (
        <div
          key={element.id}
          className={`absolute ${element.type === "comet" ? "rounded-none" : "rounded-full"} ${element.type === "star" ? "animate-pulse" : ""}`}
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.size}px`,
            height: `${element.size}px`,
            background:
              element.type === "comet"
                ? `linear-gradient(45deg, ${element.color}, transparent)`
                : element.color,
            opacity: element.opacity,
            boxShadow: `0 0 ${element.size / 2}px ${element.color}30`,
            transform: element.type === "comet" ? "skew(-20deg, 0)" : "none",
            zIndex: 1,
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
              title="Sound"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              title="Chat"
            >
              <MessageCircle size={20} />
            </button>
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              title="Statistics"
            >
              <BarChart3 size={20} />
            </button>
            <button
              onClick={() => setShowAutoplay(!showAutoplay)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              title="Autoplay"
            >
              <Repeat size={20} />
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              title="Help"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              title="Settings"
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
              {/* Planet/Multiplier Background with Dynamic Effects */}
              <div
                className="relative w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-2xl animate-pulse"
                style={{
                  boxShadow: `0 0 ${gameData.gameState.multiplier * 10}px rgba(6, 182, 212, 0.8), 0 0 ${gameData.gameState.multiplier * 20}px rgba(147, 51, 234, 0.6), 0 0 ${gameData.gameState.multiplier * 30}px rgba(59, 130, 246, 0.4)`,
                  animation: `pulse ${Math.max(0.3, 1.5 - gameData.gameState.multiplier * 0.05)}s infinite, rotate 360deg ${Math.max(1, 5 - gameData.gameState.multiplier * 0.2)}s linear infinite`,
                  transform: `scale(${Math.min(1.3, 1 + gameData.gameState.multiplier * 0.02)})`,
                }}
              >
                <div
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-300/50 to-purple-500/50 backdrop-blur-sm"
                  style={{
                    boxShadow: `inset 0 0 ${gameData.gameState.multiplier * 5}px rgba(34, 197, 94, 0.4)`,
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span
                      className={`text-6xl font-extrabold drop-shadow-lg ${getMultiplierColor()}`}
                    >
                      {gameData.gameState.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Rotating rays with dynamic speed */}
              <div
                className="absolute inset-0 animate-spin"
                style={{
                  animationDuration: `${Math.max(0.5, 3 - gameData.gameState.multiplier * 0.1)}s`,
                  filter: `drop-shadow(0 0 ${gameData.gameState.multiplier * 2}px rgba(34, 197, 94, 0.8))`,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 bg-gradient-to-t from-transparent via-cyan-400 to-transparent"
                    style={{
                      opacity: Math.min(
                        1,
                        0.6 + gameData.gameState.multiplier * 0.05,
                      ),
                      filter: `drop-shadow(0 0 ${gameData.gameState.multiplier}px rgba(6, 182, 212, 0.8))`,
                      background: `linear-gradient(to top, transparent, rgba(6, 182, 212, ${Math.min(1, 0.8 + gameData.gameState.multiplier * 0.02)}), transparent)`,
                    }}
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

        {/* Spaceman Character with Flame Trail */}
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
          {/* Flame Trail Effect */}
          {gameData.gameState.phase === "flying" && (
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2">
              {/* Multiple flame particles */}
              <div className="relative">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-pulse"
                    style={{
                      right: `${i * 8}px`,
                      top: `${Math.sin(i) * 10}px`,
                      animation: `flameFloat ${0.5 + i * 0.1}s infinite ease-in-out alternate`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    <div
                      className="w-3 h-6 rounded-full"
                      style={{
                        background:
                          i < 3
                            ? "linear-gradient(to top, #ff6b35, #f7931e, #ffcd3c)"
                            : i < 6
                              ? "linear-gradient(to top, #f7931e, #ffcd3c, transparent)"
                              : "linear-gradient(to top, #ffcd3c, transparent, transparent)",
                        filter: `blur(${i * 0.5}px)`,
                        opacity: Math.max(0.3, 1 - i * 0.15),
                        transform: `scale(${Math.max(0.3, 1 - i * 0.1)})`,
                      }}
                    />
                  </div>
                ))}

                {/* Main flame jet */}
                <div
                  className="absolute right-0 top-1/2 transform -translate-y-1/2"
                  style={{
                    width: `${20 + gameData.gameState.multiplier * 5}px`,
                    height: "12px",
                    background:
                      "linear-gradient(to left, #ff4444, #ff8800, #ffaa00, transparent)",
                    borderRadius: "0 50% 50% 0",
                    filter: `blur(1px) brightness(${1 + gameData.gameState.multiplier * 0.1})`,
                    boxShadow: "0 0 10px #ff6600, 0 0 20px #ff4400",
                    animation:
                      "flameIntensity 0.3s infinite ease-in-out alternate",
                  }}
                />
              </div>
            </div>
          )}

          <div className="w-20 h-20 flex items-center justify-center relative">
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

      {/* Bottom Control Panel - Fixed Layout */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md p-4 z-40">
        <div className="max-w-7xl mx-auto">
          {/* Auto Cashout Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Auto Cashout */}
              <div className="flex items-center space-x-2 min-w-fit">
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
              <div className="flex items-center space-x-2 min-w-fit">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            {/* Left side - Betting controls */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
              {/* Quick bet buttons */}
              <div className="flex space-x-2">
                {quickBetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => updateBetAmount(amount)}
                    className="relative bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-400/40 hover:to-blue-400/40 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-purple-400/30 hover:border-purple-300/50 shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm"
                    style={{
                      boxShadow: `0 0 ${gameData.gameState.phase === "flying" ? gameData.gameState.multiplier * 2 : 5}px rgba(147, 51, 234, 0.3)`,
                    }}
                  >
                    +€{amount}
                  </button>
                ))}
              </div>

              {/* Bet amount controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={doubleBet}
                  className="relative bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-400/40 hover:to-orange-400/40 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 border border-yellow-400/30 hover:border-yellow-300/50 shadow-lg hover:shadow-yellow-500/25 backdrop-blur-sm"
                  style={{
                    boxShadow: `0 0 ${gameData.gameState.phase === "flying" ? gameData.gameState.multiplier * 2 : 5}px rgba(234, 179, 8, 0.3)`,
                  }}
                >
                  2x
                </button>
                <button
                  onClick={undoBet}
                  disabled={betHistory.length === 0}
                  className="relative bg-gradient-to-r from-gray-500/20 to-slate-500/20 hover:from-gray-400/40 hover:to-slate-400/40 disabled:from-gray-700/20 disabled:to-slate-700/20 disabled:opacity-50 text-white p-2 rounded-lg transition-all duration-300 border border-gray-400/30 hover:border-gray-300/50 disabled:border-gray-600/20 shadow-lg hover:shadow-gray-500/25 backdrop-blur-sm"
                  style={{
                    boxShadow:
                      betHistory.length > 0
                        ? `0 0 ${gameData.gameState.phase === "flying" ? gameData.gameState.multiplier * 2 : 5}px rgba(107, 114, 128, 0.3)`
                        : "none",
                  }}
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Bet amount display */}
              <div
                className="relative bg-gradient-to-r from-slate-700/30 to-gray-700/30 px-4 py-2 rounded-lg border border-slate-500/30 backdrop-blur-sm shadow-lg"
                style={{
                  boxShadow: `0 0 ${gameData.gameState.phase === "flying" ? gameData.gameState.multiplier * 3 : 8}px rgba(148, 163, 184, 0.2)`,
                }}
              >
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
            <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 justify-center">
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
                      className="relative bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-400/90 hover:to-emerald-400/90 disabled:from-gray-600/50 disabled:to-slate-600/50 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 border border-green-400/50 hover:border-green-300/70 shadow-xl animate-pulse"
                      style={{
                        boxShadow: `0 0 ${gameData.gameState.multiplier * 4}px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(34, 197, 94, 0.1)`,
                        animation: `pulse ${Math.max(0.5, 2 - gameData.gameState.multiplier * 0.1)}s infinite`,
                      }}
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
                      className="relative bg-gradient-to-r from-green-600/80 to-teal-500/80 hover:from-green-500/90 hover:to-teal-400/90 disabled:from-gray-600/50 disabled:to-slate-600/50 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 border border-green-500/50 hover:border-green-400/70 shadow-xl animate-pulse"
                      style={{
                        boxShadow: `0 0 ${gameData.gameState.multiplier * 3}px rgba(20, 184, 166, 0.6), inset 0 0 15px rgba(20, 184, 166, 0.1)`,
                        animation: `pulse ${Math.max(0.6, 2.2 - gameData.gameState.multiplier * 0.1)}s infinite`,
                      }}
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
                  className="relative bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600/50 disabled:to-slate-600/50 text-white px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300 border-2 border-green-400/60 hover:border-green-300/80 shadow-2xl transform hover:scale-105"
                  style={{
                    boxShadow:
                      "0 0 25px rgba(34, 197, 94, 0.5), inset 0 0 25px rgba(34, 197, 94, 0.1)",
                  }}
                >
                  CONFIRM BET
                  <div className="text-sm">€{betAmount.toFixed(2)}</div>
                </button>
              )}
            </div>

            {/* Right side - Balance and info */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-4 justify-end">
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

      {/* Autoplay Panel */}
      {showAutoplay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl w-[90%] max-w-md border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Repeat className="text-purple-400" size={24} />
                <h2 className="text-xl font-bold text-white">Autoplay</h2>
              </div>
              <button
                onClick={() => setShowAutoplay(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">
                  Number of rounds
                </label>
                <select
                  value={autoplayRounds}
                  onChange={(e) => setAutoplayRounds(parseInt(e.target.value))}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="text-yellow-300 text-sm font-medium mb-1">
                  ⚠️ Important
                </div>
                <div className="text-yellow-200 text-xs">
                  Please set Auto Cashout before starting Autoplay. While
                  Autoplay is running, you cannot change bet amounts or auto
                  cashout settings.
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setAutoplayActive(true);
                    setShowAutoplay(false);
                  }}
                  disabled={!autoCashoutEnabled}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Start Autoplay
                </button>
                <button
                  onClick={() => setShowAutoplay(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl w-[90%] max-w-2xl h-[80%] border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <HelpCircle className="text-purple-400" size={24} />
                <h2 className="text-xl font-bold text-white">
                  Spaceman Game Help
                </h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    🚀 How to Play
                  </h3>
                  <p className="mb-2">
                    Spaceman is a multiplayer crash game where you bet on how
                    high the multiplier will go before it crashes.
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Place your bet during the betting phase</li>
                    <li>Watch the multiplier grow from 1.00x upwards</li>
                    <li>
                      Cash out before the crash to win your bet × multiplier
                    </li>
                    <li>
                      If you don't cash out before the crash, you lose your bet
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    💰 Betting
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <strong>Minimum bet:</strong> €1.00
                    </li>
                    <li>
                      <strong>Maximum bet:</strong> €100.00
                    </li>
                    <li>
                      <strong>Quick bets:</strong> Use +€1, +€5, +€10, +€25
                      buttons
                    </li>
                    <li>
                      <strong>Double (2x):</strong> Doubles your current bet
                      amount
                    </li>
                    <li>
                      <strong>Undo:</strong> Reverts to your previous bet amount
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    🎯 Cashing Out
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <strong>CASHOUT:</strong> Cash out your full bet at
                      current multiplier
                    </li>
                    <li>
                      <strong>CASHOUT 50%:</strong> Cash out half your bet,
                      continue with the rest
                    </li>
                    <li>
                      <strong>Auto Cashout:</strong> Automatically cash out at a
                      set multiplier
                    </li>
                    <li>
                      <strong>50% Auto Cashout:</strong> Automatically cash out
                      50% at a set multiplier
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    ⚡ Special Rules
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>If crash occurs at 1.00x, all bets are lost</li>
                    <li>Maximum multiplier is 5000x (auto payout)</li>
                    <li>Game has 95.50% RTP (Return to Player)</li>
                    <li>This is a game of chance, not skill</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    🔄 Autoplay
                  </h3>
                  <p className="text-sm">
                    Automatically repeat your bets for a selected number of
                    rounds. Auto Cashout must be enabled to use Autoplay.
                  </p>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-300 font-bold mb-2">
                    🛡️ Responsible Gaming
                  </h4>
                  <p className="text-blue-200 text-sm">
                    Remember to play responsibly. Set limits for yourself and
                    never bet more than you can afford to lose. If you need help
                    with gambling issues, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Results Panel - Fixed at bottom */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-600/30">
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs font-medium mr-2">
              LAST RESULTS
            </span>
            <div className="flex space-x-1">
              {lastResults.slice(-15).map((multiplier, index) => {
                const getMultiplierColor = (mult: number) => {
                  if (mult >= 10) return "bg-purple-500 text-white";
                  if (mult >= 5) return "bg-red-500 text-white";
                  if (mult >= 2) return "bg-yellow-500 text-black";
                  return "bg-gray-500 text-white";
                };

                return (
                  <div
                    key={`${multiplier}-${index}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getMultiplierColor(multiplier)}`}
                  >
                    {multiplier >= 100
                      ? `${Math.floor(multiplier / 100)}k`
                      : multiplier >= 10
                        ? Math.floor(multiplier)
                        : multiplier.toFixed(1)}
                  </div>
                );
              })}
              {lastResults.length === 0 && (
                <div className="text-gray-400 text-xs">No games played yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <StatisticsPanel
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        gameHistory={gameHistory}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUserId={userId}
        currentUserName={userName}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        animationsEnabled={animationsEnabled}
        onAnimationsToggle={() => setAnimationsEnabled(!animationsEnabled)}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
};

export default SpacemanGame;
