import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const CancelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Cancel Icon */}
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} className="text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
          <p className="text-white/70 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          {/* Information */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-white font-semibold mb-3">What happened?</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• You cancelled the payment process</li>
              <li>• No money was charged to your account</li>
              <li>• You can try again anytime</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center space-x-2 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl transition-all"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};