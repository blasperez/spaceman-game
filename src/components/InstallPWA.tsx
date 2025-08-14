import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-xl border border-white/20 z-50">
      <div className="flex items-center space-x-3">
        <span>Instala la app para usarla en tu dispositivo</span>
        <button onClick={handleInstall} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg">Instalar</button>
        <button onClick={() => setIsVisible(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg">Cerrar</button>
      </div>
    </div>
  );
};

export default InstallPWA;