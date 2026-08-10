import { assertVectorValue, type ModelDefinition } from "@damatjs/orm-model";
import type { SelectDescriptor, WhereClause } from "@damatjs/orm-type";
import { serializeVectorParams } from "../executor/vectorParams";
import { toVectorSql } from "../executor/vectorValues";
import {
  buildTableRef,
  buildWhereClause,
  columnNameSet,
  quoteIdent,
} from "../query/helpers";

export type VectorDistance = "l2" | "cosine" | "innerProduct" | "l1";

export interface FindNearestOptions<Cols extends string = string> {
  column: Cols;
  vector: number[];
  distance: VectorDistance;
  limit: number;
  where?: WhereClause<Cols>;
}

const operators: Record<VectorDistance, string> = Object.freeze({
  l2: "<->",
  cosine: "<=>",
  innerProduct: "<#>",
  l1: "<+>",
});

export function buildNearestQuery<Cols extends string>(
  model: ModelDefinition,
  options: FindNearestOptions<Cols>,
) {
  const table = model.toTableSchema();
  const column = table.columns.find((entry) => entry.name === options.column);
  if (!column || (column.type !== "vector" && column.type !== "halfvec"))
    throw new Error(`Column "${options.column}" is not a native vector column`);
  assertVectorValue(
    options.vector,
    column.dimensions ?? 0,
    String(options.column),
  );
  if (!Object.hasOwn(operators, options.distance))
    throw new Error(`Unknown vector distance "${String(options.distance)}"`);
  if (!Number.isInteger(options.limit) || options.limit <= 0)
    throw new RangeError("nearest limit must be a positive integer");
  const limit = Math.min(options.limit, 1000);
  const alias = nearestAlias(table.columns.map((entry) => entry.name));
  const whereParams: unknown[] = [];
  const where = options.where
    ? buildWhereClause(
        [options.where as Record<string, unknown>],
        [],
        whereParams,
        columnNameSet(table.columns),
      )
    : "";
  const shiftedWhere = where.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 1}`);
  const descriptor: SelectDescriptor = {
    type: "select",
    table: model._tableName,
    columns: [],
    where: [],
    whereRaw: [],
    orderBy: [],
    distinct: false,
  };
  const vectorDescriptor: SelectDescriptor = {
    ...descriptor,
    where: options.where ? [options.where as any] : [],
  };
  const params = [
    toVectorSql(options.vector, String(options.column), column.dimensions ?? 0),
    ...serializeVectorParams(model, vectorDescriptor, whereParams),
  ];
  const columnSql = quoteIdent(String(options.column));
  const distance = `(${columnSql} ${operators[options.distance]} $1)`;
  const tableRef = buildTableRef({
    name: model._tableName,
    ...(model._schemaName ? { schema: model._schemaName } : {}),
  });
  const sql = `SELECT *, ${distance} AS ${quoteIdent(alias)} FROM ${tableRef} ${shiftedWhere} ORDER BY ${quoteIdent(alias)} ASC LIMIT ${limit}`;
  return { sql: { sql, params }, descriptor, alias };
}

function nearestAlias(columns: string[]): string {
  const base = "__damat_vector_distance";
  let alias = base;
  let index = 1;
  while (columns.includes(alias)) alias = `${base}_${index++}`;
  return alias;
}
