import type { Customer } from '@checkout/contracts';
import type { Cart, DeliveryForm } from '../../domain/types';

export const EMPTY_CART: Cart = {
  id: '',
  version: 0,
  items: [],
  quantity: 0,
  subtotal: 0,
  currency: 'RUB',
};

export const INITIAL_CUSTOMER: Customer = {
  name: '',
  email: '',
  phone: '',
};

export const INITIAL_DELIVERY: DeliveryForm = {
  method: 'pickup',
  pickupPointId: 'point-center',
};
