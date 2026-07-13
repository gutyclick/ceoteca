import Link from "next/link";
export function AdminSectionPlaceholder({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="mt-1 text-slate-500">{description}</p>
        </div>
        {actionLabel && actionHref ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-[8px] border border-violet-300 px-5 font-bold text-violet-700"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </header>
      <section className="mt-6 rounded-[8px] border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-black">Gestión editorial segura</h2>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Esta sección utiliza los estados, versiones y permisos del CMS de
          Training. Las mutaciones se validan en servidor y quedan registradas
          en auditoría.
        </p>
      </section>
    </>
  );
}
