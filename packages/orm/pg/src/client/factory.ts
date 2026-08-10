import type { PoolClient, QueryResultRow } from "@damatjs/orm-type";
import { PgModelClient } from "./base";

export function withClient<T extends QueryResultRow, Cols extends string>(
  source: PgModelClient<T, Cols>,
  client: PoolClient,
): PgModelClient<T, Cols> {
  return new PgModelClient<T, Cols>(
    source.accessor._model,
    source._pool,
    client,
    source._logger,
  );
}
