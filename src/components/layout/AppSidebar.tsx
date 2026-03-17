import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, AlertTriangle, TrendingUp,
  Home, Briefcase, Image, DollarSign, UserCircle,
  ClipboardList, MessageSquare, Star, Shield, PlusCircle, FileText
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Prestadores", url: "/admin/prestadores", icon: Users },
  { title: "Disputas", url: "/admin/disputas", icon: AlertTriangle },
  { title: "Reportes", url: "/admin/reportes", icon: TrendingUp },
  { title: "Moderación", url: "/admin/moderacion", icon: Shield },
  { title: "Auditoría", url: "/admin/audit", icon: FileText },
];

const providerItems = [
  { title: "Dashboard", url: "/prestador", icon: Home },
  { title: "Servicios", url: "/prestador/servicios", icon: Briefcase },
  { title: "Chat", url: "/prestador/chat", icon: MessageSquare },
  { title: "Portafolio", url: "/prestador/portafolio", icon: Image },
  { title: "Finanzas", url: "/prestador/finanzas", icon: DollarSign },
  { title: "Mi Perfil", url: "/prestador/perfil", icon: UserCircle },
];

const clientItems = [
  { title: "Dashboard", url: "/cliente", icon: Home },
  { title: "Solicitar Servicio", url: "/cliente/solicitar", icon: PlusCircle },
  { title: "Mis Servicios", url: "/cliente/servicios", icon: ClipboardList },
  { title: "Chat", url: "/cliente/chat", icon: MessageSquare },
  { title: "Reseñas", url: "/cliente/resenas", icon: Star },
  { title: "Mi Perfil", url: "/cliente/perfil", icon: UserCircle },
];

interface AppSidebarProps {
  variant: "admin" | "provider" | "client";
}

const AppSidebar = ({ variant }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  // Fetch active service request IDs for unread badge
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  useEffect(() => {
    if (!user || variant === "admin") return;
    const fetchIds = async () => {
      const col = variant === "provider" ? "provider_id" : "client_id";
      const { data } = await supabase
        .from("service_requests")
        .select("id")
        .eq(col, user.id)
        .not("status", "in", '("cancelado","completado")');
      setServiceIds((data || []).map((d) => d.id));
    };
    fetchIds();
  }, [user, variant]);

  const { hasUnread, unreadServiceIds } = useUnreadMessages(serviceIds);
  const unreadCount = unreadServiceIds.size;

  const items = variant === "admin" ? adminItems : variant === "provider" ? providerItems : clientItems;
  const label = variant === "admin" ? "Administración" : variant === "provider" ? "Prestador" : "Cliente";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Servicios Ya" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold text-sidebar-foreground">
                Servicios <span className="text-sidebar-primary">Ya</span>
              </span>
            </Link>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">{label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === `/admin` || item.url === `/prestador` || item.url === `/cliente`}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <div className="relative mr-2">
                        <item.icon className="h-4 w-4" />
                        {item.title === "Chat" && hasUnread && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
