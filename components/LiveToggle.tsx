"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LiveToggle({ seconds = 10 }: { seconds?: number }) {
  const [on, setOn] = useState(false);
  const [tick, setTick] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      router.refresh();
      setTick((t) => t + 1);
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [on, seconds, router]);

  return (
    <label
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm select-none ${
        on ? "border-green-500 text-green-400" : "border-border text-muted"
      }`}
      title={`Atualiza a cada ${seconds}s`}
    >
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          on ? "bg-green-400 animate-pulse" : "bg-muted"
        }`}
      />
      <input type="checkbox" className="hidden" checked={on} onChange={(e) => setOn(e.target.checked)} />
      {on ? `Ao vivo (${tick})` : "Ao vivo"}
    </label>
  );
}
