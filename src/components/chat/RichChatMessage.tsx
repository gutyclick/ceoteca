import { Fragment } from "react";

import { cn } from "@/lib/utils/cn";

type RichChatMessageTone = "dark" | "light";

function renderInlineText(value: string, tone: RichChatMessageTone) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          className={cn("font-semibold", tone === "light" ? "text-slate-950" : "text-white")}
          key={`${part}-${index}`}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export function RichChatMessage({
  content,
  tone = "dark",
}: {
  content: string;
  tone?: RichChatMessageTone;
}) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-3 text-[15px] leading-7",
        tone === "light" ? "text-slate-700" : "text-text-primary",
      )}
    >
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,3}\s+(.+)$/);
        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        const bullet = line.match(/^[-*]\s+(.+)$/);

        if (heading) {
          return (
            <h3
              className={cn(
                "pt-1 text-base font-semibold leading-6",
                tone === "light" ? "text-slate-950" : "text-white",
              )}
              key={`${line}-${index}`}
            >
              {renderInlineText(heading[1], tone)}
            </h3>
          );
        }

        if (numbered) {
          return (
            <div className="grid grid-cols-[28px_1fr] gap-3" key={`${line}-${index}`}>
              <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-brand-purple/25 text-xs font-semibold text-brand-purple">
                {numbered[1]}
              </span>
              <p className={cn("min-w-0", tone === "light" ? "text-slate-700" : "text-text-primary")}>
                {renderInlineText(numbered[2], tone)}
              </p>
            </div>
          );
        }

        if (bullet) {
          return (
            <div className="grid grid-cols-[18px_1fr] gap-3" key={`${line}-${index}`}>
              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-brand-purple" />
              <p className={cn("min-w-0", tone === "light" ? "text-slate-700" : "text-text-primary")}>
                {renderInlineText(bullet[1], tone)}
              </p>
            </div>
          );
        }

        return (
          <p
            className={cn(tone === "light" ? "text-slate-700" : "text-text-primary")}
            key={`${line}-${index}`}
          >
            {renderInlineText(line, tone)}
          </p>
        );
      })}
    </div>
  );
}
