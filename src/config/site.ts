/**
 * Centralised site configuration — single source of truth for public-facing
 * metadata, contact info and legal identifiers.
 *
 * Edit this file (not individual components) when updating contact details,
 * business identifiers or social media handles.
 */

export const SITE = {
  name: "Servicios 360",
  url: "https://www.servicios360.com.ar",
  domain: "servicios360.com.ar",
  description:
    "Servicios profesionales verificados para tu hogar en toda La Rioja, Argentina. Plomeros, electricistas, limpieza, pintura y más — con reseñas reales y pagos seguros.",
  locale: "es_AR",
  country: "Argentina",
  region: "La Rioja",
} as const;

export const CONTACT = {
  // Public support email (Google Workspace).
  email: "soporte@servicios360.com.ar",
  adminEmail: "contacto@servicios360.com.ar",

  // WhatsApp Business number in international format (no +, no spaces, no dashes).
  // Used to build wa.me links. Example: 5493804xxxxxxx (54 = AR, 9 for mobile, 380 = La Rioja).
  whatsappNumber: "5493804848972",
  whatsappDisplay: "+54 9 3804 84-8972",
} as const;

/**
 * Legal identifiers required for e-commerce compliance in Argentina.
 * Law 24.240 (Defensa del Consumidor) + Res. SC 424/2020 require these
 * to be publicly visible in the footer.
 */
export const LEGAL = {
  cuit: "27-96368942-5",
  // Business legal name (razón social).
  razonSocial: "Servicios 360",
  // Physical address required by Res. SC 424/2020 for e-commerce.
  domicilio: "La Rioja, Provincia de La Rioja, Argentina",

  // Official links — DO NOT modify, these are government URLs.
  defensaConsumidor: "https://www.argentina.gob.ar/produccion/defensadelconsumidor",
  aaip: "https://www.argentina.gob.ar/aaip",
  arcaNorms: "https://servicioscf.afip.gob.ar/publico/", // ARCA (ex-AFIP)
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/servicios360",
  instagram: "https://www.instagram.com/servicios360",
  twitter: "https://twitter.com/servicios360",
  linkedin: "https://www.linkedin.com/company/servicios360",
} as const;

/**
 * Builds a wa.me link with an optional prefilled message.
 * Message is URL-encoded automatically.
 */
export const buildWhatsAppLink = (message?: string): string => {
  const base = `https://wa.me/${CONTACT.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
