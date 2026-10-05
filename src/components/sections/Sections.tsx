// Seções sem interação própria: renderizadas no build (Server Components).
import { copy, galeria, site, splitValor } from "@/lib/content";
import { DayNight } from "@/components/ui/DayNight";
import { Img } from "@/components/ui/Img";
import { HeroCompare } from "./HeroCompare";
import { StreetAccordion } from "./StreetAccordion";
import { LeadForm } from "@/components/forms/LeadForm";

const ext = { target: "_blank", rel: "noopener" } as const;

export function Hero() {
  const t = copy.hero;
  // a mensal mais baixa dá motivo para o clique no simulador
  const mensal = copy.condicoes.itens.map(splitValor).find((v) => v && /mensa/i.test(v[0]));
  return (
    <section className="hero" aria-labelledby="h1">
      <div className="wrap hero__grid">
        <h1 id="h1">{t.titulo}</h1>
        <div className="hero__aside">
          <p className="hero__sub">{t.subtitulo}</p>
          <p className="body">
            {t.descricao} {t.texto}
          </p>
          <div className="hero__cta">
            <a className="btn" href="#contato">
              {t.cta}
            </a>
            <a className="btn btn--lamp" href={site.simuladorUrl} {...ext}>
              {t.ctaSimular}
            </a>
          </div>
          {mensal && <p className="hero__hint">{mensal.join(" ")}</p>}
        </div>
      </div>
      <HeroCompare dia={galeria.hero.dia} noite={galeria.hero.noite} labels={t.comparar} />
    </section>
  );
}

export function Localizacao() {
  const t = copy.localizacao;
  const g = galeria.localizacao;
  return (
    <section className="sec" id="localizacao" aria-labelledby="loc-h">
      <div className="wrap loc">
        <div className="loc__txt">
          <h2 className="h2" id="loc-h">{t.titulo}</h2>
          {t.textos.map((p) => (
            <p className="body" key={p}>
              {p}
            </p>
          ))}
          <div>
            {/* o mapa do entorno tem os pontos próximos e os atalhos para Maps, Waze e Uber */}
            <a className="btn btn--line" href="#entorno">
              {t.cta}
            </a>
          </div>
        </div>
        <figure id="mapa">
          <DayNight dia={g.dia} noite={g.noite} sizes="(min-width:960px) 58vw, 100vw" style={{ aspectRatio: "1920/1071" }} />
          <figcaption className="cap">{site.localizacao.enderecoCompleto ?? g.legenda}</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function Condominio() {
  const t = copy.condominio;
  return (
    <section className="sec" id="condominio" aria-labelledby="cond-h" style={{ paddingTop: 0 }}>
      <div className="wrap cond">
        <DayNight dia={galeria.condominio.dia} noite={galeria.condominio.noite} sizes="(min-width:960px) 58vw, 100vw" style={{ aspectRatio: "4/3" }} />
        <div style={{ display: "grid", gap: 24 }}>
          <h2 className="h2" id="cond-h">{t.titulo}</h2>
          <p className="body">{t.texto}</p>
          <ul className="cond__list">
            {t.itens.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p className="lamp-line">{t.fechamento}</p>
        </div>
      </div>
    </section>
  );
}

export function Casas() {
  const t = copy.casas;
  // itens da copy: "3 quartos", "1 suíte", "70,27 m² de área construída", "Lotes de 180 m²"
  const specs = [
    { n: "3", u: "", l: "quartos" },
    { n: "1", u: "", l: "suíte" },
    { n: "70,27", u: "m²", l: "de área construída" },
    { n: "180", u: "m²", l: "de lote" },
  ];
  return (
    <section className="sec" id="casas" aria-labelledby="casas-h" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="casa__head">
          <h2 className="h2" id="casas-h">{t.titulo}</h2>
          <p className="body">{t.texto}</p>
        </div>
        <StreetAccordion ruas={galeria.ruas} />
        <ul className="specs">
          {specs.map((s) => (
            <li className="spec" key={s.l}>
              <b>
                {s.n}
                {s.u && <small>{s.u}</small>}
              </b>
              <span>{s.l}</span>
            </li>
          ))}
        </ul>
        <div className="casa__foot">
          <p className="body">
            {t.complemento} {t.fechamento}
          </p>
          <a className="btn" href={site.simuladorUrl} {...ext}>
            {t.cta}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Condicoes() {
  const t = copy.condicoes;
  const valores = t.itens.map(splitValor).filter(Boolean) as [string, string][];
  const ticks = t.itens.filter((i) => !splitValor(i));
  return (
    <section className="sec night" id="condicoes" aria-labelledby="c-h">
      <div className="wrap night__grid">
        <div>
          <h2 className="h2" id="c-h">{t.titulo}</h2>
          <p className="body" style={{ marginTop: 20 }}>
            {t.texto}
          </p>
          <ul className="ticks">
            {ticks.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div className="vals">
          {valores.map(([label, valor]) => (
            <div key={label}>
              <small>{label}</small>
              <b>{valor}</b>
            </div>
          ))}
          <div>
            <a className="btn" href={site.simuladorUrl} {...ext}>
              {t.cta}
            </a>
          </div>
          <p className="disc">*{copy.juridico}</p>
        </div>
      </div>
    </section>
  );
}

export function Contato() {
  const t = copy.fechamento;
  return (
    <section className="sec end" id="contato" aria-labelledby="fim-h">
      <Img name={galeria.fechamento.img} alt="" sizes="100vw" />
      <div className="wrap end__grid">
        <div>
          <h2 id="fim-h">{t.titulo}</h2>
          <p style={{ marginTop: 24, maxWidth: "52ch", color: "#D5DCE8" }}>{t.textos.join(" ")}</p>
          <div className="end__phr">
            {t.frases.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
        </div>
        <div className="card" id="form">
          <h3>{copy.form.titulo}</h3>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
