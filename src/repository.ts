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

// --- CRUD do cardápio -------------------------------------------------------
// As alterações valem só na memória do processo, igual aos pedidos: o
// data/menu.json não é reescrito. Numa função serverless isso significa que cada
// instância tem sua própria versão do cardápio e tudo volta ao JSON no próximo
// cold start. É o suficiente para a v1 (sem banco), mas não é persistência.

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createMenuItem(item: Omit<MenuItem, "id"> & { id?: string }): MenuItem {
  const base = item.id ?? slugify(item.name);
  if (!base) {
    throw new Error("Não foi possível gerar um id para o item: informe um nome válido.");
  }

  let id = base;
  let suffix = 2;
  while (findMenuItem(id)) {
    id = `${base}-${suffix++}`;
  }

  const created: MenuItem = { id, name: item.name, category: item.category, price: item.price };
  data.menu.push(created);
  return created;
}

export function updateMenuItem(
  id: string,
  changes: Partial<Omit<MenuItem, "id">>
): MenuItem {
  const item = findMenuItem(id);
  if (!item) {
    throw new Error(`Item não encontrado no cardápio: ${id}`);
  }

  if (changes.name !== undefined) item.name = changes.name;
  if (changes.category !== undefined) item.category = changes.category;
  if (changes.price !== undefined) item.price = changes.price;
  return item;
}

export function deleteMenuItem(id: string): MenuItem {
  const index = data.menu.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Item não encontrado no cardápio: ${id}`);
  }
  return data.menu.splice(index, 1)[0];
}
