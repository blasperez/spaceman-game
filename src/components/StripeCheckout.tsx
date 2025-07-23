/// <reference types="react" />
import React from 'react';
import { StripePaymentForm } from './StripePaymentForm';

interface StripeCheckoutProps {
  onClose: () => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ onClose }: StripeCheckoutProps) => {
  const handlePaymentSuccess = () => {
    // Close the modal
    onClose();

    // Exit the game - for example, redirect to a success page or close UI
    // Here we redirect to a success page
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
        <StripePaymentForm amount={10} onPaymentSuccess={handlePaymentSuccess} />
      </div>
    </div>
  );
};
