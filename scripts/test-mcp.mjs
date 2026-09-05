// Smoke test do servidor MCP: sobe o server por stdio, lista as tools e chama
// as duas. Rode `npm run build` antes. Uso: node scripts/test-mcp.mjs
import { spawn } from "node:child_process";

const server = spawn("node", ["dist/src/mcp/server.js"], { stdio: ["pipe", "pipe", "inherit"] });

const pending = new Map();
let buffer = "";

server.stdout.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    const resolve = pending.get(msg.id);
    if (resolve) {
      pending.delete(msg.id);
      resolve(msg);
    }
  }
});

let nextId = 1;
function send(method, params) {
  const id = nextId++;
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return new Promise((resolve) => pending.set(id, resolve));
}

function notify(method, params) {
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}

const init = await send("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke", version: "1.0.0" },
});
console.log("servidor:", init.result.serverInfo.name, init.result.serverInfo.version);
notify("notifications/initialized");

const { result: tools } = await send("tools/list", {});
console.log("tools:", tools.tools.map((t) => t.name).join(", "));

const menu = await send("tools/call", {
  name: "get_menu",
  arguments: { category: "sobremesa" },
});
console.log("get_menu(sobremesa):");
console.log(menu.result.content[0].text);

const order = await send("tools/call", {
  name: "place_order",
  arguments: {
    tableId: "mesa-1",
    people: 2,
    items: [
      { itemId: "prato-principal-1", quantity: 2 },
      { itemId: "bebida-2", quantity: 2 },
    ],
  },
});
console.log("place_order(mesa-1, 2 pessoas):");
console.log(order.result.content[0].text);

const invalid = await send("tools/call", {
  name: "place_order",
  arguments: { tableId: "mesa-99", people: 1, items: [{ itemId: "bebida-1", quantity: 1 }] },
});
console.log("place_order(mesa inexistente):", invalid.result.content[0].text);

// --- palavra mágica --------------------------------------------------------
const MAGIC = process.env.MAGIC_WORD ?? "por favor";

const semPalavra = await send("tools/call", {
  name: "create_menu_item",
  arguments: { magicWord: "abracadabra", name: "Item Pirata", category: "entrada", price: 1 },
});
console.log("create sem a palavra magica:", semPalavra.result.content[0].text.trim());
console.log("  isError:", semPalavra.result.isError === true);

const criado = await send("tools/call", {
  name: "create_menu_item",
  arguments: { magicWord: MAGIC, name: "Feijoada da casa", category: "prato_principal", price: 120 },
});
const novoItem = JSON.parse(criado.result.content[0].text);
console.log("create com a palavra magica:", novoItem);

const editado = await send("tools/call", {
  name: "update_menu_item",
  arguments: { magicWord: MAGIC, id: novoItem.id, price: 135 },
});
console.log("update:", JSON.parse(editado.result.content[0].text));

const removido = await send("tools/call", {
  name: "delete_menu_item",
  arguments: { magicWord: MAGIC, id: novoItem.id },
});
console.log("delete:", JSON.parse(removido.result.content[0].text).id);

const sumiu = await send("tools/call", {
  name: "update_menu_item",
  arguments: { magicWord: MAGIC, id: novoItem.id, price: 10 },
});
console.log("update apos delete:", sumiu.result.content[0].text.trim());

server.stdin.end();
server.kill();
