import React, { useState, useRef, useEffect } from "react";
import { X, Send, Users, Headphones } from "lucide-react";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: "user" | "system" | "support";
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "system",
      userName: "System",
      message: "Welcome to Spaceman! Good luck with your bets! 🚀",
      timestamp: Date.now() - 60000,
      type: "system",
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"game" | "support">("game");
  const [isBlocked, setIsBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  const sendMessage = () => {
    if (!currentMessage.trim() || isBlocked) return;

    // Check for inappropriate content (basic filter)
    const inappropriateWords = ["spam", "flood", "scam"];
    const hasInappropriateContent = inappropriateWords.some((word) =>
      currentMessage.toLowerCase().includes(word),
    );

    if (hasInappropriateContent) {
      // Block user temporarily
      setIsBlocked(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          userId: "system",
          userName: "System",
          message:
            "⚠️ Your message was blocked due to inappropriate content. Please be respectful.",
          timestamp: Date.now(),
          type: "system",
        },
      ]);

      setTimeout(() => setIsBlocked(false), 30000); // Unblock after 30 seconds
      setCurrentMessage("");
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: currentUserName,
      message: currentMessage.trim(),
      timestamp: Date.now(),
      type: activeTab === "support" ? "support" : "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setCurrentMessage("");

    // Simulate support response if in support tab
    if (activeTab === "support") {
      setTimeout(() => {
        const supportResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          userId: "support",
          userName: "Support Agent",
          message:
            "Thank you for contacting support. How can we help you today?",
          timestamp: Date.now(),
          type: "support",
        };
        setMessages((prev) => [...prev, supportResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageStyle = (message: ChatMessage) => {
    if (message.type === "system") {
      return "bg-blue-500/20 border-l-4 border-blue-500 text-blue-200";
    }
    if (message.type === "support") {
      return "bg-green-500/20 border-l-4 border-green-500 text-green-200";
    }
    if (message.userId === currentUserId) {
      return "bg-purple-500/20 border-l-4 border-purple-500 text-purple-200";
    }
    return "bg-gray-700/50 text-gray-200";
  };

  const getUserIcon = (message: ChatMessage) => {
    if (message.type === "system") return "🤖";
    if (message.type === "support") return "🎧";
    if (message.userId === currentUserId) return "👤";
    return "👥";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-[90%] max-w-2xl h-[80%] max-h-[600px] border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Chat</h2>
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
            onClick={() => setActiveTab("game")}
            className={`flex-1 px-6 py-3 font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "game"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users size={16} />
            <span>Game Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 px-6 py-3 font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "support"
                ? "text-green-400 border-b-2 border-green-400 bg-green-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Headphones size={16} />
            <span>Support</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeTab === "game" && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-blue-200 text-sm">
              <div className="font-medium mb-1">📢 Chat Rules</div>
              <ul className="text-xs space-y-1 text-blue-300">
                <li>• Be respectful to other players</li>
                <li>• No spam or flooding allowed</li>
                <li>• Keep conversations game-related</li>
                <li>• Inappropriate messages will be blocked</li>
              </ul>
            </div>
          )}

          {activeTab === "support" && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-200 text-sm">
              <div className="font-medium mb-1">🎧 Live Support</div>
              <p className="text-xs text-green-300">
                You are now connected to our support team. Please describe your
                issue and we'll help you as soon as possible.
              </p>
            </div>
          )}

          {messages
            .filter((msg) =>
              activeTab === "game"
                ? msg.type !== "support"
                : msg.type === "support" || msg.userId === currentUserId,
            )
            .map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${getMessageStyle(message)}`}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{getUserIcon(message)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.userName}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm break-words">{message.message}</p>
                  </div>
                </div>
              </div>
            ))}

          {isBlocked && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-center">
              <div className="text-sm font-medium">
                ⛔ You are temporarily blocked from chatting
              </div>
              <div className="text-xs text-red-300 mt-1">
                Your chat privileges will be restored in 30 seconds.
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isBlocked
                  ? "You are temporarily blocked..."
                  : activeTab === "game"
                    ? "Type your message to other players..."
                    : "Describe your issue to support..."
              }
              disabled={isBlocked}
              maxLength={200}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isBlocked}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <span>
              {activeTab === "game"
                ? "Chat with other players"
                : "Private chat with support team"}
            </span>
            <span>{currentMessage.length}/200</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
