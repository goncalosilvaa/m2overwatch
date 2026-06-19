"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function createBan(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const playerName = String(formData.get("playerName") || "").trim();
  if (!playerName) return;
  const account = String(formData.get("account") || "").trim() || null;
  const ip = String(formData.get("ip") || "").trim() || null;
  const reason = String(formData.get("reason") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;
  let serverId = String(formData.get("serverId") || "").trim() || null;
  // Checkbox so e enviado quando marcado.
  const executeInGame = String(formData.get("executeInGame") || "") !== "";
  // Cliente so pode banir no seu proprio servidor.
  if (me.role !== "ADMIN") serverId = me.serverId;

  await prisma.ban.create({
    data: { playerName, account, ip, reason, note, serverId, executeInGame },
  });
  revalidatePath("/bans");
  revalidatePath("/dashboard");
}

// Marca um ban existente para ser aplicado no jogo (re-fila se ja tinha erro).
export async function applyBanInGame(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  const ban = await prisma.ban.findUnique({ where: { id } });
  if (!ban) return;
  if (me.role !== "ADMIN" && ban.serverId !== me.serverId) return;
  await prisma.ban.update({
    where: { id },
    data: { executeInGame: true, executed: false, executedAt: null, executeError: null },
  });
  revalidatePath("/bans");
}

export async function deleteBan(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  if (me.role !== "ADMIN") {
    const ban = await prisma.ban.findUnique({ where: { id } });
    if (!ban || ban.serverId !== me.serverId) return;
  }
  await prisma.ban.delete({ where: { id } });
  revalidatePath("/bans");
  revalidatePath("/dashboard");
}
