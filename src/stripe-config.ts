export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment';
  amount: number; // Amount in Mexican Pesos (MXN)
  coins: number;  // Coins to add to game (1 MXN = 1 coin)
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_mxn_50', // Replace with your actual Price ID from Stripe
    name: '50 Monedas',
    description: 'Compra 50 monedas para el juego',
    mode: 'payment',
    amount: 50,
    coins: 50
  },
  {
    priceId: 'price_mxn_100', // Replace with your actual Price ID from Stripe
    name: '100 Monedas',
    description: 'Compra 100 monedas para el juego',
    mode: 'payment',
    amount: 100,
    coins: 100
  },
  {
    priceId: 'price_mxn_200', // Replace with your actual Price ID from Stripe
    name: '200 Monedas',
    description: 'Compra 200 monedas para el juego',
    mode: 'payment',
    amount: 200,
    coins: 200
  },
  {
    priceId: 'price_mxn_500', // Replace with your actual Price ID from Stripe
    name: '500 Monedas',
    description: 'Compra 500 monedas para el juego',
    mode: 'payment',
    amount: 500,
    coins: 500
  }
];
