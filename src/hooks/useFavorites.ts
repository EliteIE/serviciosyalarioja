import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

function getStorageKey(userId: string | null): string {
  return userId ? `favorites_providers_${userId}` : "favorites_providers_anonymous";
}

function getStoredFavorites(userId: string | null): string[] {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(userId)) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [favorites, setFavorites] = useState<string[]>(() => getStoredFavorites(userId));

  // Re-load favorites when user changes (login/logout)
  useEffect(() => {
    setFavorites(getStoredFavorites(userId));
  }, [userId]);

  const toggleFavorite = useCallback((providerId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId];
      localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
      return next;
    });
  }, [userId]);

  const isFavorite = useCallback(
    (providerId: string) => favorites.includes(providerId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
