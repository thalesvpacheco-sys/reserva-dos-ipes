"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { copy, entorno as E, site, type Ponto } from "@/lib/content";
import { ModeToggle } from "@/components/ui/ModeToggle";

/*
  Mapa do entorno em tela cheia sobre a foto aérea (content/entorno.json, coordenadas em pixels da foto 1920x1080).
  A foto fica numa "cena" do tamanho original; a câmera é só um transform (translate + scale) nela.
  Marcadores ficam dentro da cena e se contra-escalam por --inv para manter o tamanho na tela.
  Lista dos pontos e "Como chegar" ficam num painel flutuante (no celular, uma folha embaixo); a câmera
  enquadra o ponto escolhido na parte da tela que o painel não cobre.
*/

const FW = E.largura;
const FH = E.altura;
const C = E.condominio;
const pontos = E.pontos as Ponto[];
const { lat, lng, mapsUrl, enderecoCompleto } = site.localizacao;
const AQUI = `${lat},${lng}`;
const t = copy.entorno;
const CELULAR = 760; // abaixo disso o painel vira folha
const TOPO = 84; // altura do cabeçalho do site por cima do mapa

const rotaAte = (destino: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${AQUI}&destination=${encodeURIComponent(destino)}`;
const rotaDe = (origem: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${AQUI}${origem ? `&origin=${encodeURIComponent(origem)}` : ""}`;

const apps = [
  { nome: "Google Maps", acao: "Abrir o local", href: mapsUrl },
  { nome: "Waze", acao: "Ir agora", href: `https://waze.com/ul?ll=${AQUI}&navigate=yes` },
  {
    nome: "Uber",
    acao: "Chamar corrida",
    href: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(site.nome)}`,
  },
];

function dms(v: number, pos: string, neg: string) {
  const a = Math.abs(v);
  const g = Math.floor(a);
  const mf = (a - g) * 60;
  const m = Math.floor(mf);
  const s = ((mf - m) * 60).toFixed(1).replace(".", ",");
  return `${g}°${String(m).padStart(2, "0")}′${s.padStart(4, "0")}″ ${v < 0 ? neg : pos}`;
}
const LAT = dms(lat, "N", "S");
const LNG = dms(lng, "L", "O");

// luzes da noite: pontos na área urbana, com seed fixa para o HTML do build bater com o do navegador
const CIDADE = [[600, 330], [1920, 250], [1920, 1080], [560, 1080], [700, 760], [1000, 740], [1220, 540], [990, 505]];
function dentro(x: number, y: number) {
  let c = false;
  for (let i = 0, j = CIDADE.length - 1; i < CIDADE.length; j = i++) {
    const [xi, yi] = CIDADE[i];
    const [xj, yj] = CIDADE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const LUZES = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: { x: number; y: number; r: number; o: number; d: number }[] = [];
  while (out.length < 260) {
    const x = 540 + rnd() * 1380;
    const y = 250 + rnd() * 830;
    if (!dentro(x, y)) continue;
    out.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(y < 420 ? 1.4 : 2 + rnd() * 1.6).toFixed(1), o: +(0.45 + rnd() * 0.55).toFixed(2), d: +(1.6 + rnd() * 2.8).toFixed(2) });
  }
  return out;
})();

const categoria = (p: Ponto) => p.categoria + (p.detalhe ? ` / ${p.detalhe}` : "");
const direcao = (p: Ponto) => (p.borda === "esquerda" ? "←" : p.borda === "direita" ? "→" : "↗");

const Seta = ({ dir }: { dir: "esquerda" | "direita" }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d={dir === "esquerda" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} />
  </svg>
);

export function Entorno() {
  const [ativo, setAtivo] = useState<number | null>(null);
  const [aba, setAba] = useState<"pontos" | "chegar">("pontos");
  const [intro, setIntro] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [origem, setOrigem] = useState("");
  const [gps, setGps] = useState<"" | "buscando" | "erro">("");
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const bordas = useRef<(HTMLDivElement | null)[]>([]);
  const cam = useRef({ z: 1, x: C.x, y: 560 });

  // escala de "cobrir" o quadro inteiro (mede na hora: o ResizeObserver não roda com a aba em segundo plano)
  function medir() {
    const el = stage.current;
    const w = el?.clientWidth ?? 0;
    const h = el?.clientHeight ?? 0;
    return { w, h, s0: Math.max(w / FW, h / FH) };
  }

  // parte da tela que fica livre: tira o cabeçalho do site e, no celular, a folha de baixo
  function livre(w: number, h: number) {
    const p = painel.current;
    return { y0: TOPO, y1: h - (w < CELULAR && p ? p.offsetHeight : 0) };
  }

  // caixa do painel flutuante (só no computador; no celular ele é a folha de baixo, já descontada em livre())
  function caixaPainel(w: number) {
    const p = painel.current;
    if (!p || w < CELULAR) return null;
    return { l: p.offsetLeft, t: p.offsetTop, r: p.offsetLeft + p.offsetWidth, b: p.offsetTop + p.offsetHeight };
  }

  // onde a câmera põe a foto para um zoom e um alvo
  function enquadrar(z: number, alvo: { x: number; y: number }) {
    const { w, h, s0 } = medir();
    const s = s0 * z;
    const f = livre(w, h);
    const cx = w / 2;
    const cy = (f.y0 + f.y1) / 2;
    const tx = Math.min(0, Math.max(w - FW * s, cx - alvo.x * s));
    const ty = Math.min(0, Math.max(h - FH * s, cy - alvo.y * s));
    return { s, tx, ty, cx, cy };
  }

  const visaoGeral = () => (medir().w < CELULAR ? { z: 1.45, x: C.x, y: C.y } : { z: 1, x: C.x, y: 560 });

  function aplicar() {
    const { w, h } = medir();
    if (!w || !h || !scene.current) return;
    const c = cam.current;
    const { s, tx, ty, cx, cy } = enquadrar(c.z, c);
    // guarda o centro real (depois do limite) para o arrasto não travar na borda
    c.x = (cx - tx) / s;
    c.y = (cy - ty) / s;
    scene.current.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    scene.current.style.setProperty("--inv", (1 / s).toFixed(4));
    // pontos fora do quadro (seta na borda): presos à parte livre da tela, a 30px da beirada e fora do painel
    const f = livre(w, h);
    const box = caixaPainel(w);
    pontos.forEach((q, i) => {
      const el = bordas.current[i];
      if (!el) return;
      const y = Math.min(Math.max(q.y * s + ty, f.y0 + 30), f.y1 - 30);
      const xMax = box && y > box.t - 30 ? box.l - 40 : w - 30;
      const x = Math.min(Math.max(q.x * s + tx, 30), xMax);
      el.style.left = `${(x - tx) / s}px`;
      el.style.top = `${(y - ty) / s}px`;
    });
  }

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    cam.current = visaoGeral();
    const ro = new ResizeObserver(() => aplicar());
    ro.observe(el);
    if (painel.current) ro.observe(painel.current); // o painel cresce quando um ponto abre
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setIntro(true);
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
    // aplicar só lê refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // arrastar a foto (no celular o quadro é mais estreito que a foto)
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let drag: { x: number; y: number; cx: number; cy: number; moveu: boolean } | null = null;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button,a")) return;
      drag = { x: e.clientX, y: e.clientY, cx: cam.current.x, cy: cam.current.y, moveu: false };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moveu && Math.hypot(dx, dy) < 6) return;
      drag.moveu = true;
      el.classList.add("is-drag");
      const s = medir().s0 * cam.current.z;
      cam.current.x = drag.cx - dx / s;
      cam.current.y = drag.cy - dy / s;
      aplicar();
    };
    const up = () => {
      drag = null;
      el.classList.remove("is-drag");
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function focar(i: number | null) {
    setAtivo(i);
    if (i === null) {
      cam.current = visaoGeral();
    } else {
      const p = pontos[i];
      const { w } = medir();
      // enquadra o ponto puxando um pouco para o condomínio, para os dois aparecerem
      const alvo = { x: p.borda ? p.x : p.x * 0.75 + C.x * 0.25, y: p.borda ? p.y : p.y * 0.8 + C.y * 0.2 };
      let z = w < CELULAR ? 1.45 : 1.6;
      // no computador: perto da borda da foto a câmera não passa do limite e o ponto pode cair embaixo do painel.
      // Nesse caso abre menos o zoom até o ponto (e o rótulo) ficarem livres.
      const box = caixaPainel(w);
      if (box && !p.borda) {
        for (const zz of [1.6, 1.45, 1.3, 1.15, 1]) {
          z = zz;
          const { s, tx, ty } = enquadrar(zz, alvo);
          const px = p.x * s + tx;
          const py = p.y * s + ty;
          const [l0, l1] = p.lado === "esquerda" ? [px - 290, px + 20] : [px - 20, px + 290];
          if (!(l1 > box.l - 16 && l0 < box.r && py + 30 > box.t - 16 && py - 30 < box.b)) break;
        }
      }
      cam.current = { z, ...alvo };
      setAba("pontos");
    }
    aplicar();
  }

  // depois que o item abre na lista: rola a lista até ele e reenquadra (o painel mudou de altura)
  useEffect(() => {
    aplicar();
    if (ativo === null || !lista.current) return;
    const li = lista.current.querySelector<HTMLElement>(`[data-i="${ativo}"]`);
    if (li) lista.current.scrollTo({ top: li.offsetTop - 8, behavior: "smooth" });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && focar(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, aba]);

  const abrir = (url: string) => {
    const w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
  };

  function tracar(e: FormEvent) {
    e.preventDefault();
    abrir(rotaDe(origem.trim()));
  }

  function minhaLocalizacao() {
    if (!navigator.geolocation) return setGps("erro");
    setGps("buscando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps("");
        abrir(rotaDe(`${pos.coords.latitude},${pos.coords.longitude}`));
      },
      () => setGps("erro"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enderecoCompleto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      /* sem permissão de área de transferência: o endereço continua selecionável na tela */
    }
  }

  return (
    <section className={`ent${intro ? " is-intro" : ""}${ativo !== null ? " is-focus" : ""}`} id="entorno" aria-labelledby="ent-h">
      <div className="ent__stage" ref={stage}>
        <div className="ent__scene" ref={scene}>
          <div className="ent__zoom">
            <img className="ent__photo" src={E.imagem} alt={E.alt} width={FW} height={FH} draggable={false} decoding="async" loading="lazy" />
            <div className="ent__shade" />
            <svg className="ent__ov" viewBox={`0 0 ${FW} ${FH}`} aria-hidden="true">
              <g className="ent__luzes">
                {LUZES.map((l, i) => (
                  <circle key={i} cx={l.x} cy={l.y} r={l.r} style={{ ["--o" as string]: l.o, ["--d" as string]: `${l.d}s` }} />
                ))}
              </g>
              {pontos.map((q, i) => (
                <path
                  key={q.id}
                  className={`ent__rota${ativo === i ? " on" : ""}`}
                  style={{ ["--i" as string]: i }}
                  d={`M${C.x} ${C.y} Q${(C.x + q.x) / 2} ${Math.min(C.y, q.y) - 140} ${q.x} ${q.y}`}
                />
              ))}
              <polygon className="ent__lote" points={E.lote} />
            </svg>

            <div className="mk mk--casa" style={{ left: C.x, top: C.y }}>
              <div className="farol">
                <div className="farol__flag">
                  <span className="farol__arv">
                    <img src="/brand/icone-arvore.webp" alt="" width={187} height={192} />
                  </span>
                  <small>Você aqui</small>
                  <b>{site.nome}</b>
                </div>
                <div className="farol__haste" />
                <div className="farol__base" />
              </div>
            </div>

            {pontos.map((q, i) => (
              <div
                key={q.id}
                ref={(el) => {
                  bordas.current[i] = q.borda ? el : null;
                }}
                className={`mk${q.lado === "esquerda" ? " mk--esq" : ""}${q.borda ? " mk--borda" : ""}${ativo === i ? " on" : ""}`}
                style={{ left: q.x, top: q.y, ["--i" as string]: i }}
              >
                <button type="button" onClick={() => focar(ativo === i ? null : i)} aria-label={`${q.nome}: ver no mapa`}>
                  <span className="mk__dot">{q.borda && <Seta dir={q.borda as "esquerda" | "direita"} />}</span>
                  <span className="mk__lbl">
                    <i>{q.categoria}</i>
                    <b>{q.nome}</b>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="ent__vin" />
        <p className="ent__hud" aria-hidden="true">
          <span>{LAT}</span>
          <span>{LNG}</span>
        </p>
        {ativo !== null && (
          <button className="ent__tudo" type="button" onClick={() => focar(null)}>
            Ver tudo
          </button>
        )}
      </div>

      <div className="ent__scrim" />
      <div className="ent__head">
        <h2 className="ent__h" id="ent-h">
          {t.titulo}
        </h2>
        <p className="ent__p">{t.texto}</p>
        <ModeToggle />
      </div>

      <aside className="ent__panel" ref={painel} aria-label="Pontos próximos e como chegar">
        {/* celular: o título vem para a folha (o Dia/Noite fica no menu do site) */}
        <div className="ent__mhead">
          <p className="ent__h" aria-hidden="true">
            {t.titulo}
          </p>
        </div>
        <div className="ent__tabs" role="tablist" aria-label="Painel do mapa">
          <button type="button" role="tab" id="ent-tab-p" aria-controls="ent-aba-p" aria-selected={aba === "pontos"} onClick={() => setAba("pontos")}>
            Pontos próximos
          </button>
          <button type="button" role="tab" id="ent-tab-c" aria-controls="ent-aba-c" aria-selected={aba === "chegar"} onClick={() => setAba("chegar")}>
            Como chegar
          </button>
        </div>

        <div className="ent__view" role="tabpanel" id="ent-aba-p" aria-labelledby="ent-tab-p" hidden={aba !== "pontos"} ref={lista}>
          <ol className="ent__lista">
            {pontos.map((q, i) => (
              <li key={q.id} data-i={i} className={ativo === i ? "on" : undefined}>
                <button type="button" className="ent__row" aria-expanded={ativo === i} onClick={() => focar(ativo === i ? null : i)}>
                  <i>{categoria(q)}</i>
                  <b>{q.nome}</b>
                  <span aria-hidden="true">{direcao(q)}</span>
                </button>
                {ativo === i && (
                  <div className="ent__more">
                    <p>{q.texto}</p>
                    {q.destino ? (
                      <a className="btn btn--lamp" href={rotaAte(q.destino)} target="_blank" rel="noopener">
                        Rota a partir do condomínio
                      </a>
                    ) : (
                      <p className="ent__obs">Obra prevista. A rota entra quando o endereço estiver no Google Maps.</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="ent__view" role="tabpanel" id="ent-aba-c" aria-labelledby="ent-tab-c" hidden={aba !== "chegar"}>
          <div className="chegar">
            <div>
              <p className="chegar__lab">Endereço</p>
              <p className="chegar__coord">
                {LAT}
                <br />
                {LNG}
              </p>
              <div className="chegar__end">
                <p>{enderecoCompleto}</p>
                <button type="button" onClick={copiar}>
                  {copiado ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <form className="chegar__form" onSubmit={tracar}>
              <label className="chegar__lab" htmlFor="ent-origem">
                {t.origem}
              </label>
              <div>
                <input
                  id="ent-origem"
                  type="text"
                  autoComplete="street-address"
                  placeholder={t.origemPlaceholder}
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                />
                <button className="btn btn--lamp" type="submit">
                  {t.tracar}
                </button>
              </div>
              <button className="chegar__gps" type="button" onClick={minhaLocalizacao} disabled={gps === "buscando"}>
                {gps === "buscando" ? "Buscando sua localização…" : gps === "erro" ? "Não deu para pegar sua localização. Digite seu bairro acima." : t.minhaLocalizacao}
              </button>
            </form>

            <div className="chegar__apps">
              {apps.map((a) => (
                <a key={a.nome} href={a.href} target="_blank" rel="noopener">
                  <b>{a.nome}</b>
                  <span>{a.acao}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
