import { safeReadJson, safeRemoveItem, safeSetItem } from '../shared/safeStorage';

const storageKeys = {
  order: 'checkout:idempotency:order',
  payment: 'checkout:idempotency:payment',
} as const;

type StoredKey = {
  key: string;
  fingerprint: string;
};

const createKey = (): string => {
  return crypto.randomUUID();
};

const isStoredKey = (value: unknown): value is StoredKey => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.key === 'string' && typeof candidate.fingerprint === 'string';
};

const readStored = (key: keyof typeof storageKeys): StoredKey | null => {
  return safeReadJson(storageKeys[key], isStoredKey);
};

const writeStored = (key: keyof typeof storageKeys, value: StoredKey): void => {
  safeSetItem(storageKeys[key], JSON.stringify(value));
};

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`).join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return serialized ?? 'null';
};

const fingerprint = (input: unknown): string => {
  return stableSerialize(input);
};

export const getIdempotencyKey = (scope: 'order' | 'payment', body: unknown): string => {
  const nextFingerprint = fingerprint(body);
  const stored = readStored(scope);

  if (stored && stored.fingerprint === nextFingerprint) {
    return stored.key;
  }

  const key = createKey();
  writeStored(scope, { key, fingerprint: nextFingerprint });
  return key;
};

export const clearIdempotencyKey = (scope: 'order' | 'payment'): void => {
  safeRemoveItem(storageKeys[scope]);
};
