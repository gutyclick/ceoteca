'use client';

import { Pause, Play, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { LockedFeature } from '@/components/ui/LockedFeature';

export function AudioPlayer({ locked }: { locked: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [volume, setVolume] = useState(70);

  if (locked) {
    return (
      <LockedFeature
        title="Audio bloqueado"
        description="Las versiones en audio están disponibles en Pro, Ilimitado y Fundador. En modo demo no se reproduce un archivo real."
      />
    );
  }

  return (
    <section className="glass rounded-3xl p-5" aria-label="Reproductor de audio demo">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="focus-ring rounded-full bg-white p-3 text-black"
          onClick={() => setIsPlaying((current) => !current)}
          aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>
        <button type="button" className="focus-ring" aria-label="Retroceder 10 segundos">
          <RotateCcw />
        </button>
        <div className="h-2 min-w-48 flex-1 rounded bg-white/10" aria-label="Progreso de audio">
          <div className="h-2 w-1/3 rounded bg-violet-400" />
        </div>
        <span className="text-sm text-zinc-300">04:12 / 12:00</span>
        <button type="button" className="focus-ring" aria-label="Adelantar 10 segundos">
          <RotateCw />
        </button>
        <label className="sr-only" htmlFor="audio-speed">
          Velocidad
        </label>
        <select
          id="audio-speed"
          className="rounded bg-white/10 p-2"
          value={speed}
          onChange={(event) => setSpeed(event.target.value)}
        >
          <option>1x</option>
          <option>1.5x</option>
          <option>2x</option>
        </select>
        <Volume2 aria-hidden="true" />
        <label className="sr-only" htmlFor="audio-volume">
          Volumen
        </label>
        <input
          id="audio-volume"
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </div>
    </section>
  );
}
