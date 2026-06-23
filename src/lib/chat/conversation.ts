import type { ChatConversationMessage } from "@/lib/validation/chat";

const MAX_CONVERSATION_MESSAGES = 12;
const MAX_CONVERSATION_MESSAGE_LENGTH = 1800;

export function prepareChatConversation(
  messages: ChatConversationMessage[],
): ChatConversationMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_CONVERSATION_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_CONVERSATION_MESSAGES);
}
