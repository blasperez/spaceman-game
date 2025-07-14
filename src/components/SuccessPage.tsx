import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data: orders, error } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .order('order_date', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching order details:', error);
        } else if (orders && orders.length > 0) {
          setOrderDetails(orders[0]);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, []);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Success Icon */}
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-white/70 mb-6">
            Thank you for your purchase. Your space money has been added to your account.
          </p>

          {loading ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
              </div>
            </div>
          ) : orderDetails ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-white font-semibold mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Order ID:</span>
                  <span className="text-white font-mono">#{orderDetails.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Amount:</span>
                  <span className="text-white">
                    {(orderDetails.amount_total / 100).toLocaleString('en-US', {
                      style: 'currency',
                      currency: orderDetails.currency.toUpperCase()
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className="text-green-400 capitalize">{orderDetails.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Date:</span>
                  <span className="text-white">
                    {new Date(orderDetails.order_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
              <p className="text-white/70 text-sm">
                Your purchase has been processed successfully. You can now start playing!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center space-x-2 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl transition-all"
            >
              <span>Start Playing</span>
              <ArrowRight size={20} />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl transition-all"
            >
              <Home size={20} />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};