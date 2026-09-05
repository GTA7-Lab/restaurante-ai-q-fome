import { listOrders, placeOrder } from "../src/repository";

export default function handler(req: any, res: any) {
  if (req.method === "GET") {
    res.status(200).json({ orders: listOrders() });
    return;
  }

  if (req.method === "POST") {
    try {
      const { tableId, people, items } = req.body ?? {};
      const order = placeOrder(tableId, people, items);
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
    return;
  }

  res.status(405).json({ error: "Método não permitido" });
}
