"use client";

import { useEffect, useRef, useState } from "react";
import { copy, site } from "@/lib/content";
import { Img } from "@/components/ui/Img";

const ID = site.manifestoYoutubeId;
const ABRIR_MS = 1100; // tempo das faixas de cinema abrindo (igual ao CSS)

/** Capa em formato de cinema; no clique abre para 16:9 e só então carrega o player do YouTube. */
export function Manifesto() {
  const t = copy.manifesto;
  const [aberto, setAberto] = useState(false);
  const [player, setPlayer] = useState(false);
  const tela = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLSpanElement>(null);

  // o botão "Assistir" segue o mouse; no toque fica no centro
  useEffect(() => {
    const el = tela.current;
    const bt = play.current;
    if (!el || !bt) return;
    const centro = () => {
      bt.style.setProperty("--px", `${el.clientWidth / 2}px`);
      bt.style.setProperty("--py", `${el.clientHeight / 2}px`);
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      bt.style.setProperty("--px", `${e.clientX - r.left}px`);
      bt.style.setProperty("--py", `${e.clientY - r.top}px`);
    };
    centro();
    const ro = new ResizeObserver(centro);
    ro.observe(el);
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", centro);
    return () => {
      ro.disconnect();
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", centro);
    };
  }, []);

  function assistir() {
    setAberto(true);
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => setPlayer(true), reduz ? 0 : ABRIR_MS * 0.7);
  }

  return (
    <section className="sec" id="manifesto" aria-labelledby="man-h">
      <div className="wrap">
        <div className="man__head">
          <h2 className="h2" id="man-h">
            {t.titulo}
          </h2>
          <p className="body">{t.texto}</p>
        </div>
        <div ref={tela} className={`tela${aberto ? " is-open" : ""}`}>
          <Img className="tela__capa" name="portaria-n" alt="" sizes="(min-width:1760px) 1680px, 100vw" />
          <div className="tela__cap" aria-hidden="true">
            <small>{t.rotulo}</small>
            <b>{site.nome}</b>
          </div>
          <span ref={play} className="tela__play" aria-hidden="true">
            {t.cta}
          </span>
          {!aberto && (
            <button className="tela__btn" type="button" onClick={assistir} aria-label={`${t.cta} ao manifesto do ${site.nome}`} />
          )}
          {player && (
            <iframe
              className="tela__video"
              src={`https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0&playsinline=1`}
              title={`Manifesto ${site.nome}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </section>
  );
}
