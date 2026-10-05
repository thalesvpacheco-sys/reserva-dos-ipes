"use client";

import { useEffect, useRef, useState } from "react";
import { copy, nav, site } from "@/lib/content";
import { Logo } from "@/components/ui/Logo";
import { ModeToggle } from "@/components/ui/ModeToggle";

/** Header no padrão header-2 (21st.dev): largo no topo, cápsula flutuante ao rolar, menu em tela cheia no celular. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(72);
  const hd = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    const wide = window.matchMedia("(min-width:1360px)");
    const onWide = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  function toggle() {
    // o painel é fixed e precisa começar logo abaixo do header, que muda de altura ao rolar
    if (hd.current) setTop(hd.current.getBoundingClientRect().bottom);
    setOpen((v) => !v);
  }

  return (
    <>
      <header ref={hd} className={`hd${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
        <div className="hd__bar">
          <a className="hd__logo" href="#topo" aria-label="Reserva dos Ipês, início">
            <Logo />
          </a>
          <nav className="hd__links" aria-label="Seções">
            {nav.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hd__act">
            <ModeToggle />
            <a className="btn btn--line" href="#contato">
              Falar com um consultor
            </a>
            <a className="btn btn--lamp" href={site.simuladorUrl} target="_blank" rel="noopener">
              {copy.condicoes.cta}
            </a>
          </div>
          <button
            ref={menuBtn}
            className="hd__menu"
            type="button"
            aria-expanded={open}
            aria-controls="hd-panel"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={toggle}
          >
            <span />
          </button>
        </div>
      </header>
      {/* fora do <header>: o backdrop-filter do header prenderia o position:fixed do painel */}
      <div
        className="hd__panel"
        id="hd-panel"
        hidden={!open}
        style={{ ["--hd-h" as string]: `${top}px` }}
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
      >
        <nav aria-label="Seções">
          {nav.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div>
          <ModeToggle />
          <a className="btn btn--lamp" href={site.simuladorUrl} target="_blank" rel="noopener">
            {copy.condicoes.cta}
          </a>
          <a className="btn btn--line" href="#contato">
            Falar com um consultor
          </a>
        </div>
      </div>
    </>
  );
}
