import { formatRub } from '../domain/format';
import type { Order } from '../domain/types';
import { RouteModal } from './RouteModal';

type HistoryModalProps = {
  open: boolean;
  onClose: () => void;
  isHistoryLoading: boolean;
  orderHistory: Order[];
  onRefresh: () => void;
  onOpenOrder: (orderId: string) => void;
  toOrderStatusLabel: (order: Order) => string;
};

export function HistoryModal({
  open,
  onClose,
  isHistoryLoading,
  orderHistory,
  onRefresh,
  onOpenOrder,
  toOrderStatusLabel,
}: HistoryModalProps) {
  return (
    <RouteModal open={open} onClose={onClose} ariaLabel="История заказов" maxWidthClass="max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-['Prata'] text-2xl">История заказов</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isHistoryLoading}
            className="cursor-pointer rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isHistoryLoading ? 'Обновляем...' : 'Обновить'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-stone-300 px-3 py-2 text-sm disabled:cursor-not-allowed"
          >
            Закрыть
          </button>
        </div>
      </div>

      {isHistoryLoading && orderHistory.length === 0 && (
        <p className="mt-3 text-sm text-stone-600">Загружаем историю заказов...</p>
      )}
      {!isHistoryLoading && orderHistory.length === 0 && (
        <p className="mt-3 text-sm text-stone-600">Заказов пока нет.</p>
      )}

      {orderHistory.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {orderHistory.map((historyOrder) => (
            <li
              key={historyOrder.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 p-3 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold">Заказ {historyOrder.number}</p>
                <p className="text-sm text-stone-600">
                  Статус заказа: {toOrderStatusLabel(historyOrder)}
                </p>
                <p className="text-sm text-stone-600">{formatRub(historyOrder.total)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenOrder(historyOrder.id)}
                  className="cursor-pointer rounded-xl bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed"
                >
                  Открыть заказ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </RouteModal>
  );
}
