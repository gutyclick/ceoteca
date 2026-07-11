export const dailyQuotes = [
  "Una idea gana valor cuando se convierte en una decisión concreta.",
  "El progreso sostenible nace de acciones pequeñas que puedes repetir.",
  "Aprender mejor también significa elegir qué aplicar primero.",
  "La claridad aparece cuando una meta se traduce en el siguiente paso.",
  "Una buena estrategia protege tu atención de lo que no importa.",
  "Leer abre posibilidades; practicar convierte una posibilidad en capacidad.",
  "Los mejores sistemas hacen más fácil cumplir una buena intención.",
] as const;

export function getDailyQuote(date = new Date()) {
  const dayNumber = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );

  return dailyQuotes[dayNumber % dailyQuotes.length];
}
