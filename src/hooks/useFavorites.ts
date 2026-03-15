import { useState, useCallback } from "react";

const STORAGE_KEY = "favorites_providers";

function getStoredFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getStoredFavorites);

  const toggleFavorite = useCallback((providerId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (providerId: string) => favorites.includes(providerId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
