import React from 'react';

export const StripePaymentForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = () => {
  return (
    <div className="text-white/70 text-sm">Pago en la app disponible en el modal actual.</div>
  );
};