import { describe, expect, it } from "vitest";

import { createChatPublicError, normalizeClientChatError } from "@/lib/chat/errors";

describe("chat errors", () => {
  it("never exposes internal provider details", () => {
    const error = normalizeClientChatError(new Error("API key invalid: sk-secret"), "PROVIDER_UNAVAILABLE");
    expect(error.userMessage).toBe("CEO no está disponible temporalmente.");
    expect(JSON.stringify(error)).not.toContain("sk-secret");
  });

  it("maps actions to the affected recovery flow", () => {
    expect(createChatPublicError("SESSION_EXPIRED").action).toBe("sign_in");
    expect(createChatPublicError("PLAN_LIMIT_REACHED").action).toBe("upgrade");
    expect(createChatPublicError("STREAM_INTERRUPTED").retryable).toBe(true);
  });
});
