# Bruno Samora — Fit 90

Landing page com quiz de seis perguntas e captação de contactos para o Fit 90. A localização não altera o programa. A frequência recomenda Light (199.000 Kz), Performance (249.000 Kz) ou Gold (279.000 Kz); o visitante pode escolher qualquer plano. O backend valida os dados, guarda-os no Supabase e permite que o CRM importe os contactos pela Data API.

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

[Integração do gateway de pagamento](docs/INTEGRACAO-PAGAMENTOS.md): fluxo e contrato propostos para implementação pela equipa. O pagamento ainda não está integrado.

Ler [docs/INTEGRACAO-CRM.md](docs/INTEGRACAO-CRM.md): instalação, contrato HTTP, campos da base de dados, exemplo de importação idempotente e instruções de acesso à equipa.

- `app/api/leads/route.ts`: endpoint do site.
- `supabase/functions/fit90-leads/`: função de validação e gravação.
- `supabase/migrations/`: histórico completo da tabela, permissões e função de gravação.
- `supabase/functions/_shared/fit90.ts`: planos, preços e recomendação partilhados com o frontend.
- `.env.example`: configuração sem segredos.

A fotografia de Bruno foi fornecida pelo cliente. As cinco fotografias do quiz foram geradas por IA; prompts em `image-prompts.json`. O site não processa pagamentos, reservas ou mensagens automáticas.
