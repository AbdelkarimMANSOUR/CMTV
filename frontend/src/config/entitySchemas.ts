export const ENTITY_SCHEMAS = {
  Patient: {
    type: "object",
    required: ["nom", "prenom", "dateNaissance", "genre", "telephone", "email", "adresse"],
    properties: {
      nom: { type: "string" },
      prenom: { type: "string" },
      dateNaissance: { type: "string", format: "date" },
      genre: { type: "string", enum: ["homme", "femme", "autre"] },
      telephone: { type: "string" },
      email: { type: "string", format: "email" },
      adresse: { type: "string" },
      groupeSanguin: { type: "string" },
      allergies: { type: "array", items: { type: "string" } },
      notes: { type: "string" },
      numeroAssurance: { type: "string" },
      contactUrgence: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          relation: { type: "string" }
        }
      }
    }
  },
  Appointment: {
    type: "object",
    required: ["patient_id", "date", "heure", "duree", "type", "statut"],
    properties: {
      patient_id: { type: "string" },
      date: { type: "string", format: "date" },
      heure: { type: "string" },
      duree: { type: "number" },
      type: { type: "string", enum: ["consultation", "suivi", "urgence", "controle", "vaccination"] },
      statut: { type: "string", enum: ["planifie", "confirme", "en_cours", "termine", "annule", "absent"] },
      motif: { type: "string" }
    }
  },
  SocialPost: {
    type: "object",
    required: ["titre", "contenu", "plateforme", "statut"],
    properties: {
      titre: { type: "string" },
      contenu: { type: "string" },
      plateforme: { type: "string", enum: ["instagram", "google", "both"] },
      image: { type: "string" },
      statut: { type: "string", enum: ["brouillon", "planifie", "publie"] },
      hashtags: { type: "array", items: { type: "string" } },
      datePlanification: { type: "string" },
      metrics: {
        type: "object",
        properties: {
          likes: { type: "number" },
          commentaires: { type: "number" },
          partages: { type: "number" }
        }
      }
    }
  },
  TVContent: {
    type: "object",
    required: ["titre", "type", "dureeAffichage", "ordre", "ecranCible"],
    properties: {
      titre: { type: "string" },
      type: {
        type: "string",
        enum: ["annonce", "conseil_sante", "info_cabinet", "video", "image", "message_defilant"]
      },
      dureeAffichage: { type: "number" },
      ordre: { type: "number" },
      ecranCible: { type: "string", enum: ["salle_attente", "accueil", "toutes"] },
      dateDebut: { type: "string", format: "date" },
      dateFin: { type: "string", format: "date" },
      couleurFond: { type: "string" },
      media: { type: "string" },
      message: { type: "string" },
      actif: { type: "boolean" }
    }
  },
  TVAudioTrack: {
    type: "object",
    required: ["titre", "ecranCible", "ordre", "url", "actif"],
    properties: {
      titre: { type: "string" },
      artiste: { type: "string" },
      ecranCible: { type: "string", enum: ["salle_attente", "accueil", "toutes"] },
      ordre: { type: "number" },
      url: { type: "string" },
      actif: { type: "boolean" },
      loopMode: { type: "string", enum: ["playlist", "single"] },
      volume: { type: "number" }
    }
  },
  WaitingQueueTicket: {
    type: "object",
    required: ["patient_id", "numeroTicket", "ecranCible", "statut", "priorite", "heureArrivee"],
    properties: {
      patient_id: { type: "string" },
      appointment_id: { type: "string" },
      numeroTicket: { type: "string" },
      ecranCible: { type: "string", enum: ["salle_attente", "accueil", "toutes"] },
      statut: { type: "string", enum: ["en_attente", "appele", "en_consultation", "termine", "absent"] },
      priorite: { type: "string", enum: ["normale", "prioritaire", "urgence"] },
      heureArrivee: { type: "string" },
      heureAppel: { type: "string" },
      heureConsultation: { type: "string" },
      heureSortie: { type: "string" },
      notes: { type: "string" }
    }
  },
  PatientFlowEvent: {
    type: "object",
    required: ["patient_id", "step", "occuredAt", "sourceSystem", "syncStatus"],
    properties: {
      patient_id: { type: "string" },
      appointment_id: { type: "string" },
      queue_ticket_id: { type: "string" },
      step: {
        type: "string",
        enum: ["arrivee", "appel_salle", "consultation_debut", "consultation_fin", "depart", "absence"]
      },
      occuredAt: { type: "string" },
      performedBy: { type: "string" },
      details: { type: "string" },
      sourceSystem: { type: "string" },
      externalReference: { type: "string" },
      syncStatus: { type: "string", enum: ["synced", "pending", "failed"] }
    }
  },
  AuditLog: {
    type: "object",
    required: ["entity", "entityId", "action", "actor", "timestamp", "changesSummary"],
    properties: {
      entity: { type: "string" },
      entityId: { type: "string" },
      action: { type: "string", enum: ["create", "update", "delete", "manual"] },
      actor: { type: "string" },
      timestamp: { type: "string" },
      changesSummary: { type: "string" },
      before: { type: "object" },
      after: { type: "object" },
      complianceTag: { type: "string", enum: ["RGPD", "CNDP", "Interne"] }
    }
  },
  Resource: {
    type: "object",
    required: ["nom", "type", "statut"],
    properties: {
      nom: { type: "string" },
      type: { type: "string", enum: ["personnel", "salle", "equipement"] },
      statut: { type: "string", enum: ["disponible", "occupe", "maintenance", "hors_service"] },
      capacite: { type: "number" },
      planning: { type: "string" },
      notes: { type: "string" }
    }
  },
  LanDevice: {
    type: "object",
    required: ["nom", "type", "ipAdresse", "statut", "authMode"],
    properties: {
      nom: { type: "string" },
      type: { type: "string", enum: ["imprimante", "scanner", "camera_ip", "routeur", "autre"] },
      ipAdresse: { type: "string" },
      macAdresse: { type: "string" },
      statut: { type: "string", enum: ["online", "offline", "alerte"] },
      authMode: { type: "string", enum: ["api_key", "oauth2", "local_token"] },
      authSecretMasked: { type: "string" },
      capabilities: { type: "array", items: { type: "string" } },
      streamUrl: { type: "string" },
      lastSeenAt: { type: "string" },
      notes: { type: "string" }
    }
  },
  HealthNetworkLink: {
    type: "object",
    required: ["nom", "endpoint", "protocol", "statut"],
    properties: {
      nom: { type: "string" },
      endpoint: { type: "string" },
      protocol: { type: "string" },
      statut: { type: "string", enum: ["connecte", "degrade", "deconnecte"] },
      lastSyncAt: { type: "string" },
      tokenMasked: { type: "string" },
      scope: { type: "string" }
    }
  },
  Lead: {
    type: "object",
    required: ["fullName", "source", "status"],
    properties: {
      fullName: { type: "string" },
      telephone: { type: "string" },
      email: { type: "string", format: "email" },
      message: { type: "string" },
      source: { type: "string" },
      requestedDate: { type: "string" },
      requestedService: { type: "string" },
      status: { type: "string", enum: ["nouveau", "contacte", "converti", "archive"] }
    }
  },
  DoctorProfile: {
    type: "object",
    required: ["nom", "specialite", "telephone", "email"],
    properties: {
      nom: { type: "string" },
      specialite: { type: "string" },
      bio: { type: "string" },
      photo: { type: "string" },
      telephone: { type: "string" },
      email: { type: "string", format: "email" },
      adresse: { type: "string" },
      horaires: { type: "string" },
      instagramHandle: { type: "string" },
      instagramFollowers: { type: "number" },
      googleBusinessUrl: { type: "string", format: "uri" },
      googleRating: { type: "number" },
      googleReviews: { type: "number" },
      siteWeb: { type: "string", format: "uri" }
    }
  },
  AIReport: {
    type: "object",
    required: ["typePeriode", "periodeLabel", "generatedAt", "metrics", "resume", "insights", "recommendations"],
    properties: {
      typePeriode: { type: "string", enum: ["hebdo", "mensuel"] },
      periodeLabel: { type: "string" },
      generatedAt: { type: "string" },
      metrics: {
        type: "object",
        properties: {
          totalPatients: { type: "number" },
          rdvTotal: { type: "number" },
          rdvCompletes: { type: "number" },
          rdvAnnules: { type: "number" },
          engagementSocial: { type: "number" },
          contenusTVActifs: { type: "number" }
        }
      },
      resume: { type: "string" },
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            categorie: {
              type: "string",
              enum: ["Rendez-vous", "Réseaux Sociaux", "Communication TV", "Gestion"]
            },
            priorite: { type: "string", enum: ["haute", "moyenne", "basse"] },
            titre: { type: "string" },
            description: { type: "string" }
          }
        }
      },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titre: { type: "string" },
            impact: { type: "string", enum: ["eleve", "moyen", "faible"] },
            description: { type: "string" }
          }
        }
      }
    }
  }
} as const;
