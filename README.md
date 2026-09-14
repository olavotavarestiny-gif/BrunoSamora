# Bruno Samora — Fit 90

Landing page com quiz de cinco perguntas e captação de contactos para o Fit 90. A localização não altera o programa. O backend valida os dados, guarda-os no Supabase e permite que o CRM importe os contactos pela Data API.

**Supabase ativo:** organização **Bruno Samora**, projeto `fslrkrhuatzfqxbzilnd`. Tabela e função publicadas; gravação, idempotência e bloqueio de leitura pública verificados na cloud. O KUKUGEST-CRM não foi alterado.

- [Ver contactos no Supabase](https://supabase.com/dashboard/project/fslrkrhuatzfqxbzilnd/editor)
- [Código no GitHub](https://github.com/olavotavarestiny-gif/BrunoSamora)
- [Landing page](https://bruno-samora-diagnostico.olavotavarestiny.chatgpt.site) — acesso privado, gerido no Sites.

## Desenvolvimento

```sh
npm ci
cp .env.example .env.local
# Preencher as variáveis do projeto Supabase dedicado.
npm run dev
```

```sh
node --test tests/leads.test.ts
npx tsc --noEmit
npm run build
```

Node.js 22.13+ (testes com remoção nativa de tipos; validados em Node 24).

## Entrega aos devs

Ler [docs/INTEGRACAO-CRM.md](docs/INTEGRACAO-CRM.md): instalação, contrato HTTP, campos da base de dados, exemplo de importação idempotente e instruções de acesso à equipa.

- `app/api/leads/route.ts`: endpoint do site.
- `supabase/functions/fit90-leads/`: função de validação e gravação.
- `supabase/schema.sql`: tabela, permissões, índices e função de gravação.
- `.env.example`: configuração sem segredos.

A fotografia de Bruno foi fornecida pelo cliente. As cinco fotografias do quiz foram geradas por IA; prompts em `image-prompts.json`. O site não processa pagamentos, reservas ou mensagens automáticas.
