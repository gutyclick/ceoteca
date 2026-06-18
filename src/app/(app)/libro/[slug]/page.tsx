import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Clock3, ShoppingBag, Sparkles } from "lucide-react";

import { AudioPlayer } from "@/components/books/AudioPlayer";
import { BookCover } from "@/components/books/BookCover";
import { InteractiveExercise } from "@/components/books/InteractiveExercise";
import { KeyPointCard } from "@/components/books/KeyPointCard";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LockedFeature } from "@/components/ui/LockedFeature";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { canAccessFeature } from "@/lib/permissions";
import { createBookRepository } from "@/lib/books/repository";

const disclaimer =
  "Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la editorial. Este análisis no reemplaza la obra original.";

type BookPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const books = await createBookRepository().list();

  return books.map((book) => ({
    slug: book.slug,
  }));
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await createBookRepository().getBySlug(slug);

  if (!book) {
    return {
      title: "Libro no encontrado",
    };
  }

  return {
    title: book.title,
    description: book.description,
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await createBookRepository().getBySlug(slug);

  if (!book || !book.isPublished) {
    notFound();
  }

  const canUseAudio = canAccessFeature("free", "audio");
  const canUseChat = canAccessFeature("free", "chat");

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container pb-20 pt-10">
        <div className="grid gap-10 lg:grid-cols-[380px_1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <BookCover book={book} size="lg" />
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-text-secondary">
                {book.category}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-text-secondary">
                {book.difficulty}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-text-secondary">
                Editorial
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-tight">
              {book.title}
            </h1>
            <p className="mt-3 text-xl text-text-secondary">{book.author}</p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
              {book.description}
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <Clock3 aria-hidden="true" className="text-brand-purple" size={20} />
                <p className="mt-3 text-2xl font-semibold">{book.readingTime} min</p>
                <p className="text-sm text-text-secondary">Lectura estimada</p>
              </Card>
              <Card className="p-4">
                <Sparkles aria-hidden="true" className="text-brand-pink" size={20} />
                <p className="mt-3 text-2xl font-semibold">{book.keyPoints.length}</p>
                <p className="text-sm text-text-secondary">Ideas clave</p>
              </Card>
              <Card className="p-4">
                <BookOpen aria-hidden="true" className="text-info" size={20} />
                <p className="mt-3 text-2xl font-semibold">{book.activities.length}</p>
                <p className="text-sm text-text-secondary">Ejercicios</p>
              </Card>
            </div>

            <div className="mt-7">
              <ProgressBar value={book.progress ?? 0} label="Progreso" />
            </div>

            <div className="mt-8 grid gap-4">
              {canUseAudio ? (
                <AudioPlayer
                  durationMinutes={book.readingTime}
                  title={`Audio de ${book.title}`}
                />
              ) : (
                <LockedFeature
                  title="Audio bloqueado en plan Gratis"
                  description="El audio está disponible en planes Pro, Ilimitado y Fundador."
                />
              )}

              {canUseChat ? (
                <Card className="p-5">
                  <h2 className="font-semibold">Chat contextual</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    Responde en español usando solo el análisis autorizado
                    de Ceoteca para este libro.
                  </p>
                  <div className="mt-4">
                    <ChatDrawer bookSlug={book.slug} bookTitle={book.title} />
                  </div>
                </Card>
              ) : (
                <LockedFeature
                  title="Chat bloqueado en plan Gratis"
                  description="El chat contextual se activa desde Pro y será implementado en la siguiente fase."
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="space-y-12">
            <section>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
                Análisis interactivo
              </p>
              <div className="mt-5 grid gap-4">
                {book.analysis.map((section) => (
                  <Card className="p-6" key={section.title}>
                    <h2 className="text-2xl font-semibold">{section.title}</h2>
                    <p className="mt-4 text-sm leading-7 text-text-secondary">
                      {section.content}
                    </p>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
                Puntos clave
              </p>
              <div className="mt-5 grid gap-4">
                {book.keyPoints.map((point) => (
                  <KeyPointCard key={point.number} point={point} />
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
                Actividades
              </p>
              <div className="mt-5 grid gap-4">
                {book.activities.map((activity) => (
                  <InteractiveExercise key={activity.title} activity={activity} />
                ))}
              </div>
            </section>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold">Conclusión editorial</h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                {book.conclusion}
              </p>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="p-6">
              <h2 className="font-semibold">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-text-secondary"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold">Disclaimer</h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {disclaimer}
              </p>
            </Card>

            {book.purchaseUrl ? (
              <ButtonLink
                className="w-full"
                href={book.purchaseUrl}
                target="_blank"
                variant="secondary"
              >
                <ShoppingBag aria-hidden="true" size={18} />
                Comprar el libro original
              </ButtonLink>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
