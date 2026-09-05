# Restaurante Ai Q FOME — GTA7 Lab

Repo próprio (`GTA7-Lab/restaurante-ai-q-fome`) de uma entidade da cidade digital
GTA7 Lab. A cidade fica em `GTA7-Lab/gta7-lab` e o Core Orchestrator em
`GTA7-Lab/gta7-lab-core`; o Core alcança esta entidade pelas MCP tools, não por
caminho no repo.

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
- Build (`npm run build`) e MCP server verificados: `npm run smoke` lista as tools e
  chama `get_menu` e `place_order` (total unificado por mesa confere).
- Publicado em `github.com/GTA7-Lab/restaurante-ai-q-fome` (repo próprio, saiu do
  monorepo da cidade em 05/09/2026).
- Deploy na Vercel **bloqueado por permissão**, não por código. O projeto
  `clinica21/gta7-lab-restaurante` existe, mas o conector MCP da Vercel não
  alcança: `list_projects` volta vazio e `deploy_to_vercel` dá 403 tanto em
  production quanto em preview ("You don't have permission to create a ...
  Deployment for this Vercel project"). O erro nomeia o projeto, então ele é
  resolvível — o que aponta para a autorização do conector estar limitada a um
  conjunto de projetos que não inclui este. Destrava concedendo acesso a todos os
  projetos (ou a este) na autorização do conector Vercel.
- `vercel.json` define `outputDirectory: public`. A causa provável da falha de build
  anterior era não existir diretório de saída (as funções em `api/` a Vercel compila
  sozinha, então não há build command).

## Próxima tarefa
Destravar a permissão do conector Vercel (ver Status atual) e refazer o deploy.
Depois, integrar com o Core Orchestrator usando `manifest.json`.
