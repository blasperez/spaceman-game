import React, { useState } from "react";
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Globe,
} from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  animationsEnabled: boolean;
  onAnimationsToggle: () => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onSoundToggle,
  animationsEnabled,
  onAnimationsToggle,
  language,
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "audio" | "display">(
    "general",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(50);
  const [effectsEnabled, setEffectsEnabled] = useState(true);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.log("Error attempting to enable fullscreen:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.log("Error attempting to exit fullscreen:", err);
        });
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-[90%] max-w-2xl h-[80%] max-h-[600px] border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Settings</h2>
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
            onClick={() => setActiveTab("general")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "general"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "audio"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Audio
          </button>
          <button
            onClick={() => setActiveTab("display")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "display"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Display
          </button>
        </div>

        {/* Content */}
        <div className="p-6 h-[calc(100%-120px)] overflow-y-auto">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="text-purple-400" size={20} />
                  <h3 className="text-white font-medium">Language</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => onLanguageChange(lang.code)}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                        language === lang.code
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Preferences */}
              <div>
                <h3 className="text-white font-medium mb-4">
                  Game Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">Auto-confirm bets</div>
                      <div className="text-gray-400 text-sm">
                        Skip confirmation dialog for bets
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">Quick cashout</div>
                      <div className="text-gray-400 text-sm">
                        Enable one-click cashout
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">Show other players</div>
                      <div className="text-gray-400 text-sm">
                        Display other players' bets
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Responsible Gaming */}
              <div>
                <h3 className="text-white font-medium mb-4">
                  Responsible Gaming
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Daily bet limit (€)
                    </label>
                    <input
                      type="number"
                      placeholder="No limit"
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Session time reminder (minutes)
                    </label>
                    <select className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none">
                      <option value="">No reminder</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audio" && (
            <div className="space-y-6">
              {/* Master Audio Control */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  {soundEnabled ? (
                    <Volume2 className="text-green-400" size={20} />
                  ) : (
                    <VolumeX className="text-red-400" size={20} />
                  )}
                  <h3 className="text-white font-medium">Audio Settings</h3>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white">Master Volume</div>
                    <div className="text-gray-400 text-sm">
                      Control overall game audio
                    </div>
                  </div>
                  <button
                    onClick={onSoundToggle}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      soundEnabled
                        ? "bg-green-600 hover:bg-green-500 text-white"
                        : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                  >
                    {soundEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                {soundEnabled && (
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Volume Level
                    </label>
                    <div className="flex items-center space-x-4">
                      <VolumeX className="text-gray-400" size={16} />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <Volume2 className="text-gray-400" size={16} />
                      <span className="text-white text-sm w-12 text-right">
                        {volume}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual Audio Controls */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Individual Controls</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white">Game Effects</div>
                    <div className="text-gray-400 text-sm">
                      Rocket sounds, crashes, etc.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={effectsEnabled}
                      onChange={(e) => setEffectsEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white">Background Music</div>
                    <div className="text-gray-400 text-sm">
                      Ambient space sounds
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white">Notification Sounds</div>
                    <div className="text-gray-400 text-sm">
                      Bet confirmations, wins, etc.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white">Chat Sounds</div>
                    <div className="text-gray-400 text-sm">
                      New message notifications
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "display" && (
            <div className="space-y-6">
              {/* Display Settings */}
              <div>
                <h3 className="text-white font-medium mb-4">
                  Display Settings
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white">Animations</div>
                    <div className="text-gray-400 text-sm">
                      Enable visual effects and animations
                    </div>
                  </div>
                  <button
                    onClick={onAnimationsToggle}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      animationsEnabled
                        ? "bg-green-600 hover:bg-green-500 text-white"
                        : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                  >
                    {animationsEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white">Fullscreen Mode</div>
                    <div className="text-gray-400 text-sm">
                      Expand game to full screen
                    </div>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize size={16} />
                        <span>Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <Maximize size={16} />
                        <span>Enter Fullscreen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Visual Preferences */}
              <div>
                <h4 className="text-white font-medium mb-4">
                  Visual Preferences
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">Particle Effects</div>
                      <div className="text-gray-400 text-sm">
                        Stars, fire trail, etc.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">Background Elements</div>
                      <div className="text-gray-400 text-sm">
                        Planets, moons, space objects
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">High Contrast Mode</div>
                      <div className="text-gray-400 text-sm">
                        Improve visibility and readability
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white">Reduced Motion</div>
                      <div className="text-gray-400 text-sm">
                        Minimize motion for accessibility
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="text-white font-medium mb-4">Performance</h4>

                <div>
                  <label className="block text-white text-sm mb-2">
                    Graphics Quality
                  </label>
                  <select className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none">
                    <option value="low">Low (Better Performance)</option>
                    <option value="medium">Medium</option>
                    <option value="high" selected>
                      High (Better Quality)
                    </option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
