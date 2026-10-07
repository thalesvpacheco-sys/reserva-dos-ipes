# Leads → Google Sheets (via Make)

Teaser (`/`) e LP nova (`/novo`) agora enviam **os mesmos campos**, então um único webhook e um único cenário do Make alimentam a planilha. A coluna `origem` diz de onde veio.

## Colunas da aba (linha 1, nesta ordem)

| Col | Cabeçalho | Valor no módulo "Add a Row" do Make |
|---|---|---|
| A | Data/hora | `formatDate(now; DD/MM/YYYY HH:mm:ss; America/Sao_Paulo)` |
| B | Origem | `origem` |
| C | Nome | `nome` |
| D | WhatsApp | `telefone` |
| E | E-mail | `email` |
| F | Objetivo | `objetivo` |
| G | Entrada | `entrada` |
| H | Parcela | `parcela` |
| I | utm_source | `utm_source` |
| J | utm_medium | `utm_medium` |
| K | utm_campaign | `utm_campaign` |
| L | utm_content | `utm_content` |
| M | utm_term | `utm_term` |
| N | gclid | `gclid` |
| O | fbclid | `fbclid` |
| P | Página | `pagina` |

Valores de `origem`: `teaser`, `formulario-principal` (LP), `contato-rapido-rodape` (LP, só telefone).
`telefone` chega sempre como `55` + DDD + número (ex.: `5562999998888`). Na coluna D, formate como **Texto simples** pra não virar notação científica.

## Montagem no Make (uma vez)
1. Cenário: **Webhooks > Custom webhook** (o `hook.us2.make.com/...` já em uso) → **Google Sheets > Add a Row**.
2. Em "Add a Row": escolha a planilha e a aba, "Table contains headers: Yes", e mapeie as colunas conforme a tabela.
3. Rode "Re-determine data structure" no webhook e envie um lead de teste do teaser e outro da LP, pra o Make enxergar todos os campos novos (`origem`, `enviado_em`, `entrada`, `parcela`, `gclid`, `fbclid`).
4. Na planilha: congelar linha 1, filtro ligado, coluna A com formato data/hora.

Sem o secret `NEXT_PUBLIC_MAKE_WEBHOOK_URL` no GitHub a LP nova não envia (o teaser tem a URL fixa no HTML).
