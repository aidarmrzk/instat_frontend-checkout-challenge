import type { Dispatch, SetStateAction } from 'react';
import { formatRub } from '../domain/format';
import type { Cart, CheckoutOptions, Customer, DeliveryForm, Quote } from '../domain/types';
import { RouteModal } from './RouteModal';

type CheckoutModalProps = {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  setCustomer: Dispatch<SetStateAction<Customer>>;
  delivery: DeliveryForm;
  setDelivery: Dispatch<SetStateAction<DeliveryForm>>;
  paymentMethod: 'card' | 'cash_on_delivery';
  setPaymentMethod: Dispatch<SetStateAction<'card' | 'cash_on_delivery'>>;
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
  resetQuoteState: () => void;
  options: CheckoutOptions | null;
  cart: Cart;
  quote: Quote | null;
  quoteId: string | null;
  quoteExpiresAt: string | null;
  isQuoting: boolean;
  isSubmittingOrder: boolean;
  onSubmit: () => void;
};

const fieldClass = () => {
  return 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200';
};

export function CheckoutModal({
  open,
  onClose,
  customer,
  setCustomer,
  delivery,
  setDelivery,
  paymentMethod,
  setPaymentMethod,
  fieldErrors,
  clearFieldError,
  resetQuoteState,
  options,
  cart,
  quote,
  quoteId,
  quoteExpiresAt,
  isQuoting,
  isSubmittingOrder,
  onSubmit,
}: CheckoutModalProps) {
  return (
    <RouteModal
      open={open}
      onClose={onClose}
      ariaLabel="Оформление заказа"
      maxWidthClass="max-w-4xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-['Prata'] text-2xl">Оформление заказа</h2>
        <button
          type="button"
          className="cursor-pointer rounded-xl border border-stone-300 px-3 py-2 text-sm disabled:cursor-not-allowed"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <label>
          <span className="mb-1 block text-sm font-medium">Имя</span>
          <input
            className={fieldClass()}
            value={customer.name}
            onChange={(event) => {
              setCustomer((current: Customer) => ({ ...current, name: event.target.value }));
              clearFieldError('name');
            }}
          />
          {fieldErrors.name && (
            <span className="mt-1 block text-sm text-rose-600">{fieldErrors.name}</span>
          )}
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            className={fieldClass()}
            value={customer.email}
            onChange={(event) => {
              setCustomer((current: Customer) => ({ ...current, email: event.target.value }));
              clearFieldError('email');
            }}
          />
          {fieldErrors.email && (
            <span className="mt-1 block text-sm text-rose-600">{fieldErrors.email}</span>
          )}
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium">Телефон</span>
          <input
            className={fieldClass()}
            value={customer.phone}
            onChange={(event) => {
              setCustomer((current: Customer) => ({ ...current, phone: event.target.value }));
              clearFieldError('phone');
            }}
          />
          {fieldErrors.phone && (
            <span className="mt-1 block text-sm text-rose-600">{fieldErrors.phone}</span>
          )}
        </label>

        <fieldset className="rounded-2xl border border-stone-300 p-4">
          <legend className="px-2 text-sm text-stone-500">Доставка</legend>
          <div className="grid gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 p-2">
              <input
                type="radio"
                checked={delivery.method === 'pickup'}
                onChange={() => {
                  setDelivery({ method: 'pickup', pickupPointId: 'point-center' });
                  resetQuoteState();
                }}
              />
              Самовывоз
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 p-2">
              <input
                type="radio"
                checked={delivery.method === 'courier'}
                onChange={() => {
                  setDelivery({
                    method: 'courier',
                    address: { city: '', street: '', house: '', apartment: '' },
                  });
                  resetQuoteState();
                }}
              />
              Курьер
            </label>
          </div>

          {delivery.method === 'pickup' ? (
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium">Пункт выдачи</span>
              <select
                className={fieldClass()}
                value={delivery.pickupPointId}
                onChange={(event) => {
                  setDelivery({ method: 'pickup', pickupPointId: event.target.value });
                  resetQuoteState();
                }}
              >
                {options?.deliveryMethods
                  .find((method) => method.id === 'pickup')
                  ?.pickupPoints.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.title} - {point.address}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-medium">Город</span>
                <input
                  className={fieldClass()}
                  value={delivery.address.city}
                  onChange={(event) => {
                    setDelivery((current) =>
                      current.method === 'courier'
                        ? {
                            ...current,
                            address: { ...current.address, city: event.target.value },
                          }
                        : current,
                    );
                    clearFieldError('city');
                    resetQuoteState();
                  }}
                />
                {fieldErrors.city && (
                  <span className="mt-1 block text-sm text-rose-600">{fieldErrors.city}</span>
                )}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Улица</span>
                <input
                  className={fieldClass()}
                  value={delivery.address.street}
                  onChange={(event) => {
                    setDelivery((current) =>
                      current.method === 'courier'
                        ? {
                            ...current,
                            address: { ...current.address, street: event.target.value },
                          }
                        : current,
                    );
                    clearFieldError('street');
                    resetQuoteState();
                  }}
                />
                {fieldErrors.street && (
                  <span className="mt-1 block text-sm text-rose-600">{fieldErrors.street}</span>
                )}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Дом</span>
                <input
                  className={fieldClass()}
                  value={delivery.address.house}
                  onChange={(event) => {
                    setDelivery((current) =>
                      current.method === 'courier'
                        ? {
                            ...current,
                            address: { ...current.address, house: event.target.value },
                          }
                        : current,
                    );
                    clearFieldError('house');
                    resetQuoteState();
                  }}
                />
                {fieldErrors.house && (
                  <span className="mt-1 block text-sm text-rose-600">{fieldErrors.house}</span>
                )}
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Квартира</span>
                <input
                  className={fieldClass()}
                  value={delivery.address.apartment}
                  onChange={(event) => {
                    setDelivery((current) =>
                      current.method === 'courier'
                        ? {
                            ...current,
                            address: { ...current.address, apartment: event.target.value },
                          }
                        : current,
                    );
                    resetQuoteState();
                  }}
                />
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="rounded-2xl border border-stone-300 p-4">
          <legend className="px-2 text-sm text-stone-500">Оплата</legend>
          <div className="grid gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 p-2">
              <input
                type="radio"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              Картой
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 p-2">
              <input
                type="radio"
                checked={paymentMethod === 'cash_on_delivery'}
                onChange={() => setPaymentMethod('cash_on_delivery')}
              />
              Наличными при получении
            </label>
          </div>
        </fieldset>

        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
          <p className="text-sm text-stone-600">Товары: {formatRub(cart.subtotal)}</p>
          <p className="text-sm text-stone-600">Доставка: {formatRub(quote?.shipping ?? 0)}</p>
          <p className="mt-1 text-base font-bold text-stone-900">
            Итого: {formatRub(quote?.total ?? cart.subtotal)}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {quoteId
              ? `Расчёт активен до: ${new Date(quoteExpiresAt ?? '').toLocaleTimeString()}`
              : isQuoting
                ? 'Считаем актуальную стоимость...'
                : 'Расчёт будет обновлен автоматически.'}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={isSubmittingOrder}
              onClick={onSubmit}
              className="cursor-pointer rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingOrder ? 'Оформляем...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      </div>
    </RouteModal>
  );
}
