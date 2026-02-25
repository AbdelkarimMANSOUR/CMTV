import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Clock3, Power, TimerReset, UsersRound, Volume2, VolumeX } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { SpotifyAudioPlayer } from "../components/tv/SpotifyAudioPlayer";
import { useEntityList } from "../hooks/useEntities";
import { useResolvedMediaUrl } from "../hooks/useResolvedMediaUrl";
import { base44 } from "../lib/base44";
import { parseTVSyncPayload, shouldSyncForScreen, TV_SYNC_CHANNEL, TV_SYNC_EVENT, TV_SYNC_STORAGE_KEY, type TVSyncPayload } from "../lib/tvSync";
import { isVideoMedia, resolveTVMediaSrc } from "../lib/tvMedia";
import { QUEUE_STATUS_LABELS } from "../types/entities";

const TV_SOUND_STORAGE_KEY = "cabinet-smart.tv.sound-enabled";

export function TVDisplayPage() {
  const { screen = "salle_attente" } = useParams();

  const tvQuery = useEntityList("TVContent");
  const audioQuery = useEntityList("TVAudioTrack");
  const queueQuery = useEntityList("WaitingQueueTicket");
  const patientsQuery = useEntityList("Patient");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioHint, setAudioHint] = useState("");
  const [syncHint, setSyncHint] = useState("");

  const refreshDisplayData = useCallback(async () => {
    await Promise.all([
      tvQuery.refetch(),
      audioQuery.refetch(),
      queueQuery.refetch(),
      patientsQuery.refetch()
    ]);
  }, [tvQuery, audioQuery, queueQuery, patientsQuery]);

  useEffect(() => {
    const unsubscribeTv = base44.entities.TVContent.subscribe(() => {
      void tvQuery.refetch();
    });
    const unsubscribeAudio = base44.entities.TVAudioTrack.subscribe(() => {
      void audioQuery.refetch();
    });

    const unsubscribeQueue = base44.entities.WaitingQueueTicket.subscribe(() => {
      void queueQuery.refetch();
    });

    return () => {
      unsubscribeTv();
      unsubscribeAudio();
      unsubscribeQueue();
    };
  }, [tvQuery, audioQuery, queueQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let clearHintTimeout: number | null = null;

    function applySync(payload: TVSyncPayload | null) {
      if (!payload || !shouldSyncForScreen(payload, screen)) {
        return;
      }

      setCurrentIndex(0);
      void refreshDisplayData();
      setSyncHint(`Synchronisé ${format(parseISO(payload.at), "HH:mm:ss")}`);

      if (clearHintTimeout) {
        window.clearTimeout(clearHintTimeout);
      }
      clearHintTimeout = window.setTimeout(() => {
        setSyncHint("");
      }, 3500);
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== TV_SYNC_STORAGE_KEY) {
        return;
      }
      applySync(parseTVSyncPayload(event.newValue));
    }

    function onSyncEvent(event: Event) {
      const detail = (event as CustomEvent<TVSyncPayload>).detail;
      applySync(detail ?? null);
    }

    const channel = "BroadcastChannel" in window ? new BroadcastChannel(TV_SYNC_CHANNEL) : null;
    if (channel) {
      channel.onmessage = (event: MessageEvent<TVSyncPayload>) => {
        applySync(event.data ?? null);
      };
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(TV_SYNC_EVENT, onSyncEvent as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TV_SYNC_EVENT, onSyncEvent as EventListener);
      channel?.close();
      if (clearHintTimeout) {
        window.clearTimeout(clearHintTimeout);
      }
    };
  }, [refreshDisplayData, screen]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshDisplayData();
    }, 8_000);
    return () => window.clearInterval(interval);
  }, [refreshDisplayData]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem(TV_SOUND_STORAGE_KEY);
    if (saved === "1") {
      setSoundEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(TV_SOUND_STORAGE_KEY, soundEnabled ? "1" : "0");
  }, [soundEnabled]);

  const activeContents = useMemo(() => {
    const list = tvQuery.data ?? [];
    const today = new Date();

    return list
      .filter((content) => content.actif)
      .filter((content) => content.ecranCible === "toutes" || content.ecranCible === screen)
      .filter((content) => {
        if (!content.dateDebut || !content.dateFin) {
          return true;
        }

        return isWithinInterval(today, { start: parseISO(content.dateDebut), end: parseISO(content.dateFin) });
      })
      .sort((a, b) => a.ordre - b.ordre);
  }, [tvQuery.data, screen]);

  const queueTickets = useMemo(() => {
    const all = queueQuery.data ?? [];
    return all
      .filter((ticket) => ticket.ecranCible === "toutes" || ticket.ecranCible === screen)
      .filter((ticket) => ticket.statut !== "termine" && ticket.statut !== "absent")
      .sort((a, b) => a.heureArrivee.localeCompare(b.heureArrivee));
  }, [queueQuery.data, screen]);

  const patientMap = useMemo(() => {
    const patients = patientsQuery.data ?? [];
    return new Map(patients.map((patient) => [patient.id, patient]));
  }, [patientsQuery.data]);

  const calledTicket = queueTickets.find((ticket) => ticket.statut === "en_consultation")
    ?? queueTickets.find((ticket) => ticket.statut === "appele")
    ?? null;

  const waitingTickets = queueTickets
    .filter((ticket) => ticket.statut === "en_attente")
    .slice(0, 6);

  const infoSlides = activeContents.filter((item) => item.type === "annonce" || item.type === "conseil_sante" || item.type === "info_cabinet");

  const audioTracks = useMemo(() => {
    const tracks = audioQuery.data ?? [];
    return tracks
      .filter((track) => track.actif)
      .filter((track) => track.ecranCible === "toutes" || track.ecranCible === screen)
      .sort((a, b) => a.ordre - b.ordre)
      .map((track) => {
        const src = resolveTVMediaSrc(track.url, "info_cabinet", track.titre);
        return {
          id: track.id,
          title: track.titre || "Piste audio",
          subtitle: track.artiste || "Audio diffusé en continu",
          url: src
        };
      });
  }, [audioQuery.data, screen]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (!activeContents.length) {
        return 0;
      }
      return (prev + 1) % activeContents.length;
    });
  }, [activeContents.length]);

  useEffect(() => {
    if (!activeContents.length) {
      return;
    }

    const currentSlide = activeContents[currentIndex % activeContents.length];
    const fallbackDuration = Math.max(currentSlide.dureeAffichage, 4);
    const isCurrentVideo = currentSlide.type === "video";
    const durationFromVideo = videoDurationSec ? Math.ceil(videoDurationSec) : null;
    const autoNextDuration = isCurrentVideo
      ? Math.max(durationFromVideo ?? fallbackDuration, fallbackDuration)
      : fallbackDuration;

    const timeout = window.setTimeout(() => {
      goToNext();
    }, autoNextDuration * 1000);

    return () => window.clearTimeout(timeout);
  }, [activeContents, currentIndex, goToNext, videoDurationSec]);

  const current = activeContents[currentIndex % Math.max(activeContents.length, 1)];
  const currentMediaSrc = useResolvedMediaUrl(current?.media ?? "", current?.type, current?.titre);
  const currentIsVideo = current ? current.type === "video" || isVideoMedia(currentMediaSrc) : false;

  const marqueeMessages = activeContents
    .filter((item) => item.type === "message_defilant")
    .map((item) => item.message)
    .filter(Boolean)
    .join("    •    ");
  const displayStatus = "ON";

  useEffect(() => {
    setVideoDurationSec(null);
  }, [current?.id]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player) {
      return;
    }

    player.muted = !soundEnabled;
    if (soundEnabled) {
      void player.play().then(() => {
        setAudioHint("");
      }).catch(() => {
        setAudioHint("Le navigateur bloque le son automatique. Clique encore sur “Activer le son”.");
      });
    } else {
      setAudioHint("");
    }
  }, [current?.id, soundEnabled]);

  function toggleSound() {
    setSoundEnabled((prev) => !prev);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 pb-28 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_55%,#020617_100%)] opacity-90" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm lg:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo-cabinet.svg" alt="Cabinet Smart logo" className="h-9 w-9 rounded-lg bg-white/5 p-1.5" />
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Écran: <span className="font-semibold uppercase">{screen}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-200">
              <Power className="h-4 w-4" />
              {displayStatus}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncHint ? (
              <div className="rounded-full border border-emerald-300/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                {syncHint}
              </div>
            ) : null}
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-white transition hover:bg-white/10"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              {soundEnabled ? "Son ON" : "Activer le son"}
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Clock3 className="h-4 w-4" />
              {format(now, "EEEE d MMMM yyyy HH:mm:ss", { locale: fr })}
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1600px] gap-4 px-4 py-4 lg:grid-cols-[1fr,360px] lg:px-6 lg:py-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 shadow-xl">
          {!current ? (
            <div className="grid min-h-[58vh] place-items-center rounded-xl border border-white/10 bg-slate-950/45 p-8 text-center">
              <div>
                <p className="text-2xl font-semibold">Aucun contenu actif</p>
                <p className="mt-2 text-sm text-slate-300">Ajoutez du contenu depuis TV Manager.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.35 }}
                className="min-h-[58vh] rounded-xl border border-white/10 p-4 lg:p-6"
                style={{ backgroundColor: current.couleurFond || "#0f172a" }}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-200/90">
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                    Slide {Math.min(currentIndex + 1, Math.max(activeContents.length, 1))}/{Math.max(activeContents.length, 1)}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">{current.type}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                    <TimerReset className="h-3.5 w-3.5" />
                    {current.dureeAffichage}s
                  </span>
                </div>

                <h1 className="mb-5 text-3xl font-semibold tracking-tight lg:text-5xl">{current.titre}</h1>

                {currentMediaSrc ? (
                  currentIsVideo ? (
                    <video
                      ref={videoRef}
                      src={currentMediaSrc}
                      className="mx-auto mb-5 max-h-[48vh] w-full rounded-xl border border-white/10 bg-slate-900/40 object-contain"
                      autoPlay
                      muted={!soundEnabled}
                      playsInline
                      onEnded={goToNext}
                      onLoadedMetadata={(event) => {
                        const duration = event.currentTarget.duration;
                        setVideoDurationSec(Number.isFinite(duration) ? duration : null);
                      }}
                    />
                  ) : (
                    <img
                      src={currentMediaSrc}
                      alt={current.titre}
                      className="mx-auto mb-5 max-h-[48vh] rounded-xl border border-white/10 bg-slate-900/40 p-3 object-contain"
                    />
                  )
                ) : null}

                {audioHint ? <p className="mb-4 text-sm text-amber-200">{audioHint}</p> : null}
                <p className="max-w-4xl text-lg leading-relaxed text-slate-100 lg:text-2xl">{current.message}</p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
            <div className="mb-3 flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-100">File d'attente</h2>
            </div>

            {calledTicket ? (
              <div className="mb-3 rounded-lg border border-amber-300/25 bg-amber-400/15 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-100">Ticket appelé</p>
                <p className="text-3xl font-bold text-amber-50">{calledTicket.numeroTicket}</p>
                <p className="text-sm text-amber-100">
                  {patientMap.get(calledTicket.patient_id)?.prenom} {patientMap.get(calledTicket.patient_id)?.nom}
                </p>
                <p className="text-xs text-amber-200">{QUEUE_STATUS_LABELS[calledTicket.statut]}</p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-slate-300">Aucun ticket appelé.</p>
            )}

            <div className="space-y-2">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <BellRing className="h-3.5 w-3.5" />
                Prochains tickets
              </p>
              {waitingTickets.length ? (
                waitingTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
                    <span className="font-semibold">{ticket.numeroTicket}</span>
                    <span className="text-xs text-slate-300">
                      {patientMap.get(ticket.patient_id)?.prenom} {patientMap.get(ticket.patient_id)?.nom}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Aucun ticket en attente.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-100">Annonces santé</h2>
            <div className="space-y-2">
              {infoSlides.slice(0, 4).map((slide) => (
                <div key={slide.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-2">
                  <p className="text-sm font-semibold">{slide.titre}</p>
                  <p className="line-clamp-2 text-xs text-slate-300">{slide.message}</p>
                </div>
              ))}
              {!infoSlides.length ? <p className="text-xs text-slate-400">Aucune annonce active.</p> : null}
            </div>
          </div>
        </aside>
      </section>

      {marqueeMessages ? (
        <footer className="absolute bottom-24 left-0 right-0 z-10 overflow-hidden border-y border-white/15 bg-slate-100 py-2 text-sm font-semibold text-slate-900">
          <div className="marquee-track whitespace-nowrap">{marqueeMessages}</div>
        </footer>
      ) : null}

      <SpotifyAudioPlayer tracks={audioTracks} />
    </main>
  );
}
