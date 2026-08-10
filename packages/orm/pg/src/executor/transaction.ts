import type { Pool, PoolClient } from "@damatjs/orm-type";
import type { ModelDefinition } from "@damatjs/orm-model";
import { getQueryLogger, type QueryLogger } from "@damatjs/orm-core";
import { attachVectorPool, modelUsesVector, registerVectorClient } from "./vectorRegistration";

export async function pgTransaction<R>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<R>,
  logger?: QueryLogger,
  model?: ModelDefinition,
): Promise<R> {
  const loggerInstance = logger ?? getQueryLogger();
  const client = await pool.connect();
  try {
    if (model && modelUsesVector(model)) {
      attachVectorPool(pool, model);
      await registerVectorClient(client);
    }
    loggerInstance.logTransaction("begin");
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    loggerInstance.logTransaction("commit");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    loggerInstance.logTransaction("rollback");
    throw err;
  } finally {
    client.release();
  }
}
