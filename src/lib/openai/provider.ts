import { clientEnv, serverEnv } from "@/lib/env";
import { MockAIProvider } from "@/lib/openai/mock";
import type { AIProvider, BookChatInput, BookChatResult } from "@/lib/openai/types";

class OpenAIProvider implements AIProvider {
  async answerBookQuestion(input: BookChatInput): Promise<BookChatResult> {
    void input;
    if (!serverEnv.OPENAI_API_KEY || !serverEnv.OPENAI_CHAT_MODEL) {
      throw new Error("OpenAI no está configurado para modo real.");
    }

    throw new Error("OpenAIProvider está preparado, pero la llamada real queda pendiente.");
  }
}

export function createAIProvider(): AIProvider {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockAIProvider();
  }

  return new OpenAIProvider();
}
