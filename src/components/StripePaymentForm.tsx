import React from 'react';

export const StripePaymentForm: React.FC<{ amount: number; onPaymentSuccess: () => void }> = () => {
<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
  // Deprecated: use AddCardModal + PaymentSheet
  return (
    <div className="text-white/70 text-sm">Este flujo ha sido reemplazado por el pago en la app.</div>
=======
  return (
    <div className="text-white/70 text-sm">Pago en la app disponible en el modal actual.</div>
>>>>>>> Incoming (Background Agent changes)
=======
  return (
    <div className="text-white/70 text-sm">Pago en la app disponible en el modal actual.</div>
>>>>>>> Incoming (Background Agent changes)
  );
};