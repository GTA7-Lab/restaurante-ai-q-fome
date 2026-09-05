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
- `src/repository.ts` — carrega o JSON e expõe consultas/pedidos/CRUD.
- `src/magic-word.ts` — validação da palavra mágica.
- `src/mcp/create-server.ts` — as tools, compartilhadas pelos dois transportes.
- `src/mcp/server.ts` — transporte stdio.
- `api/mcp.ts` — **única** função serverless: MCP sobre HTTP.
- `manifest.json` — manifesto da entidade para o Core Orchestrator.

## Palavra mágica (`src/magic-word.ts`)
Só as escritas no cardápio são protegidas. Leitura e pedidos ficam abertos — se
`get_menu` exigisse a palavra, a cidade não conseguiria consultar o cardápio nem
comer aqui, e a entidade perderia a função.

Valor vem de `MAGIC_WORD`; o padrão é `por favor`. Comparação ignora maiúsculas,
acentos e espaços nas pontas. Como o padrão está num repo público, ele serve para
o projeto rodar recém-clonado — protegendo algo real, defina a env var na Vercel.

## Acesso só por MCP
Não existe rota que devolva os dados do `data/menu.json` cru. As antigas
`GET /api/menu` e `GET|POST /api/orders` foram removidas: a única função
serverless é `api/mcp.ts`. Até a página em `public/index.html` monta o cardápio
chamando `get_menu` por MCP, como qualquer outro cliente.

Ao acrescentar funcionalidade, ela entra como tool nova em
`src/mcp/create-server.ts` — nunca como endpoint HTTP paralelo.

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
- **Em produção e validado**: projeto `clinica21/gta7-lab-restaurante`, ligado a
  este repo (auto-deploy a cada push), público, com `MAGIC_WORD` configurada.

  MCP: **https://gta7-lab-restaurante.vercel.app/api/mcp**

  Smoke contra a produção (`npm run smoke:http -- <url>`) confirma as 5 tools,
  `get_menu`, `place_order` (total certo) e a palavra mágica recusando tanto uma
  palavra errada quanto o padrão `por favor` — ou seja, a env var do projeto está
  valendo e a palavra real é só do dono.
- O conector MCP da Vercel neste time **só cria projeto**: não lê (`list_projects`
  vazio, `get_project`/`get_deployment` 404) nem atualiza projeto existente (403 em
  todo deploy). Por isso o deploy é por Git, não por `deploy_to_vercel` — e por isso
  mudar configuração do projeto (env var, Deployment Protection) é sempre no painel.
- Projetos `restaurante-ai-q-fome` e `ai-q-fome` foram tentativas do caminho antigo
  e ficaram obsoletos — dá para apagar os dois (o `ai-q-fome` também está ligado a
  este repo, então hoje publica em paralelo sem necessidade).
- `vercel.json` define `outputDirectory: public`. A causa provável da falha de build
  anterior era não existir diretório de saída (as funções em `api/` a Vercel compila
  sozinha, então não há build command).

## Próxima tarefa
Registrar a entidade no Core com `transport: "http"` e
`endpoint: "https://gta7-lab-restaurante.vercel.app/api/mcp"`, mapeando os slots
canônicos do Core no `argsMap` das tools.
