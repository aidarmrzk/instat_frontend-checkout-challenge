import type { AppError } from '../../api/errors';

export const toUserMessage = (error: AppError): string => {
  if (error.code === 'CART_VERSION_CONFLICT') {
    return 'Корзина изменилась. Мы обновили данные, проверьте заказ и повторите действие.';
  }

  if (error.code === 'QUOTE_EXPIRED') {
    return 'Расчёт устарел. Обновите расчёт и повторите оформление.';
  }

  if (error.code === 'PAYMENT_IN_PROGRESS') {
    return 'Для этого заказа уже есть активная попытка оплаты. Дождитесь результата.';
  }

  return error.message;
};
