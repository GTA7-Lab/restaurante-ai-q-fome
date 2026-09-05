// Smoke test do MCP sobre HTTP. Sem argumento, sobe um servidor local que monta a
// mesma função serverless de api/mcp.ts (rode `npm run build` antes). Com uma URL,
// testa um deploy de verdade:
//
//   node scripts/test-http-mcp.mjs
//   node scripts/test-http-mcp.mjs https://gta7-lab-restaurante.vercel.app/api/mcp
import { createServer } from "node:http";

const remote = process.argv[2];
let server;
let url;

if (remote) {
  url = remote;
} else {
  const mcpHandler = await import("../dist/api/mcp.js");
  const handler = mcpHandler.default?.default ?? mcpHandler.default;

  // A Vercel entrega o body já parseado e adiciona res.status().json();
  // aqui replicamos os dois para rodar o handler fora dela.
  server = createServer((req, res) => {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(data));
      return res;
    };

    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      req.body = raw ? JSON.parse(raw) : undefined;
      handler(req, res);
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  url = `http://127.0.0.1:${server.address().port}/api/mcp`;
}

console.log("endpoint:", url);

async function rpc(method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
  return JSON.parse(text);
}

const init = await rpc("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke-http", version: "1.0.0" },
});
console.log("servidor:", init.result.serverInfo.name, init.result.serverInfo.version);

const tools = await rpc("tools/list", {});
console.log("tools:", tools.result.tools.map((t) => t.name).join(", "));

const menu = await rpc("tools/call", { name: "get_menu", arguments: { category: "bebida" } });
console.log("get_menu(bebida):");
console.log(menu.result.content[0].text);

const order = await rpc("tools/call", {
  name: "place_order",
  arguments: {
    tableId: "mesa-3",
    people: 3,
    items: [
      { itemId: "prato-principal-2", quantity: 3 },
      { itemId: "sobremesa-3", quantity: 3 },
    ],
  },
});
console.log("place_order(mesa-3, 3 pessoas):");
console.log(order.result.content[0].text);

// --- palavra mágica --------------------------------------------------------
// Contra um deploy, a palavra certa é a da env MAGIC_WORD do projeto: passe em
// MAGIC_WORD aqui também para testar o caminho feliz.
const MAGIC = process.env.MAGIC_WORD ?? "por favor";

const recusado = await rpc("tools/call", {
  name: "create_menu_item",
  arguments: { magicWord: "abracadabra", name: "Item Pirata", category: "entrada", price: 1 },
});
console.log("create com palavra errada:", recusado.result.content[0].text.trim());
console.log("  isError:", recusado.result.isError === true);

const aceito = await rpc("tools/call", {
  name: "create_menu_item",
  arguments: { magicWord: MAGIC, name: "Feijoada da casa", category: "prato_principal", price: 120 },
});
console.log(`create com "${MAGIC}":`, aceito.result.content[0].text.trim());

server?.close();
