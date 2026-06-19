import { prisma } from "./prisma";

// Motor de cruzamento entre servidores.
// Ideia: se um jogador BANIDO num servidor aparece (deteção/login) noutro
// servidor que usa o mesmo anti-cheat, geramos um CrossAlert no painel.

export type Identity = {
  serverId: string | null;
  serverName?: string | null;
  playerName?: string | null;
  account?: string | null;
  ip?: string | null;
  email?: string | null;
};

const clean = (v?: string | null): string | null => {
  const s = (v ?? "").trim();
  return s.length ? s : null;
};

// Identidade vista num servidor -> procura BANS noutros servidores (ou globais)
// que batam por ip/nome/conta/email e cria alertas (com dedupe). Nº criados.
export async function checkCrossServerSeen(raw: Identity, source: string): Promise<number> {
  const idn = {
    serverId: raw.serverId ?? null,
    serverName: clean(raw.serverName),
    playerName: clean(raw.playerName),
    account: clean(raw.account),
    ip: clean(raw.ip),
    email: clean(raw.email),
  };

  const ors: any[] = [];
  if (idn.ip) ors.push({ ip: idn.ip });
  if (idn.playerName) ors.push({ playerName: idn.playerName });
  if (idn.account) ors.push({ account: idn.account });
  if (idn.email) ors.push({ email: idn.email });
  if (ors.length === 0) return 0;

  const bans = await prisma.ban.findMany({
    where: { OR: ors },
    include: { server: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let created = 0;
  for (const ban of bans) {
    // só interessa se o ban é de OUTRO servidor (ou global). Ignora o próprio.
    if (ban.serverId && idn.serverId && ban.serverId === idn.serverId) continue;

    // prioridade do match: email > conta > ip > nome
    let matchType = "";
    let matchValue = "";
    if (idn.email && ban.email && ban.email === idn.email) { matchType = "email"; matchValue = idn.email; }
    else if (idn.account && ban.account && ban.account === idn.account) { matchType = "account"; matchValue = idn.account; }
    else if (idn.ip && ban.ip && ban.ip === idn.ip) { matchType = "ip"; matchValue = idn.ip; }
    else if (idn.playerName && ban.playerName === idn.playerName) { matchType = "name"; matchValue = idn.playerName; }
    else continue;

    const dup = await prisma.crossAlert.findFirst({
      where: { banId: ban.id, seenServerId: idn.serverId, acknowledged: false },
    });
    if (dup) continue;

    await prisma.crossAlert.create({
      data: {
        seenServerId: idn.serverId,
        seenServerName: idn.serverName,
        banServerId: ban.serverId,
        banServerName: ban.server?.name ?? null,
        banId: ban.id,
        banReason: ban.reason,
        matchType,
        matchValue,
        playerName: idn.playerName,
        account: idn.account,
        ip: idn.ip,
        email: idn.email,
        source,
      },
    });
    created++;
  }
  return created;
}

// Ao criar um BAN: verifica retroativamente se essa identidade já foi VISTA
// (deteções recentes, 30 dias) noutros servidores, e gera alertas.
export async function checkCrossServerOnBan(ban: {
  id: string;
  serverId: string | null;
  serverName?: string | null;
  playerName?: string | null;
  account?: string | null;
  ip?: string | null;
  email?: string | null;
  reason?: string | null;
}): Promise<number> {
  const pn = clean(ban.playerName);
  const ac = clean(ban.account);
  const ip = clean(ban.ip);
  const em = clean(ban.email);

  const ors: any[] = [];
  if (ip) ors.push({ ip });
  if (pn) ors.push({ playerName: pn });
  if (ac) ors.push({ account: ac });
  if (em) ors.push({ email: em });
  if (ors.length === 0) return 0;

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const seen = await prisma.detection.findMany({
    where: { OR: ors, createdAt: { gte: since } },
    include: { server: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // 1 alerta por servidor distinto onde foi visto (diferente do servidor do ban)
  const bySrv = new Map<string, (typeof seen)[number]>();
  for (const d of seen) {
    if (ban.serverId && d.serverId === ban.serverId) continue;
    if (!bySrv.has(d.serverId)) bySrv.set(d.serverId, d);
  }

  let created = 0;
  for (const [seenServerId, d] of bySrv) {
    let matchType = "";
    let matchValue = "";
    if (em && d.email && d.email === em) { matchType = "email"; matchValue = em; }
    else if (ac && d.account && d.account === ac) { matchType = "account"; matchValue = ac; }
    else if (ip && d.ip && d.ip === ip) { matchType = "ip"; matchValue = ip; }
    else if (pn && d.playerName === pn) { matchType = "name"; matchValue = pn; }
    else continue;

    const dup = await prisma.crossAlert.findFirst({
      where: { banId: ban.id, seenServerId, acknowledged: false },
    });
    if (dup) continue;

    await prisma.crossAlert.create({
      data: {
        seenServerId,
        seenServerName: d.server?.name ?? null,
        banServerId: ban.serverId,
        banServerName: ban.serverName ?? null,
        banId: ban.id,
        banReason: ban.reason ?? null,
        matchType,
        matchValue,
        playerName: d.playerName,
        account: d.account,
        ip: d.ip,
        email: d.email,
        source: "ban",
      },
    });
    created++;
  }
  return created;
}
