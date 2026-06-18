import { SearchX } from "lucide-react";

import { Card } from "@/components/ui/Card";

export function EmptyState() {
  return (
    <Card className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <SearchX
          aria-hidden="true"
          className="mx-auto text-text-muted"
          size={34}
        />
        <h3 className="mt-4 text-xl font-semibold">No encontramos libros</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Prueba con otra búsqueda o cambia la categoría.
        </p>
      </div>
    </Card>
  );
}
