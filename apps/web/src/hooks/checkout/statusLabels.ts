import type { Payment } from '@checkout/contracts';
import type { Order } from '../../domain/types';

export const toPaymentStatusLabel = (status: Payment['status']): string => {
  if (status === 'pending') {
    return 'Ожидает выбора тестовой карты';
  }

  if (status === 'processing') {
    return 'Платеж обрабатывается';
  }

  if (status === 'succeeded') {
    return 'Оплачен';
  }

  if (status === 'failed') {
    return 'Оплата отклонена';
  }

  return 'Оплата отменена';
};

export const toOrderStatusLabel = (order: Order): string => {
  if (order.paymentMethod === 'cash_on_delivery' && order.status === 'confirmed') {
    return 'Подтвержден, оплата при получении';
  }

  if (order.status === 'awaiting_payment') {
    return 'Ожидает оплаты';
  }

  if (order.status === 'paid') {
    return 'Оплачен';
  }

  return 'Подтвержден';
};
