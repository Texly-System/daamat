// import { model } from "../schema/model";
// import { CategorySchema } from "./category";

// // ---------------------------------------------------------------------------
// // Product
// // ---------------------------------------------------------------------------
// export const ProductSchema = model
//   .define("products", {
//     id: model.id({ prefix: "prd" }).primaryKey(),
//     sku: model.varchar(64).unique(),
//     title: model.text(),
//     price: model.decimal(10, 2),
//     stock: model.number().default(0),
//     status: model.enum(["draft", "active", "archived"]),
//     tags: model.text().array().nullable(),
//     specs: model.json().nullable(),
//     createdAt: model.timestamp().defaultRaw("now()"),

//     // belongsTo Category (nullable - product might not have a category yet)
//     category: model
//       .belongsTo(CategorySchema, { foreignKey: "category_id" })
//       .nullable(),
//   })
//   .indexes([
//     { on: ["sku"], unique: true },
//     { on: ["status", "createdAt"], type: "btree" },
//   ]);
