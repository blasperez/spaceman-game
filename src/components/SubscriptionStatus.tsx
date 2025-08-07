import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Crown, Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  cancel_at_period_end: boolean;
}

export const SubscriptionStatus: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setError(null);
        
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
          setError('Failed to load subscription data');
        } else {
          setSubscription(data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <span className="text-white/70">{error}</span>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Crown size={20} className="text-gray-400" />
          <span className="text-white/70">No active subscription</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'trialing':
        return 'text-blue-400';
      case 'past_due':
        return 'text-yellow-400';
      case 'canceled':
        return 'text-red-400';
      case 'unpaid':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Unpaid';
      default:
        return status;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Crown size={20} className="text-yellow-400" />
          <span className="text-white font-medium">Subscription</span>
        </div>
        <span className={`text-sm font-medium ${getStatusColor(subscription.subscription_status)}`}>
          {getStatusText(subscription.subscription_status)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {subscription.current_period_end && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white/70">
              <Calendar size={16} />
              <span>Next billing:</span>
            </div>
            <span className="text-white">{formatDate(subscription.current_period_end)}</span>
          </div>
        )}

        {subscription.payment_method_brand && subscription.payment_method_last4 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white/70">
              <CreditCard size={16} />
              <span>Payment method:</span>
            </div>
            <span className="text-white capitalize">
              {subscription.payment_method_brand} •••• {subscription.payment_method_last4}
            </span>
          </div>
        )}

        {subscription.cancel_at_period_end && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <AlertCircle size={16} />
            <span className="text-sm">Will cancel at period end</span>
          </div>
        )}
      </div>
    </div>
  );
};