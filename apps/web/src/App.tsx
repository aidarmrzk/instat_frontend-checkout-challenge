import { AppHeader } from './components/AppHeader';
import { CartModal } from './components/CartModal';
import { CatalogSection } from './components/CatalogSection';
import { CheckoutModal } from './components/CheckoutModal';
import { HistoryModal } from './components/HistoryModal';
import { OrderModal } from './components/OrderModal';
import { toOrderStatusLabel, toPaymentStatusLabel, useCheckoutApp } from './hooks/useCheckoutApp';

export function App() {
  const app = useCheckoutApp();

  if (app.isBootstrapping) {
    return (
      <main className="min-h-screen bg-stone-100 p-4 text-stone-900 sm:p-8">
        <p className="mx-auto max-w-5xl rounded-2xl border border-stone-200 bg-white p-4 text-sm">
          Загрузка магазина...
        </p>
      </main>
    );
  }

  if (app.loadError) {
    return (
      <main className="min-h-screen bg-stone-100 p-4 text-stone-900 sm:p-8">
        <p className="mx-auto max-w-5xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Не удалось загрузить данные: {app.loadError}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_5%,rgba(251,191,36,0.28),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(20,184,166,0.24),transparent_42%),linear-gradient(140deg,#fafaf9_0%,#fff7ed_100%)] p-4 text-stone-900 sm:p-8">
      <div className="mx-auto grid max-w-6xl gap-4">
        <AppHeader
          quantity={app.cart.quantity}
          subtotal={app.cart.subtotal}
          onOpenCart={app.openCartModal}
          onOpenHistory={app.openHistoryModal}
        />

        {app.actionError && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {app.actionError}
          </p>
        )}
        {app.historyError && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Не удалось загрузить историю: {app.historyError}
          </p>
        )}

        <CatalogSection
          products={app.products}
          cartItemsByProductId={app.cartItemsByProductId}
          isMutatingCart={app.isMutatingCart}
          onUpdateQuantity={(productId, quantity) => void app.updateQuantity(productId, quantity)}
          onRemoveItem={(productId) => void app.removeItem(productId)}
        />
      </div>

      <CartModal
        open={app.isCartModalOpen}
        onClose={() => app.setIsCartModalOpen(false)}
        cart={app.cart}
        productsById={app.productsById}
        isMutatingCart={app.isMutatingCart}
        onUpdateQuantity={(productId, quantity) => void app.updateQuantity(productId, quantity)}
        onRemoveItem={(productId) => void app.removeItem(productId)}
        onProceedToCheckout={app.openCheckoutFromCart}
      />

      <CheckoutModal
        open={app.isCheckoutModalOpen}
        onClose={() => app.setIsCheckoutModalOpen(false)}
        customer={app.customer}
        setCustomer={app.setCustomer}
        delivery={app.delivery}
        setDelivery={app.setDelivery}
        paymentMethod={app.paymentMethod}
        setPaymentMethod={app.setPaymentMethod}
        fieldErrors={app.fieldErrors}
        clearFieldError={app.clearFieldError}
        resetQuoteState={app.resetQuoteState}
        options={app.options}
        cart={app.cart}
        quote={app.quote}
        quoteId={app.quoteId}
        quoteExpiresAt={app.quoteExpiresAt}
        isQuoting={app.isQuoting}
        isSubmittingOrder={app.isSubmittingOrder}
        onSubmit={() => void app.submitCheckout()}
      />

      <HistoryModal
        open={app.isHistoryModalOpen}
        onClose={() => app.setIsHistoryModalOpen(false)}
        isHistoryLoading={app.isHistoryLoading}
        orderHistory={app.orderHistory}
        onRefresh={() => void app.loadOrderHistory()}
        onOpenOrder={(orderId) => void app.openOrderDetails(orderId)}
        toOrderStatusLabel={toOrderStatusLabel}
      />

      <OrderModal
        open={app.isOrderModalOpen}
        onClose={() => app.setIsOrderModalOpen(false)}
        order={app.order}
        payment={app.payment}
        sandbox={app.sandbox}
        isProcessingPayment={app.isProcessingPayment}
        isRunningPayment={app.isRunningPayment}
        isCreatingPayment={app.isCreatingPayment}
        onStartPaymentScenario={(scenario) => void app.startPaymentScenario(scenario)}
        onRetryPaymentAttempt={() => void app.retryPaymentAttempt()}
        toOrderStatusLabel={toOrderStatusLabel}
        toPaymentStatusLabel={toPaymentStatusLabel}
      />
    </main>
  );
}
