"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AudioPlayerProps = {
  title: string;
  durationMinutes: number;
};

export function AudioPlayer({ title, durationMinutes }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <Button
          aria-label={isPlaying ? "Pausar audio demo" : "Reproducir audio demo"}
          className="h-12 w-12 px-0"
          onClick={() => setIsPlaying((current) => !current)}
        >
          {isPlaying ? (
            <Pause aria-hidden="true" size={20} />
          ) : (
            <Play aria-hidden="true" size={20} />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          <p className="text-sm text-text-secondary">
            Audio demo visual · {durationMinutes} min
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-500"
              style={{ width: isPlaying ? "42%" : "12%" }}
            />
          </div>
        </div>
        <Volume2 aria-hidden="true" className="text-text-secondary" size={20} />
      </div>
    </Card>
  );
}
