/**
 * Snapshot generator — writes src/tests/__snapshots__/module.snap.json
 *
 * Run with:
 *   bun run scripts/generate-snapshots.ts
 *
 * The output file is committed and used by snapshots.test.ts to detect
 * unintentional regressions in toModuleSchema() output.
 */

import { writeFileSync } from "fs";
import { join } from "path";

import { toModuleSchema } from "../src/schema/toModuleSchema";
import {
  CategorySchema,
  OrderSchema,
  OrderItemSchema,
  ProductSchema,
  UserSchema,
} from "../src/tests/__fixtures__/models";
import { OrderStatusEnum } from "../src/tests/__fixtures__/order";
import { ProductStatusEnum } from "../src/tests/__fixtures__/product";

// ─── Build module schemas ─────────────────────────────────────────────────────

/**
 * The entire e-commerce fixture domain as a single module.
 *
 * schema "store" comes from UserSchema — for a real app each model in a
 * non-default pg schema would live in its own module. Here we use "public"
 * as the module-level schema (user has schema="store" on its table, not
 * module-level).
 */
const ecommerceModule = toModuleSchema(
  "ecommerce",
  [CategorySchema, ProductSchema, OrderSchema, OrderItemSchema, UserSchema],
  {
    enums: [ProductStatusEnum, OrderStatusEnum],
  },
);

// ─── Write snapshot ──────────────────────────────────────────────────────────

const outPath = join(
  import.meta.dir,
  "../src/tests/__snapshots__/module.snap.json",
);

writeFileSync(outPath, JSON.stringify(ecommerceModule, null, 2) + "\n", "utf8");

console.log(`Snapshot written to ${outPath}`);
