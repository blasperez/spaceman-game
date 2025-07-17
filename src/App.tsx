import React from 'react';
import EnhancedGameBoard from './components/EnhancedGameBoard';
import MobileBettingPanel from './components/MobileBettingPanel';

function App() {
  // Aquí podrías agregar lógica de rutas o layout si es necesario
  return (
    <div>
      <EnhancedGameBoard />
      {/* El panel de apuestas móvil se debe renderizar según el layout real */}
      {/* <MobileBettingPanel ...props /> */}
    </div>
  );
}

export default App;