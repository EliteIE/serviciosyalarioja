import { Link, useLocation, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  variant: "admin" | "provider" | "client";
}

const DashboardLayout = ({ variant }: DashboardLayoutProps) => {
  const { profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const dashboardPath = variant === "provider" ? "/prestador" : variant === "admin" ? "/admin" : "/cliente";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar variant={variant} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b bg-card/95 backdrop-blur px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden md:flex" />
              <Link to="/" className="md:hidden flex items-center gap-2">
                <img src={logo} alt="Servicios 360" className="h-7 w-7 rounded-lg" />
                <span className="text-lg font-bold">Servicios <span className="text-primary">360</span></span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications bell */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => notifications.data?.filter((n) => !n.read).forEach((n) => markAsRead.mutate(n.id))}
                        className="text-[10px] text-primary hover:underline font-medium"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <ScrollArea className="max-h-72">
                    {!notifications.data?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Sin notificaciones</p>
                    ) : (
                      notifications.data.map((n) => {
                        const getNotificationLink = () => {
                          const text = `${n.title} ${n.message}`.toLowerCase();
                          if (text.includes("presupuesto") || text.includes("servicio")) return `${dashboardPath}/servicios`;
                          if (text.includes("mensaje") || text.includes("chat")) return `${dashboardPath}/chat`;
                          if (text.includes("reseña") || text.includes("calific")) return `${dashboardPath}/resenas`;
                          if (text.includes("pago") || text.includes("cobro")) return dashboardPath;
                          return dashboardPath;
                        };

                        return (
                          <div
                            key={n.id}
                            className={`p-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                            onClick={() => {
                              markAsRead.mutate(n.id);
                              navigate(getNotificationLink());
                            }}
                          >
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(n.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>Mi Panel</DropdownMenuItem>
                  {variant === "provider" && (
                    <DropdownMenuItem onClick={() => navigate("/prestador/perfil")}>Mi Perfil</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
