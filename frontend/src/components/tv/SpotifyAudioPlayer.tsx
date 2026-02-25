import {
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useResolvedMediaUrl } from "../../hooks/useResolvedMediaUrl";

type AudioTrack = {
  id: string;
  title: string;
  url: string;
  subtitle?: string;
};

type SpotifyAudioPlayerProps = {
  tracks: AudioTrack[];
};

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }

  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function SpotifyAudioPlayer({ tracks }: SpotifyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [playError, setPlayError] = useState("");

  const hasTracks = tracks.length > 0;
  const safeIndex = hasTracks ? Math.min(currentIndex, tracks.length - 1) : 0;
  const activeTrack = hasTracks ? tracks[safeIndex] : null;
  const resolvedActiveUrl = useResolvedMediaUrl(activeTrack?.url ?? "", "info_cabinet", activeTrack?.title);

  useEffect(() => {
    if (!tracks.length) {
      setCurrentIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    if (currentIndex > tracks.length - 1) {
      setCurrentIndex(0);
    }

    // Keep audio diffusion running by default when a playlist is available.
    setIsPlaying(true);
  }, [tracks, currentIndex]);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) {
      return;
    }

    player.volume = volume;
  }, [volume]);

  useEffect(() => {
    const player = audioRef.current;
    if (!player || !activeTrack || !resolvedActiveUrl) {
      if (activeTrack && !resolvedActiveUrl) {
        setPlayError("Fichier audio local introuvable. Réuploade la piste.");
      }
      return;
    }

    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      void player.play().then(() => {
        setPlayError("");
      }).catch(() => {
        setIsPlaying(false);
        setPlayError("Lecture bloquée par le navigateur. Clique sur Play pour démarrer.");
      });
    }
  }, [activeTrack?.id, isPlaying, activeTrack, resolvedActiveUrl]);

  function togglePlayback() {
    const player = audioRef.current;
    if (!player || !activeTrack || !resolvedActiveUrl) {
      return;
    }

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    void player.play().then(() => {
      setIsPlaying(true);
      setPlayError("");
    }).catch(() => {
      setPlayError("Lecture bloquée par le navigateur. Interagis encore avec Play.");
    });
  }

  function goNext() {
    if (!tracks.length) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  }

  function goPrevious() {
    if (!tracks.length) {
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }

  function onSeekChange(value: string) {
    const player = audioRef.current;
    if (!player) {
      return;
    }

    const nextTime = Number(value);
    player.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  const progressPercent = useMemo(() => {
    if (!duration) {
      return 0;
    }
    return Math.min((currentTime / duration) * 100, 100);
  }, [currentTime, duration]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/70 px-3 py-3 backdrop-blur-xl lg:px-6">
      <audio
        ref={audioRef}
        src={resolvedActiveUrl}
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={goNext}
      />

      <div className="mx-auto grid max-w-[1600px] gap-3 lg:grid-cols-[1.2fr,2fr,1.2fr] lg:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-900">
            <ListMusic className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{activeTrack?.title ?? "Aucune piste audio"}</p>
            <p className="truncate text-xs text-slate-300">{activeTrack?.subtitle ?? "Configure l'audio dans TV Manager > Audio ambiance"}</p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-40"
              disabled={!hasTracks}
              aria-label="Piste précédente"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              className="rounded-full bg-white p-2 text-slate-900 transition hover:scale-105 disabled:opacity-40"
              disabled={!hasTracks}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-40"
              disabled={!hasTracks}
              aria-label="Piste suivante"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative h-1 flex-1 rounded-full bg-white/20">
              <div className="absolute left-0 top-0 h-full rounded-full bg-emerald-400" style={{ width: `${progressPercent}%` }} />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(event) => onSeekChange(event.target.value)}
                className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
                disabled={!hasTracks}
              />
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          {playError ? <p className="mt-1 text-center text-xs text-amber-300">{playError}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full bg-white/10 p-2 text-white"
            onClick={() => setVolume((prev) => (prev > 0 ? 0 : 0.7))}
            aria-label="Mute"
          >
            {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-1 w-28 cursor-pointer accent-emerald-400"
          />
        </div>
      </div>
    </div>
  );
}
