import React from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  onReconnect
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Conectando...',
          className: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300',
          iconClassName: 'animate-spin'
        };
      case 'connected':
        return {
          icon: Wifi,
          text: 'Conectado',
          className: 'bg-green-500/20 border-green-400/30 text-green-300',
          iconClassName: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Error de conexión',
          className: 'bg-red-500/20 border-red-400/30 text-red-300',
          iconClassName: ''
        };
      default:
        return {
          icon: WifiOff,
          text: 'Desconectado',
          className: 'bg-red-500/20 border-red-400/30 text-red-300',
          iconClassName: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl backdrop-blur-md border ${config.className}`}>
      <Icon size={16} className={config.iconClassName} />
      <span className="text-sm font-medium">{config.text}</span>
      
      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
          title="Reconectar"
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
};
