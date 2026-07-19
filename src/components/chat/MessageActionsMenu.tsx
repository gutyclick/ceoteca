"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export type MessageMenuAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
};

export function MessageActionsMenu({ label, actions }: { label: string; actions: MessageMenuAction[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: Math.min(rect.bottom + 6, window.innerHeight - 280), left: Math.max(12, Math.min(rect.right - 220, window.innerWidth - 232)) });
    window.setTimeout(() => menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 0);
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    if (items.length === 0) return;
    event.preventDefault();
    const current = Math.max(0, items.indexOf(document.activeElement as HTMLButtonElement));
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <>
      <button aria-expanded={open} aria-haspopup="menu" aria-label={label} className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600" onClick={() => setOpen((value) => !value)} ref={buttonRef} type="button"><MoreHorizontal size={18} /></button>
      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed z-[160] w-[220px] rounded-[12px] border border-slate-200 bg-white p-1.5" onKeyDown={moveFocus} ref={menuRef} role="menu" style={position}>
          {actions.map((action) => <button className={`flex min-h-11 w-full items-center gap-2 rounded-[9px] px-3 text-left text-sm font-semibold ${action.danger ? "text-rose-700 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"}`} key={action.id} onClick={() => { setOpen(false); action.onSelect(); }} role="menuitem" type="button">{action.icon}{action.label}</button>)}
        </div>, document.body,
      ) : null}
    </>
  );
}
