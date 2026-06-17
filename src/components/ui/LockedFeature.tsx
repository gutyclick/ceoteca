import { Lock } from 'lucide-react';
import { GradientButton } from './Buttons';

export function LockedFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-3xl p-6 text-center">
      <Lock className="mx-auto h-10 w-10 text-pink-300" aria-hidden="true" />
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-300">{description}</p>
      <div className="mt-5">
        <GradientButton href="/planes">Mejorar plan</GradientButton>
      </div>
    </div>
  );
}
