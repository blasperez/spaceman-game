/// <reference types="react" />
import React from 'react';
import { StripePaymentForm } from './StripePaymentForm';

interface StripeCheckoutProps {
  onClose: () => void;
  amount: number;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ onClose, amount }) => {
  const handlePaymentSuccess = () => {
    onClose();
    window.location.href = '/success';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Agregar Tarjeta</h2>
          <button
            onClick={onClose}
            className="text-white text-2xl font-bold leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
        <StripePaymentForm amount={amount} onPaymentSuccess={handlePaymentSuccess} />
      </div>
    </div>
  );
};
