import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Política de privacidad de Ceoteca.",
};

const sections = [
  {
    title: "Datos que recopilamos",
    body: "Podemos guardar datos de cuenta, correo, nombre, plan, progreso de lectura, actividad, preferencias y uso de funciones como chat o audio para operar la plataforma.",
  },
  {
    title: "Cómo usamos tus datos",
    body: "Usamos la información para autenticarte, guardar tu progreso, personalizar recomendaciones, administrar planes, mejorar el producto y proteger la seguridad de la cuenta.",
  },
  {
    title: "Proveedores",
    body: "Utilizamos servicios como Supabase para autenticación y datos, OpenAI para funciones de IA, Resend para emails transaccionales y Vercel para despliegue.",
  },
  {
    title: "Control de tu información",
    body: "Puedes solicitar actualización, exportación o eliminación de datos escribiendo a soporte. Algunas solicitudes pueden requerir verificación de identidad.",
  },
  {
    title: "Seguridad",
    body: "Aplicamos controles técnicos razonables para proteger la información, incluyendo sesiones seguras, validación en servidor y restricciones de acceso por usuario.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
      <section className="ceoteca-container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-600">
            Privacidad
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.04em]">
            Política de privacidad
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Cómo cuidamos, usamos y protegemos la información necesaria para operar Ceoteca.
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
