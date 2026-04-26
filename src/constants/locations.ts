/**
 * Ciudades / localidades de la provincia de La Rioja.
 * Se usan tanto en el registro de cliente (localidad)
 * como en el registro de prestador (zona de cobertura).
 */
export const LA_RIOJA_CITIES = [
  "Capital",
  "Chilecito",
  "Chamical",
  "Aimogasta",
  "Nonogasta",
  "Famatina",
  "Sanagasta",
  "Villa Unión",
  "Chepes",
] as const;

export type LaRiojaCity = (typeof LA_RIOJA_CITIES)[number];
