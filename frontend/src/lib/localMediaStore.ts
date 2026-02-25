const LOCAL_MEDIA_PREFIX = "localmedia://";
const DB_NAME = "cabinet-smart.media.v1";
const STORE_NAME = "files";
const DB_VERSION = 1;

type LocalMediaRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  blob: Blob;
};

const resolvedUrlCache = new Map<string, string>();

function canUseIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function buildLocalMediaRef(id: string, name: string): string {
  return `${LOCAL_MEDIA_PREFIX}${id}/${encodeURIComponent(name)}`;
}

function parseLocalMediaRef(ref: string): { id: string; name: string } | null {
  if (!ref.startsWith(LOCAL_MEDIA_PREFIX)) {
    return null;
  }
  const raw = ref.slice(LOCAL_MEDIA_PREFIX.length);
  const slashIndex = raw.indexOf("/");
  if (slashIndex <= 0) {
    return null;
  }
  const id = raw.slice(0, slashIndex);
  const encodedName = raw.slice(slashIndex + 1);
  const name = decodeURIComponent(encodedName || "media.bin");
  return { id, name };
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function getRecordById(id: string): Promise<LocalMediaRecord | null> {
  if (!canUseIndexedDb()) {
    return null;
  }

  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      resolve((request.result as LocalMediaRecord | undefined) ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
  });
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
}

export function isLocalMediaRef(value: string): boolean {
  return value.trim().startsWith(LOCAL_MEDIA_PREFIX);
}

export async function saveFileToLocalMedia(file: File): Promise<{ url: string; name: string; type: string; size: number }> {
  if (!canUseIndexedDb()) {
    throw new Error("IndexedDB indisponible dans ce navigateur.");
  }

  const db = await openMediaDb();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const record: LocalMediaRecord = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("IndexedDB write failed"));
  });

  return {
    url: buildLocalMediaRef(id, file.name),
    name: file.name,
    type: file.type,
    size: file.size
  };
}

export async function resolveLocalMediaRef(ref: string): Promise<string> {
  if (!isLocalMediaRef(ref)) {
    return ref;
  }

  const normalized = ref.trim();
  const cached = resolvedUrlCache.get(normalized);
  if (cached) {
    return cached;
  }

  const parsed = parseLocalMediaRef(normalized);
  if (!parsed) {
    return "";
  }

  const record = await getRecordById(parsed.id);
  if (!record) {
    return "";
  }

  const url = URL.createObjectURL(record.blob);
  resolvedUrlCache.set(normalized, url);
  return url;
}

export async function downloadMediaReference(mediaRef: string, fallbackName: string): Promise<void> {
  const source = mediaRef.trim();
  if (!source) {
    throw new Error("Aucun média à télécharger.");
  }

  if (isLocalMediaRef(source)) {
    const parsed = parseLocalMediaRef(source);
    if (!parsed) {
      throw new Error("Référence média locale invalide.");
    }
    const record = await getRecordById(parsed.id);
    if (!record) {
      throw new Error("Média local introuvable.");
    }
    triggerFileDownload(record.blob, record.name || fallbackName);
    return;
  }

  if (source.startsWith("data:")) {
    const anchor = document.createElement("a");
    anchor.href = source;
    anchor.download = fallbackName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${response.status})`);
  }
  const blob = await response.blob();
  const urlPath = source.split("?")[0].split("#")[0];
  const remoteName = urlPath.split("/").filter(Boolean).pop();
  const fileName = remoteName || fallbackName;
  triggerFileDownload(blob, fileName);
}
