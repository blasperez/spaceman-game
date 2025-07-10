import React from 'react';
import { Rocket } from 'lucide-react';

interface SimpleGameBoardProps {
  multiplier: number;
  gamePhase: 'waiting' | 'flying' | 'crashed';
}

export const SimpleGameBoard: React.FC<SimpleGameBoardProps> = ({ 
  multiplier, 
  gamePhase 
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg">
      {/* Rocket Animation */}
      <div className={`transition-all duration-300 ${gamePhase === 'flying' ? 'animate-bounce' : ''}`}>
        <Rocket 
          size={80} 
          className={`
            ${gamePhase === 'waiting' ? 'text-gray-400' : ''}
            ${gamePhase === 'flying' ? 'text-blue-400' : ''}
            ${gamePhase === 'crashed' ? 'text-red-400' : ''}
          `} 
        />
      </div>
      
      {/* Multiplier Display */}
      <div className="mt-6 text-center">
        <div className={`text-6xl font-bold transition-colors
          ${gamePhase === 'waiting' ? 'text-gray-400' : ''}
          ${gamePhase === 'flying' ? 'text-green-400' : ''}
          ${gamePhase === 'crashed' ? 'text-red-400' : ''}
        `}>
          {multiplier.toFixed(2)}x
        </div>
        
        <div className="text-gray-300 text-lg mt-2">
          {gamePhase === 'waiting' && 'Esperando...'}
          {gamePhase === 'flying' && '¡Volando!'}
          {gamePhase === 'crashed' && '¡Crashed!'}
        </div>
      </div>
      
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {gamePhase === 'flying' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>
  );
};