# Restaurante Ai Q FOME — GTA7 Lab

Esta pasta (`entities/restaurante-ai-q-fome/`) é uma entidade dentro do monorepo
`GTA7-Lab/gta7-lab`, que reúne a cidade digital GTA7 Lab e todas as suas
entidades (cada uma em sua própria pasta dentro de `entities/`).

## Objetivo
Entidade "restaurante" da cidade digital GTA7 Lab. Moradores compram refeições,
combinações e bebidas; pedidos são feitos por mesa (uma ou mais pessoas) e
cobrados de forma unificada por mesa.

## Estrutura do JSON (`data/menu.json`)
```
{
  restaurant: { id, name, description, openingHours },
  menu: [{ id, name, category, price }],   // category: prato_principal | entrada | sobremesa | bebida
  employees: [{ id, name, role, salaryPerShift }],
  tables: [{ id, capacity }]
}
```
Pedidos (`Order`) são gerados em memória via `src/repository.ts` (sem persistência
entre reinícios nesta v1 — ver Limitações).

## MCP tools
Servidor MCP (stdio) em `src/mcp/server.ts`, rodado com `npm run mcp` (após `npm run build`).

- `get_menu(category?)` — lista o cardápio, opcionalmente filtrado por categoria.
- `place_order(tableId, people, items[])` — registra pedido de uma mesa e calcula o total unificado.

Referência sobre MCP + Vercel (conectar Claude Code ao Vercel MCP para gerenciar
deploys durante o desenvolvimento): https://vercel.com/docs/agent-resources/vercel-mcp#claude-code

## Arquivos principais
- `data/menu.json` — dados fictícios (cardápio, funcionários, mesas).
- `src/types.ts` — tipos compartilhados.
- `src/repository.ts` — carrega o JSON e expõe consultas/pedidos.
- `src/mcp/server.ts` — servidor MCP (stdio) com as tools acima.
- `api/menu.ts`, `api/orders.ts` — funções serverless da Vercel para consulta HTTP
  (`GET /api/menu?category=`, `GET/POST /api/orders`).
- `manifest.json` — manifesto da entidade para o Core Orchestrator.

## Decisões relevantes
- Sem banco de dados: cardápio/funcionários/mesas vêm de `data/menu.json` (import
  estático com `resolveJsonModule`, para funcionar tanto local quanto no bundle da Vercel).
- Pedidos ficam em memória (array em `repository.ts`), não persistidos em arquivo,
  para manter a v1 simples — cada processo (MCP local ou função serverless) tem seu
  próprio estado.
- TypeScript com `module: CommonJS`; `moduleResolution: node` foi removido no
  TypeScript 7, por isso o campo foi deixado sem valor explícito (default atual).

## Limitações da v1 (intencionais)
Sem autenticação, pagamentos reais, banco externo, Docker, ou contratação/pagamento
de funcionários (dados de funcionários existem no JSON só para consulta futura).

## Status atual
- Projeto criado, build (`npm run build`) e MCP server testados localmente.
- Publicado em `github.com/GTA7-Lab/gta7-lab`, na pasta `entities/restaurante-ai-q-fome/`.
- Projeto na Vercel (`clinica21/gta7-lab-restaurante`) criado via deploy direto de
  arquivos (sem vínculo Git — o GitHub App da Vercel não está instalado no repo).
  Último deploy falhou no build; causa ainda não diagnosticada (conector MCP da
  Vercel não tem permissão de leitura de logs/deployments nesse time — só escrita).

## Próxima tarefa
Diagnosticar a falha de build na Vercel (ver Status atual) e, depois, integrar
com o Core Orchestrator usando `manifest.json`, validando as tools MCP a partir
de um client externo.
