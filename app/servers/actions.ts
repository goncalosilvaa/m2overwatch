"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function newKey() {
  return randomBytes(24).toString("hex");
}

export async function createServer(formData: FormData) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return;
  const name = String(formData.get("name") || "").trim();
  const ownerEmail = String(formData.get("ownerEmail") || "").trim() || null;
  if (!name) return;
  await prisma.server.create({ data: { name, apiKey: newKey(), ownerEmail } });
  revalidatePath("/servers");
}

export async function toggleServer(formData: FormData) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return;
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!id) return;
  await prisma.server.update({ where: { id }, data: { active: !active } });
  revalidatePath("/servers");
}

export async function regenerateKey(formData: FormData) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.server.update({ where: { id }, data: { apiKey: newKey() } });
  revalidatePath("/servers");
}
