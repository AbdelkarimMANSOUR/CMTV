import { CalendarCheck2, MapPin, PhoneCall, ShieldCheck, Star, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";
import { LandingShell } from "../components/landing/LandingShell";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { useEntityList } from "../hooks/useEntities";
import { useSeo } from "../hooks/useSeo";

export function LandingHomePage() {
  const doctorProfile = useEntityList("DoctorProfile").data?.[0];
  const leads = useEntityList("Lead").data ?? [];

  useSeo(
    "Dr Basma Oumalloul | Gynécologue Obstétricienne à Marrakech",
    "Cabinet Dr Basma Oumalloul à Marrakech: suivi de grossesse, accouchement, chirurgie gynécologique, échographie 2D/3D/4D."
  );

  return (
    <LandingShell
      title="Cabinet Dr Basma Oumalloul"
      subtitle="Gynécologie - obstétrique avec parcours patient digital, prise de rendez-vous simple et suivi médical sécurisé."
    >
      <section className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-2">
            <img
              src={doctorProfile?.photo || "/logo-cabinet.svg"}
              alt="Dr Basma Oumalloul"
              className="h-72 w-full object-cover"
            />
            <div className="p-5">
              <h2 className="text-2xl font-semibold text-slate-900">{doctorProfile?.nom || "Dr Basma Oumalloul"}</h2>
              <p className="text-sm text-slate-600">{doctorProfile?.specialite || "Gynécologue - Obstétricienne"}</p>
              <p className="mt-3 text-sm text-slate-700">{doctorProfile?.bio}</p>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="inline-flex items-center gap-2"><PhoneCall className="h-4 w-4 text-violet-700" /> {doctorProfile?.telephone}</p>
                <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-700" /> {doctorProfile?.adresse}</p>
                <p className="inline-flex items-center gap-2"><TimerReset className="h-4 w-4 text-violet-700" /> {doctorProfile?.horaires}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="appointments">
                  <Star className="mr-1 h-3.5 w-3.5" /> {doctorProfile?.googleRating || 4.9}/5 Google
                </Badge>
                <Badge tone="social">{doctorProfile?.instagramFollowers || 0} followers Instagram</Badge>
                <Badge tone="tv">Demandes RDV: {leads.length}</Badge>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/landing/rendez-vous" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
                  Prendre rendez-vous
                </Link>
                <Link to="/landing/services" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  Voir les services
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Pourquoi ce cabinet</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p className="inline-flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" /> Dossier patient tracé et sécurisé.</p>
            <p className="inline-flex items-start gap-2"><CalendarCheck2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Prise de rendez-vous digitale et rappels automatiques.</p>
            <p className="inline-flex items-start gap-2"><TimerReset className="mt-0.5 h-4 w-4 text-emerald-600" /> File d'attente en temps réel sur TV en salle d'attente.</p>
          </div>

          <div className="mt-5 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-800 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-violet-100">Nouveau</p>
            <p className="mt-1 text-lg font-semibold">Suivi intelligent du parcours patient</p>
            <p className="mt-1 text-sm text-violet-100">Arrivée, consultation et départ horodatés pour conformité et qualité de service.</p>
          </div>
        </Card>
      </section>
    </LandingShell>
  );
}
