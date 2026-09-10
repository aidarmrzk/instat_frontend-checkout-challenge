import { useEffect, useMemo, useRef, useState } from 'react';
import type { CreateOrder, Customer, Payment } from '@checkout/contracts';
import {
  cartService,
  catalogService,
  checkoutService,
  orderService,
  paymentService,
  sessionService,
} from '../domain/services';
import {
  clearDraft,
  clearSnapshot,
  readDraft,
  readSnapshot,
  saveDraft,
  saveSnapshot,
} from '../domain/storage';
import type {
  Cart,
  CheckoutOptions,
  DeliveryForm,
  Order,
  Product,
  Quote,
  Sandbox,
} from '../domain/types';
import { EMPTY_CART, INITIAL_CUSTOMER, INITIAL_DELIVERY } from './checkout/defaults';
import { canRequestQuote, isQuoteExpired, isTerminal } from './checkout/flowState';
import { validateCheckoutForm, type FieldErrors } from './checkout/formValidation';
import { toProductIdMap, toProductsMap } from './checkout/maps';
import { runAsyncAction } from './checkout/asyncAction';
import {
  isCheckoutUnauthorized,
  isCheckoutUnauthorizedOrNotFound,
  resolveCheckoutError,
  toCheckoutErrorMessage,
} from './checkout/errorHandling';
import { toOrderStatusLabel, toPaymentStatusLabel } from './checkout/statusLabels';
import { useModalState } from './checkout/useModalState';
import { usePaymentFlow } from './checkout/usePaymentFlow';

export { toOrderStatusLabel, toPaymentStatusLabel };
export type { FieldErrors };

export const useCheckoutApp = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);

  const [customer, setCustomer] = useState<Customer>(INITIAL_CUSTOMER);
  const [delivery, setDelivery] = useState<DeliveryForm>(INITIAL_DELIVERY);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash_on_delivery'>('card');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteExpiresAt, setQuoteExpiresAt] = useState<string | null>(null);
  const [quoteContextKey, setQuoteContextKey] = useState<string | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [isMutatingCart, setIsMutatingCart] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const canPersistDraftRef = useRef(false);
  const quoteRequestSeqRef = useRef(0);
  const latestQuoteContextKeyRef = useRef<string>('');
  const modal = useModalState();

  const isProcessingPayment = useMemo(() => payment?.status === 'processing', [payment]);
  const cartItemsByProductId = useMemo(() => toProductIdMap(cart.items), [cart.items]);
  const productsById = useMemo(() => toProductsMap(products), [products]);
  const currentQuoteContextKey = useMemo(
    () => JSON.stringify({ cartVersion: cart.version, delivery }),
    [cart.version, delivery],
  );

  useEffect(() => {
    latestQuoteContextKeyRef.current = currentQuoteContextKey;
  }, [currentQuoteContextKey]);

  useEffect(() => {
    if (!canPersistDraftRef.current || isBootstrapping) {
      return;
    }

    saveDraft({ customer, delivery, paymentMethod });
  }, [customer, delivery, paymentMethod, isBootstrapping]);

  useEffect(() => {
    if (!token || !sessionId) return;
    saveSnapshot({
      token,
      sessionId,
      orderId: order?.id ?? null,
      paymentId: payment?.id ?? null,
    });
  }, [token, sessionId, order?.id, payment?.id]);

  useEffect(() => {
    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError(null);

      try {
        const snapshot = readSnapshot();
        const draft = readDraft();

        if (draft) {
          setCustomer(draft.customer);
          setDelivery(draft.delivery);
          setPaymentMethod(draft.paymentMethod);
        }

        let currentToken = snapshot?.token ?? null;
        let currentSessionId = snapshot?.sessionId ?? null;
        let shouldRestoreOrder = Boolean(snapshot?.orderId);

        if (currentToken && currentSessionId) {
          sessionService.setToken(currentToken);
        } else {
          const session = await sessionService.createSession();
          currentToken = session.token;
          currentSessionId = session.id;
          shouldRestoreOrder = false;
        }

        const loadBaseData = () =>
          Promise.all([
            catalogService.getProducts(),
            cartService.getCart(),
            checkoutService.getCheckoutOptions(),
            catalogService.getSandbox(),
          ]);

        let baseData: Awaited<ReturnType<typeof loadBaseData>>;
        try {
          baseData = await loadBaseData();
        } catch (error) {
          if (snapshot && isCheckoutUnauthorized(error)) {
            clearSnapshot();
            const session = await sessionService.createSession();
            currentToken = session.token;
            currentSessionId = session.id;
            shouldRestoreOrder = false;
            baseData = await loadBaseData();
          } else {
            throw error;
          }
        }

        const [productsData, cartData, optionsData, sandboxData] = baseData;

        setToken(currentToken);
        setSessionId(currentSessionId);
        setProducts(productsData);
        setCart(cartData);
        setOptions(optionsData);
        setSandbox(sandboxData);

        if (shouldRestoreOrder && snapshot?.orderId) {
          try {
            const restoredOrder = await orderService.getOrder(snapshot.orderId);
            setOrder(restoredOrder);

            if (restoredOrder.paymentMethod === 'card') {
              const paymentToRestore = await restoreCardPayment(restoredOrder, snapshot.paymentId);
              setPayment(paymentToRestore);
            } else {
              setPayment(null);
            }
          } catch (error) {
            if (isCheckoutUnauthorizedOrNotFound(error)) {
              setOrder(null);
              setPayment(null);
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        setLoadError(toCheckoutErrorMessage(error));
      } finally {
        canPersistDraftRef.current = true;
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!modal.isHistoryModalOpen) {
      return;
    }

    if (orderHistory.length > 0 || isHistoryLoading) {
      return;
    }

    void loadOrderHistory();
  }, [modal.isHistoryModalOpen, orderHistory.length, isHistoryLoading]);

  useEffect(() => {
    if (!modal.isCheckoutModalOpen || cart.items.length === 0) {
      return;
    }

    if (!canRequestQuote(delivery)) {
      return;
    }

    if (isQuoting || isSubmittingOrder) {
      return;
    }

    if (quote && quoteId && quoteExpiresAt && !isQuoteExpired(quoteExpiresAt)) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void recalculateQuote();
    }, 350);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    modal.isCheckoutModalOpen,
    cart.items.length,
    cart.version,
    delivery,
    quote,
    quoteId,
    quoteExpiresAt,
    isQuoting,
    isSubmittingOrder,
  ]);

  const refreshCartAndOptions = async () => {
    const [nextCart, nextOptions] = await Promise.all([
      cartService.getCart(),
      checkoutService.getCheckoutOptions(),
    ]);
    setCart(nextCart);
    setOptions(nextOptions);
  };

  const setActionErrorFromAppError = (error: unknown) => {
    setActionError(toCheckoutErrorMessage(error));
  };

  const applyCheckoutError = async (
    error: unknown,
    options: { includeFieldErrors?: boolean; recoverQuoteState?: boolean } = {},
  ) => {
    const resolved = resolveCheckoutError(error);

    if (options.includeFieldErrors) {
      setFieldErrors(resolved.fieldErrors);
    }

    if (options.recoverQuoteState && resolved.shouldRecoverQuoteState) {
      resetQuoteState();
      await refreshCartAndOptions();
    }

    setActionError(resolved.message);
  };

  const restoreCardPayment = async (
    orderToRestore: Order,
    paymentId: string | null,
  ): Promise<Payment | null> => {
    if (paymentId) {
      return paymentService.getPayment(paymentId);
    }

    const attempts = await paymentService.listOrderPayments(orderToRestore.id);
    return attempts[0] ?? null;
  };

  const loadOrderHistory = async () => {
    await runAsyncAction({
      execute: () => orderService.getOrders(),
      setLoading: setIsHistoryLoading,
      clearError: () => setHistoryError(null),
      onSuccess: (orders) => {
        setOrderHistory(orders);
      },
      onError: (appError) => {
        setHistoryError(toCheckoutErrorMessage(appError));
      },
    });
  };

  const openOrderDetails = async (orderId: string) => {
    await runAsyncAction({
      execute: () => orderService.getOrder(orderId),
      clearError: () => setActionError(null),
      onSuccess: async (nextOrder) => {
        setOrder(nextOrder);

        if (nextOrder.paymentMethod === 'card') {
          setPayment(await restoreCardPayment(nextOrder, null));
        } else {
          setPayment(null);
        }

        modal.openModal('order');
      },
      onError: setActionErrorFromAppError,
    });
  };

  const resetQuoteState = () => {
    setQuote(null);
    setQuoteId(null);
    setQuoteExpiresAt(null);
    setQuoteContextKey(null);
  };

  const clearFieldError = (key: string): void => {
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const runCartMutation = async (execute: () => Promise<Cart>) => {
    await runAsyncAction({
      execute,
      setLoading: setIsMutatingCart,
      clearError: () => setActionError(null),
      onSuccess: async (nextCart) => {
        setCart(nextCart);
        resetQuoteState();
        setOptions(await checkoutService.getCheckoutOptions());
      },
      onError: setActionErrorFromAppError,
    });
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;

    await runCartMutation(() => cartService.setItemQuantity(productId, quantity));
  };

  const removeItem = async (productId: string) => {
    await runCartMutation(() => cartService.removeItem(productId));
  };

  const ensureQuote = async (): Promise<string> => {
    const contextKey = currentQuoteContextKey;
    if (
      quote &&
      quoteId &&
      quoteExpiresAt &&
      quoteContextKey === contextKey &&
      !isQuoteExpired(quoteExpiresAt)
    ) {
      return quoteId;
    }

    const deliverySnapshot = delivery;
    const cartVersionSnapshot = cart.version;
    const nextQuote = await checkoutService.createQuote(cartVersionSnapshot, deliverySnapshot);

    if (contextKey !== latestQuoteContextKeyRef.current) {
      throw new Error('Quote context changed while calculating. Please retry.');
    }

    setQuote(nextQuote);
    setQuoteId(nextQuote.id);
    setQuoteExpiresAt(nextQuote.expiresAt);
    setQuoteContextKey(contextKey);
    return nextQuote.id;
  };

  const recalculateQuote = async () => {
    if (cart.items.length === 0) {
      setActionError('Корзина пуста. Добавьте товары перед расчётом.');
      return;
    }

    if (!canRequestQuote(delivery)) {
      return;
    }

    const requestSeq = ++quoteRequestSeqRef.current;
    const contextKey = currentQuoteContextKey;
    const deliverySnapshot = delivery;
    const cartVersionSnapshot = cart.version;

    await runAsyncAction({
      execute: () => checkoutService.createQuote(cartVersionSnapshot, deliverySnapshot),
      setLoading: setIsQuoting,
      clearError: () => setActionError(null),
      onSuccess: (nextQuote) => {
        if (
          requestSeq !== quoteRequestSeqRef.current ||
          contextKey !== latestQuoteContextKeyRef.current
        ) {
          return;
        }

        setQuote(nextQuote);
        setQuoteId(nextQuote.id);
        setQuoteExpiresAt(nextQuote.expiresAt);
        setQuoteContextKey(contextKey);
      },
      onError: async (appError) => {
        await applyCheckoutError(appError, { recoverQuoteState: true });
      },
    });
  };

  const validateForm = (): boolean => {
    const nextErrors = validateCheckoutForm(customer, delivery);
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitCheckout = async () => {
    if (cart.items.length === 0) {
      setActionError('Корзина пуста. Добавьте товары перед оформлением.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    await runAsyncAction({
      execute: async () => {
        const preparedQuoteId = await ensureQuote();
        const createOrderBody: CreateOrder = {
          quoteId: preparedQuoteId,
          customer,
          paymentMethod,
        };

        const nextOrder = await orderService.createOrder(createOrderBody);
        setOrder(nextOrder);
        clearDraft();
        await refreshCartAndOptions();

        if (modal.isHistoryModalOpen) {
          await loadOrderHistory();
        }

        if (nextOrder.paymentMethod === 'cash_on_delivery') {
          setPayment(null);
        } else {
          setPayment(await paymentService.createPayment(nextOrder.id));
        }

        modal.openModal('order');
      },
      setLoading: setIsSubmittingOrder,
      clearError: () => setActionError(null),
      onError: async (appError) => {
        await applyCheckoutError(appError, {
          includeFieldErrors: true,
          recoverQuoteState: true,
        });
      },
    });
  };

  const paymentFlow = usePaymentFlow({
    order,
    payment,
    setOrder,
    setPayment,
    setActionError,
    isHistoryModalOpen: modal.isHistoryModalOpen,
    loadOrderHistory,
  });

  return {
    isBootstrapping,
    loadError,
    actionError,
    historyError,
    products,
    cart,
    options,
    sandbox,
    customer,
    delivery,
    paymentMethod,
    fieldErrors,
    quote,
    quoteId,
    quoteExpiresAt,
    order,
    payment,
    orderHistory,
    isMutatingCart,
    isQuoting,
    isSubmittingOrder,
    isCreatingPayment: paymentFlow.isCreatingPayment,
    isRunningPayment: paymentFlow.isRunningPayment,
    isProcessingPayment,
    isCartModalOpen: modal.isCartModalOpen,
    isCheckoutModalOpen: modal.isCheckoutModalOpen,
    isOrderModalOpen: modal.isOrderModalOpen,
    isHistoryModalOpen: modal.isHistoryModalOpen,
    isHistoryLoading,
    cartItemsByProductId,
    productsById,
    setCustomer,
    setDelivery,
    setPaymentMethod,
    setIsCartModalOpen: modal.setIsCartModalOpen,
    setIsCheckoutModalOpen: modal.setIsCheckoutModalOpen,
    setIsOrderModalOpen: modal.setIsOrderModalOpen,
    setIsHistoryModalOpen: modal.setIsHistoryModalOpen,
    clearFieldError,
    resetQuoteState,
    updateQuantity,
    removeItem,
    submitCheckout,
    loadOrderHistory,
    openOrderDetails,
    startPaymentScenario: paymentFlow.startPaymentScenario,
    retryPaymentAttempt: paymentFlow.retryPaymentAttempt,
    openCartModal: modal.openCartModal,
    openHistoryModal: modal.openHistoryModal,
    openCheckoutFromCart: modal.openCheckoutFromCart,
  };
};
