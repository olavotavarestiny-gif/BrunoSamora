# Fit 90 — entrega à equipa de desenvolvimento

## Estado desta entrega

O backend está instalado na organização **Bruno Samora**:

- Projeto: `fslrkrhuatzfqxbzilnd` (nome atual no painel: `olavotavarestiny-gif's Project`).
- [Contactos — Table Editor](https://supabase.com/dashboard/project/fslrkrhuatzfqxbzilnd/editor), tabela `fit90_leads`.
- [Edge Function fit90-leads](https://supabase.com/dashboard/project/fslrkrhuatzfqxbzilnd/functions).
- [Repositório privado](https://github.com/olavotavarestiny-gif/BrunoSamora).
- Migrações aplicadas: `20260914145325_fit90_leads.sql` e `20260914220051_fit90_three_plans.sql`.

A gravação e a repetição do mesmo pedido foram verificadas na cloud: apenas uma linha foi criada. A leitura com chave anónima foi recusada. O KUKUGEST-CRM não foi alterado. O aviso informativo “RLS Enabled No Policy” é intencional: apenas o backend privilegiado acede à tabela; não criar políticas públicas para o remover.

## Fluxo

1. O visitante responde às seis perguntas, incluindo a frequência de treino.
2. A landing apresenta sempre Light Fit 90 (199.000 Kz), Performance Fit 90 (249.000 Kz) e Gold Fit 90 (279.000 Kz).
3. A frequência recomenda Light para 2 vezes, Performance para 3 vezes e Gold para 4+ vezes ou liberdade de horários. O visitante pode escolher outro plano.
4. Após escolher, indica nome/WhatsApp, e-mail opcional e autoriza o armazenamento e contacto. Nada é gravado só por ver os planos.
5. `POST /api/leads` encaminha para a Edge Function `fit90-leads`, que valida os valores e chama `submit_fit90_lead`.
6. A tabela `public.fit90_leads` guarda o contacto, as respostas, o plano recomendado, o escolhido e o preço. Só depois da confirmação é apresentado o sucesso.
7. O CRM importa os contactos pendentes e confirma a sincronização.

Todos os contactos continuam associados ao programa `fit90`. A localização serve apenas de contexto; não existe encaminhamento para treino à distância. O preço guardado é o valor apresentado no momento da captação, não um pagamento. O site não processa reservas, pagamentos ou mensagens automáticas.


## Executar localmente ou instalar noutro ambiente

No projeto acima, a estrutura já foi aplicada: **não executar novamente o SQL inicial**. Para um ambiente novo, seguir os passos abaixo.

1. Criar/selecionar o projeto da equipa Bruno Samora.
2. Aplicar as migrações versionadas em `supabase/migrations/`, por ordem de nome usando o fluxo Supabase CLI da equipa. `supabase/schema.sql` é apenas uma cópia de referência do esquema inicial v1; não aplicar ambos. Alterações futuras devem acrescentar migrações.
3. Publicar `supabase/functions/fit90-leads` mantendo **Verify JWT ligado**, conforme `supabase/config.toml`. A função usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, disponibilizadas pelo runtime Supabase. Não colocar a chave privilegiada no site.
4. Copiar `.env.example` para `.env.local` e preencher `SUPABASE_URL` e `SUPABASE_ANON_KEY` do projeto. A chave deve ser a **legacy anon JWT**, porque o gateway verifica JWTs; uma chave `sb_publishable_...` não serve para esta configuração. Estas variáveis são lidas no servidor da landing.
5. Configurar as mesmas duas variáveis no ambiente de produção do site. No Sites, usar as variáveis de runtime da plataforma. Publicar depois de aplicar as variáveis.
6. Executar um envio de teste, confirmar a linha no Table Editor e verificar que uma segunda tentativa com o mesmo `id` não cria outra linha. Remover o contacto sintético após o teste.

O projeto não precisa de buckets, contas para visitantes ou de um servidor adicional permanente. A função usa HTTP/REST, sem dependências externas.

## Contrato de captação

`POST /api/leads`, `Content-Type: application/json`:

```json
{
  "id": "10000000-0000-4000-8000-000000000001",
  "name": "Contacto de teste",
  "phone": "+244 923 000 000",
  "email": "teste@example.com",
  "answers": [
    "Homem",
    "Não, estou longe de Talatona",
    "Quero reduzir peso",
    "Perder gordura",
    "Falta de tempo",
    "3 vezes por semana"
  ],
  "consent": true,
  "selected_plan": "performance"
}
```

Gerar um UUID v4 por submissão; reutilizar esse UUID em retries. A resposta `201` contém `{ "id": "...", "program": "fit90" }`. Repetir o mesmo UUID devolve o mesmo identificador, sem sobrescrever dados anteriores. Um novo diagnóstico gera outro UUID; pessoas com o mesmo telefone podem ter contactos distintos. O CRM decide como os relaciona.

Erros: `400` validação/JSON; `403` origem não permitida no servidor do site; `413` acima de 8 KiB; `415` formato incorreto; `429` mais de três novos pedidos por telefone/hora; `503` falha de armazenamento/configuração. Erros devolvem `{ "error": "mensagem" }`. Falhas de envio preservam os campos para tentar novamente.

Os números de nove dígitos recebem o indicativo `+244`; números internacionais devem incluir o indicativo. As respostas permitidas estão em `validation.ts` e são comparadas com o contrato do frontend nos testes. `program`, `source`, datas de consentimento e estado inicial são definidos no backend/base de dados, não pelo visitante.

Novos pedidos exigem seis respostas e `selected_plan` válido. `recommended_plan` e `selected_price_kz` enviados pelo cliente são ignorados: a recomendação e o preço são calculados no backend. Não presumir que o plano escolhido é sempre o recomendado.

Por compatibilidade com páginas antigas ainda abertas, pedidos de cinco respostas sem plano continuam aceites, com os quatro campos novos nulos. Contactos históricos não são alterados nem recebem recomendações inventadas.

## Tabela e ligação ao CRM

| Campo | Uso |
| --- | --- |
| `id` | UUID estável; chave de deduplicação na importação |
| `program` | Sempre `fit90` |
| `name`, `phone`, `email` | Contactos; e-mail pode ser nulo |
| `answers` | JSON com `gender`, `location`, `current_shape`, `goal`, `barrier`, `training_frequency` |
| `consent_at`, `consent_version` | Data no servidor e versão `fit90-contact-v2` para o novo fluxo (v1 nos contactos antigos) |
| `training_frequency` | Resposta textual à sexta pergunta |
| `recommended_plan` | `light`, `performance` ou `gold`, calculado pela frequência |
| `selected_plan` | Plano escolhido pelo visitante; pode diferir do recomendado |
| `selected_price_kz` | Inteiro: `199000`, `249000` ou `279000`; calculado pelo servidor e pela base de dados. Contactos Gold anteriores à alteração podem manter o valor histórico `289000`. |
| `source` | `bruno_samora_landing` |
| `status` | `new`, `contacted`, `qualified`, `converted`, `lost` |
| `crm_external_id` | Identificador atribuído pelo CRM |
| `crm_synced_at` | Nulo até confirmação da importação |
| `created_at`, `updated_at` | Datas do servidor; atualização automática por trigger |

O acesso do CRM é **servidor a servidor** pela Data API Supabase. Usar uma chave secreta dedicada ao CRM no gestor de segredos do backend. A chave secreta/service_role tem acesso privilegiado ao projeto: nunca incluí-la em aplicações de browser/mobile, mensagens, documentação pública ou ficheiros versionados. A tabela tem RLS ativo e não concede acesso aos papéis `anon`/`authenticated`.

Exemplo de importação em JavaScript no **backend do CRM**, com chave secreta moderna no header `apikey`:

```js
const base = process.env.SUPABASE_URL;
const headers = {
  apikey: process.env.SUPABASE_SECRET_KEY,
  'Content-Type': 'application/json',
};
const response = await fetch(
  `${base}/rest/v1/fit90_leads?crm_synced_at=is.null&order=created_at.asc,id.asc&limit=100`,
  { headers },
);
if (!response.ok) throw new Error('Falha ao consultar contactos');
for (const lead of await response.json()) {
  // Implementar no CRM: upsert com lead.id como chave externa única.
  // Se esta etapa falhar, NÃO marcar o contacto como sincronizado.
  const crmId = await upsertContactInYourCRM(lead.id, lead);
  const ack = await fetch(`${base}/rest/v1/fit90_leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      crm_external_id: crmId,
      crm_synced_at: new Date().toISOString(),
    }),
  });
  if (!ack.ok) throw new Error('Falha ao confirmar importação; repetir com o mesmo lead.id');
}
```

A chave legacy `service_role` exige também `Authorization: Bearer <chave>`; não confundir com a chave `anon` utilizada pela landing. A importação deve ser idempotente mesmo que dois workers processem o mesmo lote ou uma confirmação falhe. Repetir lotes pendentes até esvaziar a fila, sem usar offsets sobre essa fila mutável. O fluxo acima importa novos contactos; alterações de estado no CRM podem ser escritas por `PATCH`. Sincronização bidirecional e webhooks não fazem parte desta entrega.

## Visualização e partilha

Abrir [o Table Editor do projeto](https://supabase.com/dashboard/project/fslrkrhuatzfqxbzilnd/editor) e selecionar `fit90_leads`. A equipa pode ver e filtrar os contactos no Table Editor.

Convidar os devs através das definições de equipa da organização Supabase, usando o menor nível de acesso disponível para o trabalho. As opções de acesso por projeto dependem do plano. O link do painel só funciona para quem tem acesso; não torna os contactos públicos. Partilhar o pacote de código com os devs e dar acesso ao projeto separadamente. Não partilhar credenciais pessoais.

## Validação e limites

- Build de produção, verificação TypeScript e logotipo original preservado byte a byte.
- Testes automatizados de validação, quatro recomendações, 12 combinações frequência/plano, preço não manipulável pelo cliente, compatibilidade v1 e erros de envio.
- SQL executado em PostgreSQL local via PGlite: gravação, idempotência, limite por telefone, atualização CRM e acesso público bloqueado.
- Teste **na cloud** concluído: envio `201`, retry idempotente com uma linha e leitura pública recusada (`401`).
- O limite por telefone é básico e não impede bots que alternem números. Antes de uma campanha aberta com tráfego elevado, a equipa pode adicionar CAPTCHA e limites por IP no gateway.
- O consentimento refere-se apenas ao armazenamento e contacto sobre Fit 90. Definir com o responsável pelo projeto o prazo de retenção e o processo de eliminação também no CRM.

Referências oficiais: [Edge Function auth](https://supabase.com/docs/guides/functions/auth-headers), [proteção da Data API](https://supabase.com/docs/guides/api/securing-your-api), [gestão de acessos da equipa](https://supabase.com/docs/guides/platform/access-control).

## Próxima etapa: pagamento

A equipa irá integrar o gateway depois da seleção do plano e recolha do contacto. Ver [INTEGRACAO-PAGAMENTOS.md](INTEGRACAO-PAGAMENTOS.md) para os pontos de integração, contrato proposto, confirmação no backend e atualização do CRM. Os campos e endpoints de pagamento descritos nesse documento ainda não estão implementados.
