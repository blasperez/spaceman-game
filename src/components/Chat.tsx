import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system';
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  username: string;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, username }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
          <span className="text-white font-medium">Chat</span>
          <div className="flex items-center space-x-1 text-white/70">
            <Users size={14} />
            <span className="text-xs">{Math.floor(Math.random() * 500) + 100}</span>
          </div>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Chat Content */}
      {isExpanded && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto px-4 pb-2">
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start space-x-2 ${
                  msg.type === 'system' ? 'justify-center' : ''
                }`}>
                  {msg.type === 'user' && (
                    <>
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {msg.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white">{msg.username}</span>
                          <span className="text-xs text-white/60">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-sm text-white/80 break-words">{msg.message}</p>
                      </div>
                    </>
                  )}
                  {msg.type === 'system' && (
                    <div className="text-center">
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/20 px-2 py-1 rounded-lg">
                        {msg.message}
                      </span>
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
                placeholder="Type a message..."
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-400/50 focus:outline-none placeholder-white/50 shadow-lg"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="px-3 py-2 bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-md border border-blue-400/30 rounded-xl transition-colors shadow-lg"
              >
                <Send size={16} className="text-white" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
