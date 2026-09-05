import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createMenuItem,
  deleteMenuItem,
  getMenu,
  getRestaurantInfo,
  placeOrder,
  updateMenuItem,
} from "../repository";
import { requireMagicWord } from "../magic-word";

const CATEGORIES = ["prato_principal", "entrada", "sobremesa", "bebida"] as const;

const magicWord = z
  .string()
  .describe("Palavra mágica exigida para qualquer alteração no cardápio");

// Toda tool de escrita responde do mesmo jeito: valida a palavra mágica, executa,
// e devolve o erro como texto (isError) em vez de estourar a chamada MCP.
function guarded<T>(word: string, action: () => T) {
  try {
    requireMagicWord(word);
    return { content: [{ type: "text" as const, text: JSON.stringify(action(), null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: `Erro: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

// As tools ficam aqui para serem servidas pelos dois transportes: stdio
// (src/mcp/server.ts) e HTTP (api/mcp.ts).
export function createServer(): McpServer {
  const server = new McpServer({
    name: "restaurante-ai-q-fome",
    version: "1.0.0",
  });

  server.tool(
    "get_menu",
    "Lista os itens do cardápio do restaurante Ai Q FOME, opcionalmente filtrados por categoria.",
    {
      category: z
        .enum(CATEGORIES)
        .optional()
        .describe("Categoria para filtrar o cardápio"),
    },
    async ({ category }) => {
      const items = getMenu(category);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ restaurant: getRestaurantInfo().name, items }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "place_order",
    "Registra um pedido para uma mesa do restaurante Ai Q FOME e calcula o valor total unificado da mesa.",
    {
      tableId: z.string().describe("Identificador da mesa, ex: mesa-1"),
      people: z.number().int().min(1).describe("Número de pessoas sentadas na mesa"),
      items: z
        .array(
          z.object({
            itemId: z.string().describe("Identificador do item do cardápio, ex: prato-principal-1"),
            quantity: z.number().int().min(1).describe("Quantidade pedida do item"),
          })
        )
        .min(1)
        .describe("Itens pedidos pela mesa"),
    },
    async ({ tableId, people, items }) => {
      try {
        const order = placeOrder(tableId, people, items);
        return {
          content: [{ type: "text", text: JSON.stringify(order, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Erro: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_menu_item",
    "Adiciona um item ao cardápio do Ai Q FOME. Exige a palavra mágica.",
    {
      magicWord,
      name: z.string().min(1).describe("Nome do item, ex: Feijoada da casa"),
      category: z.enum(CATEGORIES).describe("Categoria do item"),
      price: z.number().positive().describe("Preço em BRL"),
    },
    async ({ magicWord: word, name, category, price }) =>
      guarded(word, () => createMenuItem({ name, category, price }))
  );

  server.tool(
    "update_menu_item",
    "Altera nome, categoria ou preço de um item do cardápio do Ai Q FOME. Exige a palavra mágica.",
    {
      magicWord,
      id: z.string().describe("Identificador do item, ex: prato-principal-1"),
      name: z.string().min(1).optional().describe("Novo nome"),
      category: z.enum(CATEGORIES).optional().describe("Nova categoria"),
      price: z.number().positive().optional().describe("Novo preço em BRL"),
    },
    async ({ magicWord: word, id, name, category, price }) =>
      guarded(word, () => updateMenuItem(id, { name, category, price }))
  );

  server.tool(
    "delete_menu_item",
    "Remove um item do cardápio do Ai Q FOME. Exige a palavra mágica.",
    {
      magicWord,
      id: z.string().describe("Identificador do item, ex: sobremesa-3"),
    },
    async ({ magicWord: word, id }) => guarded(word, () => deleteMenuItem(id))
  );

  return server;
}
