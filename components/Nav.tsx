"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card sticky top-0 z-20">
      <Link href="/dashboard" className="font-extrabold">
        M2<span className="text-primary">Overwatch</span>
        {sub && <span className="text-muted font-normal text-sm"> · {sub}</span>}
      </Link>
      <nav className="flex items-center gap-4 text-sm ml-4 flex-wrap">
        {links.map(([href, label]) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={active ? "text-primary font-semibold" : "text-muted hover:text-white"}>
              {label}
            </Link>
          );
        })}
      </nav>
      {role && (
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-muted uppercase tracking-wide">
          {role === "ADMIN" ? "Admin" : "Cliente"}
        </span>
      )}
      <Link
        href="/api/logout"
        className={`${role ? "" : "ml-auto"} text-muted text-sm border border-border rounded-lg px-3 py-1.5 hover:border-primary`}
      >
        Sair
      </Link>
    </header>
  );
}
