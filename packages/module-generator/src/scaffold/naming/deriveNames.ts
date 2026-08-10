import type { TableSchema } from "@damatjs/orm-type";
import { toPascalCase } from "./toPascalCase";
import { toCamelCaseCodeGen } from "./toCamelCase";
import { CrudNames } from "./type";

function primaryKeyColumnNames(table: TableSchema): string[] {
  const constraint = table.constraints?.find(
    (entry) => entry.type === "primary_key",
  );
  if (constraint) {
    const columns = new Set(table.columns.map((column) => column.name));
    return constraint.columns.every((name) => columns.has(name))
      ? constraint.columns
      : [];
  }
  return table.columns
    .filter((column) => column.primaryKey === true)
    .map((column) => column.name);
}

export function deriveNames(moduleId: string, table: TableSchema): CrudNames {
  const pascal = toPascalCase(table.name);
  // The table name, exactly as written, camelCased — used for BOTH the service
  // accessor (`service.<camel>`) and the route/workflow resource folder so they
  // stay identical. No pluralizing/singularizing.
  const camel = toCamelCaseCodeGen(table.name);
  const pkColumns = primaryKeyColumnNames(table);
  const supportsById = pkColumns.length === 1;
  const pk = pkColumns[0] ?? "id";
  return {
    moduleId,
    table: table.name,
    prop: camel,
    fileBase: camel,
    pascal,
    pk,
    pkColumns,
    supportsById,
    rowType: pascal,
    newType: `New${pascal}`,
    updateType: `Update${pascal}`,
    idType: `${pascal}Id`,
    queryType: `${pascal}Query`,
    paramsType: `${pascal}Params`,
    newSchema: `new${pascal}Schema`,
    updateSchema: `update${pascal}Schema`,
    querySchema: `${pascal}QuerySchema`,
    idSchema: `${pascal}IdSchema`,
    paramsSchema: `${pascal}ParamsSchema`,
  };
}
