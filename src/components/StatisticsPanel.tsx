import React, { useState } from "react";
import { X, BarChart3, TrendingUp } from "lucide-react";

interface GameResult {
  multiplier: number;
  timestamp: number;
  gameId: string;
  hashString?: string;
  resultString?: string;
}

interface StatisticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameHistory: GameResult[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  isOpen,
  onClose,
  gameHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"results" | "charts">("results");
  const [resultCount, setResultCount] = useState(50);
  const [selectedResult, setSelectedResult] = useState<GameResult | null>(null);

  if (!isOpen) return null;

  // Get last N results
  const getLastResults = (count: number) => {
    return gameHistory.slice(0, count);
  };

  // Calculate distribution for charts
  const getDistribution = (count: number) => {
    const results = getLastResults(count);
    const ranges = [
      { label: "1x", min: 1, max: 1, color: "bg-gray-500", percentage: 0 },
      {
        label: "1.01x - 1.99x",
        min: 1.01,
        max: 1.99,
        color: "bg-red-500",
        percentage: 0,
      },
      {
        label: "2x - 5.99x",
        min: 2,
        max: 5.99,
        color: "bg-orange-500",
        percentage: 0,
      },
      {
        label: "6x - 25.99x",
        min: 6,
        max: 25.99,
        color: "bg-yellow-500",
        percentage: 0,
      },
      {
        label: "26x - 100.99x",
        min: 26,
        max: 100.99,
        color: "bg-green-500",
        percentage: 0,
      },
      {
        label: "101x - 4999.99x",
        min: 101,
        max: 4999.99,
        color: "bg-blue-500",
        percentage: 0,
      },
      {
        label: "5000x",
        min: 5000,
        max: 5000,
        color: "bg-purple-500",
        percentage: 0,
      },
    ];

    if (results.length === 0) return ranges;

    ranges.forEach((range) => {
      const count = results.filter(
        (r) => r.multiplier >= range.min && r.multiplier <= range.max,
      ).length;
      range.percentage = Math.round((count / results.length) * 100);
    });

    return ranges;
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier === 1) return "bg-gray-500 text-white";
    if (multiplier < 2) return "bg-red-500 text-white";
    if (multiplier < 6) return "bg-orange-500 text-white";
    if (multiplier < 26) return "bg-yellow-500 text-black";
    if (multiplier < 101) return "bg-green-500 text-white";
    if (multiplier < 5000) return "bg-blue-500 text-white";
    return "bg-purple-500 text-white";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-[90%] max-w-4xl h-[80%] max-h-[600px] border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Statistics</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "results"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            LAST RESULTS
          </button>
          <button
            onClick={() => setActiveTab("charts")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "charts"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            CHARTS
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-[calc(100%-120px)] overflow-y-auto">
          {activeTab === "results" && (
            <div>
              {/* Results Count Selector */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-white">Show last</span>
                  <select
                    value={resultCount}
                    onChange={(e) => setResultCount(parseInt(e.target.value))}
                    className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                  </select>
                  <span className="text-white">rounds</span>
                </div>
                <div className="text-gray-400 text-sm">
                  Total results: {gameHistory.length}
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                {getLastResults(resultCount).map((result, index) => (
                  <button
                    key={`${result.gameId}-${index}`}
                    onClick={() => setSelectedResult(result)}
                    className={`h-12 rounded flex items-center justify-center text-xs font-bold transition-all hover:scale-105 ${getMultiplierColor(result.multiplier)}`}
                  >
                    {result.multiplier === 5000
                      ? "5000x"
                      : result.multiplier.toFixed(2)}
                  </button>
                ))}
              </div>

              {/* Empty State */}
              {gameHistory.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No game history available yet.</p>
                  <p className="text-sm">Play some rounds to see statistics!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "charts" && (
            <div>
              {/* Charts Count Selector */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-white">Analyze last</span>
                  <select
                    value={resultCount}
                    onChange={(e) => setResultCount(parseInt(e.target.value))}
                    className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                  </select>
                  <span className="text-white">rounds</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <TrendingUp size={16} />
                  <span>{getLastResults(resultCount).length} ROUNDS</span>
                </div>
              </div>

              {/* Distribution Chart */}
              <div className="space-y-4">
                {getDistribution(resultCount).map((range, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-24 text-white text-sm font-medium">
                      {range.label}
                    </div>
                    <div className="flex-1 bg-gray-800 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full ${range.color} transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(range.percentage, 2)}%` }}
                      >
                        {range.percentage > 10 && (
                          <span className="text-xs font-bold text-white">
                            {range.percentage}%
                          </span>
                        )}
                      </div>
                      {range.percentage <= 10 && range.percentage > 0 && (
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-white">
                          {range.percentage}%
                        </span>
                      )}
                    </div>
                    <div className="w-12 text-right text-white text-sm">
                      {range.percentage}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {gameHistory.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No data available for charts.</p>
                  <p className="text-sm">
                    Play some rounds to see distribution!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Round Details</h3>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm">
                    Timestamp of the Round
                  </div>
                  <div className="text-white">
                    {new Date(selectedResult.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm">Result</div>
                  <div
                    className={`inline-block px-3 py-1 rounded font-bold ${getMultiplierColor(selectedResult.multiplier)}`}
                  >
                    {selectedResult.multiplier.toFixed(2)}x
                  </div>
                </div>

                {selectedResult.hashString && (
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Hash</div>
                    <div className="bg-gray-900 p-2 rounded text-xs text-gray-300 font-mono break-all">
                      {selectedResult.hashString}
                    </div>
                    <button className="text-xs text-purple-400 hover:text-purple-300 mt-1">
                      📋 Copied
                    </button>
                  </div>
                )}

                {selectedResult.resultString && (
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Result</div>
                    <div className="bg-gray-900 p-2 rounded text-xs text-gray-300 font-mono break-all">
                      {selectedResult.resultString}
                    </div>
                    <button className="text-xs text-purple-400 hover:text-purple-300 mt-1">
                      📋 Copied
                    </button>
                  </div>
                )}

                <div className="text-xs text-gray-500 bg-gray-900 p-2 rounded">
                  <div className="flex items-center space-x-1 mb-1">
                    <span>ℹ️</span>
                    <span>More info about Hash</span>
                  </div>
                  You can use the hash to verify that the result of the round is
                  fair by hashing the result string with SHA256.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPanel;
