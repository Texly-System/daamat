import { model } from "@/schema";
import { EnumBuilder } from "../../properties/enum/base";
import { columns } from "@/properties";
import { CategorySchema } from "./category";

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export const ProductStatusEnum = new EnumBuilder([
  "draft",
  "active",
  "archived",
]).name("product_status");

export const ProductSchema = model("products", {
  id: columns.id({ prefix: "prd" }).primaryKey(),
  sku: columns.varchar().length(64).unique(),
  title: columns.text(),
  price: columns.numeric(10, 2),
  stock: columns.integer().default(0),
  status: columns.enum(ProductStatusEnum),
  tags: columns.text().array().nullable(),
  specs: columns.json().nullable(),
  createdAt: columns.timestamp({ withTimezone: true }).defaultNow(),

  // belongsTo Category (nullable - product might not have a category yet)
  category: columns.belongsTo(CategorySchema).nullable(),
}).indexes([
  columns.indexes().columns(["sku"]).unique(),
  columns.indexes().columns(["status", "createdAt"]).type("btree"),
]);

export function getProductTableSchema() {
  return ProductSchema.toTableSchema();
}
