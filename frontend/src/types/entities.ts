export type Gender = "homme" | "femme" | "autre";

export type AppointmentType = "consultation" | "suivi" | "urgence" | "controle" | "vaccination";

export type AppointmentStatus =
  | "planifie"
  | "confirme"
  | "en_cours"
  | "termine"
  | "annule"
  | "absent";

export type SocialPlatform = "instagram" | "google" | "both";
export type SocialStatus = "brouillon" | "planifie" | "publie";

export type TVContentType =
  | "annonce"
  | "conseil_sante"
  | "info_cabinet"
  | "video"
  | "image"
  | "message_defilant";

export type TVTargetScreen = "salle_attente" | "accueil" | "toutes";
export type TVAudioLoopMode = "playlist" | "single";

export type QueueTicketStatus = "en_attente" | "appele" | "en_consultation" | "termine" | "absent";
export type QueueTicketPriority = "normale" | "prioritaire" | "urgence";

export type PatientFlowStep =
  | "arrivee"
  | "appel_salle"
  | "consultation_debut"
  | "consultation_fin"
  | "depart"
  | "absence";

export type SyncStatus = "synced" | "pending" | "failed";
export type AuditAction = "create" | "update" | "delete" | "manual";

export type ResourceType = "personnel" | "salle" | "equipement";
export type ResourceStatus = "disponible" | "occupe" | "maintenance" | "hors_service";

export type LanDeviceType = "imprimante" | "scanner" | "camera_ip" | "routeur" | "autre";
export type LanDeviceStatus = "online" | "offline" | "alerte";
export type LanAuthMode = "api_key" | "oauth2" | "local_token";

export type HealthNetworkStatus = "connecte" | "degrade" | "deconnecte";
export type LeadStatus = "nouveau" | "contacte" | "converti" | "archive";

export type InsightCategory = "Rendez-vous" | "Réseaux Sociaux" | "Communication TV" | "Gestion";
export type InsightPriority = "haute" | "moyenne" | "basse";
export type RecommendationImpact = "eleve" | "moyen" | "faible";

export type EntityBase = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  relation: string;
};

export type Patient = EntityBase & {
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: Gender;
  telephone: string;
  email: string;
  adresse: string;
  groupeSanguin: string;
  allergies: string[];
  notes: string;
  numeroAssurance: string;
  contactUrgence: EmergencyContact;
};

export type Appointment = EntityBase & {
  patient_id: string;
  date: string;
  heure: string;
  duree: number;
  type: AppointmentType;
  statut: AppointmentStatus;
  motif: string;
};

export type EngagementMetrics = {
  likes: number;
  commentaires: number;
  partages: number;
};

export type SocialPost = EntityBase & {
  titre: string;
  contenu: string;
  plateforme: SocialPlatform;
  image: string;
  statut: SocialStatus;
  hashtags: string[];
  datePlanification: string;
  metrics: EngagementMetrics;
};

export type TVContent = EntityBase & {
  titre: string;
  type: TVContentType;
  dureeAffichage: number;
  ordre: number;
  ecranCible: TVTargetScreen;
  dateDebut: string;
  dateFin: string;
  couleurFond: string;
  media: string;
  message: string;
  actif: boolean;
};

export type TVAudioTrack = EntityBase & {
  titre: string;
  artiste: string;
  ecranCible: TVTargetScreen;
  ordre: number;
  url: string;
  actif: boolean;
  loopMode: TVAudioLoopMode;
  volume: number;
};

export type WaitingQueueTicket = EntityBase & {
  patient_id: string;
  appointment_id?: string;
  numeroTicket: string;
  ecranCible: TVTargetScreen;
  statut: QueueTicketStatus;
  priorite: QueueTicketPriority;
  heureArrivee: string;
  heureAppel: string;
  heureConsultation: string;
  heureSortie: string;
  notes: string;
};

export type PatientFlowEvent = EntityBase & {
  patient_id: string;
  appointment_id: string;
  queue_ticket_id: string;
  step: PatientFlowStep;
  occuredAt: string;
  performedBy: string;
  details: string;
  sourceSystem: string;
  externalReference: string;
  syncStatus: SyncStatus;
};

export type AuditLog = EntityBase & {
  entity: string;
  entityId: string;
  action: AuditAction;
  actor: string;
  timestamp: string;
  changesSummary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  complianceTag: "RGPD" | "CNDP" | "Interne";
};

export type Resource = EntityBase & {
  nom: string;
  type: ResourceType;
  statut: ResourceStatus;
  capacite: number;
  planning: string;
  notes: string;
};

export type LanDevice = EntityBase & {
  nom: string;
  type: LanDeviceType;
  ipAdresse: string;
  macAdresse: string;
  statut: LanDeviceStatus;
  authMode: LanAuthMode;
  authSecretMasked: string;
  capabilities: string[];
  streamUrl: string;
  lastSeenAt: string;
  notes: string;
};

export type HealthNetworkLink = EntityBase & {
  nom: string;
  endpoint: string;
  protocol: string;
  statut: HealthNetworkStatus;
  lastSyncAt: string;
  tokenMasked: string;
  scope: string;
};

export type Lead = EntityBase & {
  fullName: string;
  telephone: string;
  email: string;
  message: string;
  source: string;
  requestedDate: string;
  requestedService: string;
  status: LeadStatus;
};

export type DoctorProfile = EntityBase & {
  nom: string;
  specialite: string;
  bio: string;
  photo: string;
  telephone: string;
  email: string;
  adresse: string;
  horaires: string;
  instagramHandle: string;
  instagramFollowers: number;
  googleBusinessUrl: string;
  googleRating: number;
  googleReviews: number;
  siteWeb: string;
};

export type AIInsight = {
  id: string;
  categorie: InsightCategory;
  priorite: InsightPriority;
  titre: string;
  description: string;
};

export type AIRecommendation = {
  id: string;
  titre: string;
  impact: RecommendationImpact;
  description: string;
};

export type AIReportMetrics = {
  totalPatients: number;
  rdvTotal: number;
  rdvCompletes: number;
  rdvAnnules: number;
  engagementSocial: number;
  contenusTVActifs: number;
};

export type AIReport = EntityBase & {
  typePeriode: "hebdo" | "mensuel";
  periodeLabel: string;
  generatedAt: string;
  metrics: AIReportMetrics;
  resume: string;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
};

export type Database = {
  Patient: Patient[];
  Appointment: Appointment[];
  SocialPost: SocialPost[];
  TVContent: TVContent[];
  TVAudioTrack: TVAudioTrack[];
  WaitingQueueTicket: WaitingQueueTicket[];
  PatientFlowEvent: PatientFlowEvent[];
  AuditLog: AuditLog[];
  Resource: Resource[];
  LanDevice: LanDevice[];
  HealthNetworkLink: HealthNetworkLink[];
  Lead: Lead[];
  DoctorProfile: DoctorProfile[];
  AIReport: AIReport[];
};

export type EntityName = keyof Database;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
  absent: "Absent"
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: "Consultation",
  suivi: "Suivi",
  urgence: "Urgence",
  controle: "Contrôle",
  vaccination: "Vaccination"
};

export const SOCIAL_STATUS_LABELS: Record<SocialStatus, string> = {
  brouillon: "Brouillon",
  planifie: "Planifié",
  publie: "Publié"
};

export const TV_TYPE_LABELS: Record<TVContentType, string> = {
  annonce: "Annonce",
  conseil_sante: "Conseil santé",
  info_cabinet: "Info cabinet",
  video: "Vidéo",
  image: "Image",
  message_defilant: "Message défilant"
};

export const QUEUE_STATUS_LABELS: Record<QueueTicketStatus, string> = {
  en_attente: "En attente",
  appele: "Appelé",
  en_consultation: "En consultation",
  termine: "Terminé",
  absent: "Absent"
};

export const QUEUE_PRIORITY_LABELS: Record<QueueTicketPriority, string> = {
  normale: "Normale",
  prioritaire: "Prioritaire",
  urgence: "Urgence"
};

export const FLOW_STEP_LABELS: Record<PatientFlowStep, string> = {
  arrivee: "Arrivée",
  appel_salle: "Appel salle",
  consultation_debut: "Début consultation",
  consultation_fin: "Fin consultation",
  depart: "Départ",
  absence: "Absence"
};

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  disponible: "Disponible",
  occupe: "Occupé",
  maintenance: "Maintenance",
  hors_service: "Hors service"
};

export const LAN_DEVICE_STATUS_LABELS: Record<LanDeviceStatus, string> = {
  online: "Online",
  offline: "Offline",
  alerte: "Alerte"
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  converti: "Converti",
  archive: "Archivé"
};
