"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function nodeText(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (isValidElement<{ children?: ReactNode }>(child)) return nodeText(child.props.children);
    return "";
  }).join("");
}

function CodeBlock({ className, children }: { className?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = className?.match(/language-([\w-]+)/)?.[1] ?? "código";
  const code = nodeText(children).replace(/\n$/, "");

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  if (!className) {
    return <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-violet-800">{children}</code>;
  }

  return (
    <div className="my-4 min-w-0 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex min-h-10 items-center justify-between border-b border-white/10 px-3 text-xs text-slate-300">
        <span>{language}</span>
        <button aria-label="Copiar código" className="inline-flex min-h-9 items-center gap-1.5 rounded-[8px] px-2 hover:bg-white/10" onClick={() => void copyCode()} type="button">
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-[13px] leading-6"><code>{code}</code></pre>
      <span aria-live="polite" className="sr-only">{copied ? "Copiado" : ""}</span>
    </div>
  );
}

export function SafeMarkdown({ content }: { content: string }) {
  return (
    <div className="chat-markdown min-w-0 text-[15px] leading-7 text-slate-700">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => <a className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900" href={href} rel="noopener noreferrer" target="_blank">{children}</a>,
          blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-violet-300 pl-4 text-slate-600">{children}</blockquote>,
          code: ({ className, children }) => <CodeBlock className={className}>{children}</CodeBlock>,
          h1: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-black text-slate-950">{children}</h2>,
          h2: ({ children }) => <h3 className="mb-2 mt-5 text-base font-black text-slate-950">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-2 mt-4 text-[15px] font-black text-slate-950">{children}</h4>,
          hr: () => <hr className="my-5 border-slate-200" />,
          li: ({ children }) => <li className="pl-1 marker:text-violet-600">{children}</li>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-6">{children}</ol>,
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => <div className="my-4 max-w-full overflow-x-auto rounded-[12px] border border-slate-200"><table className="min-w-[520px] w-full border-collapse text-left text-sm">{children}</table></div>,
          td: ({ children }) => <td className="border-t border-slate-200 px-3 py-2.5 align-top">{children}</td>,
          th: ({ children }) => <th className="bg-slate-50 px-3 py-2.5 font-black text-slate-950">{children}</th>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-6">{children}</ul>,
        }}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
