"use client";
import { useState } from "react";

export default function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard indisponivel */
        }
      }}
      className="text-xs border border-border rounded-md px-2 py-1 hover:border-primary text-muted"
    >
      {done ? "Copiado!" : "Copiar"}
    </button>
  );
}
