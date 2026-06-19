"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const BASE: [string, string][] = [
  ["/dashboard", "Deteções"],
  ["/analytics", "Analytics"],
  ["/bans", "Bans"],
  ["/lists", "Listas"],
];
const ADMIN_LINKS: [string, string][] = [
  ["/servers", "Servidores"],
  ["/users", "Utilizadores"],
];

export default function Nav({ sub, role }: { sub?: string; role?: string }) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? [...BASE, ...ADMIN_LINKS] : BASE;
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-[#0a0f18]/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 py-3">
        <Link href="/dashboard" className="shrink-0">
          <Logo sub={sub} />
        </Link>
        <nav className="flex items-center gap-1 text-sm ml-3 flex-wrap">
          {links.map(([href, label]) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                    : "px-3 py-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {role && (
          <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-muted uppercase tracking-wider ring-1 ring-white/10">
            {role === "ADMIN" ? "Admin" : "Cliente"}
          </span>
        )}
        <form action="/api/logout" method="post" className={role ? "" : "ml-auto"}>
          <button
            type="submit"
            className="text-muted text-sm border border-border rounded-lg px-3 py-1.5 hover:border-primary hover:text-white transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
