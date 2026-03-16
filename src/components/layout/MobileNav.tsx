import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, PlusCircle, Briefcase, DollarSign, User, LayoutDashboard, Users, Shield, TrendingUp, FileText, Search } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const clientNav: NavItem[] = [
  { label: "Inicio", icon: Home, path: "/cliente" },
  { label: "Buscar", icon: Search, path: "/cliente/solicitar" },
  { label: "Servicios", icon: Briefcase, path: "/cliente/servicios" },
  { label: "Chat", icon: MessageSquare, path: "/cliente/chat" },
  { label: "Perfil", icon: User, path: "/cliente/perfil" },
];

const providerNav: NavItem[] = [
  { label: "Inicio", icon: Home, path: "/prestador" },
  { label: "Servicios", icon: Briefcase, path: "/prestador/servicios" },
  { label: "Chat", icon: MessageSquare, path: "/prestador/chat" },
  { label: "Finanzas", icon: DollarSign, path: "/prestador/finanzas" },
  { label: "Perfil", icon: User, path: "/prestador/perfil" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Prestadores", icon: Users, path: "/admin/prestadores" },
  { label: "Moderación", icon: Shield, path: "/admin/moderacion" },
  { label: "Reportes", icon: TrendingUp, path: "/admin/reportes" },
  { label: "Auditoría", icon: FileText, path: "/admin/audit" },
];

const MobileNav = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isProvider = location.pathname.startsWith("/prestador");
  const items = isAdmin ? adminNav : isProvider ? providerNav : clientNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = item.path === "/admin" || item.path === "/prestador" || item.path === "/cliente"
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
