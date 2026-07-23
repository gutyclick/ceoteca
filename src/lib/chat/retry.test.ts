import { describe, expect, it, vi } from "vitest";

import { retryIdempotent } from "@/lib/chat/retry";

describe("retryIdempotent", () => {
  it("retries safe reads with bounded backoff", async () => {
    vi.useFakeTimers();
    const operation = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue("ok");
    const result = retryIdempotent(operation, { attempts: 2, baseDelayMs: 10 });
    await vi.advanceTimersByTimeAsync(10);
    await expect(result).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
