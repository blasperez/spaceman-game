/// <reference types="react" />
import React, { useState } from 'react';
import { AddCardModal } from './AddCardModal';
import { PaymentSheet } from './PaymentSheet';

interface StripeCheckoutProps {
  onClose: () => void;
  amount: number;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ onClose, amount }) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Pagos</h2>
          <button
            onClick={onClose}
            className="text-white text-2xl font-bold leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Añadir tarjeta
          </button>
          <button
            onClick={() => setShowPaymentSheet(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Pagar ahora en la app
          </button>
        </div>
      </div>

      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onAdded={() => setShowAddCard(false)}
        />
      )}

      {showPaymentSheet && (
        <PaymentSheet
          onClose={() => setShowPaymentSheet(false)}
          defaultAmount={amount}
          onSuccess={() => setShowPaymentSheet(false)}
        />
      )}
    </div>
  );
};
