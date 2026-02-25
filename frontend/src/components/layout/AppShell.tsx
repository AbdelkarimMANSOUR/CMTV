import {
  Building2,
  Bot,
  CalendarDays,
  Globe2,
  LayoutDashboard,
  Network,
  Megaphone,
  Menu,
  MonitorPlay,
  ShieldCheck,
  Stethoscope,
  Users,
  Wifi,
  X
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/resources", label: "Resources", icon: Building2 },
  { to: "/social-media", label: "SocialMedia", icon: Megaphone },
  { to: "/tv-manager", label: "TVManager", icon: MonitorPlay },
  { to: "/traceability", label: "Traceability", icon: ShieldCheck },
  { to: "/lan-devices", label: "LAN Devices", icon: Wifi },
  { to: "/health-network", label: "HealthNetwork", icon: Network },
  { to: "/ai-reports", label: "AIReports", icon: Bot },
  { to: "/doctor-profile", label: "DoctorProfile", icon: Stethoscope },
  { to: "/landing", label: "Landing", icon: Globe2 }
];

function Sidebar({ closeOnClick }: { closeOnClick?: () => void }) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white/90 p-4 backdrop-blur">
      <div className="mb-6 rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">Cabinet Smart</p>
        <p className="mt-1 text-lg font-semibold">Gestion médicale</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeOnClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        TV display: <a className="font-semibold text-slate-900" href="/tv-display/salle_attente">/tv-display/salle_attente</a>
      </div>
    </aside>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <p className="text-sm font-semibold">Cabinet Smart</p>
          <button
            className="rounded-lg border border-slate-300 p-2"
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 flex bg-slate-900/40">
            <Sidebar closeOnClick={() => setMobileOpen(false)} />
            <button
              className="flex-1"
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <main className="w-full p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
