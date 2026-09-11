# Bruno Samora — Protótipo de diagnóstico

Quiz visual mobile-first em português de Angola. Cinco perguntas ilustradas com fotografias criadas por IA, contactos opcionais no protótipo (nome e WhatsApp exigidos para avançar), análise simulada e recomendação do Plano Evolução ou Cademy consoante a proximidade de Talatona.

## Executar

`npm install` e `npm run dev`. Produção: `npm run build`.

## Limites do protótipo

Os contactos ficam apenas na memória da página e não são enviados ou guardados. Os botões de adesão mostram uma mensagem de demonstração. Não há pagamento, reserva, inscrição nem envio de WhatsApp. Para lançamento real, ligar os contactos e as adesões ao destino comercial definido pelo proprietário.

Os preços e o selo promocional são os fornecidos no briefing. A recomendação é determinada pela resposta de localização; as restantes respostas servem para demonstrar o percurso visual.

## Recursos

Fotografia de Bruno fornecida na pasta original Imagens. As cinco fotografias do quiz foram geradas pelo imagegen integrado; os prompts completos e caminhos estão em image-prompts.json. Imagens optimizadas em public/images.

## Validação

Build de produção e TypeScript sem erros; verificados os três ramos de localização e entradas válidas/inválidas de telefone. Não foi solicitado teste de interface no navegador. O início do quiz é exposto opcionalmente via WebMCP quando suportado; não havia contexto WebMCP disponível para validar esse contrato.
