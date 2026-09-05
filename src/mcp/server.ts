import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getMenu, getRestaurantInfo, placeOrder } from "../repository";

const server = new McpServer({
  name: "restaurante-ai-q-fome",
  version: "1.0.0",
});

server.tool(
  "get_menu",
  "Lista os itens do cardápio do restaurante Ai Q FOME, opcionalmente filtrados por categoria.",
  {
    category: z
      .enum(["prato_principal", "entrada", "sobremesa", "bebida"])
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
