import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import SearchPage from "./pages/Search";
import ProviderProfilePage from "./pages/ProviderProfile";
import Login from "./pages/auth/Login";
import RegisterClient from "./pages/auth/RegisterClient";
import RegisterProvider from "./pages/auth/RegisterProvider";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ConfirmEmail from "./pages/auth/ConfirmEmail";
import ClientDashboard from "./pages/client/Dashboard";
import ChatPage from "./pages/client/Chat";
import ClientServices from "./pages/client/Services";
import ClientReviews from "./pages/client/Reviews";
import ClientProfile from "./pages/client/Profile";
import RequestService from "./pages/client/RequestService";
import ProviderDashboard from "./pages/provider/Dashboard";
import ProviderServices from "./pages/provider/Services";
import ServiceDetail from "./pages/provider/ServiceDetail";
import ProviderPortfolio from "./pages/provider/Portfolio";
import ProviderFinance from "./pages/provider/Finance";
import ProviderProfilePage2 from "./pages/provider/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProviders from "./pages/admin/Providers";
import AdminDisputes from "./pages/admin/Disputes";
import AdminReports from "./pages/admin/Reports";
import AdminModeration from "./pages/admin/Moderation";
import RequestBudget from "./pages/RequestBudget";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

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
            <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/prestador/:id" element={<ProviderProfilePage />} />
              <Route path="/terminos" element={<TermsAndConditions />} />
              <Route path="/privacidad" element={<PrivacyPolicy />} />
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

            {/* Client — protected */}
            <Route element={<ProtectedRoute allowedRoles={["client", "provider", "admin"]} />}>
              <Route element={<DashboardLayout variant="client" />}>
                <Route path="/cliente" element={<ClientDashboard />} />
                <Route path="/cliente/solicitar" element={<RequestService />} />
                <Route path="/cliente/chat" element={<ChatPage />} />
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
                <Route path="/prestador/chat" element={<ChatPage />} />
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
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
