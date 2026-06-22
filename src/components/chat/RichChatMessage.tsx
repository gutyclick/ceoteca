import { Fragment } from "react";

function renderInlineText(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong className="font-semibold text-white" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export function RichChatMessage({ content }: { content: string }) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 text-[15px] leading-7">
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,3}\s+(.+)$/);
        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        const bullet = line.match(/^[-*]\s+(.+)$/);

        if (heading) {
          return (
            <h3
              className="pt-1 text-base font-semibold leading-6 text-white"
              key={`${line}-${index}`}
            >
              {renderInlineText(heading[1])}
            </h3>
          );
        }

        if (numbered) {
          return (
            <div className="grid grid-cols-[28px_1fr] gap-3" key={`${line}-${index}`}>
              <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-brand-purple/25 text-xs font-semibold text-brand-purple">
                {numbered[1]}
              </span>
              <p className="min-w-0 text-text-primary">{renderInlineText(numbered[2])}</p>
            </div>
          );
        }

        if (bullet) {
          return (
            <div className="grid grid-cols-[18px_1fr] gap-3" key={`${line}-${index}`}>
              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-brand-purple" />
              <p className="min-w-0 text-text-primary">{renderInlineText(bullet[1])}</p>
            </div>
          );
        }

        return (
          <p className="text-text-primary" key={`${line}-${index}`}>
            {renderInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}
