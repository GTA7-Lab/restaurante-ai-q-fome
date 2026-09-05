import { getMenu, getRestaurantInfo } from "../src/repository";

export default function handler(req: any, res: any) {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  res.status(200).json({
    restaurant: getRestaurantInfo(),
    items: getMenu(category),
  });
}
