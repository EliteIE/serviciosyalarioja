/**
 * Traduce los mensajes de error más comunes de Supabase Auth
 * al español argentino para una mejor experiencia de usuario.
 */
const ERROR_MAP: Record<string, string> = {
  // Auth — login
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "Email not confirmed": "Tu email aún no fue confirmado. Revisá tu casilla de correo.",

  // Auth — signup
  "User already registered": "Este email ya está registrado. Iniciá sesión o recuperá tu contraseña.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Signup requires a valid password": "Ingresá una contraseña válida.",
  "Unable to validate email address: invalid format": "El formato del email no es válido.",
  "A user with this email address has already been registered": "Este email ya está registrado.",

  // Auth — rate limit
  "Email rate limit exceeded": "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
  "For security purposes, you can only request this after": "Por seguridad, esperá unos segundos antes de intentar de nuevo.",

  // Auth — password reset
  "New password should be different from the old password.": "La nueva contraseña debe ser diferente a la anterior.",
};

export function translateSupabaseError(message: string): string {
  // Exact match first
  if (ERROR_MAP[message]) return ERROR_MAP[message];

  // Partial match — some Supabase errors include dynamic values
  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return translation;
  }

  // Fallback: return original if no match
  return message;
}
