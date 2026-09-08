/**
 * Executes an async function with exponential backoff retry.
 * Handles rate limits (HTTP 429) and transient server errors (HTTP 5xx).
 *
 * @param {Function} asyncFn - Async function to execute.
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [options.baseDelayMs=500] - Initial delay in milliseconds.
 * @param {number} [options.factor=2] - Exponential factor for backoff delay.
 * @returns {Promise<any>}
 */
async function withRetry(asyncFn, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const factor = options.factor ?? 2;

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await asyncFn();
    } catch (err) {
      attempt += 1;

      const statusCode = err.status || err.response?.status;
      const isRetryable =
        !statusCode ||
        statusCode === 429 ||
        (statusCode >= 500 && statusCode < 600) ||
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT';

      if (attempt > maxRetries || !isRetryable) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(factor, attempt - 1);
      console.warn(
        `[withRetry] Attempt ${attempt} failed (${err.message}). Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  withRetry,
};
