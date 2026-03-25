// import { model } from "../schema/model";
// import { OrderSchema } from "./order";
// import { ProductSchema } from "./product";

// // ---------------------------------------------------------------------------
// // OrderItem
// // ---------------------------------------------------------------------------
// export const OrderItemSchema = model
//   .define("order_items", {
//     id: model.id({ prefix: "oi" }).primaryKey(),
//     quantity: model.number(),
//     unitPrice: model.decimal(10, 2),

//     // belongsTo Order
//     order: model.belongsTo(OrderSchema, { foreignKey: "order_id" }),

//     // belongsTo Product
//     product: model.belongsTo(ProductSchema, { foreignKey: "product_id" }),
//   })
//   .indexes([
//     {
//       on: ["order_id", "product_id"],
//       unique: true,
//       name: "uniq_order_items_order_product",
//     },
//   ]);
