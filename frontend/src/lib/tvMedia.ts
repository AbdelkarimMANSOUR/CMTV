const LOGO_ALIASES = new Set([
  "logo",
  "logo-cabinet",
  "cabinet-logo",
  "logo-cabinet.svg",
  "/logo-cabinet.svg"
]);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isAbsoluteUrl(value: string): boolean {
  return (
    value.startsWith("http://")
    || value.startsWith("https://")
    || value.startsWith("blob:")
    || value.startsWith("data:")
    || value.startsWith("localmedia://")
  );
}

export function resolveTVMediaSrc(media: string, type?: string, title?: string): string {
  const trimmed = media.trim();
  const normalizedMedia = normalize(trimmed);
  const normalizedTitle = normalize(title ?? "");

  if (!trimmed) {
    if (type === "image" && normalizedTitle.includes("logo")) {
      return "/logo-cabinet.svg";
    }
    return "";
  }

  if (LOGO_ALIASES.has(normalizedMedia)) {
    return "/logo-cabinet.svg";
  }

  if (isAbsoluteUrl(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }

  // Relative media names (e.g. "my-image.png") are resolved from /public
  return `/${trimmed}`;
}

export function isVideoMedia(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") || lower.includes("video");
}

export function isAudioMedia(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp3")
    || lower.endsWith(".wav")
    || lower.endsWith(".ogg")
    || lower.endsWith(".m4a")
    || lower.endsWith(".aac")
    || lower.endsWith(".flac")
    || lower.includes("audio")
  );
}
