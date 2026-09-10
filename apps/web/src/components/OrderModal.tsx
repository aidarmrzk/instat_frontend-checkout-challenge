import { formatRub } from '../domain/format';
import type { Order, Payment, Sandbox, Scenario } from '../domain/types';
import { RouteModal } from './RouteModal';

type OrderModalProps = {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  payment: Payment | null;
  sandbox: Sandbox | null;
  isProcessingPayment: boolean;
  isRunningPayment: boolean;
  isCreatingPayment: boolean;
  onStartPaymentScenario: (scenario: Scenario) => void;
  onRetryPaymentAttempt: () => void;
  toOrderStatusLabel: (order: Order) => string;
  toPaymentStatusLabel: (status: Payment['status']) => string;
};

const describeDelivery = (order: Order): string => {
  if (order.delivery.method === 'pickup') {
    return `Самовывоз: ${order.delivery.pickupPointId}`;
  }

  const { city, street, house, apartment } = order.delivery.address;
  const apartmentPart = apartment ? `, кв. ${apartment}` : '';
  return `Курьер: ${city}, ${street}, ${house}${apartmentPart}`;
};

export function OrderModal({
  open,
  onClose,
  order,
  payment,
  sandbox,
  isProcessingPayment,
  isRunningPayment,
  isCreatingPayment,
  onStartPaymentScenario,
  onRetryPaymentAttempt,
  toOrderStatusLabel,
  toPaymentStatusLabel,
}: OrderModalProps) {
  if (!open || !order) {
    return null;
  }

  const isPaidOrder = order.status === 'paid' && order.paymentStatus === 'succeeded';

  return (
    <RouteModal open={open} onClose={onClose} ariaLabel="Заказ и оплата" maxWidthClass="max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-['Prata'] text-2xl">Заказ {order.number}</h2>
        <button
          type="button"
          className="cursor-pointer rounded-xl border border-stone-300 px-3 py-2 text-sm disabled:cursor-not-allowed"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm text-stone-600">Статус заказа: {toOrderStatusLabel(order)}</p>
        <p className="text-sm text-stone-600">Доставка: {describeDelivery(order)}</p>
        <p className="mt-1 text-lg font-semibold">Сумма: {formatRub(order.total)}</p>
      </div>

      <ul className="mt-4 grid gap-2">
        {order.items.map((item: Order['items'][number]) => (
          <li key={item.productId} className="rounded-2xl border border-stone-200 p-3">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-stone-600">
              {item.quantity} x {formatRub(item.unitPrice)} = {formatRub(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      {order.paymentMethod === 'cash_on_delivery' && (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
          Заказ оформлен, оплата при получении.
        </p>
      )}

      {order.paymentMethod === 'card' && (
        <div className="mt-4 grid gap-3">
          {payment ? (
            <div className="rounded-2xl border border-stone-200 p-3">
              <p className="text-xs text-stone-500">Попытка оплаты</p>
              <p className="text-sm font-medium break-all">{payment.id}</p>
              <p className="mt-1 text-sm text-stone-700">
                Статус: {toPaymentStatusLabel(payment.status)}
              </p>
            </div>
          ) : isPaidOrder ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Оплата подтверждена сервером. Заказ успешно завершен.
            </p>
          ) : (
            <p className="rounded-2xl border border-stone-200 p-3 text-sm text-stone-600">
              Попытка оплаты еще не создана. Нажмите кнопку ниже, чтобы создать ее.
            </p>
          )}

          {isProcessingPayment && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
              Платеж обрабатывается, дождитесь результата...
            </p>
          )}

          {payment?.status === 'pending' && (
            <div className="grid gap-2">
              {sandbox?.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={isRunningPayment}
                  onClick={() => onStartPaymentScenario(card.scenario)}
                  className="cursor-pointer rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Оплатить {card.title} ({card.maskedNumber})
                </button>
              ))}
              <button
                type="button"
                disabled={isRunningPayment}
                onClick={() => onStartPaymentScenario('cancel')}
                className="cursor-pointer rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Отменить оплату
              </button>
            </div>
          )}

          {!isProcessingPayment &&
            payment?.status === 'succeeded' &&
            order.status === 'paid' &&
            order.paymentStatus === 'succeeded' && (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                Оплата подтверждена сервером. Заказ успешно завершен.
              </p>
            )}

          {!isProcessingPayment && payment?.status === 'failed' && (
            <>
              <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                Карта отклонена. Можно повторить оплату этого же заказа.
              </p>
              <button
                type="button"
                disabled={isCreatingPayment}
                onClick={onRetryPaymentAttempt}
                className="cursor-pointer rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingPayment ? 'Создаем новую попытку...' : 'Повторить оплату'}
              </button>
            </>
          )}

          {!isProcessingPayment && payment?.status === 'cancelled' && (
            <>
              <p className="rounded-2xl border border-stone-300 bg-stone-100 p-3 text-stone-700">
                Оплата отменена. Можно запустить новую попытку.
              </p>
              <button
                type="button"
                disabled={isCreatingPayment}
                onClick={onRetryPaymentAttempt}
                className="cursor-pointer rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingPayment ? 'Создаем новую попытку...' : 'Запустить новую попытку'}
              </button>
            </>
          )}

          {!payment && order.paymentStatus !== 'succeeded' && (
            <button
              type="button"
              disabled={isCreatingPayment}
              onClick={onRetryPaymentAttempt}
              className="cursor-pointer rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingPayment ? 'Создаем попытку...' : 'Создать попытку оплаты'}
            </button>
          )}
        </div>
      )}
    </RouteModal>
  );
}
