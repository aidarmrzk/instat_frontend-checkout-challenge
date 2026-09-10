import type { CreateOrder, Delivery, Payment, Scenario } from '@checkout/contracts';
import { apiRequest, setAuthToken } from '../api/client';
import { clearIdempotencyKey, getIdempotencyKey } from '../api/idempotency';
import type {
  Cart,
  CheckoutOptions,
  DeliveryForm,
  Order,
  Product,
  Quote,
  Sandbox,
  Session,
} from './types';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestParams = {
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
};

const requestData = async <T>(
  method: RequestMethod,
  path: string,
  params?: RequestParams,
): Promise<T> => {
  const response = await apiRequest<T>({
    method,
    path,
    body: params?.body,
    idempotencyKey: params?.idempotencyKey,
    signal: params?.signal,
  });

  return response.data;
};

const TERMINAL_PAYMENT_STATUSES = new Set(['succeeded', 'failed', 'cancelled']);

const waitFor = async (ms: number, signal: AbortSignal): Promise<void> => {
  if (signal.aborted) {
    throw new DOMException('Polling aborted', 'AbortError');
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Polling aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
};

const toDelivery = (deliveryForm: DeliveryForm): Delivery => {
  if (deliveryForm.method === 'pickup') {
    return {
      method: 'pickup',
      pickupPointId: deliveryForm.pickupPointId,
    };
  }

  return {
    method: 'courier',
    address: {
      city: deliveryForm.address.city,
      street: deliveryForm.address.street,
      house: deliveryForm.address.house,
      apartment: deliveryForm.address.apartment || undefined,
    },
  };
};

export const sessionService = {
  createSession: async (): Promise<Session> => {
    const session = await requestData<Session>('POST', '/api/sessions', { body: {} });
    setAuthToken(session.token);
    return session;
  },

  setToken: (token: string): void => {
    setAuthToken(token);
  },
};

export const catalogService = {
  getProducts: async (): Promise<Product[]> => {
    return requestData<Product[]>('GET', '/api/products');
  },

  getSandbox: async (): Promise<Sandbox> => {
    return requestData<Sandbox>('GET', '/api/sandbox');
  },
};

export const cartService = {
  getCart: async (): Promise<Cart> => {
    return requestData<Cart>('GET', '/api/cart');
  },

  setItemQuantity: async (productId: string, quantity: number): Promise<Cart> => {
    await apiRequest({
      method: 'PUT',
      path: `/api/cart/items/${productId}`,
      body: { quantity },
    });
    return cartService.getCart();
  },

  removeItem: async (productId: string): Promise<Cart> => {
    await apiRequest({
      method: 'DELETE',
      path: `/api/cart/items/${productId}`,
    });
    return cartService.getCart();
  },
};

export const checkoutService = {
  getCheckoutOptions: async (): Promise<CheckoutOptions> => {
    return requestData<CheckoutOptions>('GET', '/api/checkout/options');
  },

  createQuote: async (cartVersion: number, deliveryForm: DeliveryForm): Promise<Quote> => {
    return requestData<Quote>('POST', '/api/quotes', {
      body: {
        cartVersion,
        delivery: toDelivery(deliveryForm),
      },
    });
  },
};

export const orderService = {
  createOrder: async (body: CreateOrder): Promise<Order> => {
    const idempotencyKey = getIdempotencyKey('order', body);
    const order = await requestData<Order>('POST', '/api/orders', {
      body,
      idempotencyKey,
    });
    clearIdempotencyKey('order');
    return order;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    return requestData<Order>('GET', `/api/orders/${orderId}`);
  },

  getOrders: async (): Promise<Order[]> => {
    return requestData<Order[]>('GET', '/api/orders');
  },
};

export const paymentService = {
  createPayment: async (orderId: string): Promise<Payment> => {
    const requestBody = {};
    const idempotencyKey = getIdempotencyKey('payment', { orderId });
    const payment = await requestData<Payment>('POST', `/api/orders/${orderId}/payments`, {
      body: requestBody,
      idempotencyKey,
    });
    clearIdempotencyKey('payment');
    return payment;
  },

  listOrderPayments: async (orderId: string): Promise<Payment[]> => {
    return requestData<Payment[]>('GET', `/api/orders/${orderId}/payments`);
  },

  getPayment: async (paymentId: string, signal?: AbortSignal): Promise<Payment> => {
    return requestData<Payment>('GET', `/api/payments/${paymentId}`, { signal });
  },

  startSimulation: async (paymentId: string, scenario: Scenario): Promise<number> => {
    const response = await apiRequest({
      method: 'POST',
      path: `/api/payments/${paymentId}/simulations`,
      body: { scenario },
    });

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : 1;
    return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 1;
  },

  pollPayment: async (
    paymentId: string,
    signal: AbortSignal,
    onStatus: (payment: Payment) => void,
    retryAfterSec = 1,
  ): Promise<Payment> => {
    while (true) {
      const payment = await paymentService.getPayment(paymentId, signal);
      onStatus(payment);

      if (TERMINAL_PAYMENT_STATUSES.has(payment.status)) {
        return payment;
      }

      await waitFor(retryAfterSec * 1000, signal);
    }
  },
};
