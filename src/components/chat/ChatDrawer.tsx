'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatTurn } from '@/types';

const suggestions = [
  'Explícame la idea principal con un ejemplo.',
  '¿Cómo aplico esto si tengo poco tiempo?',
  'Convierte este concepto en un plan de 7 días.',
  '¿Cuáles son las principales limitaciones?',
];

export function ChatDrawer({
  bookId,
  title,
  open,
  onClose,
}: {
  bookId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<ChatTurn[]>([
    { role: 'assistant', content: 'Hola, puedo ayudarte con este análisis demo de Ceoteca.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  async function send(text = message) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextConversation = [...items, { role: 'user' as const, content: trimmed }];
    setItems(nextConversation);
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookId, message: trimmed, conversation: nextConversation }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo responder.');
      }

      setItems([...nextConversation, { role: 'assistant', content: data.message ?? 'Sin respuesta.' }]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Error inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" role="dialog" aria-modal="true">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-[#0b0b14] p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Habla con este libro</h2>
            <p className="text-sm text-zinc-400">{title} · Plan Pro · 50 restantes</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar chat">
            <X />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="focus-ring rounded-full bg-white/10 px-3 py-2 text-sm"
              onClick={() => void send(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto" aria-live="polite">
          {items.map((item, index) => (
            <p
              key={`${item.role}-${index}`}
              className={`max-w-[85%] rounded-2xl p-3 ${
                item.role === 'user' ? 'ml-auto bg-violet-600' : 'bg-white/10'
              }`}
            >
              {item.content}
            </p>
          ))}
          {isLoading && <p className="text-sm text-zinc-400">Escribiendo...</p>}
          {error && <p className="text-sm text-pink-300">{error}</p>}
        </div>

        <div className="mt-3 flex justify-between text-sm text-zinc-400">
          <button type="button" className="underline" onClick={() => setItems([])}>
            Limpiar conversación
          </button>
          {error && (
            <button type="button" className="underline" onClick={() => void send()}>
              Reintentar
            </button>
          )}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label className="sr-only" htmlFor="chat-message">
            Mensaje para el libro
          </label>
          <input
            id="chat-message"
            className="focus-ring flex-1 rounded-2xl bg-white/10 p-3"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={600}
            placeholder="Escribe tu pregunta..."
          />
          <button className="focus-ring rounded-2xl bg-white px-4 font-bold text-black" disabled={isLoading}>
            Enviar
          </button>
        </form>
      </aside>
    </div>
  );
}
