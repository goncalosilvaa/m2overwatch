"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Marca um alerta de cruzamento como visto/resolvido.
export async function acknowledgeAlert(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const id = String(formData.get("id") || "");
  if (!id) return;

  // CLIENT só pode resolver alertas relevantes ao seu servidor.
  if (me.role !== "ADMIN") {
    const a = await prisma.crossAlert.findUnique({ where: { id } });
    if (!a || (a.seenServerId !== me.serverId && a.banServerId !== me.serverId)) return;
  }

  await prisma.crossAlert.update({ where: { id }, data: { acknowledged: true } });
  revalidatePath("/alerts");
}
