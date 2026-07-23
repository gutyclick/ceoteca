export const chatTimeouts = {
  conversationCreateMs: 12_000,
  messageSaveMs: 12_000,
  streamStartMs: 25_000,
  streamIdleMs: 35_000,
  titleGenerationMs: 6_000,
  historyLoadMs: 12_000,
  connectivityProbeMs: 5_000,
} as const;

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parentSignal?: AbortSignal,
) {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted && !parentSignal?.aborted) {
      throw new DOMException("Timed out", "TimeoutError");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

export async function retryIdempotent<T>(
  operation: (signal: AbortSignal, attempt: number) => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number; signal?: AbortSignal } = {},
) {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 350;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (options.signal?.aborted) throw options.signal.reason;
    try {
      return await operation(options.signal ?? new AbortController().signal, attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      await new Promise<void>((resolve, reject) => {
        const finish = () => {
          options.signal?.removeEventListener("abort", abort);
          resolve();
        };
        const timer = setTimeout(finish, baseDelayMs * 2 ** attempt);
        const abort = () => {
          clearTimeout(timer);
          options.signal?.removeEventListener("abort", abort);
          reject(options.signal?.reason);
        };
        options.signal?.addEventListener("abort", abort, { once: true });
      });
    }
  }
  throw lastError;
}
