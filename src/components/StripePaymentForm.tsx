import React from 'react';

export const StripePaymentForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = () => {
  // Deprecated: use AddCardModal + PaymentSheet
  return (
    <div className="text-white/70 text-sm">Este flujo ha sido reemplazado por el pago en la app.</div>
  );
};