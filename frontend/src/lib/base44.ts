import type {
  AIReport,
  Appointment,
  AuditLog,
  Database,
  DoctorProfile,
  EntityName,
  LanDevice,
  Lead,
  Patient,
  PatientFlowEvent,
  PatientFlowStep,
  QueueTicketStatus,
  Resource,
  SocialPost,
  TVAudioTrack,
  TVContent,
  WaitingQueueTicket,
  HealthNetworkLink
} from "../types/entities";
import { createDemoDatabase } from "../data/demo";
import { saveFileToLocalMedia } from "./localMediaStore";
import { triggerTVSync } from "./tvSync";

const STORAGE_KEY = "cabinet-smart.base44.database.v2";

type SchemaLike = {
  type?: string;
  properties?: Record<string, SchemaLike>;
  items?: SchemaLike;
  enum?: ReadonlyArray<string | number | boolean>;
};

type LLMInput = {
  prompt: string;
  response_json_schema?: SchemaLike;
  context?: Record<string, unknown>;
};

type LLMOutput = {
  text?: string;
  json?: unknown;
};

type UploadOutput = {
  url: string;
  name: string;
  size: number;
  type: string;
};

type EntityClient<T extends { id: string }> = {
  list: () => Promise<T[]>;
  create: (payload: Omit<T, "id" | "createdAt" | "updatedAt"> & Partial<Pick<T, "id">>) => Promise<T>;
  update: (id: string, patch: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<{ success: boolean }>;
  subscribe: (callback: () => void) => () => void;
};

type AuditPayload = Omit<AuditLog, "id" | "createdAt" | "updatedAt">;
type FlowPayload = Omit<PatientFlowEvent, "id" | "createdAt" | "updatedAt">;

const listeners: Partial<Record<EntityName, Set<() => void>>> = {};
let memoryDb: Database = createDemoDatabase();
let useMemoryFallback = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

function normalizeDb(raw: Partial<Database>): Database {
  const demo = createDemoDatabase();
  return {
    Patient: raw.Patient ?? demo.Patient,
    Appointment: raw.Appointment ?? demo.Appointment,
    SocialPost: raw.SocialPost ?? demo.SocialPost,
    TVContent: raw.TVContent ?? demo.TVContent,
    TVAudioTrack: raw.TVAudioTrack ?? demo.TVAudioTrack,
    WaitingQueueTicket: raw.WaitingQueueTicket ?? demo.WaitingQueueTicket,
    PatientFlowEvent: raw.PatientFlowEvent ?? demo.PatientFlowEvent,
    AuditLog: raw.AuditLog ?? demo.AuditLog,
    Resource: raw.Resource ?? demo.Resource,
    LanDevice: raw.LanDevice ?? demo.LanDevice,
    HealthNetworkLink: raw.HealthNetworkLink ?? demo.HealthNetworkLink,
    Lead: raw.Lead ?? demo.Lead,
    DoctorProfile: raw.DoctorProfile ?? demo.DoctorProfile,
    AIReport: raw.AIReport ?? demo.AIReport
  };
}

function getDb(): Database {
  if (!isBrowser()) {
    return clone(memoryDb);
  }

  if (useMemoryFallback) {
    return clone(memoryDb);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const demo = createDemoDatabase();
    memoryDb = clone(demo);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch {
      useMemoryFallback = true;
    }
    return clone(demo);
  }

  try {
    const normalized = normalizeDb(JSON.parse(raw) as Partial<Database>);
    memoryDb = clone(normalized);
    return clone(normalized);
  } catch {
    const demo = createDemoDatabase();
    memoryDb = clone(demo);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch {
      useMemoryFallback = true;
    }
    return clone(demo);
  }
}

function setDb(next: Database): void {
  memoryDb = clone(next);
  if (isBrowser() && !useMemoryFallback) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep working in-memory when browser storage quota is exceeded.
      // This can happen with heavy media usage in the demo app.
      useMemoryFallback = true;
    }
  }
}

function notify(entityName: EntityName): void {
  const entityListeners = listeners[entityName];
  if (!entityListeners) {
    // Continue to sync event propagation even without local listeners.
  } else {
    entityListeners.forEach((listener) => listener());
  }

  if (
    entityName === "TVContent"
    || entityName === "TVAudioTrack"
    || entityName === "WaitingQueueTicket"
    || entityName === "Patient"
  ) {
    triggerTVSync("all", "system");
  }
}

function subscribe(entityName: EntityName, callback: () => void): () => void {
  listeners[entityName] ??= new Set();
  listeners[entityName]?.add(callback);
  return () => {
    listeners[entityName]?.delete(callback);
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return clone(value as Record<string, unknown>);
}

function appendAuditLog(db: Database, payload: AuditPayload): Database {
  const now = new Date().toISOString();
  const audit: AuditLog = {
    ...payload,
    id: makeId("audit"),
    createdAt: now,
    updatedAt: now
  };

  return {
    ...db,
    AuditLog: [...db.AuditLog, audit]
  };
}

function appendFlowEvent(db: Database, payload: FlowPayload): Database {
  const now = new Date().toISOString();
  const event: PatientFlowEvent = {
    ...payload,
    id: makeId("flow"),
    createdAt: now,
    updatedAt: now
  };

  return {
    ...db,
    PatientFlowEvent: [...db.PatientFlowEvent, event]
  };
}

function queueStepFromStatus(status: QueueTicketStatus): PatientFlowStep | null {
  if (status === "appele") {
    return "appel_salle";
  }
  if (status === "en_consultation") {
    return "consultation_debut";
  }
  if (status === "termine") {
    return "depart";
  }
  if (status === "absent") {
    return "absence";
  }
  return null;
}

function appointmentStepFromStatus(status: Appointment["statut"]): PatientFlowStep | null {
  if (status === "en_cours") {
    return "consultation_debut";
  }
  if (status === "termine") {
    return "consultation_fin";
  }
  if (status === "annule" || status === "absent") {
    return "absence";
  }
  return null;
}

function entityClient<K extends EntityName>(entityName: K): EntityClient<Database[K][number]> {
  return {
    async list() {
      const db = getDb();
      const values = db[entityName] as Database[K][number][];
      return clone(values);
    },

    async create(payload) {
      const db = getDb();
      const now = new Date().toISOString();
      const entity = {
        ...payload,
        id: payload.id ?? makeId(entityName.toLowerCase()),
        createdAt: now,
        updatedAt: now
      } as Database[K][number];

      let next = {
        ...db,
        [entityName]: [...(db[entityName] as Database[K][number][]), entity]
      } as Database;

      let touchedAudit = false;
      let touchedFlow = false;

      if (entityName !== "AuditLog") {
        next = appendAuditLog(next, {
          entity: entityName,
          entityId: entity.id,
          action: "create",
          actor: "system",
          timestamp: now,
          changesSummary: `Création ${entityName}`,
          before: null,
          after: toRecord(entity),
          complianceTag: "Interne"
        });
        touchedAudit = true;
      }

      if (entityName === "WaitingQueueTicket") {
        const ticket = entity as WaitingQueueTicket;
        next = appendFlowEvent(next, {
          patient_id: ticket.patient_id,
          appointment_id: ticket.appointment_id ?? "",
          queue_ticket_id: ticket.id,
          step: "arrivee",
          occuredAt: now,
          performedBy: "Accueil",
          details: `Ticket ${ticket.numeroTicket} enregistré (${ticket.priorite})`,
          sourceSystem: "TVQueue",
          externalReference: ticket.numeroTicket,
          syncStatus: "synced"
        });
        touchedFlow = true;
      }

      setDb(next);
      notify(entityName);
      if (touchedAudit) {
        notify("AuditLog");
      }
      if (touchedFlow) {
        notify("PatientFlowEvent");
      }
      return clone(entity);
    },

    async update(id, patch) {
      const db = getDb();
      let updatedRecord: Database[K][number] | null = null;
      let previousRecord: Database[K][number] | null = null;

      const updated = (db[entityName] as Database[K][number][]).map((row) => {
        if (row.id !== id) {
          return row;
        }
        previousRecord = clone(row);
        updatedRecord = {
          ...row,
          ...patch,
          id: row.id,
          updatedAt: new Date().toISOString()
        };
        return updatedRecord;
      });

      if (!updatedRecord || !previousRecord) {
        throw new Error(`${entityName} ${id} introuvable`);
      }

      let next = {
        ...db,
        [entityName]: updated
      } as Database;

      let touchedAudit = false;
      let touchedFlow = false;

      if (entityName !== "AuditLog") {
        next = appendAuditLog(next, {
          entity: entityName,
          entityId: id,
          action: "update",
          actor: "system",
          timestamp: new Date().toISOString(),
          changesSummary: `Mise à jour ${entityName}`,
          before: toRecord(previousRecord),
          after: toRecord(updatedRecord),
          complianceTag: "Interne"
        });
        touchedAudit = true;
      }

      if (entityName === "Appointment") {
        const previous = previousRecord as Appointment;
        const current = updatedRecord as Appointment;
        const step = previous.statut !== current.statut ? appointmentStepFromStatus(current.statut) : null;

        if (step) {
          next = appendFlowEvent(next, {
            patient_id: current.patient_id,
            appointment_id: current.id,
            queue_ticket_id: "",
            step,
            occuredAt: new Date().toISOString(),
            performedBy: "Cabinet",
            details: `RDV ${current.id} -> ${current.statut}`,
            sourceSystem: "Appointments",
            externalReference: current.id,
            syncStatus: "synced"
          });
          touchedFlow = true;
        }
      }

      if (entityName === "WaitingQueueTicket") {
        const previous = previousRecord as WaitingQueueTicket;
        const current = updatedRecord as WaitingQueueTicket;
        const step = previous.statut !== current.statut ? queueStepFromStatus(current.statut) : null;

        if (step) {
          next = appendFlowEvent(next, {
            patient_id: current.patient_id,
            appointment_id: current.appointment_id ?? "",
            queue_ticket_id: current.id,
            step,
            occuredAt: new Date().toISOString(),
            performedBy: "Accueil",
            details: `Ticket ${current.numeroTicket} -> ${current.statut}`,
            sourceSystem: "TVQueue",
            externalReference: current.numeroTicket,
            syncStatus: "synced"
          });
          touchedFlow = true;
        }
      }

      setDb(next);
      notify(entityName);
      if (touchedAudit) {
        notify("AuditLog");
      }
      if (touchedFlow) {
        notify("PatientFlowEvent");
      }
      return clone(updatedRecord);
    },

    async delete(id) {
      const db = getDb();
      const currentList = db[entityName] as Database[K][number][];
      const record = currentList.find((row) => row.id === id) ?? null;
      const filtered = currentList.filter((row) => row.id !== id);

      let next = {
        ...db,
        [entityName]: filtered
      } as Database;

      const deleted = filtered.length < currentList.length;
      if (deleted && entityName !== "AuditLog") {
        next = appendAuditLog(next, {
          entity: entityName,
          entityId: id,
          action: "delete",
          actor: "system",
          timestamp: new Date().toISOString(),
          changesSummary: `Suppression ${entityName}`,
          before: toRecord(record),
          after: null,
          complianceTag: "Interne"
        });
      }

      setDb(next);
      notify(entityName);
      if (deleted && entityName !== "AuditLog") {
        notify("AuditLog");
      }
      return { success: deleted };
    },

    subscribe(callback) {
      return subscribe(entityName, callback);
    }
  };
}

function fromSchema(schema: SchemaLike | undefined, fieldName = "field"): unknown {
  if (!schema) {
    return `Valeur ${fieldName}`;
  }

  if (schema.enum?.length) {
    return schema.enum[0];
  }

  if (schema.type === "array") {
    return [fromSchema(schema.items, `${fieldName}_item`)];
  }

  if (schema.type === "object") {
    const props = schema.properties ?? {};
    return Object.fromEntries(
      Object.entries(props).map(([key, value]) => [key, fromSchema(value, key)])
    );
  }

  if (schema.type === "number" || schema.type === "integer") {
    return 1;
  }

  if (schema.type === "boolean") {
    return true;
  }

  return `Texte généré pour ${fieldName}`;
}

function mockSocialContent(): { titre: string; contenu: string; hashtags: string[] } {
  return {
    titre: "Prévention saisonnière au cabinet",
    contenu:
      "Pensez au contrôle préventif avant la période hivernale: tension, glycémie et bilan général pour agir tôt.",
    hashtags: ["#CabinetMedical", "#PréventionSanté", "#SuiviPatient", "#SantéLocale"]
  };
}

function mockReportInsights(): Pick<AIReport, "resume" | "insights" | "recommendations"> {
  return {
    resume:
      "Les confirmations de rendez-vous progressent, mais les annulations de dernière minute restent à réduire. Les contenus TV éducatifs soutiennent la fidélisation.",
    insights: [
      {
        id: makeId("insight"),
        categorie: "Rendez-vous",
        priorite: "haute",
        titre: "Annulations tardives sur créneau 17h-19h",
        description: "Un rappel H-2 personnalisé permettrait de réduire les absences de fin de journée."
      },
      {
        id: makeId("insight"),
        categorie: "Réseaux Sociaux",
        priorite: "moyenne",
        titre: "Posts éducatifs plus engageants",
        description: "Les conseils santé courts obtiennent plus de partages que les annonces génériques."
      },
      {
        id: makeId("insight"),
        categorie: "Communication TV",
        priorite: "basse",
        titre: "Message défilant efficace à l'accueil",
        description: "Les consignes administratives affichées réduisent les questions répétitives."
      }
    ],
    recommendations: [
      {
        id: makeId("rec"),
        titre: "Activer une relance automatique J-1",
        impact: "eleve",
        description: "Coupler SMS et email pour les rendez-vous à forte valeur clinique."
      },
      {
        id: makeId("rec"),
        titre: "Planifier 3 posts prévention par semaine",
        impact: "moyen",
        description: "Rythme éditorial stable pour consolider la visibilité locale."
      },
      {
        id: makeId("rec"),
        titre: "Standardiser les slides TV d'information",
        impact: "faible",
        description: "Structurer les messages: accueil, préparation dossier, conseils de suivi."
      }
    ]
  };
}

function mockTraceabilitySummary(): {
  resume: string;
  alerts: string[];
  recommendations: string[];
} {
  return {
    resume:
      "Les flux patients sont correctement horodatés. Les étapes arrivée->consultation sont synchronisées avec les systèmes internes.",
    alerts: [
      "Quelques événements restent en statut pending vers le réseau de santé externe.",
      "Des sorties patient non marquées après 18h ont été détectées."
    ],
    recommendations: [
      "Automatiser la clôture de flux après statut RDV terminé.",
      "Activer une supervision LAN sur scanner et imprimante critiques."
    ]
  };
}

async function invokeLLM(input: LLMInput): Promise<LLMOutput> {
  const prompt = input.prompt.toLowerCase();

  if (prompt.includes("social") || prompt.includes("instagram") || prompt.includes("google business")) {
    return { json: mockSocialContent() };
  }

  if (prompt.includes("traçabilité") || prompt.includes("tracabilite") || prompt.includes("compliance")) {
    return { json: mockTraceabilitySummary() };
  }

  if (prompt.includes("rapport") || prompt.includes("insight") || prompt.includes("analyse")) {
    return { json: mockReportInsights() };
  }

  if (input.response_json_schema) {
    return { json: fromSchema(input.response_json_schema) };
  }

  return { text: "Réponse générée automatiquement." };
}

async function uploadFile(file: File): Promise<UploadOutput> {
  const maxDataUrlBytes = 8 * 1024 * 1024;
  const mediaLike = file.type.startsWith("video/") || file.type.startsWith("audio/");
  const isHeavy = file.size > maxDataUrlBytes || mediaLike;

  if (isHeavy) {
    try {
      return await saveFileToLocalMedia(file);
    } catch {
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        return {
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type
        };
      }
    }
  }

  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("UploadFile: unable to read file"));
    reader.readAsDataURL(file);
  });

  return {
    url,
    name: file.name,
    size: file.size,
    type: file.type
  };
}

export const base44 = {
  entities: {
    Patient: entityClient("Patient") as EntityClient<Patient>,
    Appointment: entityClient("Appointment") as EntityClient<Appointment>,
    SocialPost: entityClient("SocialPost") as EntityClient<SocialPost>,
    TVContent: entityClient("TVContent") as EntityClient<TVContent>,
    TVAudioTrack: entityClient("TVAudioTrack") as EntityClient<TVAudioTrack>,
    WaitingQueueTicket: entityClient("WaitingQueueTicket") as EntityClient<WaitingQueueTicket>,
    PatientFlowEvent: entityClient("PatientFlowEvent") as EntityClient<PatientFlowEvent>,
    AuditLog: entityClient("AuditLog") as EntityClient<AuditLog>,
    Resource: entityClient("Resource") as EntityClient<Resource>,
    LanDevice: entityClient("LanDevice") as EntityClient<LanDevice>,
    HealthNetworkLink: entityClient("HealthNetworkLink") as EntityClient<HealthNetworkLink>,
    Lead: entityClient("Lead") as EntityClient<Lead>,
    DoctorProfile: entityClient("DoctorProfile") as EntityClient<DoctorProfile>,
    AIReport: entityClient("AIReport") as EntityClient<AIReport>
  },
  integrations: {
    Core: {
      InvokeLLM: invokeLLM,
      UploadFile: uploadFile
    }
  }
};
