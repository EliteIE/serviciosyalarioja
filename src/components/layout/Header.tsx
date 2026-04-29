import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";
import { PROVIDER_INTAKE_PATH } from "@/constants/external";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userRole, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const isPublic = !location.pathname.startsWith("/cliente") &&
                   !location.pathname.startsWith("/prestador") &&
                   !location.pathname.startsWith("/admin");

  const dashboardPath = userRole === "provider" ? "/prestador" : userRole === "admin" ? "/admin" : "/cliente";
  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Servicios 360 — inicio">
          <img src={logo} alt="Servicios 360" className="h-9 w-9 rounded-[16px]" />
          <span className="hidden sm:inline text-xl font-bold text-foreground leading-none">
            Servicios <span className="text-primary">360</span>
          </span>
        </Link>

        {isPublic && (
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="¿Qué servicio necesitás?"
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        )}

        <nav className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/buscar"><Button variant="ghost" size="sm">Explorar</Button></Link>
              <Link to="/login"><Button variant="ghost" size="sm">Iniciar Sesión</Button></Link>
              <Link to="/registro/cliente"><Button variant="outline" size="sm">Registrate Gratis</Button></Link>
              <Link to={PROVIDER_INTAKE_PATH}><Button size="sm">Ofrecer Servicios</Button></Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath}><Button variant="ghost" size="sm">Mi Panel</Button></Link>
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate(user ? dashboardPath : "/login")}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-card animate-fade-in">
          <div className="container py-4 space-y-3">
            {isPublic && (
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="¿Qué servicio necesitás?"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            )}
            {!user ? (
              <>
                <Link to="/buscar" className="block" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Explorar Servicios</Button>
                </Link>
                <Link to="/login" className="block" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Iniciar Sesión</Button>
                </Link>
                <Link to={PROVIDER_INTAKE_PATH} className="block" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Ofrecer Servicios</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={dashboardPath} className="block" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Mi Panel</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
