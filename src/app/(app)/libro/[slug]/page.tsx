'use client';

import { notFound } from 'next/navigation';
import { useState } from 'react';
import { AudioPlayer } from '@/components/books/AudioPlayer';
import { BookCover } from '@/components/books/BookCover';
import { InteractiveExercise } from '@/components/books/InteractiveExercise';
import { KeyPointCard } from '@/components/books/KeyPointCard';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { demoBooks, getBookBySlug } from '@/data/books';
import { canAccessFeature } from '@/lib/permissions';

export default function BookPage({ params }: { params: { slug: string } }) {
  const book = getBookBySlug(params.slug);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [progress, setProgress] = useState(35);

  if (!book) {
    notFound();
  }

  // Demo profile. Production should read this from the trusted server session/profile.
  const plan = 'pro' as const;

  return (
    <main className="container py-10">
      <section className="grid gap-8 md:grid-cols-[auto_1fr]">
        <BookCover book={book} size="lg" />
        <div>
          <p className="text-violet-300">
            {book.category} · {book.readingTime} min · {book.difficulty}
          </p>
          <h1 className="mt-3 text-5xl font-black">{book.title}</h1>
          <p className="mt-2 text-xl text-zinc-300">{book.author}</p>
          <p className="mt-5 max-w-2xl text-zinc-300">{book.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {book.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 max-w-md">
            <ProgressBar value={progress} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="focus-ring rounded-2xl bg-white px-5 py-3 font-bold text-black"
              onClick={() => setProgress(60)}
            >
              Comenzar análisis
            </button>
            <a className="focus-ring rounded-2xl border border-white/15 px-5 py-3" href="#audio">
              Escuchar
            </a>
            <button
              type="button"
              className="focus-ring rounded-2xl bg-violet-600 px-5 py-3 font-bold"
              onClick={() => setIsChatOpen(true)}
            >
              Habla con este libro
            </button>
          </div>

          <p className="mt-5 text-sm text-zinc-400">
            Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la
            editorial. Este análisis no reemplaza la obra original.{' '}
            <a className="underline" href={book.purchaseUrl} rel="noreferrer" target="_blank">
              Comprar el libro original
            </a>
          </p>
        </div>
      </section>

      <section id="audio" className="mt-10">
        <AudioPlayer locked={!canAccessFeature(plan, 'audio')} />
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {book.sections.map((section) => (
            <article key={section.title} className="glass rounded-3xl p-6">
              <p className="text-sm text-violet-300">{section.type}</p>
              <h2 className="mt-1 text-2xl font-bold">{section.title}</h2>
              <p className="mt-3 text-zinc-300">{section.content}</p>
            </article>
          ))}
          <InteractiveExercise />
        </div>

        <aside className="space-y-4">
          <h2 className="text-2xl font-black">Puntos clave</h2>
          {book.keyPoints.map((point, index) => (
            <KeyPointCard key={point.title} point={point} index={index} />
          ))}
        </aside>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="text-2xl font-black">Nota editorial</h2>
          <p className="mt-3 text-zinc-300">
            No se incluyen citas textuales atribuidas al autor en los datos demo. Este espacio
            está reservado para campos editoriales autorizados.
          </p>
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="text-2xl font-black">Conclusión propia</h2>
          <ul className="mt-3 space-y-2 text-zinc-300">
            <li>{book.conclusion.usefulFor}</li>
            <li>{book.conclusion.limitations}</li>
            <li>{book.conclusion.whenToApply}</li>
            <li>{book.conclusion.nextStep}</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-black">Libros relacionados</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {demoBooks
            .filter((relatedBook) => book.conclusion.related.includes(relatedBook.slug))
            .map((relatedBook) => (
              <a
                key={relatedBook.id}
                className="focus-ring rounded-2xl bg-white/10 px-4 py-3"
                href={`/libro/${relatedBook.slug}`}
              >
                {relatedBook.title}
              </a>
            ))}
        </div>
      </section>

      <ChatDrawer
        bookId={book.id}
        title={book.title}
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </main>
  );
}
