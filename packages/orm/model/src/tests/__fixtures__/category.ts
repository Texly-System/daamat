import { model } from "@/schema";
import { columns } from "@/properties";

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export const CategorySchema = model("categories", {
  id: columns.id({ prefix: "cat" }).primaryKey(),
  name: columns.varchar().length(128),
  slug: columns.varchar().length(128).unique(),
  description: columns.text().nullable(),
  createdAt: columns.timestamp({ withTimezone: true }).defaultNow(),
});

export function getCategoryTableSchema() {
  return CategorySchema.toTableSchema();
}
