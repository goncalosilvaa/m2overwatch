"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function upsertUser(formData: FormData) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return;
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "CLIENT").trim().toUpperCase() === "ADMIN" ? "ADMIN" : "CLIENT";
  const serverId = role === "ADMIN" ? null : (String(formData.get("serverId") || "").trim() || null);
  if (!email) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const data: any = { role, serverId };
    if (password) data.passwordHash = hashPassword(password);
    await prisma.user.update({ where: { email }, data });
  } else {
    if (!password) return; // conta nova precisa de password
    await prisma.user.create({ data: { email, passwordHash: hashPassword(password), role, serverId } });
  }
  revalidatePath("/users");
}

export async function deleteUser(formData: FormData) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return;
  const id = String(formData.get("id") || "");
  if (!id || id === me.id) return; // nao apagar a propria conta
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
}
