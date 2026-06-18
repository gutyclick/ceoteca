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
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-lg leading-8 text-text-secondary">
        {description}
      </p>
    </div>
  );
}
