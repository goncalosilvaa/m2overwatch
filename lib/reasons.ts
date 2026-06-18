// Rotulos e cores por motivo de detecao (partilhado pelo dashboard).
export const REASON_STYLE: Record<string, { label: string; color: string }> = {
  CAPTCHA_FAIL: { label: "Captcha falhado", color: "#e74c3c" },
  ATTACKSPEED_HACK: { label: "Attack-speed", color: "#e74c3c" },
  SPEEDHACK: { label: "Speedhack", color: "#e74c3c" },
  ATTACK_DISTANCE_HACK: { label: "Hit a distância", color: "#e74c3c" },
  REVIEW: { label: "Rever", color: "#e67e22" },
  CAPTCHA_SENT: { label: "Captcha enviado", color: "#f1c40f" },
  CAPTCHA_PASS: { label: "Captcha passado", color: "#2ecc71" },
  MOVE_TELEPORT: { label: "Teleport", color: "#e67e22" },
  SYNC_POSITION_HACK: { label: "Sync anómalo", color: "#f1c40f" },
  SYNC_POSITION_COUNT: { label: "Sync contagem", color: "#f1c40f" },
};

// Motivos considerados "hacks duros" (violacoes deterministicas).
export const HARD_REASONS = [
  "SPEEDHACK",
  "ATTACKSPEED_HACK",
  "ATTACK_DISTANCE_HACK",
];

export function reasonStyle(reason: string): { label: string; color: string } {
  return REASON_STYLE[reason] ?? { label: reason, color: "#8b97a7" };
}

export function scoreColor(score: number): string {
  if (score >= 120) return "#e74c3c";
  if (score >= 60) return "#e67e22";
  return "#8b97a7";
}
