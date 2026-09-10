import { useEffect, useRef, useState } from 'react';
import type { Payment, Scenario } from '@checkout/contracts';
import { orderService, paymentService } from '../../domain/services';
import type { Order } from '../../domain/types';
import { runAsyncAction } from './asyncAction';
import { toCheckoutErrorMessage } from './errorHandling';

type UsePaymentFlowParams = {
  order: Order | null;
  payment: Payment | null;
  setOrder: (order: Order | null) => void;
  setPayment: (payment: Payment | null) => void;
  setActionError: (message: string | null) => void;
  isHistoryModalOpen: boolean;
  loadOrderHistory: () => Promise<void>;
};

export const usePaymentFlow = ({
  order,
  payment,
  setOrder,
  setPayment,
  setActionError,
  isHistoryModalOpen,
  loadOrderHistory,
}: UsePaymentFlowParams) => {
  const [isRunningPayment, setIsRunningPayment] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const pollAbortRef = useRef<AbortController | null>(null);
  const pollRunRef = useRef(0);

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!order || !payment) {
      return;
    }

    if (order.paymentMethod !== 'card' || payment.status !== 'processing') {
      return;
    }

    if (isRunningPayment) {
      return;
    }

    const runId = ++pollRunRef.current;
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;

    setIsRunningPayment(true);

    void paymentService
      .pollPayment(
        payment.id,
        controller.signal,
        (nextPayment) => {
          if (runId === pollRunRef.current) {
            setPayment(nextPayment);
          }
        },
        1,
      )
      .then(async (finalPayment) => {
        if (runId !== pollRunRef.current) {
          return;
        }

        setPayment(finalPayment);
        const latestOrder = await orderService.getOrder(order.id);
        if (runId === pollRunRef.current) {
          setOrder(latestOrder);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        if (runId === pollRunRef.current) {
          setActionError(toCheckoutErrorMessage(error));
        }
      })
      .finally(() => {
        if (runId === pollRunRef.current) {
          setIsRunningPayment(false);
        }
      });
  }, [order, payment, isRunningPayment, setActionError, setOrder, setPayment]);

  const startPaymentScenario = async (scenario: Scenario) => {
    if (!payment || !order) return;

    pollAbortRef.current?.abort();
    const runId = ++pollRunRef.current;
    const controller = new AbortController();
    pollAbortRef.current = controller;

    await runAsyncAction({
      execute: async () => {
        const retryAfter = await paymentService.startSimulation(payment.id, scenario);
        const finalPayment = await paymentService.pollPayment(
          payment.id,
          controller.signal,
          (nextPayment) => {
            if (runId === pollRunRef.current) {
              setPayment(nextPayment);
            }
          },
          retryAfter,
        );

        if (runId !== pollRunRef.current) {
          return;
        }

        setPayment(finalPayment);
        const latestOrder = await orderService.getOrder(order.id);
        if (runId === pollRunRef.current) {
          setOrder(latestOrder);
        }

        if (isHistoryModalOpen) {
          await loadOrderHistory();
        }
      },
      setLoading: (isLoading) => {
        if (runId === pollRunRef.current) {
          setIsRunningPayment(isLoading);
        }
      },
      clearError: () => setActionError(null),
      ignoreError: (error) => error instanceof DOMException && error.name === 'AbortError',
      onError: (appError) => {
        if (runId === pollRunRef.current) {
          setActionError(toCheckoutErrorMessage(appError));
        }
      },
    });
  };

  const retryPaymentAttempt = async () => {
    if (!order) return;

    await runAsyncAction({
      execute: () => paymentService.createPayment(order.id),
      setLoading: setIsCreatingPayment,
      clearError: () => setActionError(null),
      onSuccess: async (nextPayment) => {
        setPayment(nextPayment);
        if (isHistoryModalOpen) {
          await loadOrderHistory();
        }
      },
      onError: (appError) => {
        setActionError(toCheckoutErrorMessage(appError));
      },
    });
  };

  return {
    isRunningPayment,
    isCreatingPayment,
    startPaymentScenario,
    retryPaymentAttempt,
  };
};
