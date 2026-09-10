import type {
  Cart,
  Customer,
  Delivery,
  Order,
  Payment,
  Product,
  Quote,
  Scenario,
} from '@checkout/contracts';

export type CheckoutOptionDeliveryMethod = {
  id: 'pickup' | 'courier';
  title: string;
  price: number;
  freeFrom: number | null;
  pickupPoints: Array<{ id: string; title: string; address: string }>;
};

export type CheckoutOptionPaymentMethod = {
  id: 'card' | 'cash_on_delivery';
  title: string;
};

export type CheckoutOptions = {
  cart: Cart;
  deliveryMethods: CheckoutOptionDeliveryMethod[];
  paymentMethods: CheckoutOptionPaymentMethod[];
};

export type SandboxCard = {
  id: string;
  title: string;
  maskedNumber: string;
  scenario: Extract<Scenario, 'success' | 'decline'>;
};

export type Sandbox = {
  settlementDelayMs: number;
  cards: SandboxCard[];
};

export type Session = {
  id: string;
  token: string;
  cart: Cart;
};

export type DeliveryForm =
  | { method: 'pickup'; pickupPointId: string }
  | {
      method: 'courier';
      address: { city: string; street: string; house: string; apartment: string };
    };

export type CheckoutDraft = {
  customer: Customer;
  delivery: DeliveryForm;
  paymentMethod: 'card' | 'cash_on_delivery';
};

export type AppSnapshot = {
  token: string;
  sessionId: string;
  orderId: string | null;
  paymentId: string | null;
};

export type { Cart, Customer, Delivery, Order, Payment, Product, Quote, Scenario };
