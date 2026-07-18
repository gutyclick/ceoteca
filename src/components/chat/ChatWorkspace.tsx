"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Archive,
  BookOpen,
  Bot,
  LibraryBig,
  Loader2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { plans, type PlanKey } from "@/config/plans";
import type { ChatConversation, StoredChatMessage } from "@/lib/chat/model";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/types";

type ChatMessage = Pick<StoredChatMessage, "id" | "role" | "content" | "status">;
type Conversation = ChatConversation & { book: Book | null; optimistic?: boolean };
type FilterKey = "all" | "book" | "general" | "archived";

type HistoryResponse = {
  data?: {
    conversation: ChatConversation | null;
    messages: StoredChatMessage[];
    remainingQuestions: number | null;
    usage: { questionCount: number; limit: number | null };
  };
  error?: { message: string };
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
  error?: { message: string };
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

const generalSuggestions = [
  "Recomiéndame una ruta para mejorar mi productividad.",
  "¿Qué análisis me conviene leer para validar una idea de negocio?",
  "Ayúdame a crear un hábito de lectura sostenible.",
];

const bookSuggestions = [
  "Explícame la idea más importante de este análisis.",
  "Dame un ejemplo práctico para aplicar esta semana.",
  "Crea un plan de acción sencillo con estas ideas.",
];

function getFirstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Lector";
}

function formatInline(value: string): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong className="font-black text-slate-950" key={`${part}-${index}`}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n").filter((line, index, all) => line.trim() || all[index - 1]?.trim());

  return (
    <div className="grid gap-2 text-sm leading-7 sm:text-[15px]">
      {lines.map((line, index) => {
        const value = line.trim();
        if (!value) return <span className="h-1" key={`space-${index}`} />;
        if (/^#{1,3}\s/.test(value)) {
          return <h3 className="mt-2 text-base font-black text-slate-950" key={`${value}-${index}`}>{formatInline(value.replace(/^#{1,3}\s/, ""))}</h3>;
        }
        if (/^[-*]\s/.test(value)) {
          return <p className="grid grid-cols-[8px_1fr] gap-3" key={`${value}-${index}`}><span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-violet-500" /><span>{formatInline(value.replace(/^[-*]\s/, ""))}</span></p>;
        }
        if (/^\d+[.)]\s/.test(value)) {
          const number = value.match(/^\d+/)?.[0] ?? "";
          return <p className="grid grid-cols-[24px_1fr] gap-2" key={`${value}-${index}`}><span className="font-black text-violet-700">{number}.</span><span>{formatInline(value.replace(/^\d+[.)]\s/, ""))}</span></p>;
        }
        return <p key={`${value}-${index}`}>{formatInline(value)}</p>;
      })}
    </div>
  );
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

export function ChatWorkspace({ books, initialConversationId = null }: { books: Book[]; initialConversationId?: string | null }) {
  const router = useRouter();
  const bookById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [fullName, setFullName] = useState("Lector");
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const creationKeyRef = useRef(crypto.randomUUID());
  const selected = conversations.find((item) => item.id === selectedId) ?? draftConversation;
  const canUseChat = plans[plan].features.includes("chat");
  const canSendMessages = canUseChat && selected.status === "active";
  const suggestions = selected.type === "general" ? generalSuggestions : bookSuggestions;

  const filteredConversations = conversations.filter((conversation) => {
    const matchesArchive = filter === "archived" ? conversation.status === "archived" : conversation.status === "active";
    const matchesFilter = filter === "all" || filter === "archived" || conversation.type === filter;
    const searchTarget = `${conversation.title} ${conversation.book?.author ?? "general"}`.toLocaleLowerCase("es");
    return matchesArchive && matchesFilter && searchTarget.includes(query.trim().toLocaleLowerCase("es"));
  });

  useEffect(() => {
    setSelectedId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      const supabase = createBrowserSupabaseClient();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (!userData.user || !isMounted) return;
      const token = sessionData.session?.access_token;
      const [profileResponse, subscriptionsResponse] = await Promise.all([
        supabase.from("profiles").select("full_name,plan").eq("id", userData.user.id).maybeSingle(),
        supabase.from("subscriptions").select("plan,status,updated_at").eq("user_id", userData.user.id).order("updated_at", { ascending: false }),
      ]);
      if (!isMounted) return;
      setFullName(profileResponse.data?.full_name ?? "Lector");
      setPlan(resolvePlanFromSubscriptions({ profilePlan: profileResponse.data?.plan ?? "free", subscriptions: subscriptionsResponse.data ?? [] }).plan);

      if (token) {
        const response = await fetch("/api/chat/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json()) as ConversationsResponse;
        if (isMounted && response.ok && payload.data) {
          const loaded = payload.data.conversations.map((conversation) => ({
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
    return () => { isMounted = false; };
  }, [bookById, initialConversationId]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setError(null);
      if (!selected.id) {
        setMessages([]);
        setIsLoadingHistory(false);
        return;
      }
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || !selected) return;
      const response = await fetch(`/api/chat/history?conversationId=${encodeURIComponent(selected.id)}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as HistoryResponse;
      if (!isMounted) return;
      if (!response.ok || !payload.data) {
        setMessages([]);
        setError(payload.error?.message ?? "No pudimos cargar esta conversación.");
      } else {
        setMessages(payload.data.messages.filter((message) => message.role === "user" || message.role === "assistant"));
        setRemainingQuestions(payload.data.remainingQuestions);
      }
      setIsLoadingHistory(false);
    }

    void loadHistory();
    return () => { isMounted = false; };
  }, [selected]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: messages.length > 0 ? "smooth" : "auto",
      });
    });
  }, [messages, isSending]);

  function selectConversation(id: string) {
    setSelectedId(id);
    router.push(`/chat/${id}`);
    setIsConversationPanelOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function startNewConversation() {
    creationKeyRef.current = crypto.randomUUID();
    setSelectedId(null);
    router.push("/chat");
    setMessages([]);
    setInput("");
    setError(null);
    setFilter("all");
    setIsConversationPanelOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 100);
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

  async function sendMessage() {
    const message = input.trim();
    if (!message || isSending || !selected || !canSendMessages) return;
    setInput("");
    setError(null);
    const clientMessageId = crypto.randomUUID();
    const optimisticMessage: ChatMessage = { id: clientMessageId, role: "user", content: message, status: "pending" };
    setMessages((current) => [...current, optimisticMessage]);
    setIsSending(true);
    const isNewConversation = !selected.id;
    const optimisticConversationId = `optimistic:${creationKeyRef.current}`;
    if (isNewConversation) {
      const now = new Date().toISOString();
      setConversations((current) => [{
        id: optimisticConversationId,
        userId: "",
        type: "general",
        bookId: null,
        title: "Nueva conversación",
        status: "active",
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        metadata: {},
        titleIsManual: false,
        book: null,
        optimistic: true,
      }, ...current]);
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected.type,
          bookId: selected.book?.slug,
          conversationId: selected.id ?? undefined,
          clientCreationKey: selected.id ? undefined : creationKeyRef.current,
          clientMessageId,
          message,
          conversation: messages
            .filter((item) => item.role === "user" || item.role === "assistant")
            .slice(-12)
            .map((item) => ({ role: item.role as "user" | "assistant", content: item.content })),
        }),
      });
      const payload = (await response.json()) as ChatResponse;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No pudimos generar una respuesta.");
      setMessages((current) => [
        ...current.map((item) => item.id === clientMessageId ? payload.data!.userMessage : item),
        payload.data!.assistantMessage,
      ]);
      setRemainingQuestions(payload.data.remainingQuestions);
      const persisted = { ...payload.data.conversation, book: payload.data.conversation.bookId ? bookById.get(payload.data.conversation.bookId) ?? null : null };
      setConversations((current) => [
        persisted,
        ...current.filter((item) => item.id !== optimisticConversationId && item.id !== persisted.id),
      ].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
      setSelectedId(persisted.id);
      router.replace(`/chat/${persisted.id}`);
    } catch (caughtError) {
      setMessages((current) => current.filter((item) => item.id !== clientMessageId));
      if (isNewConversation) {
        setConversations((current) => current.filter((item) => item.id !== optimisticConversationId));
      }
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos generar una respuesta.");
    } finally {
      setIsSending(false);
    }
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
        <header className="flex items-center justify-between gap-4 pb-5">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em]">Chat con CEO</h1>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">Conversa con CEO dentro del contexto de Ceoteca.</p>
          </div>
          <div className="flex items-center gap-3"><NotificationBell tone="light" /><DashboardAccountMenu /></div>
        </header>

        <div className="relative grid min-h-0 flex-1 overflow-hidden rounded-[20px] border border-slate-950/[0.08] bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="hidden min-h-0 lg:block">{conversationPanel}</div>
          {isConversationPanelOpen ? <div className="fixed inset-0 z-[90] bg-slate-950/25 lg:hidden" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsConversationPanelOpen(false); }}><div className="h-full w-[min(88vw,340px)]">{conversationPanel}</div></div> : null}

          <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <header className="flex items-center gap-3 border-b border-slate-950/[0.08] px-4 py-3 sm:px-6">
              <button aria-label="Abrir conversaciones" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/[0.08] lg:hidden" onClick={() => setIsConversationPanelOpen(true)} type="button"><Menu size={19} /></button>
              {selected.book ? <BookAvatar book={selected.book} /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-violet-100 text-violet-700"><Bot size={21} /></span>}
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black sm:text-base">{selected.title}</h2><p className="truncate text-xs text-slate-500">{selected.book ? `Contexto exclusivo de ${selected.book.title}` : "Negocios, productividad, lectura y desarrollo personal"}</p></div>
              {selected.status === "archived" ? <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">Archivado</span> : null}
              {remainingQuestions !== null && canUseChat ? <span className="hidden rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 sm:block">{remainingQuestions} preguntas disponibles</span> : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-7" ref={messagesContainerRef}>
              {isLoadingHistory ? <div className="grid h-full place-items-center text-slate-400"><Loader2 className="animate-spin" size={24} /></div> : null}
              {!isLoadingHistory && !canUseChat ? <div className="mx-auto grid h-full max-w-md content-center text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-violet-50 text-violet-700"><Sparkles size={25} /></span><h2 className="mt-5 text-2xl font-black">CEO está disponible desde Pro</h2><p className="mt-3 text-sm leading-6 text-slate-500">Desbloquea conversaciones generales y una IA contextual para cada análisis.</p><Link className="mx-auto mt-6 inline-flex min-h-11 items-center rounded-[12px] bg-violet-700 px-5 text-sm font-black text-white" href="/planes">Ver planes</Link></div> : null}
              {!isLoadingHistory && canUseChat && messages.length === 0 ? <div className="mx-auto grid h-full max-w-3xl content-center py-8 text-center"><Sparkles className="mx-auto text-violet-700" size={34} /><h2 className="mt-4 text-2xl font-black sm:text-3xl">¿En qué quieres trabajar hoy?</h2><p className="mt-2 text-sm leading-6 text-slate-500">{selected.book ? `Pregunta sobre las ideas, ejercicios y aplicaciones de ${selected.book.title}.` : `Hola, ${getFirstName(fullName)}. Puedes conversar sobre negocios, marketing, productividad, desarrollo personal o tu biblioteca.`}</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{suggestions.map((suggestion, index) => { const Icon = index === 0 ? LibraryBig : index === 1 ? Sparkles : Target; return <button className="rounded-[16px] border border-slate-950/[0.08] p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50" key={suggestion} onClick={() => { setInput(suggestion); inputRef.current?.focus(); }} type="button"><Icon className="text-violet-700" size={20} /><span className="mt-3 block text-sm font-bold leading-5">{suggestion}</span></button>; })}</div></div> : null}
              {!isLoadingHistory && canUseChat && messages.length > 0 ? <div className="mx-auto grid max-w-3xl gap-5">{messages.map((message, index) => message.role === "user" ? <div className="ml-auto max-w-[86%] rounded-[18px] rounded-br-[6px] bg-violet-600 px-4 py-3 text-sm leading-6 text-white sm:max-w-[72%]" key={`${message.role}-${index}`}>{message.content}</div> : <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3" key={`${message.role}-${index}`}><span className="grid h-9 w-9 place-items-center rounded-[12px] bg-violet-50 text-violet-700"><Sparkles size={18} /></span><div className="rounded-[18px] rounded-tl-[6px] bg-slate-50 px-4 py-4 text-slate-700"><MessageContent content={message.content} /></div></div>)}</div> : null}
              {isSending ? <div className="mx-auto mt-5 flex max-w-3xl items-center gap-3 text-sm text-slate-500"><span className="grid h-9 w-9 place-items-center rounded-[12px] bg-violet-50 text-violet-700"><Loader2 className="animate-spin" size={18} /></span>CEO está preparando una respuesta...</div> : null}
            </div>

            <footer className="border-t border-slate-950/[0.08] bg-white px-3 py-3 sm:px-6 sm:py-4">
              {error ? <p className="mx-auto mb-3 max-w-3xl rounded-[10px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
              <form className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_46px] items-end gap-2 rounded-[16px] border border-slate-950/[0.10] bg-white p-2 focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-50" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
                <textarea className="max-h-32 min-h-11 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 outline-none placeholder:text-slate-400" disabled={!canSendMessages || isSending} maxLength={2000} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={selected.status === "archived" ? "Restaura esta conversación para continuar" : selected.book ? "Pregunta sobre este análisis..." : "Escribe tu mensaje..."} ref={inputRef} rows={1} value={input} />
                <button aria-label="Enviar mensaje" className="grid h-11 w-11 place-items-center rounded-[13px] bg-violet-700 text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40" disabled={!canSendMessages || isSending || !input.trim()} type="submit"><Send size={18} /></button>
              </form>
              <p className="mt-2 text-center text-[11px] text-slate-400">CEO puede cometer errores. Verifica la información importante.</p>
            </footer>
          </section>
        </div>
      </section>
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
