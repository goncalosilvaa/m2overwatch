import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// Hash de password sem dependencias externas (scrypt nativo do Node).
// Formato guardado: "scrypt$<salt-hex>$<derived-hex>".
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${dk}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = (stored || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1];
  const dkHex = parts[2];
  const calc = scryptSync(password, salt, 64);
  const orig = Buffer.from(dkHex, "hex");
  return calc.length === orig.length && timingSafeEqual(calc, orig);
}
