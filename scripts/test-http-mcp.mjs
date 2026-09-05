// Smoke test do MCP sobre HTTP: sobe um servidor local que monta a mesma função
// serverless de api/mcp.ts e faz o handshake MCP contra ela.
// Rode `npm run build` antes. Uso: node scripts/test-http-mcp.mjs
import { createServer } from "node:http";
import mcpHandler from "../dist/api/mcp.js";

const handler = mcpHandler.default ?? mcpHandler;

// A Vercel entrega o body já parseado e adiciona res.status().json();
// aqui replicamos os dois para rodar o handler fora dela.
const server = createServer((req, res) => {
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
const url = `http://127.0.0.1:${server.address().port}/api/mcp`;
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

server.close();
