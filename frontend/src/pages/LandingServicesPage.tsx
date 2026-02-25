import { Baby, HeartPulse, Microscope, ScanLine, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { LandingShell } from "../components/landing/LandingShell";
import { Card } from "../components/ui/card";
import { useSeo } from "../hooks/useSeo";

const services = [
  {
    icon: HeartPulse,
    title: "Suivi de grossesse",
    description: "Suivi médical complet de la grossesse avec conseils personnalisés à chaque trimestre."
  },
  {
    icon: Baby,
    title: "Accouchement",
    description: "Préparation, accompagnement et coordination de l'accouchement avec sécurité materno-fœtale."
  },
  {
    icon: Stethoscope,
    title: "Chirurgie gynécologique",
    description: "Prise en charge des pathologies gynécologiques et actes chirurgicaux adaptés."
  },
  {
    icon: Microscope,
    title: "Infertilité du couple",
    description: "Bilan diagnostique et orientation thérapeutique pour le projet de fertilité."
  },
  {
    icon: ScanLine,
    title: "Échographie 2D, 3D, 4D",
    description: "Imagerie de suivi et d'exploration obstétricale/gynécologique en haute précision."
  },
  {
    icon: ShieldCheck,
    title: "Suivi conformité",
    description: "Traçabilité du parcours patient et conservation sécurisée des informations médicales."
  }
];

export function LandingServicesPage() {
  useSeo(
    "Services médicaux | Cabinet Dr Basma Oumalloul",
    "Découvrez les services du cabinet: suivi de grossesse, accouchement, chirurgie gynécologique, infertilité, échographie 2D/3D/4D."
  );

  return (
    <LandingShell
      title="Services médicaux"
      subtitle="Une offre de soins complète en gynécologie et obstétrique, avec organisation moderne et suivi continu."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.title} className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-violet-100 p-2 text-violet-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{service.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{service.description}</p>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-6 text-center shadow-card">
        <h3 className="text-xl font-semibold text-slate-900">Besoin d'un rendez-vous rapide ?</h3>
        <p className="mt-2 text-sm text-slate-600">Déposez votre demande en ligne, l'équipe vous rappelle pour confirmer votre créneau.</p>
        <Link to="/landing/rendez-vous" className="mt-4 inline-flex rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
          Aller au formulaire RDV
        </Link>
      </section>
    </LandingShell>
  );
}
