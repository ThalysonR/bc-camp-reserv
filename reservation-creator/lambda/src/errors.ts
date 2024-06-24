export class RetryableError extends Error {
  constructor(msg?: string) {
    super(msg);
  }
}

export class NoResultsError extends Error {
  constructor(msg?: string) {
    super(msg);
  }
}
