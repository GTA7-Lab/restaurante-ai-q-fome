# Restaurante Ai Q FOME

Entidade "restaurante" da cidade digital colaborativa **GTA7 Lab**. Permite consultar
o cardápio e registrar pedidos por mesa, com valor total unificado.

Em produção: **https://gta7-lab-restaurante.vercel.app/api/mcp**

## Acesso só por MCP

Esta entidade **não** expõe os dados por rota HTTP comum. Não existe
`GET /api/menu` nem `/api/orders`: a única função publicada é `POST /api/mcp`, e
tudo — leitura, pedido, alteração de cardápio — passa pelas MCP tools. Até a
página inicial monta o cardápio chamando `get_menu` por MCP.

## Rodando localmente

```bash
npm install
npm run build
```

### Servidor MCP

```bash
npm run mcp
```

Isso inicia um servidor MCP via stdio. As mesmas tools também são servidas por
HTTP em `POST /api/mcp`.

Abertas a qualquer um:

- **`get_menu`** — lista o cardápio, com filtro opcional por `category`
  (`prato_principal`, `entrada`, `sobremesa`, `bebida`).
- **`place_order`** — registra um pedido para uma mesa (`tableId`, `people`, `items[]`)
  e retorna o pedido com o total calculado.

Protegidas pela palavra mágica:

- **`create_menu_item`** (`magicWord`, `name`, `category`, `price`)
- **`update_menu_item`** (`magicWord`, `id`, `name?`, `category?`, `price?`)
- **`delete_menu_item`** (`magicWord`, `id`)

Para usar no Claude Desktop/Code, aponte um servidor MCP para
`node dist/src/mcp/server.js` (rode `npm run build` antes), ou use o `.mcp.json`
já incluído no repo.

### Palavra mágica

Alterar o cardápio exige informar a palavra mágica no parâmetro `magicWord`.
Consultar o cardápio e fazer pedidos **não** exige — senão a cidade não
conseguiria comer aqui.

O valor vem da variável de ambiente `MAGIC_WORD`; sem ela, o padrão é
`por favor`. A comparação ignora maiúsculas, acentos e espaços nas pontas.

Como o padrão está num repositório público, ele existe só para o projeto
funcionar recém-clonado. Para proteger de verdade, defina `MAGIC_WORD` nas
variáveis de ambiente do projeto na Vercel.

### Testes

```bash
npm run smoke        # MCP por stdio, incluindo a palavra mágica
npm run smoke:http   # a mesma função de /api/mcp, num servidor local
```

## MCP na Vercel

Este projeto expõe MCP tools localmente via stdio (`src/mcp/server.ts`). Para conectar
o **Claude Code** ao MCP da própria Vercel (por exemplo, para consultar/gerenciar
deployments deste projeto durante o desenvolvimento), veja a documentação oficial:

https://vercel.com/docs/agent-resources/vercel-mcp#claude-code

## Deploy

Este projeto tem repositório próprio ([`GTA7-Lab/restaurante-ai-q-fome`](https://github.com/GTA7-Lab/restaurante-ai-q-fome)),
como a Sorveteria Polar e o Core. O projeto na Vercel aponta para a raiz deste repo
(sem Root Directory), com deploy a cada push. As rotas em `api/` são publicadas como
funções serverless.

A cidade fica em [`GTA7-Lab/gta7-lab`](https://github.com/GTA7-Lab/gta7-lab) e o Core
Orchestrator em [`GTA7-Lab/gta7-lab-core`](https://github.com/GTA7-Lab/gta7-lab-core).

## Manifesto da entidade

Veja [`manifest.json`](./manifest.json) para nome, descrição, capacidades e tools
MCP oferecidas ao Core Orchestrator.
