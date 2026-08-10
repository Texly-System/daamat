import type { Pool, PoolClient } from "@damatjs/orm-type";
import type { ModelDefinition } from "@damatjs/orm-model";
import { pgExecuteRaw } from "../executor";
import { ModelAccessor } from "../query";

type Connection = Pool | PoolClient;

export async function repositoryCount(
  connection: Connection,
  model: ModelDefinition,
  where?: Record<string, unknown>,
): Promise<number> {
  const { sql, json } = new ModelAccessor(model).findMany({ select: [], where } as any);
  const result = await pgExecuteRaw<{ count: string }>(connection, {
    sql: `SELECT COUNT(*) FROM (${sql.sql}) as subquery`, params: sql.params,
  }, undefined, model, json);
  return parseInt(result.rows[0]?.count || "0", 10);
}

export async function repositoryExists(
  connection: Connection,
  model: ModelDefinition,
  where: Record<string, unknown>,
): Promise<boolean> {
  const { sql, json } = new ModelAccessor(model).findOne({ where } as any);
  const result = await pgExecuteRaw<{ exists: boolean }>(connection, {
    sql: `SELECT EXISTS(${sql.sql}) as exists`, params: sql.params,
  }, undefined, model, json);
  return result.rows[0]?.exists ?? false;
}
