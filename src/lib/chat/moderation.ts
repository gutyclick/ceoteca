import type { ChatContext } from "@/lib/chat/repository";

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: "unsafe" | "out_of_scope" };

const unsafePatterns = [
  /\b(suicid|autolesi|matarme|quitarme la vida)\b/i,
  /\b(explosivo|bomba|arma casera|veneno)\b/i,
  /\b(robar|hackear|phishing|malware|estafar)\b/i,
];

const bookReplacementPatterns = [
  /\b(cap[ií]tulo completo|texto completo|libro completo|copia exacta)\b/i,
  /\b(resumen completo de todo el libro|dame todo el contenido)\b/i,
];

const allowedSitePatterns = [
  /\b(libro|lectura|leer|an[aá]lisis|cat[aá]logo|recomienda|recomendaci[oó]n)\b/i,
  /\b(productividad|h[aá]bito|mentalidad|liderazgo|finanzas|negocio|emprend)\b/i,
  /\b(desarrollo personal|comunicaci[oó]n|negociaci[oó]n|marketing|ventas)\b/i,
  /\b(estrategia|empresa|innovaci[oó]n|tecnolog[ií]a|psicolog[ií]a|comportamiento)\b/i,
  /\b(aplicar|plan|rutina|enfoque|aprendizaje|comprar)\b/i,
];

export function moderateChatMessage(
  message: string,
  context: ChatContext,
): ModerationResult {
  const normalized = message.trim();

  if (unsafePatterns.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      code: "unsafe",
      reason:
        "No puedo ayudar con solicitudes peligrosas o dañinas. Puedo ayudarte a reformularlo hacia aprendizaje, lectura o decisiones prácticas.",
    };
  }

  if (bookReplacementPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      code: "out_of_scope",
      reason:
        "Ceoteca complementa la lectura, no reemplaza la obra original. Puedo ayudarte con ideas clave, aplicaciones prácticas o ejercicios.",
    };
  }

  if (
    context === "site" &&
    normalized.length > 25 &&
    !allowedSitePatterns.some((pattern) => pattern.test(normalized))
  ) {
    return {
      allowed: false,
      code: "out_of_scope",
      reason:
        "CEO está enfocado en Ceoteca, lectura, negocios, marketing, ventas, productividad, desarrollo personal, liderazgo, finanzas y recomendaciones del catálogo.",
    };
  }

  return { allowed: true };
}
