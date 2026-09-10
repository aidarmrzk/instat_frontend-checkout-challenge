import { asAppError, type AppError } from '../../api/errors';
import { mapFieldErrors, type FieldErrors } from './formValidation';
import { toUserMessage } from './uiErrorMessages';

const QUOTE_RECOVERY_CODES = new Set(['CART_VERSION_CONFLICT', 'QUOTE_EXPIRED']);

export type CheckoutErrorResolution = {
  appError: AppError;
  message: string;
  fieldErrors: FieldErrors;
  shouldRecoverQuoteState: boolean;
};

export const resolveCheckoutError = (error: unknown): CheckoutErrorResolution => {
  const appError = asAppError(error);
  const shouldRecoverQuoteState = QUOTE_RECOVERY_CODES.has(appError.code);

  return {
    appError,
    message: toUserMessage(appError),
    fieldErrors: mapFieldErrors(appError),
    shouldRecoverQuoteState,
  };
};

export const toCheckoutErrorMessage = (error: unknown): string => {
  return resolveCheckoutError(error).message;
};

export const isCheckoutErrorStatus = (error: unknown, statuses: readonly number[]): boolean => {
  return statuses.includes(resolveCheckoutError(error).appError.status);
};

export const isCheckoutUnauthorized = (error: unknown): boolean => {
  return isCheckoutErrorStatus(error, [401]);
};

export const isCheckoutUnauthorizedOrNotFound = (error: unknown): boolean => {
  return isCheckoutErrorStatus(error, [401, 404]);
};
