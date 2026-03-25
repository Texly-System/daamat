import { model } from "@/schema";
import { columns } from "@/properties";
import { OrderSchema } from "./order";

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export const UserSchema = model(
  "users",
  {
    id: columns.id({ prefix: "usr" }).primaryKey(),
    email: columns.text().unique(),
    name: columns.text(),
    age: columns.integer().nullable(),
    verified: columns.boolean().default(false),
    metadata: columns.json({ binary: true }).nullable(),
    createdAt: columns.timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: columns.timestamp({ withTimezone: true }).defaultNow(),

    // hasMany Orders — lazy arrow breaks the circular-init error at runtime.
    orders: columns.hasMany(() => OrderSchema).inverse("user"),
  },
  { schema: "store" },
).indexes([
  columns.indexes("uniq_users_email").columns(["email"]).unique(),
  columns.indexes("idx_users_created_at").columns(["createdAt"]),
]);

export function getUserTableSchema() {
  return UserSchema.toTableSchema();
}
