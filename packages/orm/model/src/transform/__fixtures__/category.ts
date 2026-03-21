import { model } from "../schema/model";

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export const CategorySchema = model.define("categories", {
  id: model.id({ prefix: "cat" }).primaryKey(),
  name: model.varchar(128),
  slug: model.varchar(128).unique(),
  description: model.text().nullable(),
  createdAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
});
