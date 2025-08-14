import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users, Shield } from 'lucide-react';

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system' | 'global';
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  username: string;
  totalOnline?: number;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, username, totalOnline }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && inputMessage.length <= 200) {
      const moderatedMessage = moderateMessage(inputMessage.trim());
      if (moderatedMessage) {
        onSendMessage(moderatedMessage);
        setInputMessage('');
      }
    }
  };

  const moderateMessage = (message: string): string | null => {
    const bannedWords = ['spam', 'scam', 'hack', 'cheat'];
    const lowerMessage = message.toLowerCase();
    for (const word of bannedWords) {
      if (lowerMessage.includes(word)) return null;
    }
    if (message.length > 10 && message === message.toUpperCase()) return message.toLowerCase();
    return message;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStyle = (msg: ChatMessage) => {
    switch (msg.type) {
      case 'system':
        return 'bg-yellow-500/10 border border-yellow-400/20 text-yellow-300';
      case 'global':
        return 'bg-blue-500/10 border border-blue-400/20';
      default:
        return 'bg-green-500/10 border border-green-400/20';
    }
  };

  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300 shadow-2xl ${
      isExpanded ? 'h-96' : 'h-16'
    }`}>
      {/* Chat Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 rounded-t-2xl transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle size={20} className="text-blue-400" />
          <span className="text-white font-medium">Chat Global</span>
          {typeof totalOnline === 'number' && (
            <div className="flex items-center space-x-1 text-white/70">
              <Users size={14} />
              <span className="text-xs">{totalOnline}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Shield size={16} className="text-green-400" />
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      {isExpanded && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto px-4 pb-2">
            <div className="space-y-2">
              {sortedMessages.slice(-50).map((msg) => (
                <div key={msg.id} className={`p-2 rounded-lg ${getMessageStyle(msg)}`}>
                  {msg.type === 'system' ? (
                    <div className="text-center">
                      <span className="text-xs font-medium">
                        {msg.message}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white flex items-center">
                          {msg.username === username && <span className="mr-1">👤</span>}
                          {msg.username}
                        </span>
                        <span className="text-xs text-white/60">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-white/80 break-words">{msg.message}</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe un mensaje... (máx. 200 caracteres)"
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || inputMessage.length > 200}
                className="px-3 py-2 bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-md border border-blue-400/30 rounded-xl transition-colors shadow-lg"
              >
                <Send size={16} className="text-white" />
              </button>
            </form>
            <div className="mt-2 text-right">
              <span className={`text-xs ${
                inputMessage.length > 180 ? 'text-red-400' : 
                inputMessage.length > 150 ? 'text-yellow-400' : 'text-white/60'
              }`}>
                {inputMessage.length}/200
              </span>
            </div>
            <div className="mt-2 text-xs text-white/50">
              💡 Mantén el respeto. Mensajes moderados automáticamente.
            </div>
          </div>
        </>
      )}
    </div>
  );
};