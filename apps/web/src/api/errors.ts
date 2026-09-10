export type ApiFieldError = {
  path: string;
  message: string;
};

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly fields: ApiFieldError[];
  readonly kind: 'network' | 'http' | 'parse';

  constructor(params: {
    message: string;
    code: string;
    status: number;
    requestId?: string;
    fields?: ApiFieldError[];
    kind: 'network' | 'http' | 'parse';
  }) {
    super(params.message);
    this.name = 'AppError';
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
    this.fields = params.fields ?? [];
    this.kind = params.kind;
  }
}

export const asAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
      status: 0,
      kind: 'network',
    });
  }

  return new AppError({
    message: 'Unexpected error',
    code: 'UNKNOWN_ERROR',
    status: 0,
    kind: 'parse',
  });
};
