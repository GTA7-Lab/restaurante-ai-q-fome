export type MenuCategory = "prato_principal" | "entrada" | "sobremesa" | "bebida";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salaryPerShift: number;
}

export interface RestaurantInfo {
  id: string;
  name: string;
  description: string;
  openingHours: Record<string, string>;
}

export interface Table {
  id: string;
  capacity: number;
}

export interface OrderItemInput {
  itemId: string;
  quantity: number;
}

export interface Order {
  id: string;
  tableId: string;
  people: number;
  items: OrderItemInput[];
  total: number;
  status: "aberto" | "fechado";
  createdAt: string;
}

export interface RestaurantData {
  restaurant: RestaurantInfo;
  menu: MenuItem[];
  employees: Employee[];
  tables: Table[];
}
