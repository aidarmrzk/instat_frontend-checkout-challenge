import { formatRub } from '../domain/format';
import type { Cart, Product } from '../domain/types';
import { RouteModal } from './RouteModal';

type CartModalProps = {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  productsById: Map<string, Product>;
  isMutatingCart: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
};

export function CartModal({
  open,
  onClose,
  cart,
  productsById,
  isMutatingCart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartModalProps) {
  return (
    <RouteModal open={open} onClose={onClose} ariaLabel="Корзина" maxWidthClass="max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-['Prata'] text-2xl">Корзина</h2>
        <button
          type="button"
          className="cursor-pointer rounded-xl border border-stone-300 px-3 py-2 text-sm disabled:cursor-not-allowed"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>

      {cart.items.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">Корзина пустая.</p>
      ) : (
        <>
          <ul className="mt-4 grid gap-2">
            {cart.items.map((item: Cart['items'][number]) => {
              const product = productsById.get(item.productId);
              const reachedStock = Boolean(product && item.quantity >= product.stock);

              return (
                <li
                  key={item.productId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 p-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-stone-600">
                      {item.quantity} x {formatRub(item.unitPrice)} = {formatRub(item.lineTotal)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isMutatingCart || item.quantity <= 1}
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="cursor-pointer rounded-lg border border-stone-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      disabled={isMutatingCart || reachedStock}
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="cursor-pointer rounded-lg border border-stone-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      disabled={isMutatingCart}
                      onClick={() => onRemoveItem(item.productId)}
                      className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-600">Товаров: {cart.quantity} шт.</p>
            <p className="mt-1 text-lg font-semibold">Итого: {formatRub(cart.subtotal)}</p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={cart.items.length === 0}
                onClick={onProceedToCheckout}
                className="cursor-pointer rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Перейти к оформлению
              </button>
            </div>
          </div>
        </>
      )}
    </RouteModal>
  );
}
