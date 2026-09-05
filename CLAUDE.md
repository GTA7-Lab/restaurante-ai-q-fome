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
As tools são definidas uma vez em `src/mcp/create-server.ts` e servidas por dois
transportes:
- **stdio** — `src/mcp/server.ts`, via `npm run mcp` (após `npm run build`).
- **http** — `api/mcp.ts`, em `POST /api/mcp` (streamable http, stateless).

Abertas:
- `get_menu(category?)` — lista o cardápio, opcionalmente filtrado por categoria.
- `place_order(tableId, people, items[])` — registra pedido de uma mesa e calcula o total unificado.

Exigem a palavra mágica (parâmetro `magicWord`):
- `create_menu_item(magicWord, name, category, price)` — id gerado a partir do nome.
- `update_menu_item(magicWord, id, name?, category?, price?)`
- `delete_menu_item(magicWord, id)`

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

## Palavra mágica (`src/magic-word.ts`)
Só as escritas no cardápio são protegidas. Leitura e pedidos ficam abertos — se
`get_menu` exigisse a palavra, a cidade não conseguiria consultar o cardápio nem
comer aqui, e a entidade perderia a função.

Valor vem de `MAGIC_WORD`; o padrão é `por favor`. Comparação ignora maiúsculas,
acentos e espaços nas pontas. Como o padrão está num repo público, ele serve para
o projeto rodar recém-clonado — protegendo algo real, defina a env var na Vercel.

## Decisões relevantes
- Sem banco de dados: cardápio/funcionários/mesas vêm de `data/menu.json` (import
  estático com `resolveJsonModule`, para funcionar tanto local quanto no bundle da Vercel).
- Pedidos ficam em memória (array em `repository.ts`), não persistidos em arquivo,
  para manter a v1 simples — cada processo (MCP local ou função serverless) tem seu
  próprio estado.
- TypeScript com `module: CommonJS`; `moduleResolution: node` foi removido no
  TypeScript 7, por isso o campo foi deixado sem valor explícito (default atual).

## Limitações da v1 (intencionais)
Sem pagamentos reais, banco externo, Docker, ou contratação/pagamento de
funcionários (dados de funcionários existem no JSON só para consulta futura).

A palavra mágica é o único controle de acesso, e é um segredo compartilhado em
texto puro — serve para a demo da cidade, não para proteger dado sensível. As
alterações do CRUD, como os pedidos, vivem só na memória do processo: o
`data/menu.json` não é reescrito e cada instância serverless tem sua própria
cópia, que volta ao original no próximo cold start.

## Status atual
- Build (`npm run build`) e MCP server verificados: `npm run smoke` lista as tools e
  chama `get_menu` e `place_order` (total unificado por mesa confere).
- Publicado em `github.com/GTA7-Lab/restaurante-ai-q-fome` (repo próprio, saiu do
  monorepo da cidade em 05/09/2026).
- Projeto oficial: **`clinica21/ai-q-fome`** (`prj_RL9BKtwLG7uOJEPOLJvoMrA8BzAB`),
  ligado a este repo e com **auto-deploy a cada push confirmado funcionando**.
  URL: https://ai-q-fome-clinica21.vercel.app
- **Falta desativar o Vercel Authentication** nesse projeto (Settings → Deployment
  Protection). Request anônimo leva 302 para o SSO, então nem o Core nem `curl`
  alcançam `/api/mcp` — e nem dá para confirmar se o build passou, porque o SSO
  responde antes da aplicação. `update_project_deployment_protection` não resolve:
  dá 404 mesmo passando o project id real.
- **A env `MAGIC_WORD` está no projeto errado** (`restaurante-ai-q-fome`). Precisa
  ser criada em `ai-q-fome`, senão a palavra mágica em produção cai no padrão.
- O conector MCP da Vercel neste time **só cria projeto**: não lê (`list_projects`
  vazio, `get_project`/`get_deployment` 404) nem atualiza projeto existente (403 em
  todo deploy). Por isso o caminho passou a ser Git, não `deploy_to_vercel`.
- Projetos antigos `gta7-lab-restaurante` e `restaurante-ai-q-fome` ficaram
  obsoletos — dá para apagar.
- `vercel.json` define `outputDirectory: public`. A causa provável da falha de build
  anterior era não existir diretório de saída (as funções em `api/` a Vercel compila
  sozinha, então não há build command).

## Próxima tarefa
Desativar o Vercel Authentication do projeto, confirmar `/api/mcp` respondendo em
produção e registrar a entidade no Core com `endpoint` apontando para essa URL.
