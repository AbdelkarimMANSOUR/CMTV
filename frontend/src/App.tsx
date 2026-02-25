import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AIReportsPage } from "./pages/AIReportsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DoctorProfilePage } from "./pages/DoctorProfilePage";
import { HealthNetworkPage } from "./pages/HealthNetworkPage";
import { LandingBookingPage } from "./pages/LandingBookingPage";
import { LandingHomePage } from "./pages/LandingHomePage";
import { LandingServicesPage } from "./pages/LandingServicesPage";
import { LanDevicesPage } from "./pages/LanDevicesPage";
import { PatientsPage } from "./pages/PatientsPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { SocialMediaPage } from "./pages/SocialMediaPage";
import { TraceabilityPage } from "./pages/TraceabilityPage";
import { TVDisplayPage } from "./pages/TVDisplayPage";
import { TVManagerPage } from "./pages/TVManagerPage";

export function App() {
  return (
    <Routes>
      <Route path="/tv-display/:screen" element={<TVDisplayPage />} />
      <Route path="/tv-display" element={<Navigate to="/tv-display/salle_attente" replace />} />
      <Route path="/landing" element={<LandingHomePage />} />
      <Route path="/landing/services" element={<LandingServicesPage />} />
      <Route path="/landing/rendez-vous" element={<LandingBookingPage />} />

      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/social-media" element={<SocialMediaPage />} />
        <Route path="/tv-manager" element={<TVManagerPage />} />
        <Route path="/traceability" element={<TraceabilityPage />} />
        <Route path="/lan-devices" element={<LanDevicesPage />} />
        <Route path="/health-network" element={<HealthNetworkPage />} />
        <Route path="/ai-reports" element={<AIReportsPage />} />
        <Route path="/doctor-profile" element={<DoctorProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
