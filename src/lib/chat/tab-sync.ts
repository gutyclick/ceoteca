export type ChatTabEvent = {
  type: "generation_started" | "generation_finished" | "messages_changed";
  conversationId: string;
  tabId: string;
  at: number;
};

export const chatTabChannelName = "ceoteca:chat:sync:v1";

export function createChatTabChannel() {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(chatTabChannelName);
}
