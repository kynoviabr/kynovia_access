"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTopOnStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {
    const shouldScroll = status || sessionStorage.getItem("kynovia-scroll-top-after-submit") === "true";

    if (shouldScroll) {
      sessionStorage.removeItem("kynovia-scroll-top-after-submit");
      window.scrollTo({ behavior: "smooth", top: 0 });
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
      window.setTimeout(() => window.scrollTo({ top: 0 }), 100);
      window.setTimeout(() => window.scrollTo({ top: 0 }), 300);
    }
  }, [status]);

  return null;
}
