import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function BookNotFound() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <h1 className="text-3xl font-semibold">Libro no encontrado</h1>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            El análisis solicitado no existe o todavía no está publicado en modo
            demo.
          </p>
          <ButtonLink className="mt-6" href="/home">
            Volver a home
          </ButtonLink>
        </Card>
      </section>
    </main>
  );
}
