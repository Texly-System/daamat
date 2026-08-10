import type { QueryLogger } from "@damatjs/orm-core";
import type { ModelDefinition } from "@damatjs/orm-model";
import type { Pool, PoolClient } from "@damatjs/orm-type";
import type { QueryResultRow } from "@damatjs/orm-type";
import { pgExecuteRaw } from "../executor";
import { buildNearestQuery, type FindNearestOptions } from "./nearestQuery";

export { buildNearestQuery } from "./nearestQuery";
export type { FindNearestOptions, VectorDistance } from "./nearestQuery";
export type NearestResult<T extends QueryResultRow> = {
  row: T;
  distance: number;
};

export function mapNearestRows<T extends QueryResultRow>(
  rows: T[],
  alias: string,
): NearestResult<T>[] {
  return rows.map((value) => {
    const row = { ...value } as T & Record<string, unknown>;
    const distance = Number(row[alias]);
    delete row[alias];
    return { row: row as T, distance };
  });
}

export async function executeNearest<T extends QueryResultRow>(
  connection: Pool | PoolClient,
  model: ModelDefinition,
  options: FindNearestOptions<any>,
  logger?: QueryLogger,
): Promise<NearestResult<T>[]> {
  const built = buildNearestQuery(model, options);
  const result = await pgExecuteRaw<T>(
    connection,
    built.sql,
    logger,
    model,
    built.descriptor,
  );
  return mapNearestRows(result.rows, built.alias);
}
