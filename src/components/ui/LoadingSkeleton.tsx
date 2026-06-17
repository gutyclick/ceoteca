export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-label="Cargando contenido">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded-full bg-white/10"
          style={{ width: `${100 - index * 14}%` }}
        />
      ))}
    </div>
  );
}
