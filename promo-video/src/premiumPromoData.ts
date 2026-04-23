export type IconName =
  | 'plumbing'
  | 'electric'
  | 'air'
  | 'carpentry'
  | 'cleaning'
  | 'garden'
  | 'search'
  | 'calendar'
  | 'home'
  | 'star'
  | 'shield'
  | 'receipt'
  | 'clock'
  | 'whatsapp'
  | 'spark';

export const BRAND = {
  name: 'Servicios 360',
  tagline: 'Tu hogar, resuelto.',
  city: 'La Rioja, Argentina',
  domain: 'servicios360.com.ar',
  subtagline: 'Servicios para el hogar, simples y confiables.',
  ctaPrimary: 'Solicitar servicio',
  ctaSecondary: 'Escribinos ahora',
} as const;

export const SERVICES = [
  {
    label: 'Plomeria',
    subtitle: 'Urgencias y reparaciones',
    icon: 'plumbing' as const,
  },
  {
    label: 'Electricidad',
    subtitle: 'Instalaciones y arreglos',
    icon: 'electric' as const,
  },
  {
    label: 'Aire acondicionado',
    subtitle: 'Instalacion y service',
    icon: 'air' as const,
  },
  {
    label: 'Carpinteria',
    subtitle: 'Muebles, puertas y ajustes',
    icon: 'carpentry' as const,
  },
  {
    label: 'Limpieza',
    subtitle: 'Hogares y espacios listos',
    icon: 'cleaning' as const,
  },
  {
    label: 'Jardineria',
    subtitle: 'Mantenimiento y poda',
    icon: 'garden' as const,
  },
] as const;

export const VALUE_PILLS = [
  'Todo en un solo lugar',
  'Profesionales verificados',
  'Reserva en minutos',
  'Atencion rapida por WhatsApp',
] as const;

export const FLOW_STEPS = [
  {
    step: '01',
    title: 'Elegi el servicio',
    detail: 'Encuentra la categoria ideal para tu necesidad.',
    icon: 'search' as const,
  },
  {
    step: '02',
    title: 'Reserva online',
    detail: 'Coordina rapido con datos claros y simples.',
    icon: 'calendar' as const,
  },
  {
    step: '03',
    title: 'Recibi al profesional',
    detail: 'Llega un perfil verificado y listo para ayudarte.',
    icon: 'home' as const,
  },
  {
    step: '04',
    title: 'Califica y paga',
    detail: 'Cierra la experiencia con respaldo y tranquilidad.',
    icon: 'star' as const,
  },
] as const;

export const WHATSAPP_MESSAGES = [
  {
    side: 'left' as const,
    author: 'Cliente',
    text: 'Hola, necesito un electricista para hoy.',
  },
  {
    side: 'right' as const,
    author: 'Servicios 360',
    text: 'Perfecto. En que zona estas?',
  },
  {
    side: 'left' as const,
    author: 'Cliente',
    text: 'Centro.',
  },
  {
    side: 'right' as const,
    author: 'Servicios 360',
    text: 'Te enviamos un profesional verificado.',
  },
] as const;

export const WHATSAPP_TAGS = ['Hoy', 'Centro', 'Verificado'] as const;

export const TRUST_BADGES = [
  {
    title: 'Profesionales verificados',
    subtitle: 'Perfiles revisados y confiables',
    icon: 'shield' as const,
  },
  {
    title: 'Presupuesto claro',
    subtitle: 'Sin sorpresas ni vueltas',
    icon: 'receipt' as const,
  },
  {
    title: 'Garantia',
    subtitle: 'Respaldo para cada servicio',
    icon: 'spark' as const,
  },
  {
    title: 'Atencion rapida',
    subtitle: 'Respuesta agil cuando la necesitas',
    icon: 'clock' as const,
  },
] as const;

