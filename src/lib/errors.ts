export class AppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppConfigError";
  }
}

export function isAppConfigError(error: unknown): error is AppConfigError {
  return error instanceof AppConfigError;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
