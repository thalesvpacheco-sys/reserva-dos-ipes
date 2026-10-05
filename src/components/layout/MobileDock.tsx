"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/content";

/** Barra fixa do celular com o consultor e o simulador; some quando o formulário está na tela. */
export function MobileDock() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const form = document.getElementById("form");
    if (!form) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.1 });
    io.observe(form);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`dock${hidden ? " is-hidden" : ""}`} aria-hidden={hidden || undefined}>
      <a className="btn btn--line" href="#contato" tabIndex={hidden ? -1 : undefined}>
        Consultor
      </a>
      <a className="btn btn--lamp" href={site.simuladorUrl} target="_blank" rel="noopener" tabIndex={hidden ? -1 : undefined}>
        Simular
      </a>
    </div>
  );
}
