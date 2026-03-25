import { ConstraintBuilder } from "./base";

/**
 * Create a new constraint builder.
 *
 * Usage:
 * ```ts
 * constrainBuilder("name_uniq").columns(["name"]).unique()
 * constrainBuilder("orders_pkey").columns(["id"]).primaryKey()
 * constrainBuilder("age_check").check("age > 0")
 * constrainBuilder("room_excl").exclude([{ column: "during", operator: "&&" }])
 * ```
 */
export function constrainBuilder(name: string): ConstraintBuilder {
  return new ConstraintBuilder(name);
}

export * from "./base";
