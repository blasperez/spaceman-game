export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RkbL4CFvIaqd1lHzfCilh6o',
    name: 'Space man money',
    description: 'Get space money to play the Spaceman game',
    mode: 'payment'
  }
];