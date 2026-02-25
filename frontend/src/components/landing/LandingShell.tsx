import { HeartPulse, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type LandingShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
};

export function LandingShell({ title, subtitle, children, className }: LandingShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcf7f9] via-[#f4eef8] to-[#eef4fb] text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5">
        <Link to="/landing" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-900">
          <HeartPulse className="h-5 w-5" />
          Cabinet Basma
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-full px-3 py-1.5 text-slate-700 hover:bg-white/70" to="/landing">Accueil</Link>
          <Link className="rounded-full px-3 py-1.5 text-slate-700 hover:bg-white/70" to="/landing/services">Services</Link>
          <Link className="rounded-full px-3 py-1.5 text-slate-700 hover:bg-white/70" to="/landing/rendez-vous">Prendre RDV</Link>
          <Link className="rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white" to="/dashboard">Espace cabinet</Link>
        </nav>
      </header>

      <main className={cn("mx-auto w-full max-w-7xl px-4 pb-12", className)}>
        <section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-card backdrop-blur">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-violet-700">
            <Stethoscope className="h-3.5 w-3.5" />
            Clinique gynécologie & obstétrique
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 lg:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 lg:text-base">{subtitle}</p>
        </section>

        {children}
      </main>

      <footer className="border-t border-white/70 bg-white/70 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Dr Basma Oumalloul. Cabinet médical connecté.
      </footer>
    </div>
  );
}
