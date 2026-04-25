import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

// Eagerly-loaded layout shells (small, needed for every route)
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Home is eager for fastest LCP; everything else is lazy-loaded.
import Index from "./pages/Index";

// ---- Lazy route chunks -------------------------------------------------
// Public
const SearchPage = lazy(() => import("./pages/Search"));
const ProviderProfilePage = lazy(() => import("./pages/ProviderProfile"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Contacto = lazy(() => import("./pages/Contacto"));
const ComoFunciona = lazy(() => import("./pages/ComoFunciona"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Arrepentimiento = lazy(() => import("./pages/Arrepentimiento"));
const RequestBudget = lazy(() => import("./pages/RequestBudget"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const RegisterClient = lazy(() => import("./pages/auth/RegisterClient"));
const RegisterProvider = lazy(() => import("./pages/auth/RegisterProvider"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ConfirmEmail = lazy(() => import("./pages/auth/ConfirmEmail"));

// Client
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const ClientChat = lazy(() => import("./pages/client/Chat"));
const ClientServices = lazy(() => import("./pages/client/Services"));
const ClientReviews = lazy(() => import("./pages/client/Reviews"));
const ClientDisputes = lazy(() => import("./pages/client/Disputes"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));
const RequestService = lazy(() => import("./pages/client/RequestService"));

// Provider
const ProviderDashboard = lazy(() => import("./pages/provider/Dashboard"));
const ProviderServices = lazy(() => import("./pages/provider/Services"));
const ServiceDetail = lazy(() => import("./pages/provider/ServiceDetail"));
const ProviderPortfolio = lazy(() => import("./pages/provider/Portfolio"));
const ProviderFinance = lazy(() => import("./pages/provider/Finance"));
const ProviderProfilePage2 = lazy(() => import("./pages/provider/Profile"));

// Admin (biggest chunk — loaded only on demand)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProviders = lazy(() => import("./pages/admin/Providers"));
const AdminDisputes = lazy(() => import("./pages/admin/Disputes"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminModeration = lazy(() => import("./pages/admin/Moderation"));
const AdminAuditLog = lazy(() => import("./pages/admin/AuditLog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* Public */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/buscar" element={<SearchPage />} />
                  <Route path="/p/:id" element={<ProviderProfilePage />} />
                  <Route path="/terminos" element={<TermsAndConditions />} />
                  <Route path="/privacidad" element={<PrivacyPolicy />} />
                  <Route path="/contacto" element={<Contacto />} />
                  <Route path="/como-funciona" element={<ComoFunciona />} />
                  <Route path="/preguntas-frecuentes" element={<FAQ />} />
                  <Route path="/nosotros" element={<Nosotros />} />
                  <Route path="/arrepentimiento" element={<Arrepentimiento />} />
                </Route>

                {/* Standalone pages — protected (user must be logged in to request) */}
                <Route element={<ProtectedRoute allowedRoles={["client", "provider", "admin"]} />}>
                  <Route path="/solicitar/:providerId" element={<RequestBudget />} />
                </Route>

                {/* Auth (no layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/registro/cliente" element={<RegisterClient />} />
                <Route path="/registro/prestador" element={<RegisterProvider />} />
                <Route path="/confirmar-email" element={<ConfirmEmail />} />
                <Route path="/recuperar" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Client — protected (only client role) */}
                <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
                  <Route element={<DashboardLayout variant="client" />}>
                    <Route path="/cliente" element={<ClientDashboard />} />
                    <Route path="/cliente/solicitar" element={<RequestService />} />
                    <Route path="/cliente/chat" element={<ClientChat />} />
                    <Route path="/cliente/servicios" element={<ClientServices />} />
                    <Route path="/cliente/resenas" element={<ClientReviews />} />
                    <Route path="/cliente/perfil" element={<ClientProfile />} />
                  </Route>
                </Route>

                {/* Provider — protected */}
                <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
                  <Route element={<DashboardLayout variant="provider" />}>
                    <Route path="/prestador" element={<ProviderDashboard />} />
                    <Route path="/prestador/servicios" element={<ProviderServices />} />
                    <Route path="/prestador/servicios/:id" element={<ServiceDetail />} />
                    <Route path="/prestador/chat" element={<ClientChat />} />
                    <Route path="/prestador/portafolio" element={<ProviderPortfolio />} />
                    <Route path="/prestador/finanzas" element={<ProviderFinance />} />
                    <Route path="/prestador/perfil" element={<ProviderProfilePage2 />} />
                  </Route>
                </Route>

                {/* Admin — protected */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route element={<DashboardLayout variant="admin" />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/prestadores" element={<AdminProviders />} />
                    <Route path="/admin/disputas" element={<AdminDisputes />} />
                    <Route path="/admin/reportes" element={<AdminReports />} />
                    <Route path="/admin/moderacion" element={<AdminModeration />} />
                    <Route path="/admin/audit" element={<AdminAuditLog />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    {/* Vercel observability — sent to vitals.vercel-insights.com, already whitelisted in CSP */}
    <Analytics />
    <SpeedInsights />
  </ErrorBoundary>
);

export default App;
