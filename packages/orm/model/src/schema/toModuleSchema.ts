import { EnumBuilder } from "@/properties/enum";
import { ModuleSchema } from "@/types";
import { ModelDefinition } from "./model";

/**
 * Collect all tables from a list of models and build a ModuleSchema.
 *
 * ```ts
 * const schema = toModuleSchema("store", [UserSchema, OrderSchema], {
 *   enums: [OrderStatusEnum],
 *   schema: "public",
 * });
 * ```
 */
export function toModuleSchema(
  moduleName: string,
  models: ModelDefinition[],
  options?: {
    /** PostgreSQL schema name (default: "public") */
    schema?: string;
    /** Enum types declared at module level */
    enums?: EnumBuilder[];
  },
): ModuleSchema {
  return {
    moduleName,
    // schema: "public",
    ...(
      options?.schema !== undefined ?
        { schema: options.schema } :
        { schema: "public" }),
    tables: models.map((m) => m.toTableSchema()),
    enums: (options?.enums ?? []).map((e) => e.toSchema()),
  };
}
