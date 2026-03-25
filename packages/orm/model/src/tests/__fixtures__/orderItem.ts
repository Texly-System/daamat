import { model } from "@/schema";
import { columns } from "@/properties";
import { OrderSchema } from "./order";
import { ProductSchema } from "./product";

// ---------------------------------------------------------------------------
// OrderItem
// ---------------------------------------------------------------------------
export const OrderItemSchema = model("order_items", {
  id: columns.id({ prefix: "oi" }).primaryKey(),
  quantity: columns.integer(),
  unitPrice: columns.numeric(10, 2),

  // belongsTo Order
  order: columns.belongsTo(OrderSchema),

  // belongsTo Product
  product: columns.belongsTo(ProductSchema),
}).indexes([
  columns
    .indexes("uniq_order_items_order_product")
    .columns(["order_id", "product_id"])
    .unique(),
]);

export function getOrderItemTableSchema() {
  return OrderItemSchema.toTableSchema();
}
