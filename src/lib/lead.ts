"use client";

// Envio de lead para o webhook do Make (sem backend: o site é estático).
// Regra do projeto: o visitante sempre vê sucesso; falhas de CRM/Sheets são tratadas dentro do Make.

const WEBHOOK = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];

export type Lead = Record<string, string>;

export function digits(v: string) {
  return v.replace(/\D/g, "");
}

/** (62) 99999-9999; tira o 55 quando a pessoa cola o número com DDI */
export function maskPhone(v: string) {
  let d = digits(v);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length > 7) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

export function maskBRL(v: string) {
  const d = digits(v).slice(0, 9);
  return d ? `R$ ${Number(d).toLocaleString("pt-BR")}` : "";
}

/** Telefone sempre como 55 + DDD + número (mesmo formato do teaser), pra planilha ficar uniforme */
function phone55(v: string) {
  let d = digits(v);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d ? `55${d}` : "";
}

export function sendLead(lead: Lead, origem: string) {
  const params = new URLSearchParams(window.location.search);
  // todas as chaves vão sempre (vazias quando não se aplicam): o Make mapeia colunas fixas
  const body = new URLSearchParams({
    nome: "",
    telefone: "",
    email: "",
    objetivo: "",
    entrada: "",
    parcela: "",
    ...lead,
    origem,
    pagina: window.location.href,
    enviado_em: new Date().toISOString(),
  });
  body.set("telefone", phone55(body.get("telefone") ?? ""));
  UTM_KEYS.forEach((k) => body.set(k, params.get(k) ?? ""));

  // form-urlencoded é uma "simple request": sem preflight de CORS e funciona com keepalive,
  // então o envio termina mesmo se a pessoa fechar a aba logo depois
  if (WEBHOOK) {
    fetch(WEBHOOK, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[lead] NEXT_PUBLIC_MAKE_WEBHOOK_URL vazio; lead não enviado:", Object.fromEntries(body));
  }

  const w = window as unknown as { fbq?: (...a: unknown[]) => void; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.fbq?.("track", "Lead");
  w.gtag?.("event", "generate_lead", { origem });
  (w.dataLayer ||= []).push({ event: "lead", origem });
}
