import { z } from "@damatjs/deps/zod";
import { assertColumnVectorValue } from "@damatjs/orm-model";
import type { ColumnSchema } from "@damatjs/orm-type";
import { stateOf } from "./state";

export function validateData(
  methods: unknown,
  data: Record<string, unknown>,
  partial = false,
): void {
  const state = stateOf(methods);
  const schema = getValidationSchema(methods);
  for (const column of state.model.toTableSchema().columns ?? []) {
    if (column.type === "vector" || column.type === "halfvec") {
      assertColumnVectorValue(column, data[column.name]);
    }
  }
  (partial ? schema.partial() : schema).parse(data);
}

function getValidationSchema(methods: unknown): z.ZodObject<z.ZodRawShape> {
  const state = stateOf(methods);
  if (state._validationSchema) return state._validationSchema;
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const column of state.model.toTableSchema().columns ?? []) {
    let field = columnToZodType(column);
    if (column.nullable) field = field.nullable();
    if (
      column.nullable ||
      column.primaryKey ||
      column.autoincrement ||
      column.default !== undefined
    ) {
      field = field.optional();
    }
    shape[column.name] = field;
  }
  state._validationSchema = z.object(shape);
  return state._validationSchema;
}

function columnToZodType(column: ColumnSchema): z.ZodTypeAny {
  if (column.type === "vector" || column.type === "halfvec") {
    return z.array(z.number().finite()).length(column.dimensions ?? 0);
  }
  switch (column.type) {
    case "smallint":
    case "integer":
    case "bigint":
    case "decimal":
    case "numeric":
    case "real":
    case "double precision":
    case "smallserial":
    case "serial":
    case "bigserial":
      return z.number();
    case "boolean":
      return z.boolean();
    case "timestamp without time zone":
    case "timestamp with time zone":
    case "date":
    case "time without time zone":
    case "time with time zone":
      return z.union([z.string(), z.date()]);
    case "text":
    case "character":
    case "character varying":
    case "uuid":
    case "enum":
      return z.string();
    default:
      return z.any();
  }
}
