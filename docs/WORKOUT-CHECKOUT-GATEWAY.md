# Workout Online — handoff do gateway de pagamento

## O que já está pronto

O fluxo público é:

1. O cliente escolhe um plano em `/workout`.
2. A landing abre `/workout/checkout?plan=<planId>`.
3. O checkout valida e normaliza nome, email e telefone.
4. Ao confirmar, o browser envia `POST /api/workout/checkout`.
5. O servidor volta a validar o pedido, recupera preço, moeda e duração do catálogo e chama o adaptador do gateway.
6. Quando o adaptador devolver uma URL HTTPS válida, o browser redirecciona o cliente para o parceiro.

O endpoint está deliberadamente em modo seguro: `lib/workout/payment-gateway.ts` devolve `unavailable`, por isso nenhuma encomenda é criada, nenhum acesso é activado e nenhuma cobrança é feita antes da integração real.

## Contrato do adaptador

Implementar `paymentGateway.createSession(input)` em `lib/workout/payment-gateway.ts`.

Entrada confiável produzida pelo servidor:

```ts
type GatewayRequest = {
  planId: string;
  customer: { name: string; email: string; phone: string };
  requestId: string;
  currency: 'AOA';
  amountKz: number;
  accessMonths: number;
};
```

Saída esperada:

```ts
{ status: 'redirect', checkoutUrl: 'https://checkout.parceiro/...' }
```

O `requestId` é gerado uma vez por tentativa no browser. Deve ser gravado com restrição de unicidade e enviado ao fornecedor como chave de idempotência. Repetir o mesmo pedido deve devolver a mesma encomenda/sessão válida, nunca criar uma segunda cobrança.

## Responsabilidades da integração

- Criar a encomenda numa base de dados antes de chamar o fornecedor.
- Usar sempre `amountKz`, `currency` e `accessMonths` recebidos do contrato do servidor. O código já ignora valores enviados livremente pelo browser.
- Guardar credenciais somente em variáveis de ambiente do servidor.
- Configurar timeout na chamada ao fornecedor e mapear falhas para uma resposta segura.
- Restringir a URL de redireccionamento ao hostname oficial do fornecedor, além da validação HTTPS já existente.
- Implementar webhook autenticado, idempotente e capaz de lidar com eventos repetidos ou fora de ordem.
- Confirmar no webhook a referência, comerciante, valor e moeda antes de marcar a encomenda como paga.
- Activar o produto Workout na Cademi somente depois da confirmação válida no backend.
- Criar ecrãs/rotas de retorno para estados pendente, pago, falhado, cancelado e expirado. O retorno do browser não comprova pagamento.
- Definir política de retenção e protecção dos dados pessoais. Não guardar dados de cartão.

## Catálogo e testes

O catálogo oficial está em `app/workout/catalog.ts`; alterações de preço devem acontecer ali e ser aprovadas comercialmente.

Executar antes da entrega:

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/workout-checkout.test.ts tests/workout-preview.test.ts
VERCEL=1 npm run build:vercel
```

Testar no sandbox do fornecedor: quatro planos, valor adulterado no browser, clique repetido, timeout, URL de redireccionamento inválida, webhook inválido/repetido, retorno antes do webhook e indisponibilidade temporária da Cademi.
