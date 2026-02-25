import { useEffect, useMemo, useState } from "react";
import { isLocalMediaRef, resolveLocalMediaRef } from "../lib/localMediaStore";
import { resolveTVMediaSrc } from "../lib/tvMedia";

export function useResolvedMediaUrl(media: string, type?: string, title?: string): string {
  const candidate = useMemo(() => resolveTVMediaSrc(media, type, title), [media, title, type]);
  const [resolved, setResolved] = useState(isLocalMediaRef(candidate) ? "" : candidate);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!candidate) {
        setResolved("");
        return;
      }
      if (!isLocalMediaRef(candidate)) {
        setResolved(candidate);
        return;
      }
      try {
        const value = await resolveLocalMediaRef(candidate);
        if (!cancelled) {
          setResolved(value || "");
        }
      } catch {
        if (!cancelled) {
          setResolved("");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [candidate]);

  return resolved;
}
