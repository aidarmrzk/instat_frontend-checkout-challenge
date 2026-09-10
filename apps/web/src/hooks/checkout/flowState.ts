import type { Payment } from '@checkout/contracts';
import type { DeliveryForm } from '../../domain/types';

export const isTerminal = (payment: Payment | null): boolean => {
  if (!payment) return false;
  return (
    payment.status === 'succeeded' || payment.status === 'failed' || payment.status === 'cancelled'
  );
};

export const isQuoteExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
};

export const canRequestQuote = (delivery: DeliveryForm): boolean => {
  if (delivery.method === 'pickup') {
    return delivery.pickupPointId.trim().length > 0;
  }

  return (
    delivery.address.city.trim().length > 0 &&
    delivery.address.street.trim().length > 0 &&
    delivery.address.house.trim().length > 0
  );
};
