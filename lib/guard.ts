import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./auth";

// Garante sessao valida (utilizador existe na DB). Caso contrario -> /login.
export async function requireUser(): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  return me;
}

// Garante papel ADMIN. Clientes sao reencaminhados para o dashboard.
export async function requireAdmin(): Promise<CurrentUser> {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/dashboard");
  return me;
}
