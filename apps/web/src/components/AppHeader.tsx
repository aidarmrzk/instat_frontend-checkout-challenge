import { formatRub } from '../domain/format';

type AppHeaderProps = {
  quantity: number;
  subtotal: number;
  onOpenCart: () => void;
  onOpenHistory: () => void;
};

export function AppHeader({ quantity, subtotal, onOpenCart, onOpenHistory }: AppHeaderProps) {
  return (
    <header className="rounded-3xl bg-linear-to-br from-teal-700 via-teal-600 to-emerald-500 p-6 text-white shadow-[0_20px_60px_-30px_rgba(15,118,110,0.9)]">
      <p className="text-xs uppercase tracking-[0.2em] text-white/80">Учебный магазин</p>
      <h1 className="mt-2 font-['Prata'] text-3xl leading-tight sm:text-4xl">Checkout Challenge</h1>
      <p className="mt-3 max-w-2xl text-white/90">
        Тестовый стенд для оформления заказа: корзина, расчёт, оплата и повтор попытки.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-left text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed"
          onClick={onOpenCart}
        >
          Корзина
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
            {quantity} шт. / {formatRub(subtotal)}
          </span>
        </button>

        <button
          type="button"
          className="cursor-pointer rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed"
          onClick={onOpenHistory}
        >
          История заказов
        </button>
      </div>
    </header>
  );
}
