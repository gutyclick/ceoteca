import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Issue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
};

export function EditorialValidationPanel({ issues }: { issues: Issue[] }) {
  if (!issues.length)
    return (
      <section className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="flex items-center gap-2 font-black text-emerald-900">
          <CheckCircle2 size={20} />
          Sin incidencias editoriales
        </h2>
      </section>
    );
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-black">Validación editorial</h2>
      <ul className="mt-4 grid gap-3">
        {issues.map((item, index) => (
          <li
            className={`flex gap-3 rounded-[8px] border p-3 text-sm ${item.severity === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : item.severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900"}`}
            key={`${item.code}-${index}`}
          >
            {item.severity === "info" ? (
              <Info className="shrink-0" size={18} />
            ) : (
              <AlertTriangle className="shrink-0" size={18} />
            )}
            <span>
              <strong>{item.code}:</strong> {item.message}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
