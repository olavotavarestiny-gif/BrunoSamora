# Workout Online — publicação e checkout

A publicação pública foi autorizada em 21 de setembro de 2026, substituindo a restrição anterior de pré-visualização local.

- Fit90: `/`
- Workout: `/workout`
- Os botões dos planos abrem `/workout/checkout?plan=<id>` com o período escolhido.
- `/workout/checkout` recolhe e valida nome, email e telefone, apresenta o resumo e chama o endpoint do servidor.
- `POST /api/workout/checkout` está activo e preparado para receber o adaptador do gateway. Enquanto esse adaptador não for ligado, responde `503` com `GATEWAY_NOT_CONFIGURED` e não cria encomendas nem efectua cobranças.

O catálogo de preços permanece em `app/workout/catalog.ts`.

O ponto de integração da equipa de pagamentos é `lib/workout/payment-gateway.ts`. O contrato, as garantias já implementadas e o trabalho pendente estão descritos em [WORKOUT-CHECKOUT-GATEWAY.md](WORKOUT-CHECKOUT-GATEWAY.md).

## Vercel

Para verificar localmente, executar `VERCEL=1 npm run build:vercel`. Na Vercel, a variável é definida automaticamente. A configuração Vercel usa Next.js e mantém o processo Vinext/Sites existente disponível. Configurar `SUPABASE_URL` e `SUPABASE_ANON_KEY` no servidor para o formulário Fit90. Nunca expor chaves privilegiadas no cliente.
