export interface Provider {
  id: string;
  name: string;
  avatar: string;
  category: string;
  categorySlug: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  priceRange: string;
  description: string;
  location: string;
  available: boolean;
  completedJobs: number;
  responseTime: string;
  badges: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  providerCount?: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "nuevo" | "presupuestado" | "aceptado" | "en_progreso" | "finalizado_prestador" | "completado" | "cancelado";
  clientName: string;
  clientAvatar: string;
  providerName: string;
  providerAvatar: string;
  date: string;
  budget: number;
  urgency: "baja" | "media" | "alta";
  address: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: "text" | "budget" | "checklist" | "image" | "status";
  metadata?: BudgetBlock | ChecklistBlock | StatusBlock;
}

export interface BudgetBlock {
  items: { description: string; price: number }[];
  total: number;
  status: "pendiente" | "aprobado" | "rechazado";
}

export interface ChecklistBlock {
  items: { label: string; checked: boolean }[];
}

export interface StatusBlock {
  status: string;
  message: string;
}

export interface Review {
  id: string;
  clientName: string;
  clientAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tags: string[];
}

export interface Dispute {
  id: string;
  serviceId: string;
  clientName: string;
  providerName: string;
  reason: string;
  status: "abierta" | "en_revision" | "resuelta";
  date: string;
  amount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  date: string;
}
