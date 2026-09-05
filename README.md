# Restaurante Ai Q FOME

Entidade "restaurante" da cidade digital colaborativa **GTA7 Lab**. Permite consultar
o cardápio e registrar pedidos por mesa, com valor total unificado.

## Rodando localmente

```bash
npm install
npm run build
```

### Consultar dados via HTTP (funções da Vercel, localmente com `vercel dev`)

```bash
GET /api/menu?category=prato_principal
GET /api/orders
POST /api/orders   { "tableId": "mesa-1", "people": 2, "items": [{ "itemId": "prato-principal-1", "quantity": 2 }] }
```

### Servidor MCP

```bash
npm run mcp
```

Isso inicia um servidor MCP via stdio com duas tools:

- **`get_menu`** — lista o cardápio, com filtro opcional por `category`
  (`prato_principal`, `entrada`, `sobremesa`, `bebida`).
- **`place_order`** — registra um pedido para uma mesa (`tableId`, `people`, `items[]`)
  e retorna o pedido com o total calculado.

Para usar no Claude Desktop/Code, aponte um servidor MCP para
`node dist/src/mcp/server.js` (rode `npm run build` antes).

## MCP na Vercel

Este projeto expõe MCP tools localmente via stdio (`src/mcp/server.ts`). Para conectar
o **Claude Code** ao MCP da própria Vercel (por exemplo, para consultar/gerenciar
deployments deste projeto durante o desenvolvimento), veja a documentação oficial:

https://vercel.com/docs/agent-resources/vercel-mcp#claude-code

## Deploy

Este projeto vive na pasta `entities/restaurante-ai-q-fome/` do monorepo
`GTA7-Lab/gta7-lab` (cada entidade da cidade GTA7 Lab tem sua própria pasta em
`entities/`). O projeto na Vercel deve ser criado com Root Directory =
`entities/restaurante-ai-q-fome`, com deploy automático a cada push. As rotas em
`api/` são publicadas como funções serverless.

## Manifesto da entidade

Veja [`manifest.json`](./manifest.json) para nome, descrição, capacidades e tools
MCP oferecidas ao Core Orchestrator.
