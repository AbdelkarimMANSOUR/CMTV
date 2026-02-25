import { addDays, format } from "date-fns";
import type { Database } from "../types/entities";

function isoNow() {
  return new Date().toISOString();
}

function id(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

const today = new Date();
const todayDate = format(today, "yyyy-MM-dd");
const tomorrowDate = format(addDays(today, 1), "yyyy-MM-dd");
const plus2Date = format(addDays(today, 2), "yyyy-MM-dd");
const plus7Date = format(addDays(today, 7), "yyyy-MM-dd");
const plus30Date = format(addDays(today, 30), "yyyy-MM-dd");

export function createDemoDatabase(): Database {
  const now = isoNow();

  return {
    Patient: [
      {
        id: id("pat", 1),
        nom: "El Mansouri",
        prenom: "Sara",
        dateNaissance: "1989-03-17",
        genre: "femme",
        telephone: "+212600120120",
        email: "sara.elmansouri@example.com",
        adresse: "12 Rue Atlas, Casablanca",
        groupeSanguin: "A+",
        allergies: ["Pénicilline"],
        notes: "Suivi thyroïde trimestriel.",
        numeroAssurance: "CNSS-4589102",
        contactUrgence: { name: "Yassine El Mansouri", phone: "+212600900111", relation: "Conjoint" },
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("pat", 2),
        nom: "Benhaddou",
        prenom: "Omar",
        dateNaissance: "1976-11-22",
        genre: "homme",
        telephone: "+212611002233",
        email: "omar.benhaddou@example.com",
        adresse: "3 Avenue Hassan II, Rabat",
        groupeSanguin: "O-",
        allergies: ["Arachide"],
        notes: "Diabète type 2, contrôle glycémie.",
        numeroAssurance: "CNOPS-772019",
        contactUrgence: { name: "Nadia Benhaddou", phone: "+212611009988", relation: "Épouse" },
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("pat", 3),
        nom: "Amrani",
        prenom: "Lina",
        dateNaissance: "2001-06-05",
        genre: "femme",
        telephone: "+212620335577",
        email: "lina.amrani@example.com",
        adresse: "45 Bd Zerktouni, Casablanca",
        groupeSanguin: "B+",
        allergies: [],
        notes: "Vaccination à mettre à jour.",
        numeroAssurance: "AMO-229044",
        contactUrgence: { name: "Khadija Amrani", phone: "+212620300100", relation: "Mère" },
        createdAt: now,
        updatedAt: now
      }
    ],
    Appointment: [
      {
        id: id("rdv", 1),
        patient_id: id("pat", 1),
        date: todayDate,
        heure: "09:00",
        duree: 30,
        type: "suivi",
        statut: "confirme",
        motif: "Suivi hormonal",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("rdv", 2),
        patient_id: id("pat", 2),
        date: todayDate,
        heure: "11:15",
        duree: 20,
        type: "controle",
        statut: "planifie",
        motif: "Contrôle glycémie",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("rdv", 3),
        patient_id: id("pat", 3),
        date: tomorrowDate,
        heure: "14:00",
        duree: 25,
        type: "vaccination",
        statut: "planifie",
        motif: "Rappel vaccin",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("rdv", 4),
        patient_id: id("pat", 1),
        date: plus2Date,
        heure: "16:30",
        duree: 40,
        type: "consultation",
        statut: "planifie",
        motif: "Consultation générale",
        createdAt: now,
        updatedAt: now
      }
    ],
    SocialPost: [
      {
        id: id("post", 1),
        titre: "Hydratation en hiver",
        contenu:
          "Pensez à boire régulièrement même sans sensation de soif. Une bonne hydratation soutient votre immunité.",
        plateforme: "both",
        image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
        statut: "publie",
        hashtags: ["#Santé", "#CabinetMedical", "#Prévention"],
        datePlanification: todayDate,
        metrics: { likes: 120, commentaires: 18, partages: 24 },
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("post", 2),
        titre: "Check-up annuel",
        contenu: "Un bilan annuel permet une détection précoce et un meilleur suivi de votre état de santé.",
        plateforme: "instagram",
        image: "",
        statut: "planifie",
        hashtags: ["#Bilan", "#SantéPréventive"],
        datePlanification: plus2Date,
        metrics: { likes: 0, commentaires: 0, partages: 0 },
        createdAt: now,
        updatedAt: now
      }
    ],
    TVContent: [
      {
        id: id("tv", 1),
        titre: "Bienvenue au cabinet",
        type: "annonce",
        dureeAffichage: 8,
        ordre: 1,
        ecranCible: "toutes",
        dateDebut: todayDate,
        dateFin: plus7Date,
        couleurFond: "#0f172a",
        media: "",
        message: "Merci de préparer votre carte d'assurance avant votre passage à l'accueil.",
        actif: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("tv", 2),
        titre: "Conseil du jour",
        type: "conseil_sante",
        dureeAffichage: 12,
        ordre: 2,
        ecranCible: "salle_attente",
        dateDebut: todayDate,
        dateFin: plus7Date,
        couleurFond: "#1e293b",
        media: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
        message: "Lavez-vous les mains pendant 20 secondes pour limiter les infections saisonnières.",
        actif: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("tv", 3),
        titre: "Message défilant",
        type: "message_defilant",
        dureeAffichage: 10,
        ordre: 3,
        ecranCible: "toutes",
        dateDebut: todayDate,
        dateFin: plus7Date,
        couleurFond: "#f59e0b",
        media: "",
        message: "Nouveaux créneaux de vaccination disponibles chaque mercredi matin.",
        actif: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("tv", 4),
        titre: "Logo cabinet",
        type: "image",
        dureeAffichage: 10,
        ordre: 4,
        ecranCible: "salle_attente",
        dateDebut: todayDate,
        dateFin: plus30Date,
        couleurFond: "#220424",
        media: "/logo-cabinet.svg",
        message: "Dr Basma Oumalloul - Gynécologue Obstétricienne",
        actif: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    TVAudioTrack: [
      {
        id: id("audio", 1),
        titre: "Ambiance douce cabinet",
        artiste: "Playlist attente",
        ecranCible: "salle_attente",
        ordre: 1,
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        actif: true,
        loopMode: "playlist",
        volume: 0.7,
        createdAt: now,
        updatedAt: now
      }
    ],
    WaitingQueueTicket: [
      {
        id: id("queue", 1),
        patient_id: id("pat", 1),
        appointment_id: id("rdv", 1),
        numeroTicket: "A-101",
        ecranCible: "salle_attente",
        statut: "appele",
        priorite: "normale",
        heureArrivee: `${todayDate}T08:40:00.000Z`,
        heureAppel: `${todayDate}T09:02:00.000Z`,
        heureConsultation: "",
        heureSortie: "",
        notes: "Patiente prioritaire suivi grossesse",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("queue", 2),
        patient_id: id("pat", 2),
        appointment_id: id("rdv", 2),
        numeroTicket: "A-102",
        ecranCible: "salle_attente",
        statut: "en_attente",
        priorite: "normale",
        heureArrivee: `${todayDate}T10:56:00.000Z`,
        heureAppel: "",
        heureConsultation: "",
        heureSortie: "",
        notes: "",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("queue", 3),
        patient_id: id("pat", 3),
        appointment_id: id("rdv", 3),
        numeroTicket: "P-007",
        ecranCible: "accueil",
        statut: "en_attente",
        priorite: "prioritaire",
        heureArrivee: `${todayDate}T11:10:00.000Z`,
        heureAppel: "",
        heureConsultation: "",
        heureSortie: "",
        notes: "Assistance administrative dossier",
        createdAt: now,
        updatedAt: now
      }
    ],
    PatientFlowEvent: [
      {
        id: id("flow", 1),
        patient_id: id("pat", 1),
        appointment_id: id("rdv", 1),
        queue_ticket_id: id("queue", 1),
        step: "arrivee",
        occuredAt: `${todayDate}T08:40:00.000Z`,
        performedBy: "Accueil",
        details: "Patient enregistré à l'accueil",
        sourceSystem: "ReceptionDesk",
        externalReference: "ARR-10001",
        syncStatus: "synced",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("flow", 2),
        patient_id: id("pat", 1),
        appointment_id: id("rdv", 1),
        queue_ticket_id: id("queue", 1),
        step: "appel_salle",
        occuredAt: `${todayDate}T09:02:00.000Z`,
        performedBy: "Infirmière",
        details: "Patient appelée vers salle 2",
        sourceSystem: "TVQueue",
        externalReference: "CALL-10001",
        syncStatus: "synced",
        createdAt: now,
        updatedAt: now
      }
    ],
    AuditLog: [
      {
        id: id("audit", 1),
        entity: "Patient",
        entityId: id("pat", 1),
        action: "update",
        actor: "admin@cabinet",
        timestamp: now,
        changesSummary: "Mise à jour note patient",
        before: { notes: "Suivi trimestriel." },
        after: { notes: "Suivi thyroïde trimestriel." },
        complianceTag: "CNDP",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("audit", 2),
        entity: "TVContent",
        entityId: id("tv", 1),
        action: "manual",
        actor: "assistant",
        timestamp: now,
        changesSummary: "Diffusion message accueil validée",
        before: null,
        after: { actif: true },
        complianceTag: "Interne",
        createdAt: now,
        updatedAt: now
      }
    ],
    Resource: [
      {
        id: id("res", 1),
        nom: "Dr Basma Oumalloul",
        type: "personnel",
        statut: "occupe",
        capacite: 1,
        planning: "08:30 - 17:30",
        notes: "Consultations gynécologie",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("res", 2),
        nom: "Salle consultation 1",
        type: "salle",
        statut: "disponible",
        capacite: 1,
        planning: "Disponible",
        notes: "Échographie 2D/3D/4D",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("res", 3),
        nom: "Salle attente principale",
        type: "salle",
        statut: "occupe",
        capacite: 15,
        planning: "Ouverte 08:00 - 19:00",
        notes: "TV info patients",
        createdAt: now,
        updatedAt: now
      }
    ],
    LanDevice: [
      {
        id: id("lan", 1),
        nom: "HP LaserJet Ordonnances",
        type: "imprimante",
        ipAdresse: "192.168.1.35",
        macAdresse: "00:1A:11:2B:3C:4D",
        statut: "online",
        authMode: "local_token",
        authSecretMasked: "tok_****_print",
        capabilities: ["print_a4", "print_ordonnance", "duplex"],
        streamUrl: "",
        lastSeenAt: now,
        notes: "Impression ordonnances et reçus",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("lan", 2),
        nom: "Scanner Dossiers",
        type: "scanner",
        ipAdresse: "192.168.1.36",
        macAdresse: "00:1A:11:2B:3C:4E",
        statut: "online",
        authMode: "api_key",
        authSecretMasked: "api_****_scan",
        capabilities: ["scan_pdf", "ocr_basic"],
        streamUrl: "",
        lastSeenAt: now,
        notes: "Numérisation dossiers patients",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("lan", 3),
        nom: "Caméra accueil",
        type: "camera_ip",
        ipAdresse: "192.168.1.70",
        macAdresse: "00:1A:11:2B:3C:4F",
        statut: "online",
        authMode: "oauth2",
        authSecretMasked: "oauth_****_cam",
        capabilities: ["rtsp_stream", "motion_detection"],
        streamUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        lastSeenAt: now,
        notes: "Stream vidéo zone accueil",
        createdAt: now,
        updatedAt: now
      }
    ],
    HealthNetworkLink: [
      {
        id: id("hnet", 1),
        nom: "DMP régional",
        endpoint: "https://api.dmp-regional.ma/v1",
        protocol: "FHIR/REST",
        statut: "connecte",
        lastSyncAt: now,
        tokenMasked: "dmp_****_prod",
        scope: "patient.read appointment.read",
        createdAt: now,
        updatedAt: now
      },
      {
        id: id("hnet", 2),
        nom: "Assurance CNSS",
        endpoint: "https://api.cnss.example/claims",
        protocol: "REST",
        statut: "degrade",
        lastSyncAt: now,
        tokenMasked: "cnss_****_prod",
        scope: "insurance.verify",
        createdAt: now,
        updatedAt: now
      }
    ],
    Lead: [
      {
        id: id("lead", 1),
        fullName: "Imane Belhaj",
        telephone: "+212661112233",
        email: "imane@example.com",
        message: "Besoin d'un RDV suivi grossesse.",
        source: "landing",
        requestedDate: plus2Date,
        requestedService: "Suivi de grossesse",
        status: "nouveau",
        createdAt: now,
        updatedAt: now
      }
    ],
    DoctorProfile: [
      {
        id: id("doc", 1),
        nom: "Dr Basma Oumalloul",
        specialite: "Gynécologue - Obstétricienne",
        bio: "Lauréate de la faculté de médecine et de pharmacie de Marrakech. Suivi de grossesse, accouchement, chirurgie gynécologique et échographie 2D/3D/4D.",
        photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
        telephone: "+212661686070",
        email: "contact@drbasma.ma",
        adresse: "Centre d'affaire Al Baraka, Bd Allal Al Fassi, 5ème étage N°32, Marrakech",
        horaires: "Lun-Sam 09:00-19:00",
        instagramHandle: "dr.basma.oumalloul",
        instagramFollowers: 5240,
        googleBusinessUrl: "https://maps.google.com/?q=Dr+Basma+Oumalloul",
        googleRating: 4.9,
        googleReviews: 210,
        siteWeb: "https://cabinet-basma.example.com",
        createdAt: now,
        updatedAt: now
      }
    ],
    AIReport: [
      {
        id: id("report", 1),
        typePeriode: "hebdo",
        periodeLabel: "Semaine courante",
        generatedAt: now,
        metrics: {
          totalPatients: 3,
          rdvTotal: 4,
          rdvCompletes: 1,
          rdvAnnules: 0,
          engagementSocial: 162,
          contenusTVActifs: 4
        },
        resume: "Tendance positive sur l'engagement social. Optimisation possible des confirmations de rendez-vous.",
        insights: [
          {
            id: id("insight", 1),
            categorie: "Rendez-vous",
            priorite: "haute",
            titre: "Pic d'absences à anticiper",
            description: "Ajouter un rappel H-24 pourrait réduire les absences du créneau du matin."
          },
          {
            id: id("insight", 2),
            categorie: "Réseaux Sociaux",
            priorite: "moyenne",
            titre: "Contenu prévention performant",
            description: "Les publications éducatives ont généré plus d'interactions que les annonces de service."
          }
        ],
        recommendations: [
          {
            id: id("rec", 1),
            titre: "Automatiser les rappels SMS",
            impact: "eleve",
            description: "Planifier des rappels J-1 et H-2 pour améliorer le taux de présence."
          },
          {
            id: id("rec", 2),
            titre: "Renforcer les messages TV pré-consultation",
            impact: "moyen",
            description: "Afficher des instructions administratives en continu sur l'écran d'accueil."
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}
