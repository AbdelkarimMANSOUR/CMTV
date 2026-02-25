export const TV_SYNC_STORAGE_KEY = "cabinet-smart.tv.sync.v1";
export const TV_SYNC_EVENT = "cabinet-smart:tv-sync";
export const TV_SYNC_CHANNEL = "cabinet-smart.tv.sync.channel";

export type TVSyncPayload = {
  at: string;
  screen: "all" | "salle_attente" | "accueil" | "toutes";
  source: "manager" | "system";
};

export function parseTVSyncPayload(raw: string | null): TVSyncPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TVSyncPayload>;
    if (!parsed.at || !parsed.screen || !parsed.source) {
      return null;
    }
    return {
      at: parsed.at,
      screen: parsed.screen,
      source: parsed.source
    };
  } catch {
    return null;
  }
}

export function triggerTVSync(screen: TVSyncPayload["screen"] = "all", source: TVSyncPayload["source"] = "manager"): TVSyncPayload {
  const payload: TVSyncPayload = {
    at: new Date().toISOString(),
    screen,
    source
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TV_SYNC_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures in demo mode.
    }

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(TV_SYNC_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    }

    window.dispatchEvent(new CustomEvent<TVSyncPayload>(TV_SYNC_EVENT, { detail: payload }));
  }

  return payload;
}

export function shouldSyncForScreen(payload: TVSyncPayload, currentScreen: string): boolean {
  return payload.screen === "all" || payload.screen === "toutes" || payload.screen === currentScreen;
}
