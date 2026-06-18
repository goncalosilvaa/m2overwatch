#!/usr/bin/env node
// Cria/atualiza um utilizador do painel. Uso:
//   node scripts/create-admin.mjs [email] [password] [ADMIN|CLIENT] [serverId]
// Sem argumentos, usa ADMIN_EMAIL / ADMIN_PASSWORD do .env (papel ADMIN).
import { readFileSync } from "node:fs";
import { scryptSync, randomBytes } from "node:crypto";

try {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
} catch {}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${dk}`;
}

const args = process.argv.slice(2);
const email = (args[0] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = (args[1] || process.env.ADMIN_PASSWORD || "").trim();
const role = (args[2] || "ADMIN").trim().toUpperCase();
const serverId = (args[3] || "").trim() || null;

if (!email || !password) {
  console.error("Uso: node scripts/create-admin.mjs [email] [password] [ADMIN|CLIENT] [serverId]");
  console.error("(ou define ADMIN_EMAIL e ADMIN_PASSWORD no .env)");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
try {
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), role, serverId },
    create: { email, passwordHash: hashPassword(password), role, serverId },
  });
  console.log(`OK: ${user.email} (${user.role})${user.serverId ? " -> servidor " + user.serverId : ""}`);
} catch (e) {
  console.error("Erro:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
