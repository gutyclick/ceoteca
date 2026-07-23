"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  Archive,
  ArrowDown,
  BookOpen,
  Bot,
  Loader2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatConnectionStatus } from "@/components/chat/ChatConnectionStatus";
import { ChatMessageItem, type MessageRating, type ResponseAction } from "@/components/chat/ChatMessageItem";
import { useChatConnectivity } from "@/components/chat/useChatConnectivity";
import {
  chatComposerMaxLength,
  chatLowRemainingThreshold,
  getChatFollowUpPrompts,
  getChatStarterPrompts,
} from "@/config/chat";
import { plans, type PlanKey } from "@/config/plans";
import {
  cleanupOldChatDrafts,
  clearChatDraft,
  readChatDraft,
  writeChatDraft,
  type ChatDraftScope,
} from "@/lib/chat/drafts";
import type { ChatConversation, StoredChatMessage } from "@/lib/chat/model";
import {
  createChatPublicError,
  isChatPublicError,
  normalizeClientChatError,
  type ChatPublicError,
} from "@/lib/chat/errors";
import { chatTimeouts, retryIdempotent, withTimeout } from "@/lib/chat/retry";
import { createChatTabChannel, type ChatTabEvent } from "@/lib/chat/tab-sync";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/types";

type ChatMessage = StoredChatMessage;
type Conversation = ChatConversation & { book: Book | null; optimistic?: boolean };
type FilterKey = "all" | "book" | "general" | "archived";

type SendFailure = {
  kind: "create" | "response" | "connection" | "limit";
  message: string;
  originalMessage: string;
  clientMessageId: string;
  displayMessageId: string;
  conversationId: string | null;
  creationKey: string;
  error: ChatPublicError;
};

type StreamEvent =
  | { type: "conversation"; conversation: ChatConversation; userMessage: StoredChatMessage; assistantMessage: StoredChatMessage | null; remainingQuestions: number | null; requestId?: string }
  | { type: "delta"; delta: string }
  | { type: "title"; title: string }
  | { type: "completed"; conversation: ChatConversation; userMessage: StoredChatMessage; assistantMessage: StoredChatMessage; remainingQuestions: number | null }
  | { type: "failed"; code: string; message: string; userMessage: StoredChatMessage; assistantMessage: StoredChatMessage | null; conversation: ChatConversation; retryable?: boolean; action?: string | null; requestId?: string };

type HistoryResponse = {
  data?: {
    conversation: ChatConversation | null;
    messages: StoredChatMessage[];
    remainingQuestions: number | null;
    usage: { questionCount: number; limit: number | null };
    hasMore: boolean;
    feedback: Array<{ message_id: string; rating: Exclude<MessageRating, null>; reason: string | null }>;
  };
  error?: ChatPublicError & { message?: string };
};

type ChatResponse = {
  data?: {
    message: string;
    remainingQuestions: number | null;
    usage: { questionCount: number; limit: number | null };
    conversation: ChatConversation;
    userMessage: StoredChatMessage;
    assistantMessage: StoredChatMessage;
  };
  error?: ChatPublicError & { message?: string };
};

type ConversationsResponse = {
  data?: {
    conversations: ChatConversation[];
  };
  error?: { message: string };
};

const draftConversation = {
  id: null,
  userId: "",
  type: "general" as const,
  bookId: null,
  title: "Nueva conversación",
  status: "active" as const,
  createdAt: "",
  updatedAt: "",
  lastMessageAt: "",
  metadata: {},
  titleIsManual: false,
  book: null,
};

const preparationMessages = [
  "Analizando tu solicitud…",
  "Organizando una respuesta práctica…",
  "Preparando una recomendación…",
];

const responseInstructions: Record<ResponseAction, string> = {
  shorter: "Haz más breve tu respuesta anterior sin perder la idea principal.",
  example: "Explica tu respuesta anterior con un ejemplo concreto y sencillo.",
  steps: "Convierte tu respuesta anterior en pasos claros y ordenados.",
  checklist: "Convierte tu respuesta anterior en una checklist práctica.",
  business: "Adapta tu respuesta anterior a mi negocio. Primero pregúntame el contexto mínimo que necesites.",
};

function optimisticStoredMessage(input: { id: string; conversationId: string; role: "user" | "assistant"; content: string; status: StoredChatMessage["status"]; parentMessageId?: string | null }): StoredChatMessage {
  const now = new Date().toISOString();
  return { id: input.id, conversationId: input.conversationId, role: input.role, content: input.content, parts: null, status: input.status, createdAt: now, updatedAt: now, parentMessageId: input.parentMessageId ?? null, metadata: {}, clientMessageId: input.role === "user" ? input.id : null };
}

function messageDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = date.toDateString();
  if (key === today.toDateString()) return "Hoy";
  if (key === yesterday.toDateString()) return "Ayer";
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" }).format(date);
}

function recordChatEvent(name: string, metadata: Record<string, string | number | boolean | null>) {
  try {
    track(name, metadata);
  } catch {
    // Analytics must never block the conversation.
  }
}

function BookAvatar({ book }: { book: Book }) {
  return (
    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[7px] border border-slate-950/[0.08] bg-violet-50">
      {book.cover.imagePath ? (
        <Image alt="" className="object-cover" fill sizes="36px" src={book.cover.imagePath} />
      ) : (
        <BookOpen className="absolute inset-0 m-auto text-violet-600" size={18} />
      )}
    </span>
  );
}

function SendFailurePanel({
  failure,
  onRetry,
  onEdit,
  onDismiss,
}: {
  failure: SendFailure;
  onRetry: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}) {
  return (
    <section aria-live="polite" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-left">
      <p className="text-sm font-black text-rose-800">{failure.error.userMessage}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {failure.error.action === "upgrade" ? (
          <Link className="rounded-[10px] bg-violet-700 px-3 py-2 text-xs font-black text-white" href="/planes">Ver planes</Link>
        ) : failure.error.action === "sign_in" ? (
          <Link className="rounded-[10px] bg-violet-700 px-3 py-2 text-xs font-black text-white" href={`/login?next=${encodeURIComponent(typeof window === "undefined" ? "/chat" : window.location.pathname)}`}>Iniciar sesión</Link>
        ) : (
          <button className="rounded-[10px] bg-rose-700 px-3 py-2 text-xs font-black text-white" disabled={!failure.error.retryable} onClick={onRetry} type="button">
            {failure.kind === "connection" ? "Reconectar" : failure.kind === "create" ? "Intentar de nuevo" : "Reintentar respuesta"}
          </button>
        )}
        {failure.kind === "response" || failure.kind === "connection" ? (
          <button className="rounded-[10px] border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-800" onClick={onEdit} type="button">Editar mensaje</button>
        ) : null}
        <button className="rounded-[10px] px-3 py-2 text-xs font-black text-rose-800" onClick={onDismiss} type="button">
          {failure.kind === "create" ? "Volver al inicio" : "Cerrar"}
        </button>
      </div>
    </section>
  );
}

export function ChatWorkspace({ books, initialConversationId = null }: { books: Book[]; initialConversationId?: string | null }) {
  const router = useRouter();
  const connectivity = useChatConnectivity();
  const bookById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanKey>("free");
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [openActionKey, setOpenActionKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [isUpdatingConversation, setIsUpdatingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendFailure, setSendFailure] = useState<SendFailure | null>(null);
  const [retryTurn, setRetryTurn] = useState<SendFailure | null>(null);
  const [streamHasStarted, setStreamHasStarted] = useState(false);
  const [preparationIndex, setPreparationIndex] = useState(0);
  const [responseAnnouncement, setResponseAnnouncement] = useState("");
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<string, MessageRating>>({});
  const [feedbackReasonTarget, setFeedbackReasonTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StoredChatMessage | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [showJumpToEnd, setShowJumpToEnd] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [otherTabGenerating, setOtherTabGenerating] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const creationKeyRef = useRef(crypto.randomUUID());
  const activeRequestRef = useRef<AbortController | null>(null);
  const activeFirstResponseRef = useRef(false);
  const activeClientMessageIdRef = useRef<string | null>(null);
  const streamingConversationIdRef = useRef<string | null>(null);
  const stopRequestedRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const viewedNewChatRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const inputValueRef = useRef("");
  const draftScopeRef = useRef<ChatDraftScope | null>(null);
  const sendLockRef = useRef(false);
  const tabIdRef = useRef(crypto.randomUUID());
  const tabChannelRef = useRef<BroadcastChannel | null>(null);
  const activeBroadcastConversationRef = useRef<string | null>(null);
  const selected = conversations.find((item) => item.id === selectedId) ?? draftConversation;
  const canUseChat = plans[plan].features.includes("chat");
  const contextIsReady = selected.type === "general" || Boolean(selected.book);
  const hasQuota = remainingQuestions === null || remainingQuestions > 0;
  const canSendMessages = canUseChat && hasQuota && selected.status === "active" && contextIsReady
    && connectivity.canReachServer && !sessionExpired && !otherTabGenerating;
  const composerLockedReason = !canUseChat
    ? "Chat con CEO no está incluido en tu plan actual."
    : !hasQuota
      ? "Has alcanzado el límite de consultas de tu plan."
      : undefined;
  const composerDisabledReason = selected.status === "archived"
    ? "Restaura esta conversación para continuar."
    : !contextIsReady
      ? "Estamos preparando el contexto de este análisis."
      : sessionExpired
        ? "Tu sesión ha expirado. Inicia sesión para continuar."
        : !connectivity.canReachServer
          ? "Sin conexión. Puedes seguir escribiendo y enviar cuando vuelva."
          : otherTabGenerating
            ? "Esta conversación está activa en otra pestaña."
            : undefined;
  const suggestions = getChatStarterPrompts(selected.type);
  const draftScope = useMemo<ChatDraftScope | null>(() => userId ? ({
    userId,
    type: selected.type,
    conversationId: selected.id,
    bookId: selected.bookId,
  }) : null, [selected.bookId, selected.id, selected.type, userId]);
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant" && message.status === "completed");
  const followUpSuggestions = lastAssistantMessage
    ? getChatFollowUpPrompts(lastAssistantMessage.content)
    : [];

  const filteredConversations = conversations.filter((conversation) => {
    const matchesArchive = filter === "archived" ? conversation.status === "archived" : conversation.status === "active";
    const matchesFilter = filter === "all" || filter === "archived" || conversation.type === filter;
    const searchTarget = `${conversation.title} ${conversation.book?.author ?? "general"}`.toLocaleLowerCase("es");
    return matchesArchive && matchesFilter && searchTarget.includes(query.trim().toLocaleLowerCase("es"));
  });

  useEffect(() => {
    setSelectedId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => () => activeRequestRef.current?.abort(), []);

  useEffect(() => {
    const channel = createChatTabChannel();
    tabChannelRef.current = channel;
    if (!channel) return;
    channel.onmessage = (event: MessageEvent<ChatTabEvent>) => {
      const message = event.data;
      if (!message || message.tabId === tabIdRef.current || message.conversationId !== selectedId) return;
      if (message.type === "generation_started") setOtherTabGenerating(true);
      if (message.type === "generation_finished") {
        setOtherTabGenerating(false);
        setSyncVersion((current) => current + 1);
      }
      if (message.type === "messages_changed" && !isSending) {
        setSyncVersion((current) => current + 1);
      }
    };
    return () => {
      channel.close();
      if (tabChannelRef.current === channel) tabChannelRef.current = null;
    };
  }, [isSending, selectedId]);

  useEffect(() => {
    if (connectivity.state !== "restored") return;
    setSyncVersion((current) => current + 1);
  }, [connectivity.state]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    inputValueRef.current = input;
  }, [input]);

  useEffect(() => {
    draftScopeRef.current = draftScope;
  }, [draftScope]);

  useEffect(() => {
    const persistBeforeLeaving = () => {
      const scope = draftScopeRef.current;
      if (scope) writeChatDraft(scope, inputValueRef.current);
    };
    window.addEventListener("pagehide", persistBeforeLeaving);
    return () => window.removeEventListener("pagehide", persistBeforeLeaving);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadAccount() {
      const supabase = createBrowserSupabaseClient();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (!userData.user || !isMounted) {
        if (isMounted) {
          setSessionExpired(true);
          setIsLoadingConversations(false);
          setIsLoadingHistory(false);
        }
        return;
      }
      setUserId(userData.user.id);
      cleanupOldChatDrafts();
      const token = sessionData.session?.access_token;
      if (token) {
        const safeRead = (path: string) => retryIdempotent(async (signal) => {
          const response = await withTimeout(
            (timeoutSignal) => fetch(path, { headers: { Authorization: `Bearer ${token}` }, signal: timeoutSignal }),
            chatTimeouts.historyLoadMs,
            signal,
          );
          if (response.status >= 500) throw new Error("Temporary read failure");
          return response;
        }, { attempts: 3, signal: controller.signal });
        let conversationsResponse: Response;
        let subscriptionResponse: Response;
        let quotaResponse: Response;
        try {
          [conversationsResponse, subscriptionResponse, quotaResponse] = await Promise.all([
            safeRead("/api/chat/conversations"),
            safeRead("/api/subscription"),
            safeRead("/api/chat/history?context=general"),
          ]);
        } catch (loadError) {
          if (isMounted && !controller.signal.aborted) setError(normalizeClientChatError(loadError).userMessage);
          if (isMounted) setIsLoadingConversations(false);
          return;
        }
        const [conversationsPayload, subscriptionPayload, quotaPayload] = await Promise.all([
          conversationsResponse.json() as Promise<ConversationsResponse>,
          subscriptionResponse.json() as Promise<{ data?: { plan: PlanKey } }>,
          quotaResponse.json() as Promise<HistoryResponse>,
        ]);
        if (!isMounted) return;
        if (subscriptionResponse.ok && subscriptionPayload.data) setPlan(subscriptionPayload.data.plan);
        if (quotaResponse.ok && quotaPayload.data) setRemainingQuestions(quotaPayload.data.remainingQuestions);
        if (conversationsResponse.ok && conversationsPayload.data) {
          const loaded = conversationsPayload.data.conversations.map((conversation) => ({
            ...conversation,
            book: conversation.bookId ? bookById.get(conversation.bookId) ?? null : null,
          }));
          setConversations(loaded);
          if (initialConversationId && !loaded.some((item) => item.id === initialConversationId)) {
            setError("No encontramos esta conversación o no tienes acceso.");
          }
        }
      }
      if (isMounted) setIsLoadingConversations(false);
    }

    void loadAccount();
    return () => { isMounted = false; controller.abort(); };
  }, [bookById, initialConversationId]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadHistory() {
      setIsLoadingHistory(true);
      setError(null);
      if (selectedId && streamingConversationIdRef.current === selectedId) {
        setIsLoadingHistory(false);
        return;
      }
      if (!selectedId) {
        setMessages([]);
        setIsLoadingHistory(false);
        return;
      }
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSessionExpired(true);
        setIsLoadingHistory(false);
        return;
      }
      let response: Response;
      try {
        response = await retryIdempotent(
          async (signal) => {
            const result = await withTimeout(
              (timeoutSignal) => fetch(`/api/chat/history?conversationId=${encodeURIComponent(selectedId)}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: timeoutSignal,
              }),
              chatTimeouts.historyLoadMs,
              signal,
            );
            if (result.status >= 500) throw new Error("History temporarily unavailable");
            return result;
          },
          { attempts: 3, signal: controller.signal },
        );
      } catch (loadError) {
        if (!isMounted || controller.signal.aborted) return;
        const visibleError = normalizeClientChatError(loadError, "UNKNOWN_ERROR");
        setMessages([]);
        setError(visibleError.userMessage);
        setIsLoadingHistory(false);
        return;
      }
      const payload = (await response.json()) as HistoryResponse;
      if (!isMounted) return;
      if (!response.ok || !payload.data) {
        setMessages([]);
        if (response.status === 401) setSessionExpired(true);
        setError(payload.error?.userMessage ?? payload.error?.message ?? "No pudimos cargar esta conversación.");
      } else {
        setMessages(payload.data.messages.filter((message) => message.role === "user" || message.role === "assistant"));
        setRemainingQuestions(payload.data.remainingQuestions);
        setHasOlderMessages(payload.data.hasMore);
        setFeedbackByMessage(Object.fromEntries(payload.data.feedback.map((item) => [item.message_id, item.rating])));
        isNearBottomRef.current = true;
        window.requestAnimationFrame(() => {
          const container = messagesContainerRef.current;
          if (container) container.scrollTop = container.scrollHeight;
        });
      }
      setIsLoadingHistory(false);
    }

    void loadHistory();
    return () => { isMounted = false; controller.abort(); };
  }, [selectedId, syncVersion]);

  useEffect(() => {
    const restored = draftScope ? readChatDraft(draftScope) : "";
    inputValueRef.current = restored;
    setInput(restored);
    setRetryTurn(null);
    setSendFailure(null);
  }, [draftScope]);

  useEffect(() => {
    if (!draftScope) return;
    const timeout = window.setTimeout(() => writeChatDraft(draftScope, input), 350);
    return () => window.clearTimeout(timeout);
  }, [draftScope, input]);

  useEffect(() => {
    if (selectedId || viewedNewChatRef.current) return;
    viewedNewChatRef.current = true;
    recordChatEvent("new_chat_viewed", { conversation_type: "general", plan });
  }, [plan, selectedId]);

  useEffect(() => {
    if (!isSending || streamHasStarted) {
      setPreparationIndex(0);
      return;
    }
    const second = window.setTimeout(() => setPreparationIndex(1), 2_500);
    const third = window.setTimeout(() => setPreparationIndex(2), 6_000);
    return () => {
      window.clearTimeout(second);
      window.clearTimeout(third);
    };
  }, [isSending, streamHasStarted]);

  useEffect(() => {
    if (!isSending || streamHasStarted) return;
    setMessages((current) => current.map((message) => message.role === "assistant" && message.status === "pending" ? { ...message, content: preparationMessages[preparationIndex] } : message));
  }, [isSending, preparationIndex, streamHasStarted]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (!isNearBottomRef.current) {
      setShowJumpToEnd(true);
      return;
    }
    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: streamHasStarted ? "auto" : "smooth",
      });
      setShowJumpToEnd(false);
    });
  }, [messages, isSending, streamHasStarted]);

  function selectConversation(id: string) {
    if (draftScope) writeChatDraft(draftScope, inputValueRef.current);
    setSelectedId(id);
    router.push(`/chat/${id}`);
    setIsConversationPanelOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function startNewConversation() {
    if (draftScope) writeChatDraft(draftScope, inputValueRef.current);
    resetToNewConversation();
  }

  function resetToNewConversation() {
    creationKeyRef.current = crypto.randomUUID();
    setSelectedId(null);
    router.push("/chat");
    setMessages([]);
    if (userId) {
      const nextScope: ChatDraftScope = { userId, type: "general" };
      const restored = readChatDraft(nextScope);
      inputValueRef.current = restored;
      setInput(restored);
    }
    setError(null);
    setSendFailure(null);
    setRetryTurn(null);
    setFilter("all");
    setIsConversationPanelOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function stopResponse() {
    stopRequestedRef.current = true;
    activeRequestRef.current?.abort();
    const clientMessageId = activeClientMessageIdRef.current;
    const streamingMessage = messagesRef.current.find((message) => message.status === "streaming");
    const streamingMessageId = streamingMessage?.id;
    const partialContent = streamingMessage?.content ?? "";
    if (clientMessageId) {
      const cancelPersistedTurn = () => createBrowserSupabaseClient().auth.getSession().then(({ data }) => {
        const token = data.session?.access_token;
        if (!token) return;
        return fetch("/api/chat", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ clientMessageId, partialContent }),
        }).then(async (response) => {
          const payload = await response.json() as { data?: { assistantMessage: StoredChatMessage | null } };
          if (payload.data?.assistantMessage) {
            setMessages((current) => current.map((message) => message.id === streamingMessageId ? payload.data!.assistantMessage! : message));
          }
        });
      }).catch(() => undefined);
      void cancelPersistedTurn();
      window.setTimeout(() => void cancelPersistedTurn(), 350);
    }
    if (activeFirstResponseRef.current) {
      recordChatEvent("first_response_stopped", {
        conversation_type: selected.type,
        plan,
      });
    }
  }

  function selectStarterPrompt(id: string, prompt: string) {
    setInput(prompt);
    recordChatEvent("starter_prompt_selected", {
      prompt_id: id,
      conversation_type: selected.type,
      plan,
    });
    window.requestAnimationFrame(() => {
      const textarea = inputRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(prompt.length, prompt.length);
    });
  }

  async function updateConversation(
    conversation: Conversation,
    action: "archive" | "restore" | "delete" | "rename",
    title?: string,
  ) {
    if (isUpdatingConversation) return;

    setIsUpdatingConversation(true);
    setOpenActionKey(null);
    setError(null);
    const previous = conversations;
    const optimistic = action === "delete"
      ? conversations.filter((item) => item.id !== conversation.id)
      : conversations.map((item) => item.id === conversation.id
        ? {
            ...item,
            ...(action === "rename" && title ? { title } : {}),
            ...(action === "archive" ? { status: "archived" as const } : {}),
            ...(action === "restore" ? { status: "active" as const } : {}),
          }
        : item);
    setConversations(optimistic);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");

      const response = await fetch("/api/chat/conversations", {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: conversation.id, action, ...(title ? { title } : {}) }),
      });
      const payload = (await response.json()) as { data?: { conversation?: ChatConversation; deleted?: boolean }; error?: { message: string } };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "No pudimos actualizar la conversación.");
      }

      if (payload.data.conversation) {
        setConversations((current) => current.map((item) => item.id === conversation.id
          ? { ...payload.data!.conversation!, book: item.book }
          : item));
      }
      if (selectedId === conversation.id && (action === "archive" || action === "delete")) {
        setSelectedId(null);
        router.push("/chat");
        setMessages([]);
      }
      setDeleteTarget(null);
      setRenameTarget(null);
    } catch (caughtError) {
      setConversations(previous);
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos actualizar la conversación.");
    } finally {
      setIsUpdatingConversation(false);
    }
  }

  async function sendMessage(retry = retryTurn, overrideMessage?: string) {
    const message = (overrideMessage ?? retry?.originalMessage ?? input).trim();
    if (!message || isSending || regeneratingId || !canSendMessages || sendLockRef.current) return;
    if (message.length > chatComposerMaxLength) {
      setError("Tu mensaje es demasiado largo. Reduce el contenido para continuar.");
      return;
    }
    sendLockRef.current = true;

    const startedAt = Date.now();
    const requestConversationId = retry?.conversationId ?? selected.id;
    const isNewConversation = !requestConversationId;
    const creationKey = retry?.creationKey ?? creationKeyRef.current;
    const clientMessageId = retry?.clientMessageId ?? crypto.randomUUID();
    const optimisticConversationId = `optimistic:${creationKey}`;
    const streamMessageId = `stream:${clientMessageId}`;
    const originalDraftScope = draftScope;
    const requestState: { conversation: Conversation | null } = { conversation: null };
    let persistedUserMessageId = clientMessageId;
    let receivedCompletedEvent = false;
    let firstDeltaAt: number | null = null;

    inputValueRef.current = "";
    setInput("");
    if (originalDraftScope) clearChatDraft(originalDraftScope);
    setError(null);
    setSendFailure(null);
    setRetryTurn(null);
    setIsSending(true);
    setStreamHasStarted(false);
    stopRequestedRef.current = false;
    isNearBottomRef.current = true;

    const optimisticMessage = optimisticStoredMessage({ id: clientMessageId, conversationId: requestConversationId ?? optimisticConversationId, role: "user", content: message, status: "pending" });
    const pendingAssistant = optimisticStoredMessage({ id: streamMessageId, conversationId: requestConversationId ?? optimisticConversationId, role: "assistant", content: "", status: "pending", parentMessageId: clientMessageId });
    setMessages((current) => {
      const base = retry
        ? current.filter((item) => item.id !== retry.displayMessageId && item.id !== retry.clientMessageId)
        : current;
      const exists = base.some((item) => item.id === clientMessageId);
      const withUser = exists
        ? base.map((item) => item.id === clientMessageId ? optimisticMessage : item)
        : [...base, optimisticMessage];
      return [...withUser.filter((item) => item.id !== streamMessageId), pendingAssistant];
    });

    if (isNewConversation) {
      const now = new Date().toISOString();
      setConversations((current) => current.some((item) => item.id === optimisticConversationId) ? current : [{
        id: optimisticConversationId,
        userId: "",
        type: selected.type,
        bookId: selected.bookId,
        title: "Nueva conversación",
        status: "active",
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        metadata: {},
        titleIsManual: false,
        book: selected.book,
        optimistic: true,
      }, ...current]);
      recordChatEvent("first_message_sent", {
        conversation_type: selected.type,
        message_length: message.length,
        plan,
      });
    }

    const requestController = new AbortController();
    activeRequestRef.current = requestController;
    activeFirstResponseRef.current = isNewConversation;
    activeClientMessageIdRef.current = clientMessageId;
    setResponseAnnouncement("");

    function upsertConversation(conversation: ChatConversation) {
      const persisted: Conversation = {
        ...conversation,
        book: conversation.bookId ? bookById.get(conversation.bookId) ?? null : null,
      };
      requestState.conversation = persisted;
      streamingConversationIdRef.current = persisted.id;
      if (activeBroadcastConversationRef.current !== persisted.id) {
        activeBroadcastConversationRef.current = persisted.id;
        tabChannelRef.current?.postMessage({
          type: "generation_started",
          conversationId: persisted.id,
          tabId: tabIdRef.current,
          at: Date.now(),
        } satisfies ChatTabEvent);
      }
      setConversations((current) => [
        persisted,
        ...current.filter((item) => item.id !== optimisticConversationId && item.id !== persisted.id),
      ].sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime()));
      if (selectedId !== persisted.id) {
        if (userId && inputValueRef.current) {
          writeChatDraft(
            { userId, type: persisted.type, conversationId: persisted.id, bookId: persisted.bookId },
            inputValueRef.current,
          );
        }
        setSelectedId(persisted.id);
        router.replace(`/chat/${persisted.id}`);
      }
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSessionExpired(true);
        throw createChatPublicError("SESSION_EXPIRED");
      }

      const streamStartTimer = window.setTimeout(
        () => requestController.abort(new DOMException("Stream start timed out", "TimeoutError")),
        chatTimeouts.streamStartMs,
      );
      const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Request-Id": crypto.randomUUID(),
          },
          body: JSON.stringify({
            type: selected.type,
            bookId: selected.book?.slug,
            conversationId: requestConversationId ?? undefined,
            clientCreationKey: requestConversationId ? undefined : creationKey,
            clientMessageId,
            message,
            stream: true,
          }),
          signal: requestController.signal,
        }).finally(() => window.clearTimeout(streamStartTimer));

      if (!response.ok) {
        const payload = (await response.json()) as ChatResponse;
        if (payload.error && isChatPublicError(payload.error)) throw payload.error;
        throw createChatPublicError("UNKNOWN_ERROR");
      }

      if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
        const payload = (await response.json()) as ChatResponse;
        if (!payload.data) throw new Error(payload.error?.message ?? "CEO no pudo completar la respuesta.");
        upsertConversation(payload.data.conversation);
        setMessages((current) => [
          ...current.filter((item) => item.id !== streamMessageId && item.id !== clientMessageId),
          payload.data!.userMessage,
          payload.data!.assistantMessage,
        ]);
        setRemainingQuestions(payload.data.remainingQuestions);
        receivedCompletedEvent = true;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No pudimos abrir la respuesta de CEO.");
      const decoder = new TextDecoder();
      let buffer = "";
      let pendingDelta = "";
      let animationFrame: number | null = null;

      const flushDeltas = () => {
        const delta = pendingDelta;
        pendingDelta = "";
        animationFrame = null;
        if (!delta) return;
        setMessages((current) => {
          const exists = current.some((item) => item.id === streamMessageId);
          return exists
            ? current.map((item) => item.id === streamMessageId ? { ...item, content: item.content + delta, status: "streaming" } : item)
            : [...current, optimisticStoredMessage({ id: streamMessageId, conversationId: requestState.conversation?.id ?? requestConversationId ?? optimisticConversationId, role: "assistant", content: delta, status: "streaming", parentMessageId: persistedUserMessageId })];
        });
      };

      const processEvent = (event: StreamEvent) => {
        if (event.type === "conversation") {
          upsertConversation(event.conversation);
          persistedUserMessageId = event.userMessage.id;
          setMessages((current) => current.map((item) => item.id === clientMessageId ? event.userMessage : item));
          if (event.assistantMessage) {
            setMessages((current) => current.map((item) => item.id === streamMessageId ? event.assistantMessage! : item));
          }
          setRemainingQuestions(event.remainingQuestions);
          if (isNewConversation) {
            recordChatEvent("conversation_created", {
              conversation_type: event.conversation.type,
              plan,
            });
          }
          return;
        }
        if (event.type === "delta") {
          if (!firstDeltaAt) {
            firstDeltaAt = Date.now();
            setStreamHasStarted(true);
            setResponseAnnouncement("CEO comenzó a responder.");
            if (isNewConversation) {
              recordChatEvent("first_response_started", {
                conversation_type: selected.type,
                duration_ms: firstDeltaAt - startedAt,
                plan,
              });
            }
          }
          pendingDelta += event.delta;
          if (animationFrame === null) animationFrame = window.requestAnimationFrame(flushDeltas);
          return;
        }
        if (event.type === "title") {
          setConversations((current) => current.map((item) => item.id === requestState.conversation?.id ? { ...item, title: event.title } : item));
          return;
        }
        if (event.type === "completed") {
          if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
          flushDeltas();
          receivedCompletedEvent = true;
          setResponseAnnouncement("CEO terminó de responder.");
          upsertConversation(event.conversation);
          setMessages((current) => [
            ...current.filter((item) => item.id !== streamMessageId && item.id !== clientMessageId && item.id !== persistedUserMessageId),
            event.userMessage,
            event.assistantMessage,
          ]);
          setRemainingQuestions(event.remainingQuestions);
          if (isNewConversation) {
            recordChatEvent("first_response_completed", {
              conversation_type: event.conversation.type,
              duration_ms: Date.now() - startedAt,
              plan,
            });
          }
          return;
        }
        if (event.type === "failed") {
          upsertConversation(event.conversation);
          setMessages((current) => current
            .map((item) => item.id === streamMessageId || (item.role === "assistant" && item.parentMessageId === event.userMessage.id)
              ? event.assistantMessage ?? { ...item, status: event.code === "STREAM_INTERRUPTED" ? "interrupted" as const : "failed" as const }
              : item.id === clientMessageId || item.id === event.userMessage.id ? event.userMessage : item));
          const publicError = createChatPublicError(
            event.code === "TIMEOUT"
              ? "TIMEOUT"
              : event.code === "STREAM_INTERRUPTED"
                ? "STREAM_INTERRUPTED"
                : event.code === "RESPONSE_SAVE_FAILED"
                  ? "RESPONSE_SAVE_FAILED"
                  : "PROVIDER_UNAVAILABLE",
            { requestId: event.requestId },
          );
          throw publicError;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) processEvent(JSON.parse(line) as StreamEvent);
        }
        if (done) break;
      }
      if (buffer.trim()) processEvent(JSON.parse(buffer) as StreamEvent);
      if (!receivedCompletedEvent) throw new Error("Se perdió la conexión.");
    } catch (caughtError) {
      const stopped = stopRequestedRef.current;
      const publicError = isChatPublicError(caughtError)
        ? caughtError
        : normalizeClientChatError(caughtError, requestState.conversation ? "STREAM_INTERRUPTED" : "MESSAGE_SAVE_FAILED");
      const limitReached = publicError.code === "PLAN_LIMIT_REACHED";
      const conversationId = requestState.conversation?.id ?? requestConversationId ?? null;
      const kind: SendFailure["kind"] = limitReached
        ? "limit"
        : stopped || requestState.conversation
          ? "response"
          : caughtError instanceof TypeError
            ? "connection"
            : "create";
      const failureMessage = limitReached
        ? publicError.userMessage
        : stopped
          ? "La respuesta se detuvo."
          : kind === "create"
            ? "No pudimos iniciar la conversación."
            : publicError.userMessage;

      setMessages((current) => current
        .map((item) => item.id === streamMessageId && stopped
          ? { ...item, status: "stopped" as const }
          : item.id === streamMessageId
            ? { ...item, status: item.content.trim() ? "interrupted" as const : "failed" as const }
          : item.id === clientMessageId || item.id === persistedUserMessageId
            ? { ...item, status: requestState.conversation ? "completed" as const : "failed" as const }
            : item));
      if (!requestState.conversation && isNewConversation) {
        setConversations((current) => current.filter((item) => item.id !== optimisticConversationId));
        setMessages((current) => current.filter((item) => item.id !== streamMessageId));
        if (!inputValueRef.current) {
          inputValueRef.current = message;
          setInput(message);
        }
      }
      const failure: SendFailure = {
        kind,
        message: failureMessage,
        originalMessage: message,
        clientMessageId,
        displayMessageId: persistedUserMessageId,
        conversationId,
        creationKey,
        error: stopped ? createChatPublicError("STREAM_INTERRUPTED") : publicError,
      };
      setSendFailure(failure);
      if (isNewConversation) {
        recordChatEvent("first_response_failed", {
          conversation_type: selected.type,
          duration_ms: Date.now() - startedAt,
          failure_type: kind,
          plan,
        });
      }
    } finally {
      sendLockRef.current = false;
      activeRequestRef.current = null;
      activeFirstResponseRef.current = false;
      activeClientMessageIdRef.current = null;
      streamingConversationIdRef.current = null;
      stopRequestedRef.current = false;
      setIsSending(false);
      setStreamHasStarted(false);
      const broadcastConversationId = activeBroadcastConversationRef.current;
      if (broadcastConversationId) {
        tabChannelRef.current?.postMessage({
          type: "generation_finished",
          conversationId: broadcastConversationId,
          tabId: tabIdRef.current,
          at: Date.now(),
        } satisfies ChatTabEvent);
        activeBroadcastConversationRef.current = null;
      }
    }
  }

  function editFailedMessage(failure: SendFailure) {
    setRetryTurn(failure);
    setSendFailure(null);
    setInput(failure.originalMessage);
    setMessages((current) => current.filter((item) => item.id !== failure.displayMessageId && item.id !== failure.clientMessageId));
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function retryUserMessage(message: StoredChatMessage) {
    const failure = sendFailure && (
      sendFailure.clientMessageId === message.id || sendFailure.displayMessageId === message.id
    ) ? sendFailure : null;
    if (failure) {
      void sendMessage(failure);
      return;
    }
    openEditMessage(message);
  }

  function deleteFailedUserMessage(message: StoredChatMessage) {
    setMessages((current) => current.filter((item) => item.id !== message.id));
    if (sendFailure?.clientMessageId === message.id || sendFailure?.displayMessageId === message.id) {
      setSendFailure(null);
      setRetryTurn(null);
    }
  }

  async function authenticatedFetch(path: string, init: RequestInit = {}) {
    const { data } = await createBrowserSupabaseClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setSessionExpired(true);
      throw createChatPublicError("SESSION_EXPIRED");
    }
    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Request-Id": crypto.randomUUID(),
        ...init.headers,
      },
    });
    if (response.status === 401) setSessionExpired(true);
    return response;
  }

  function openEditMessage(message: StoredChatMessage) {
    setEditTarget(message);
    setEditValue(message.content);
    setShowEditConfirmation(false);
  }

  async function confirmEditMessage() {
    if (!editTarget || !editValue.trim() || isSending) return;
    const targetIndex = messagesRef.current.findIndex((message) => message.id === editTarget.id);
    const hasLaterMessages = targetIndex >= 0 && targetIndex < messagesRef.current.length - 1;
    if (hasLaterMessages && !showEditConfirmation) { setShowEditConfirmation(true); return; }
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/chat/messages/${editTarget.id}`, { method: "PATCH", body: JSON.stringify({ action: "truncate" }) });
      const payload = await response.json() as { error?: { message: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "No pudimos editar este mensaje.");
      setMessages((current) => current.slice(0, targetIndex));
      const revised = editValue.trim();
      setEditTarget(null);
      setShowEditConfirmation(false);
      await sendMessage(null, revised);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos editar este mensaje.");
    }
  }

  async function rateMessage(message: StoredChatMessage, rating: Exclude<MessageRating, null>, reason: string | null = null) {
    const previous = feedbackByMessage[message.id] ?? null;
    setFeedbackByMessage((current) => ({ ...current, [message.id]: rating }));
    if (rating === "not_helpful" && reason === null) setFeedbackReasonTarget(message.id);
    try {
      const response = await authenticatedFetch(`/api/chat/messages/${message.id}`, { method: "PATCH", body: JSON.stringify({ action: "feedback", rating, reason }) });
      if (!response.ok) throw new Error("Feedback failed");
    } catch {
      setFeedbackByMessage((current) => ({ ...current, [message.id]: previous }));
      setError("No pudimos guardar tu valoración.");
    }
  }

  function responseAction(message: StoredChatMessage, action: ResponseAction) {
    const reference = message.content.replace(/\s+/g, " ").slice(0, 180);
    void sendMessage(null, `${responseInstructions[action]} Toma como referencia la respuesta que comienza así: “${reference}”.`);
  }

  function editPreviousMessage(message: StoredChatMessage) {
    const parent = messagesRef.current.find((item) => item.id === message.parentMessageId);
    if (parent) openEditMessage(parent);
  }

  async function regenerateResponse(message: StoredChatMessage) {
    if (isSending || regeneratingId) return;
    const previous = message;
    let regeneratedPartial = "";
    setRegeneratingId(message.id);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/chat/messages/${message.id}/regenerate`, { method: "POST" });
      if (!response.ok || !response.body) {
        const payload = await response.json() as { error?: { message: string } };
        throw new Error(payload.error?.message ?? "CEO no pudo regenerar esta respuesta.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let started = false;
      const processEvent = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as { type: string; delta?: string; assistantMessage?: StoredChatMessage; remainingQuestions?: number | null; message?: string };
        if (event.type === "delta" && event.delta) {
          regeneratedPartial += event.delta;
          started = true;
          setMessages((current) => current.map((item) => item.id === message.id ? { ...item, content: regeneratedPartial, status: "streaming" } : item));
        }
        if (event.type === "completed" && event.assistantMessage) {
          setMessages((current) => current.map((item) => item.id === message.id ? event.assistantMessage! : item));
          if (event.remainingQuestions !== undefined) setRemainingQuestions(event.remainingQuestions);
          setResponseAnnouncement("CEO terminó de regenerar la respuesta.");
        }
        if (event.type === "failed") throw new Error(event.message ?? "CEO no pudo regenerar esta respuesta.");
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processEvent(line);
        if (done) break;
      }
      processEvent(buffer);
      if (!started) throw new Error("CEO no pudo regenerar esta respuesta.");
    } catch (caughtError) {
      setMessages((current) => current.map((item) => item.id === previous.id
        ? regeneratedPartial.trim()
          ? { ...previous, content: regeneratedPartial, status: "interrupted" }
          : previous
        : item));
      setError(caughtError instanceof Error ? caughtError.message : "CEO no pudo regenerar esta respuesta.");
    } finally { setRegeneratingId(null); }
  }

  async function loadOlderMessages() {
    const first = messagesRef.current[0];
    if (!selectedId || !first || isLoadingOlder) return;
    const container = messagesContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    setIsLoadingOlder(true);
    try {
      const response = await authenticatedFetch(`/api/chat/history?conversationId=${encodeURIComponent(selectedId)}&before=${encodeURIComponent(first.createdAt)}`);
      const payload = await response.json() as HistoryResponse;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No pudimos cargar mensajes anteriores.");
      setMessages((current) => [...payload.data!.messages, ...current]);
      setHasOlderMessages(payload.data.hasMore);
      setFeedbackByMessage((current) => ({ ...current, ...Object.fromEntries(payload.data!.feedback.map((item) => [item.message_id, item.rating])) }));
      window.requestAnimationFrame(() => { if (container) container.scrollTop = container.scrollHeight - previousHeight; });
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "No pudimos cargar mensajes anteriores."); }
    finally { setIsLoadingOlder(false); }
  }

  function jumpToEnd() {
    const container = messagesContainerRef.current;
    if (!container) return;
    isNearBottomRef.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    setShowJumpToEnd(false);
  }

  const conversationPanel = (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-950/[0.08] bg-white">
      <div className="border-b border-slate-950/[0.08] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black">Conversaciones</h2>
          <div className="flex items-center gap-1">
            <button aria-label="Nueva conversación general" className="grid h-9 w-9 place-items-center rounded-full text-violet-700 transition hover:bg-violet-50" onClick={startNewConversation} title="Nueva conversación" type="button"><Plus size={19} /></button>
            <button aria-label="Cerrar conversaciones" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 lg:hidden" onClick={() => setIsConversationPanelOpen(false)} type="button"><X size={18} /></button>
          </div>
        </div>
        <label className="relative mt-4 block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="h-10 w-full rounded-[12px] border border-slate-950/[0.08] bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-violet-300" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversación" value={query} />
        </label>
        <div className="mt-3 grid grid-cols-4 rounded-[12px] bg-slate-50 p-1 text-[11px] font-bold">
          {(["all", "book", "general", "archived"] as FilterKey[]).map((item) => (
            <button className={cn("rounded-[9px] px-1 py-2 text-slate-500", filter === item && "bg-white text-violet-700")} key={item} onClick={() => setFilter(item)} type="button">{item === "all" ? "Todas" : item === "book" ? "Libros" : item === "general" ? "General" : "Archivo"}</button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoadingConversations ? <div className="grid h-24 place-items-center text-slate-400"><Loader2 className="animate-spin" size={20} /></div> : null}
        {!isLoadingConversations && filteredConversations.length === 0 ? <div className="p-5 text-center text-sm leading-6 text-slate-500">No hay conversaciones en esta vista.</div> : null}
        {!isLoadingConversations ? filteredConversations.map((conversation) => (
          <div className="relative flex items-center" key={conversation.id}>
            <button className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-[14px] p-3 pr-10 text-left transition hover:bg-slate-50", selected.id === conversation.id && "bg-violet-50")} disabled={conversation.optimistic} onClick={() => selectConversation(conversation.id)} type="button">
              {conversation.book ? <BookAvatar book={conversation.book} /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-violet-100 text-violet-700"><MessageSquare size={20} /></span>}
              <span className="min-w-0 flex-1"><span className="line-clamp-2 block text-sm font-black leading-5">{conversation.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{conversation.book?.author ?? "Preguntas generales"}</span></span>
            </button>
            {!conversation.optimistic ? (
              <button aria-label={`Opciones de ${conversation.title}`} className="absolute right-1 grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700" onClick={() => setOpenActionKey((current) => current === conversation.id ? null : conversation.id)} type="button"><MoreHorizontal size={18} /></button>
            ) : null}
            {openActionKey === conversation.id ? (
              <div className="absolute right-2 top-12 z-20 w-40 rounded-[12px] border border-slate-950/[0.08] bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                <button className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setOpenActionKey(null); setRenameTarget(conversation); setRenameTitle(conversation.title); }} type="button"><Pencil size={16} />Renombrar</button>
                <button className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => void updateConversation(conversation, conversation.status === "archived" ? "restore" : "archive")} type="button">{conversation.status === "archived" ? <RotateCcw size={16} /> : <Archive size={16} />}{conversation.status === "archived" ? "Restaurar" : "Archivar"}</button>
                <button className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50" onClick={() => { setOpenActionKey(null); setDeleteTarget(conversation); }} type="button"><Trash2 size={16} />Eliminar</button>
              </div>
            ) : null}
          </div>
        )) : null}
      </div>
    </aside>
  );

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#fbfaf8] pl-0 text-slate-950 sm:pl-[var(--dashboard-sidebar-offset,84px)]">
      <DashboardSidebar active="chat" tone="light" />
      <section className="flex h-full min-h-0 w-full flex-col px-4 pb-4 pt-6 sm:px-6 lg:px-7">
        <header className="flex items-center justify-between gap-3 pb-5 pl-16 sm:gap-4 sm:pl-0">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Chat con CEO</h1>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">Conversa con CEO dentro del contexto de Ceoteca.</p>
          </div>
          <div className="flex items-center gap-3"><NotificationBell tone="light" /><DashboardAccountMenu /></div>
        </header>

        <div className="relative grid min-h-0 flex-1 overflow-hidden rounded-[20px] border border-slate-950/[0.08] bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="hidden min-h-0 lg:block">{conversationPanel}</div>
          {isConversationPanelOpen ? <div className="fixed inset-0 z-[90] bg-slate-950/25 lg:hidden" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsConversationPanelOpen(false); }}><div className="h-full w-[min(88vw,340px)]">{conversationPanel}</div></div> : null}

          <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <header className="flex items-center gap-3 border-b border-slate-950/[0.08] px-4 py-3 transition-opacity duration-200 motion-reduce:transition-none sm:px-6">
              <button aria-label="Abrir conversaciones" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/[0.08] lg:hidden" onClick={() => setIsConversationPanelOpen(true)} type="button"><Menu size={19} /></button>
              {selected.book ? <BookAvatar book={selected.book} /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-violet-100 text-violet-700"><Bot size={21} /></span>}
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black sm:text-base">{selected.title}</h2><p className="truncate text-xs text-slate-500">{selected.book ? `Contexto exclusivo de ${selected.book.title}` : "Negocios, productividad, lectura y desarrollo personal"}</p></div>
              {selected.status === "archived" ? <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">Archivado</span> : null}
              {remainingQuestions !== null && canUseChat ? <span className="hidden rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 sm:block">{remainingQuestions} preguntas disponibles</span> : null}
            </header>
            <ChatConnectionStatus onRetry={() => void connectivity.probe()} state={connectivity.state} />
            {otherTabGenerating ? (
              <div aria-live="polite" className="border-b border-violet-100 bg-violet-50 px-4 py-2 text-center text-xs font-bold text-violet-800">
                Esta conversación está activa en otra pestaña.
              </div>
            ) : null}
            {sessionExpired ? (
              <div aria-live="assertive" className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900">
                <span>Tu sesión ha expirado. Tu borrador está guardado.</span>
                <Link className="rounded-[8px] bg-violet-700 px-3 py-2 text-white" href={`/login?next=${encodeURIComponent(selectedId ? `/chat/${selectedId}` : "/chat")}`}>Iniciar sesión</Link>
              </div>
            ) : null}

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-7"
              onScroll={(event) => {
                const element = event.currentTarget;
                isNearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
                if (isNearBottomRef.current) setShowJumpToEnd(false);
              }}
              ref={messagesContainerRef}
            >
              {isLoadingHistory ? <div className="grid h-full place-items-center text-slate-400"><Loader2 className="animate-spin" size={24} /></div> : null}
              {!isLoadingHistory && error && selectedId && messages.length === 0 ? (
                <div className="mx-auto grid h-full max-w-md content-center text-center">
                  <h2 className="text-xl font-black">No pudimos abrir la conversación</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button className="min-h-11 rounded-[11px] bg-violet-700 px-4 text-sm font-black text-white" onClick={() => setSyncVersion((current) => current + 1)} type="button">Reintentar</button>
                    <button className="min-h-11 rounded-[11px] border border-slate-200 px-4 text-sm font-black text-slate-700" onClick={resetToNewConversation} type="button">Volver al inicio</button>
                  </div>
                </div>
              ) : null}
              {!isLoadingHistory && !canUseChat ? <div className="mx-auto grid h-full max-w-md content-center text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-violet-50 text-violet-700"><Sparkles size={25} /></span><h2 className="mt-5 text-2xl font-black">CEO está disponible desde Pro</h2><p className="mt-3 text-sm leading-6 text-slate-500">Desbloquea conversaciones generales y una IA contextual para cada análisis.</p><Link className="mx-auto mt-6 inline-flex min-h-11 items-center rounded-[12px] bg-violet-700 px-5 text-sm font-black text-white" href="/planes">Ver planes</Link></div> : null}
              {!isLoadingHistory && !error && canUseChat && messages.length === 0 ? (
                <div className="mx-auto grid h-full w-full max-w-3xl content-center py-6 text-center">
                  <div className="transition-all duration-200 motion-reduce:transition-none">
                    <Sparkles className="mx-auto text-violet-700" size={34} />
                    <h2 className="mt-4 text-2xl font-black sm:text-3xl">{selectedId ? "Esta conversación todavía no tiene mensajes." : "¿En qué quieres trabajar hoy?"}</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      {selectedId
                        ? "Puedes comenzar de nuevo sin perder esta conversación."
                        : selected.book
                        ? `CEO puede ayudarte a comprender y aplicar las ideas autorizadas de ${selected.book.title}.`
                        : "CEO puede ayudarte a analizar ideas, resolver problemas y convertir tus objetivos en acciones concretas."}
                    </p>
                    {selectedId ? <button className="mt-5 min-h-11 rounded-[12px] bg-violet-700 px-5 text-sm font-black text-white" onClick={() => inputRef.current?.focus()} type="button">Escribir el primer mensaje</button> : null}
                    {!selectedId ? <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                      {suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          className="rounded-[12px] border border-slate-950/[0.08] px-4 py-3 text-sm font-bold leading-5 text-slate-700 transition-colors hover:border-violet-200 hover:bg-violet-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 motion-reduce:transition-none"
                          key={suggestion.id}
                          onClick={() => selectStarterPrompt(suggestion.id, suggestion.prompt)}
                          type="button"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div> : null}
                  </div>
                  <ChatComposer
                    className="mt-5 text-left"
                    disabled={Boolean(composerDisabledReason)}
                    disabledReason={composerDisabledReason}
                    isStreaming={isSending && streamHasStarted}
                    isSubmitting={isSending && !streamHasStarted}
                    locked={Boolean(composerLockedReason)}
                    lockedReason={composerLockedReason}
                    onChange={setInput}
                    onStop={stopResponse}
                    onSubmit={() => void sendMessage()}
                    placeholder={selected.type === "book" ? "Pregunta sobre este análisis…" : undefined}
                    textareaRef={inputRef}
                    value={input}
                  />
                  {sendFailure ? <div className="mt-3"><SendFailurePanel failure={sendFailure} onDismiss={() => setSendFailure(null)} onEdit={() => editFailedMessage(sendFailure)} onRetry={() => void sendMessage(sendFailure)} /></div> : null}
                </div>
              ) : null}
              {!isLoadingHistory && canUseChat && messages.length > 0 ? (
                <div className="mx-auto grid max-w-3xl gap-4">
                  {hasOlderMessages ? <button className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50" disabled={isLoadingOlder} onClick={() => void loadOlderMessages()} type="button">{isLoadingOlder ? <Loader2 className="animate-spin" size={16} /> : null}Cargar mensajes anteriores</button> : null}
                  {messages.map((message, index) => {
                    const showDay = index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                    const transientFailure = message.status === "failed" && message.id.startsWith("stream:") ? sendFailure : null;
                    return <Fragment key={message.id}>{showDay ? <div className="flex items-center gap-3 py-2 text-[11px] font-bold text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>{messageDayLabel(message.createdAt)}</span><span className="h-px flex-1 bg-slate-200" /></div> : null}<ChatMessageItem isGenerating={isSending || regeneratingId !== null} message={message} onContinue={() => void sendMessage(null, "Continúa la respuesta anterior desde donde se detuvo, sin repetir lo ya explicado.")} onDeleteUser={deleteFailedUserMessage} onEditPrevious={transientFailure ? () => editFailedMessage(transientFailure) : editPreviousMessage} onEditUser={openEditMessage} onRate={(item, rating) => void rateMessage(item, rating)} onRegenerate={transientFailure ? () => void sendMessage(transientFailure) : (item) => void regenerateResponse(item)} onResendUser={retryUserMessage} onResponseAction={responseAction} rating={feedbackByMessage[message.id]} /></Fragment>;
                  })}
                </div>
              ) : null}
              <span aria-live="polite" className="sr-only">{responseAnnouncement}</span>
            </div>
            {showJumpToEnd ? <button className="absolute bottom-28 right-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700" onClick={jumpToEnd} type="button"><ArrowDown size={16} />Ir al final</button> : null}

            {messages.length > 0 ? <footer className="border-t border-slate-950/[0.08] bg-white px-3 py-3 sm:px-6 sm:py-4">
              {error ? <p className="mx-auto mb-3 max-w-3xl rounded-[10px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
              {sendFailure ? <div className="mx-auto mb-3 max-w-3xl"><SendFailurePanel failure={sendFailure} onDismiss={() => setSendFailure(null)} onEdit={() => editFailedMessage(sendFailure)} onRetry={() => void sendMessage(sendFailure)} /></div> : null}
              {!input && !isSending && followUpSuggestions.length > 0 ? (
                <div aria-label="Sugerencias para continuar" className="mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto pb-1">
                  {followUpSuggestions.slice(0, 3).map((suggestion) => (
                    <button
                      className="min-h-10 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-violet-200 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        window.requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
              {remainingQuestions !== null && remainingQuestions > 0 && remainingQuestions <= chatLowRemainingThreshold ? (
                <p className="mx-auto mb-2 max-w-3xl text-xs font-semibold text-amber-700">
                  Te quedan {remainingQuestions} {remainingQuestions === 1 ? "consulta" : "consultas"} este mes.
                </p>
              ) : null}
              <ChatComposer
                className="mx-auto max-w-3xl"
                disabled={Boolean(composerDisabledReason)}
                disabledReason={composerDisabledReason}
                isStreaming={isSending && streamHasStarted}
                isSubmitting={isSending && !streamHasStarted}
                locked={Boolean(composerLockedReason)}
                lockedReason={composerLockedReason}
                onChange={setInput}
                onStop={stopResponse}
                onSubmit={() => void sendMessage()}
                placeholder={selected.type === "book" ? "Pregunta sobre este análisis…" : "Cuéntale a CEO qué quieres resolver…"}
                textareaRef={inputRef}
                value={input}
              />
              <p className="mt-2 text-center text-[11px] text-slate-400">CEO puede cometer errores. Verifica la información importante.</p>
            </footer> : null}
          </section>
        </div>
      </section>
      {editTarget ? (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/30 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) { setEditTarget(null); setShowEditConfirmation(false); } }} role="presentation">
          <section aria-labelledby="edit-message-title" aria-modal="true" className="w-full max-w-xl rounded-[18px] border border-slate-200 bg-white p-5" role="dialog">
            <h2 className="text-xl font-black" id="edit-message-title">{showEditConfirmation ? "¿Editar este mensaje?" : "Editar mensaje"}</h2>
            {showEditConfirmation ? <p className="mt-2 text-sm leading-6 text-slate-600">Las respuestas posteriores se reemplazarán a partir de este punto.</p> : <textarea autoFocus className="mt-4 min-h-32 w-full resize-y rounded-[12px] border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" maxLength={2_000} onChange={(event) => setEditValue(event.target.value)} value={editValue} />}
            <div className="mt-5 flex justify-end gap-3">
              <button className="min-h-11 rounded-[11px] border border-slate-200 px-4 text-sm font-black text-slate-700" onClick={() => { if (showEditConfirmation) setShowEditConfirmation(false); else setEditTarget(null); }} type="button">Cancelar</button>
              <button className="min-h-11 rounded-[11px] bg-violet-700 px-4 text-sm font-black text-white disabled:opacity-50" disabled={!editValue.trim() || isSending} onClick={() => void confirmEditMessage()} type="button">{showEditConfirmation ? "Editar y continuar" : "Guardar y volver a enviar"}</button>
            </div>
          </section>
        </div>
      ) : null}
      {feedbackReasonTarget ? (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/20 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setFeedbackReasonTarget(null); }} role="presentation">
          <section aria-labelledby="feedback-reason-title" aria-modal="true" className="w-full max-w-sm rounded-[18px] border border-slate-200 bg-white p-5" role="dialog">
            <h2 className="text-lg font-black" id="feedback-reason-title">¿Qué podríamos mejorar?</h2>
            <p className="mt-1 text-sm text-slate-500">Responder es opcional.</p>
            <div className="mt-4 grid gap-2">{([['not_answered','No respondió mi pregunta'],['too_generic','Fue demasiado genérica'],['incorrect','Fue incorrecta'],['hard_to_understand','Fue difícil de entender'],['other','Otro motivo']] as const).map(([reason,label]) => <button className="min-h-11 rounded-[10px] border border-slate-200 px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" key={reason} onClick={() => { const target = messagesRef.current.find((message) => message.id === feedbackReasonTarget); setFeedbackReasonTarget(null); if (target) void rateMessage(target, "not_helpful", reason); }} type="button">{label}</button>)}</div>
            <button className="mt-3 min-h-11 w-full rounded-[10px] text-sm font-black text-slate-600 hover:bg-slate-50" onClick={() => setFeedbackReasonTarget(null)} type="button">Omitir</button>
          </section>
        </div>
      ) : null}
      {renameTarget ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/30 p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setRenameTarget(null); }}>
          <form aria-labelledby="rename-chat-title" aria-modal="true" className="w-full max-w-md rounded-[20px] border border-slate-950/[0.08] bg-white p-6" onSubmit={(event) => { event.preventDefault(); const title = renameTitle.trim(); if (title) void updateConversation(renameTarget, "rename", title); }} role="dialog">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-violet-700"><Pencil size={21} /></span>
            <h2 className="mt-5 text-xl font-black" id="rename-chat-title">Renombrar conversación</h2>
            <label className="mt-5 block text-sm font-bold" htmlFor="conversation-title">Título</label>
            <input autoFocus className="mt-2 h-12 w-full rounded-[12px] border border-slate-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" id="conversation-title" maxLength={120} onChange={(event) => setRenameTitle(event.target.value)} value={renameTitle} />
            <div className="mt-6 flex justify-end gap-3">
              <button className="min-h-11 rounded-[12px] border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50" disabled={isUpdatingConversation} onClick={() => setRenameTarget(null)} type="button">Cancelar</button>
              <button className="min-h-11 rounded-[12px] bg-violet-700 px-4 text-sm font-black text-white hover:bg-violet-800 disabled:opacity-50" disabled={isUpdatingConversation || !renameTitle.trim()} type="submit">Guardar</button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteTarget ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/30 p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDeleteTarget(null); }}>
          <section aria-labelledby="delete-chat-title" aria-modal="true" className="w-full max-w-md rounded-[20px] border border-slate-950/[0.08] bg-white p-6" role="dialog">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600"><Trash2 size={22} /></span>
            <h2 className="mt-5 text-xl font-black" id="delete-chat-title">Eliminar conversación</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Se eliminará permanentemente el historial de <strong className="text-slate-950">{deleteTarget.title}</strong>. Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="min-h-11 rounded-[12px] border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50" disabled={isUpdatingConversation} onClick={() => setDeleteTarget(null)} type="button">Cancelar</button>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50" disabled={isUpdatingConversation} onClick={() => void updateConversation(deleteTarget, "delete")} type="button">{isUpdatingConversation ? <Loader2 className="animate-spin" size={16} /> : null}Eliminar</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
