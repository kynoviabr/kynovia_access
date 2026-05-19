"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, router]);

  return (
    <span className="live-indicator" title="Atualizacao automatica ativa">
      Ao vivo
    </span>
  );
}
