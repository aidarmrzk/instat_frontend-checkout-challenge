import type { AppSnapshot, CheckoutDraft } from './types';
import { safeReadJson, safeRemoveItem, safeSetItem } from '../shared/safeStorage';

const SNAPSHOT_KEY = 'checkout:snapshot';
const DRAFT_KEY = 'checkout:draft';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object';
};

const isAppSnapshot = (value: unknown): value is AppSnapshot => {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.token === 'string' && typeof value.sessionId === 'string';
};

const isCheckoutDraft = (value: unknown): value is CheckoutDraft => {
  if (!isRecord(value)) {
    return false;
  }

  const customer = value.customer;
  const delivery = value.delivery;
  const paymentMethod = value.paymentMethod;

  return (
    isRecord(customer) &&
    isRecord(delivery) &&
    (paymentMethod === 'card' || paymentMethod === 'cash_on_delivery')
  );
};

export const saveSnapshot = (snapshot: AppSnapshot): void => {
  safeSetItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
};

export const readSnapshot = (): AppSnapshot | null => {
  return safeReadJson(SNAPSHOT_KEY, isAppSnapshot);
};

export const clearSnapshot = (): void => {
  safeRemoveItem(SNAPSHOT_KEY);
};

export const saveDraft = (draft: CheckoutDraft): void => {
  safeSetItem(DRAFT_KEY, JSON.stringify(draft));
};

export const readDraft = (): CheckoutDraft | null => {
  return safeReadJson(DRAFT_KEY, isCheckoutDraft);
};

export const clearDraft = (): void => {
  safeRemoveItem(DRAFT_KEY);
};
