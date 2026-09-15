# Fit 90 — integração de pagamento a implementar pelos devs

## Estado e objetivo

O gateway será integrado pela equipa de desenvolvimento. **Ainda não existe checkout, cobrança, endpoint de pagamento ou confirmação de pagamento nesta landing page.** Os endpoints e campos abaixo são uma proposta de contrato para a implementação, não funcionalidades já disponíveis.

Fluxo pretendido: **selecionar plano → preencher contacto → guardar o pedido → abrir checkout → confirmar pagamento → atualizar CRM**. A recolha de contacto existente permite associar a transação à pessoa, mesmo que abandone o checkout.

## Pontos de integração no código atual

- `app/page.tsx`: `selectPlan()` guarda a escolha e abre o formulário. Depois de `submitLead()` concluir, substituir a passagem direta para o ecrã `success` pela criação da sessão de pagamento e redirecionamento para o checkout. A confirmação atual diz apenas que o pedido de contacto foi recebido.
- `lib/leads-client.ts`: `submitLead()` devolve atualmente `Promise<void>`. Adaptar para devolver o `id` confirmado por `POST /api/leads`, que já responde `{ id, program: "fit90" }`.
- O backend do checkout deve associar a encomenda ao contacto e guardar o plano efetivamente escolhido em `selected_plan`, não o `recommended_plan`.
- O gateway, as suas credenciais e a verificação de transações ficam no backend. O browser só recebe os dados necessários para abrir o checkout.

## Planos e valores

| Identificador | Plano | Valor em Kz |
| --- | --- | ---: |
| `light` | Light Fit 90 | 199.000 |
| `performance` | Performance Fit 90 | 249.000 |
| `gold` | Gold Fit 90 | 289.000 |

Moeda: `AOA`. O servidor deve determinar o preço a partir do catálogo, validar o plano e guardar uma cópia do valor na encomenda. Nunca cobrar um valor fornecido livremente pelo browser. O campo `selected_price_kz` do contacto é informativo e não prova pagamento. A conversão para a unidade exigida pelo gateway deve seguir a documentação do fornecedor escolhido.

## Contrato proposto

### Criar checkout

Endpoint a implementar: `POST /api/checkout`.

Entrada sugerida: `{ lead_id, checkout_token, idempotency_key }`. O backend recupera o plano a partir do contacto autorizado e devolve `{ order_id, checkout_url }`.

Como os visitantes não têm conta, emitir um token curto, assinado ou aleatório, associado ao pedido após guardar o contacto. Verificá-lo ao criar checkout e consultar o estado. **Conhecer apenas o UUID do contacto não deve autorizar acesso aos seus dados ou encomendas.** Não colocar dados pessoais em URLs. Validar o domínio do checkout antes de redirecionar.

Repetições da mesma tentativa devem reutilizar a sessão/encomenda em vez de gerar cobranças duplicadas. Se o visitante mudar de plano, criar uma nova encomenda com o novo valor, sem alterar a encomenda já paga. Uma tentativa expirada ou falhada deve permitir recomeçar de forma controlada, preservando o contacto.

### Confirmar pagamento

Endpoint a implementar: `POST /api/payments/webhook`, com o formato exigido pelo gateway.

- Verificar a autenticidade da notificação segundo o mecanismo oficial do fornecedor.
- Confirmar referência da encomenda, comerciante, valor e moeda; quando necessário, consultar a API do gateway no servidor.
- Processar notificações repetidas de forma idempotente e lidar com eventos fora de ordem.
- Só marcar como pago após confirmação válida no backend. O redirecionamento de retorno, o clique no botão ou um parâmetro `success=true` não provam pagamento.
- Atualizar o CRM após confirmação e permitir repetir a sincronização caso o CRM esteja indisponível.

### Retorno do checkout

Implementar ecrãs para pagamento confirmado, pendente, falhado, cancelado e sessão expirada. A página de retorno consulta o estado no backend com autorização adequada. Se o cliente regressar antes da notificação do gateway, mostrar “A confirmar o pagamento”, sem anunciar sucesso prematuramente.

## Persistência proposta

Criar uma tabela de encomendas/pagamentos separada de `fit90_leads`, através de nova migração. Campos sugeridos: `id`, `lead_id`, `selected_plan`, `amount_kz`, `currency`, `provider`, `provider_payment_id`, `status`, `idempotency_key`, `created_at`, `paid_at` e `updated_at`.

Separar o estado comercial do contacto (`new`, `contacted`, etc.) do estado do pagamento (`pending`, `paid`, `failed`, `cancelled`, `expired`, e reembolsos se suportados). Uma pessoa pode ter várias tentativas. Definir unicidade para referências/eventos do fornecedor e proteger os registos contra leitura ou alteração pública. Não guardar dados de cartão na landing page nem nos contactos do CRM.

## O que os devs precisam de receber

1. Nome do gateway escolhido e documentação técnica oficial.
2. Conta de comerciante configurada, métodos de pagamento pretendidos e moeda aceite.
3. Credenciais de testes e de produção, partilhadas por um gestor de segredos.
4. Domínio público definitivo para as páginas de retorno e notificações. A publicação Sites atual tem acesso privado; o endpoint de webhook precisa de ser acessível ao gateway e protegido pelo seu mecanismo de autenticação, não pelo login privado da página.
5. Decisões comerciais: cobrança única ou recorrente, condições do programa, validade do checkout e regras de cancelamento/reembolso. Estas condições não estão definidas no código atual.

## Critérios de aceitação

Testar em ambiente de testes do fornecedor: os três planos, escolha diferente da recomendação, valor adulterado no browser, token inválido, clique repetido, timeout ao criar checkout, pagamento pendente/falhado/cancelado, notificação repetida ou inválida, retorno antes da notificação e indisponibilidade temporária do CRM. Garantir que nunca é apresentada confirmação de compra apenas por guardar um contacto.
