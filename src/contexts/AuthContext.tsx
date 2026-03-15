import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  userRole: string | null;
  signOut: () => Promise<void>;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  is_provider: boolean;
  provider_verified: boolean;
  provider_available: boolean;
  provider_category: string | null;
  completed_jobs: number;
  rating_avg: number;
  review_count: number;
  bank_alias: string | null;
  bank_cvu: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  userRole: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    // Explicitly select only non-sensitive columns — exclude bank_alias, bank_cvu (encrypted)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, location, bio, is_provider, provider_verified, provider_available, provider_category, completed_jobs, rating_avg, review_count")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Failed to fetch profile:", error.message);
      setProfile(null);
      return null;
    }
    setProfile({ ...data, bank_alias: null, bank_cvu: null });
    return data;
  };

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("Failed to fetch role:", error.message);
      // Fallback: check profile.is_provider to determine role safely
      // This prevents a missing user_roles row from granting wrong access
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_provider")
        .eq("id", userId)
        .single();
      setUserRole(prof?.is_provider ? "provider" : "client");
      return null;
    }
    setUserRole(data?.role ?? "client");
    return data;
  };

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
  }, []);

  // Security: Inactivity timeout — warning at 25 min, auto-logout after 30 min
  useEffect(() => {
    const WARNING_LIMIT = 25 * 60 * 1000; // 25 minutes
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    let warningTimer: ReturnType<typeof setTimeout>;
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(warningTimer);
      clearTimeout(inactivityTimer);
      if (user) {
        warningTimer = setTimeout(() => {
          toast.warning("Tu sesión se cerrará en 5 minutos por inactividad. Mové el mouse para continuar.");
        }, WARNING_LIMIT);
        inactivityTimer = setTimeout(() => {
          signOut();
        }, INACTIVITY_LIMIT);
      }
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(inactivityTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [user, signOut]);

  useEffect(() => {
    let isMounted = true;
    let initialSessionHandled = false;

    // Set up auth listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        // Skip if this is the INITIAL_SESSION event that duplicates getSession
        if (!initialSessionHandled) {
          initialSessionHandled = true;
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchRole(session.user.id),
          ]);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        if (isMounted) setLoading(false);
      }
    );

    // Check existing session (single source of truth on mount)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      initialSessionHandled = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchRole(session.user.id),
        ]);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
