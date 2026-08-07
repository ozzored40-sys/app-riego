/**
 * Genera un id local razonablemente único (timestamp base36 + sufijo aleatorio).
 * No es un UUID criptográfico: es suficiente para una app local-first de un solo
 * dispositivo, sin necesidad de un módulo nativo adicional para generarlos.
 */
export function generarId(prefijo: string): string {
  const timestamp = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 10);
  return `${prefijo}_${timestamp}${aleatorio}`;
}

export function ahoraISO(): string {
  return new Date().toISOString();
}
