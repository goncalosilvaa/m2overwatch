"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const LISTS = ["WHITE", "BLACK"];
const FIELDS = ["player", "account", "ip"];

export async function addListing(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const list = String(formData.get("list") || "").trim().toUpperCase();
  const field = String(formData.get("field") || "").trim().toLowerCase();
  const value = String(formData.get("value") || "").trim();
  const note = String(formData.get("note") || "").trim() || null;
  let serverId = String(formData.get("serverId") || "").trim() || null;
  if (!value || !LISTS.includes(list) || !FIELDS.includes(field)) return;
  if (me.role !== "ADMIN") serverId = me.serverId;

  await prisma.listing.create({ data: { list, field, value, note, serverId } });
  revalidatePath("/lists");
  revalidatePath("/dashboard");
}

export async function deleteListing(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  if (me.role !== "ADMIN") {
    const l = await prisma.listing.findUnique({ where: { id } });
    if (!l || l.serverId !== me.serverId) return;
  }
  await prisma.listing.delete({ where: { id } });
  revalidatePath("/lists");
  revalidatePath("/dashboard");
}
