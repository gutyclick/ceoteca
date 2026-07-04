import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos",
  description: "Términos de uso de Ceoteca.",
};

const sections = [
  {
    title: "Uso de Ceoteca",
    body: "Ceoteca ofrece análisis editoriales propios, ejercicios y herramientas de aprendizaje para complementar tus lecturas. El contenido no reemplaza las obras originales ni está afiliado a autores o editoriales.",
  },
  {
    title: "Cuenta y acceso",
    body: "Para usar funciones privadas necesitas una cuenta activa. Eres responsable de mantener tus datos de acceso seguros y de utilizar la plataforma de forma lícita y respetuosa.",
  },
  {
    title: "Planes y disponibilidad",
    body: "Las funciones disponibles dependen del plan activo. Algunas características, como audio, chat contextual o límites ampliados, pueden variar según la suscripción.",
  },
  {
    title: "Propiedad intelectual",
    body: "No está permitido copiar, redistribuir, revender o publicar el contenido de Ceoteca sin autorización. Las marcas, libros y autores mencionados pertenecen a sus respectivos titulares.",
  },
  {
    title: "Cambios del servicio",
    body: "Podemos mejorar, ajustar o retirar funciones para mantener la calidad, seguridad y sostenibilidad del producto. Comunicaremos cambios relevantes cuando corresponda.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
      <section className="ceoteca-container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-600">
            Legal
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.04em]">
            Términos de uso
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Condiciones principales para usar Ceoteca de forma clara, segura y responsable.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4">
          {sections.map((section) => (
            <article
              className="rounded-[1.25rem] border border-slate-950/[0.08] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
              key={section.title}
            >
              <h2 className="text-xl font-black">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
