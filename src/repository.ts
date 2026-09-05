import menuData from "../data/menu.json";
import type { RestaurantData, MenuItem, Order, OrderItemInput, Employee } from "./types";

const data = menuData as RestaurantData;

// Pedidos ficam em memória: cada processo (MCP local ou função serverless)
// mantém sua própria lista, sem persistência entre reinícios nesta primeira versão.
const orders: Order[] = [];
let nextOrderId = 1;

export function getRestaurantInfo(): RestaurantData["restaurant"] {
  return data.restaurant;
}

export function getMenu(category?: string): MenuItem[] {
  if (!category) return data.menu;
  return data.menu.filter((item) => item.category === category);
}

export function findMenuItem(id: string): MenuItem | undefined {
  return data.menu.find((item) => item.id === id);
}

export function getTables() {
  return data.tables;
}

export function getEmployees(): Employee[] {
  return data.employees;
}

export function placeOrder(tableId: string, people: number, items: OrderItemInput[]): Order {
  const table = data.tables.find((t) => t.id === tableId);
  if (!table) {
    throw new Error(`Mesa não encontrada: ${tableId}`);
  }
  if (!items.length) {
    throw new Error("O pedido precisa ter pelo menos um item.");
  }

  let total = 0;
  for (const orderItem of items) {
    const menuItem = findMenuItem(orderItem.itemId);
    if (!menuItem) {
      throw new Error(`Item não encontrado no cardápio: ${orderItem.itemId}`);
    }
    total += menuItem.price * orderItem.quantity;
  }

  const order: Order = {
    id: `pedido-${nextOrderId++}`,
    tableId,
    people,
    items,
    total,
    status: "aberto",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

export function listOrders(): Order[] {
  return orders;
}
