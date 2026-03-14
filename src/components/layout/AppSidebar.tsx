import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, AlertTriangle, TrendingUp,
  Home, Briefcase, Image, DollarSign, UserCircle,
  ClipboardList, MessageSquare, Star, Shield, PlusCircle
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import logo from "@/assets/logo.png";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Prestadores", url: "/admin/prestadores", icon: Users },
  { title: "Disputas", url: "/admin/disputas", icon: AlertTriangle },
  { title: "Reportes", url: "/admin/reportes", icon: TrendingUp },
  { title: "Moderación", url: "/admin/moderacion", icon: Shield },
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
                      <item.icon className="mr-2 h-4 w-4" />
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
