import { copy, nav, site } from "@/lib/content";
import { Logo } from "@/components/ui/Logo";
import { ModeSwitch } from "@/components/ui/ModeToggle";
import { Instagram, WhatsApp } from "@/components/ui/icons";
import { QuickContact } from "@/components/forms/QuickContact";

/** Rodapé no padrão footer-section (21st.dev). Redes e política só aparecem quando o link existir em content/site.json. */
export function Footer() {
  const t = copy.rodape;
  const { whatsapp, instagram } = site.contato;
  const wa = whatsapp ? `https://wa.me/55${String(whatsapp).replace(/\D/g, "")}` : null;
  const ig = instagram ? `https://instagram.com/${String(instagram).replace(/^@/, "")}` : null;
  const social = [
    ig && { href: ig, tip: "Instagram do Reserva dos Ipês", label: "Instagram", Icon: Instagram },
    wa && { href: wa, tip: "Fale pelo WhatsApp", label: "WhatsApp", Icon: WhatsApp },
  ].filter(Boolean) as { href: string; tip: string; label: string; Icon: typeof Instagram }[];

  return (
    <footer className="ft">
      <div className="wrap ft__in">
        <div className="ft__grid">
          <div className="ft__brand">
            <Logo />
            <p className="ft__sig">{t.assinatura}</p>
            <p>{t.contatoRapido}</p>
            <QuickContact />
          </div>
          <div>
            <h3>Navegue</h3>
            <nav className="ft__nav" aria-label="Rodapé">
              {nav.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
              <a href={site.simuladorUrl} target="_blank" rel="noopener">
                {copy.condicoes.cta}
              </a>
            </nav>
          </div>
          <div>
            <h3>Onde fica</h3>
            <address>
              <span>{site.nome}</span>
              <span>{site.localizacao.logradouro}</span>
              <span>{site.localizacao.bairro}</span>
              <span>
                {site.localizacao.cidade}, {site.localizacao.uf}, {site.localizacao.cep}
              </span>
              <span>Uma realização {site.construtora}</span>
            </address>
          </div>
          <div>
            <h3>{social.length ? "Acompanhe" : "Ver de dia ou à noite"}</h3>
            {social.length > 0 && (
              <div className="soc">
                {social.map(({ href, tip, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener" data-tip={tip} aria-label={label}>
                    <Icon />
                  </a>
                ))}
              </div>
            )}
            <ModeSwitch />
          </div>
        </div>
        <div className="ft__legal">
          <p>
            © {new Date().getFullYear()} {site.construtora}. Todos os direitos reservados.
          </p>
          <nav aria-label="Informações legais">
            {site.politicaPrivacidadeUrl && <a href={site.politicaPrivacidadeUrl}>Política de privacidade</a>}
            <span>{t.legal}</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
