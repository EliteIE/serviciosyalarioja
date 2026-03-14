import type { Category } from "@/types";

export const CATEGORIES: Category[] = [
  { id: "1", name: "Plomería", slug: "plomeria", icon: "Wrench", description: "Instalación y reparación de cañerías" },
  { id: "2", name: "Electricidad", slug: "electricidad", icon: "Zap", description: "Instalaciones eléctricas y reparaciones" },
  { id: "3", name: "Limpieza", slug: "limpieza", icon: "Sparkles", description: "Limpieza profesional del hogar y oficinas" },
  { id: "4", name: "Pintura", slug: "pintura", icon: "Paintbrush", description: "Pintura interior y exterior" },
  { id: "5", name: "Albañilería", slug: "albanileria", icon: "Hammer", description: "Construcción y reformas" },
  { id: "6", name: "Jardinería", slug: "jardineria", icon: "TreePine", description: "Mantenimiento de jardines y parques" },
  { id: "7", name: "Cerrajería", slug: "cerrajeria", icon: "Key", description: "Apertura y cambio de cerraduras" },
  { id: "8", name: "Mudanzas", slug: "mudanzas", icon: "Truck", description: "Transporte y mudanzas" },
  { id: "9", name: "Aire Acondicionado", slug: "aire-acondicionado", icon: "Wind", description: "Instalación y mantenimiento de A/C" },
  { id: "10", name: "Gasista", slug: "gasista", icon: "Flame", description: "Instalación y reparación de gas" },
  { id: "11", name: "Carpintería", slug: "carpinteria", icon: "Axe", description: "Muebles a medida y reparaciones" },
  { id: "12", name: "Técnico PC", slug: "tecnico-pc", icon: "Monitor", description: "Reparación de computadoras" },
];

export const URGENCY_LABELS = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  presupuestado: "Aguardando Respuesta",
  aceptado: "Aceptado",
  en_progreso: "En Progreso",
  finalizado_prestador: "Aguardando Pago",
  completado: "Completado",
  cancelado: "Cancelado",
} as const;

export const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-accent text-accent-foreground",
  presupuestado: "bg-warning/10 text-warning",
  aceptado: "bg-primary/10 text-primary",
  en_progreso: "bg-warning/10 text-warning",
  finalizado_prestador: "bg-warning/10 text-warning",
  completado: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive",
} as const;
