# Reserva dos Ipês — LP (Morais Engenharia)

Condomínio fechado em Senador Canedo (Parque dos Buritis). LP de conversão com captura de leads via Make.com.
Direção visual aprovada: **Dia e noite** (comparador da portaria no hero e botão Dia/Noite que troca paleta e fotos).

## Stack
Next.js 16 (App Router, `output: 'export'`) · React 19 · TypeScript · Tailwind v4 · sem dependências de UI.

## Rodar
```bash
npm install
cp .env.example .env.local   # preencha o webhook do Make
npm run dev                  # http://localhost:3000
npm run build                # gera out/ (site estático)
npm start                    # serve out/ localmente
```

## Estrutura
- `content/` textos (`copy.json`, verbatim do cliente), dados (`site.json`) e fotos de cada seção (`galeria.json`) e pontos do mapa do entorno (`entorno.json`)
- `src/app/` layout, página, ícones
- `src/components/` `layout/` (header, rodapé, barra do celular), `sections/`, `forms/`, `ui/`
- `src/styles/` `tokens.css` (cores e fontes) e `site.css` (estilos das seções)
- `public/images/` imagens otimizadas (640/1280/1920 px, webp) geradas por `npm run images`
- `assets-originais/` renders e marca em alta, **fora do Git**

## Imagens
Render novo: coloque em `assets-originais/IMAGENS RENDERIZADAS/`, registre em `scripts/optimize-images.mjs` e rode `npm run images`.
Depois use o nome em `content/galeria.json`.

## Pendências de conteúdo (`content/site.json`)
`contato.whatsapp`, `contato.instagram`, `politicaPrivacidadeUrl`.
Enquanto estiverem `null`, os ícones e links correspondentes não aparecem.

## Deploy
Push na `main` → GitHub Actions faz o build e publica `out/` na branch `deploy` → a Git da Hostinger puxa essa branch.
Veja `docs/ARQUITETURA.md` e `docs/DEPLOY.md`.
