import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, PlusCircle, Star, Briefcase, BarChart3, User, LayoutDashboard, Users, AlertTriangle, Shield } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const clientNav: NavItem[] = [
  { label: "Inicio", icon: Home, path: "/cliente" },
  { label: "Buscar", icon: PlusCircle, path: "/cliente/solicitar" },
  { label: "Servicios", icon: Briefcase, path: "/cliente/servicios" },
  { label: "Chat", icon: MessageSquare, path: "/cliente/chat" },
  { label: "Reseñas", icon: Star, path: "/cliente/resenas" },
];

const providerNav: NavItem[] = [
  { label: "Inicio", icon: Home, path: "/prestador" },
  { label: "Servicios", icon: BarChart3, path: "/prestador/servicios" },
  { label: "Chat", icon: MessageSquare, path: "/prestador/chat" },
  { label: "Perfil", icon: User, path: "/prestador/perfil" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Prestadores", icon: Users, path: "/admin/prestadores" },
  { label: "Disputas", icon: AlertTriangle, path: "/admin/disputas" },
  { label: "Moderación", icon: Shield, path: "/admin/moderacion" },
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
          const isActive = location.pathname === item.path;
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
