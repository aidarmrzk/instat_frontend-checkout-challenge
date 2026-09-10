import { formatRub } from '../domain/format';
import type { Cart, Product } from '../domain/types';

type CatalogSectionProps = {
  products: Product[];
  cartItemsByProductId: Map<string, Cart['items'][number]>;
  isMutatingCart: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

const cardClass = () => {
  return 'rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_16px_40px_-28px_rgba(20,20,20,0.55)]';
};

export function CatalogSection({
  products,
  cartItemsByProductId,
  isMutatingCart,
  onUpdateQuantity,
  onRemoveItem,
}: CatalogSectionProps) {
  return (
    <section className={cardClass()}>
      <h2 className="font-['Prata'] text-2xl">Каталог</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const inCart = cartItemsByProductId.get(product.id);
          const unavailable = product.stock <= 0;

          return (
            <article
              key={product.id}
              className="flex h-full flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-4"
            >
              <h3 className="font-['Prata'] text-lg leading-tight">{product.title}</h3>
              <p className="text-sm text-stone-600">{product.description}</p>
              <p className="mt-auto text-base font-bold text-stone-900">
                {formatRub(product.price)}
              </p>
              <p className="text-xs text-stone-500">Остаток: {product.stock}</p>

              {!inCart ? (
                <button
                  type="button"
                  disabled={unavailable || isMutatingCart}
                  onClick={() => onUpdateQuantity(product.id, 1)}
                  className="cursor-pointer rounded-xl bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unavailable ? 'Нет в наличии' : 'Добавить в корзину'}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isMutatingCart || inCart.quantity <= 1}
                    onClick={() => onUpdateQuantity(product.id, inCart.quantity - 1)}
                    className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="min-w-7 text-center text-sm font-bold">{inCart.quantity}</span>
                  <button
                    type="button"
                    disabled={isMutatingCart || inCart.quantity >= product.stock}
                    onClick={() => onUpdateQuantity(product.id, inCart.quantity + 1)}
                    className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={isMutatingCart}
                    onClick={() => onRemoveItem(product.id)}
                    className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
