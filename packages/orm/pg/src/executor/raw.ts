import type { Pool, PoolClient, QueryResultRow } from "@damatjs/orm-type";
import type { BuiltQuery } from "@damatjs/orm-type";
import type { ModelDefinition } from "@damatjs/orm-model";
import type { QueryDescriptor } from "@damatjs/orm-type";
import { getQueryLogger, type QueryLogger } from "@damatjs/orm-core";
import {
  attachVectorPool,
  descriptorUsesVector,
  isPoolClient,
  registerVectorClient,
} from "./vectorRegistration";
import { serializeVectorParams } from "./vectorParams";

export async function pgExecuteRaw<
  T extends QueryResultRow = Record<string, unknown>,
>(
  conn: Pool | PoolClient,
  query: BuiltQuery,
  logger?: QueryLogger,
  model?: ModelDefinition,
  descriptor?: QueryDescriptor,
): Promise<{ rows: T[]; rowCount: number }> {
  if (model && descriptor && descriptorUsesVector(model, descriptor)) {
    attachVectorPool(conn as Pool, model, descriptor);
    const params = serializeVectorParams(model, descriptor, [...query.params]);
    if (isPoolClient(conn)) {
      await registerVectorClient(conn);
      return executeOnConnection(conn, { ...query, params }, logger);
    }
    const client = await conn.connect();
    try {
      await registerVectorClient(client);
      return await executeOnConnection(client, { ...query, params }, logger);
    } finally {
      client.release();
    }
  }
  return executeOnConnection(conn, query, logger);
}

async function executeOnConnection<T extends QueryResultRow>(
  conn: Pool | PoolClient,
  query: BuiltQuery,
  logger?: QueryLogger,
): Promise<{ rows: T[]; rowCount: number }> {
  const loggerInstance = logger ?? getQueryLogger();
  const startTime = Date.now();

  try {
    loggerInstance.logQuery(query.sql, query.params);
    const result = await conn.query<T>(query.sql, query.params as unknown[]);
    const duration = Date.now() - startTime;
    loggerInstance.logSlowQuery(query.sql, duration, query.params);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    loggerInstance.logQueryError(err, query.sql, query.params);
    throw error;
  }
}
