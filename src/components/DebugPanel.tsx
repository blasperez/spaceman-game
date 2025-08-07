import React from 'react';

interface DebugPanelProps {
  user: any;
  connectionStatus: string;
  isConnected: boolean;
  gameData: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  user,
  connectionStatus,
  isConnected,
  gameData
}) => {
  // Solo mostrar en development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
      
      <div className="space-y-1">
        <div>
          <strong>User:</strong> {user ? `${user.name} (${user.id})` : 'Not authenticated'}
        </div>
        
        <div>
          <strong>Connection:</strong> 
          <span className={`ml-1 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {connectionStatus}
          </span>
        </div>
        
        <div>
          <strong>Game Phase:</strong> {gameData?.gameState?.phase || 'unknown'}
        </div>
        
        <div>
          <strong>Players:</strong> {gameData?.totalPlayers || 0}
        </div>
        
        <div>
          <strong>Environment:</strong> {import.meta.env.MODE}
        </div>
        
        <div>
          <strong>Host:</strong> {window.location.host}
        </div>
        
        <div>
          <strong>WS URL:</strong> {import.meta.env.VITE_WS_URL || 'Not set'}
        </div>
      </div>
    </div>
  );
};
