/**
 * Sample domain models used across the transform test suite.
 *
 * Domain: a tiny e-commerce schema
 *
 *   User  ──< Order ──< OrderItem >── Product
 *                                      │
 *                                   Category
 *
 * Relationships:
 *   - Order    belongsTo User           (user_id FK)
 *   - OrderItem belongsTo Order         (order_id FK)
 *   - OrderItem belongsTo Product       (product_id FK)
 *   - Product   belongsTo Category      (category_id FK, nullable)
 *   - User      hasMany   Order         (inverse, no FK column)
 *   - Order     hasMany   OrderItem     (inverse, no FK column)
 *   - Product   hasMany   OrderItem     (inverse, no FK column)
 *   - Category  hasMany   Product       (inverse, no FK column)
 */

import {
  BelongsToBuilder,
  DecimalColumnBuilder,
  EnumColumnBuilder,
  IdColumnBuilder,
  TextColumnBuilder,
  TimestampColumnBuilder,
} from "../properties";
import { ModelDefinition } from "@/types";
import { model } from "../schema/model";
import { UserSchema } from "./user";

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

/**
 * Concrete property map for OrderSchema.
 *
 * Declaring this as a named type (rather than relying on inference)
 * breaks the TypeScript circular-initializer error: order.ts imports user.ts
 * and user.ts imports order.ts.  By giving OrderSchema an explicit type here,
 * user.ts can see a fully-resolved type for OrderSchema and infers UserSchema
 * without any annotation on its own side.
 *
 * The `user` property is typed as plain `BelongsToBuilder` (default
 * `BelongsToBuilder<ModelProperties>`) — this is the one property that
 * cannot carry the fully-typed target without re-introducing the cycle.
 * Every other property keeps its precise concrete builder type.
 */
export type OrderProperties = {
  id: IdColumnBuilder;
  total: DecimalColumnBuilder;
  status: EnumColumnBuilder;
  notes: TextColumnBuilder;
  placedAt: TimestampColumnBuilder;
  user: BelongsToBuilder;
};

export const OrderSchema: ModelDefinition<OrderProperties> = model.define(
  "orders",
  {
    id: model.id({ prefix: "ord" }).primaryKey(),
    total: model.decimal(12, 2),
    status: model.enum([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    notes: model.text().nullable(),
    placedAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),

    // belongsTo User — lazy arrow defers resolution past module init so the
    // circular import (order ↔ user) does not cause a runtime undefined error.
    // No return-type annotation needed on the arrow: OrderSchema is explicitly
    // typed above, which lets user.ts infer UserSchema without any annotation.
    user: model.belongsTo(() => UserSchema, { foreignKey: "user_id" }),
  },
);
