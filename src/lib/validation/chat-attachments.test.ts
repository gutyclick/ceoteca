import { describe, expect, it } from "vitest";

import { chatRequestSchema } from "@/lib/validation/chat";

const uploadSessionId = "3adfd419-4e62-43ac-bdef-42e4fe0a2141";
const attachmentId = "38ddcf81-27a5-4702-9f5a-1aa30492e06e";
const creationKey = "18d3ea62-f8a3-4e12-b127-b709ee070b50";
const messageId = "b5bc0ea4-3fb4-4af2-aa12-a8674bb84127";

describe("chat request attachments", () => {
  it("allows an attachment-only message with an upload session", () => {
    const result = chatRequestSchema.safeParse({
      type: "general",
      clientCreationKey: creationKey,
      clientMessageId: messageId,
      attachmentIds: [attachmentId],
      uploadSessionId,
    });

    expect(result.success).toBe(true);
  });

  it("requires an upload session when attachments are present", () => {
    const result = chatRequestSchema.safeParse({
      type: "general",
      clientCreationKey: creationKey,
      clientMessageId: messageId,
      attachmentIds: [attachmentId],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a message without text or attachments", () => {
    const result = chatRequestSchema.safeParse({
      type: "general",
      clientCreationKey: creationKey,
      clientMessageId: messageId,
    });

    expect(result.success).toBe(false);
  });
});
