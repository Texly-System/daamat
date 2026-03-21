import { model } from "../schema/model";
import { OrderSchema } from "./order";

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export const UserSchema = model
  .define(
    "users",
    {
      id: model.id({ prefix: "usr" }).primaryKey(),
      email: model.text().unique(),
      name: model.text(),
      age: model.number().nullable(),
      verified: model.boolean().default(false),
      metadata: model.json({ binary: true }).nullable(),
      createdAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
      updatedAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),

      // hasMany Orders — lazy arrow breaks the circular-init error at runtime.
      // No return-type annotation needed: TypeScript infers the target type from
      // the arrow's return value, giving HasManyBuilder<OrderSchema['_properties']>.
      orders: model.hasMany(() => OrderSchema, { mappedBy: "user" }),
    },
    { schema: "store" },
  )
  .indexes([
    { on: ["email"], unique: true, name: "uniq_users_email" },
    { on: ["createdAt"], name: "idx_users_created_at" },
  ]);
