type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-600">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-4xl font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-lg leading-8 text-slate-600">
        {description}
      </p>
    </div>
  );
}
