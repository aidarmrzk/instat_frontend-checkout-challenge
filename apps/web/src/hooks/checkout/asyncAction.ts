import type { AppError } from '../../api/errors';
import { asAppError } from '../../api/errors';

type RunAsyncActionParams<T> = {
  execute: () => Promise<T>;
  setLoading?: (isLoading: boolean) => void;
  clearError?: () => void;
  ignoreError?: (error: unknown) => boolean;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: AppError) => void | Promise<void>;
  onFinally?: () => void | Promise<void>;
};

export const runAsyncAction = async <T>({
  execute,
  setLoading,
  clearError,
  ignoreError,
  onSuccess,
  onError,
  onFinally,
}: RunAsyncActionParams<T>): Promise<T | null> => {
  setLoading?.(true);
  clearError?.();

  try {
    const result = await execute();
    await onSuccess?.(result);
    return result;
  } catch (error) {
    if (ignoreError?.(error)) {
      return null;
    }

    const appError = asAppError(error);
    await onError?.(appError);
    return null;
  } finally {
    setLoading?.(false);
    await onFinally?.();
  }
};
