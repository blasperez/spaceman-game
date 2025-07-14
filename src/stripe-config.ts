export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  amount: number; // Amount in pesos
  coins: number;  // Coins to add to game
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_50_coins', // You'll need to create these in Stripe Dashboard
    name: '50 Monedas',
    description: 'Compra 50 monedas para el juego',
    mode: 'payment',
    amount: 50,
    coins: 50
  },
  {
    priceId: 'price_100_coins',
    name: '100 Monedas',
    description: 'Compra 100 monedas para el juego',
    mode: 'payment',
    amount: 100,
    coins: 100
  },
  {
    priceId: 'price_200_coins',
    name: '200 Monedas',
    description: 'Compra 200 monedas para el juego',
    mode: 'payment',
    amount: 200,
    coins: 200
  }
];