import pgvector from "@damatjs/deps/pgvector";
import type { ModelDefinition } from "@damatjs/orm-model";
import type { Pool, PoolClient, QueryDescriptor, RelationDescriptor } from "@damatjs/orm-type";
import { resolveModelRelations } from "../query/relations";

const registeredClients = new WeakSet<object>();
const attachedPools = new WeakSet<object>();

export function modelUsesVector(model: ModelDefinition): boolean {
  return model.toTableSchema().columns.some((column) =>
    column.type === "vector" || column.type === "halfvec",
  );
}

export function descriptorUsesVector(
  model: ModelDefinition,
  descriptor: QueryDescriptor,
): boolean {
  if (modelUsesVector(model)) return true;
  if (descriptor.type !== "select" || !descriptor.with?.length) return false;
  const resolved = resolveModelRelations(model);
  return descriptor.with.some((relation) => {
    const target = resolved.get(relation.relation)?.target;
    return target ? relationUsesVector(target, relation) : false;
  });
}

function relationUsesVector(model: ModelDefinition, relation: RelationDescriptor): boolean {
  if (modelUsesVector(model)) return true;
  if (!relation.with.length) return false;
  const resolved = resolveModelRelations(model);
  return relation.with.some((nested) => {
    const target = resolved.get(nested.relation)?.target;
    return target ? relationUsesVector(target, nested) : false;
  });
}

export function attachVectorPool(
  pool: Pool,
  model: ModelDefinition,
  descriptor?: QueryDescriptor,
): void {
  const usesVector = descriptor ? descriptorUsesVector(model, descriptor) : modelUsesVector(model);
  if (!usesVector || attachedPools.has(pool as object)) return;
  const emitter = pool as unknown as {
    on?: (event: string, listener: (client: PoolClient) => void) => void;
  };
  if (!emitter.on) return;
  attachedPools.add(pool as object);
  emitter.on("connect", (client) => {
    void registerVectorClient(client).catch(() => undefined);
  });
}

export async function registerVectorClient(client: PoolClient): Promise<void> {
  if (registeredClients.has(client as object)) return;
  await pgvector.registerTypes(client as never);
  registeredClients.add(client as object);
}

export function isPoolClient(conn: Pool | PoolClient): conn is PoolClient {
  return typeof (conn as PoolClient).release === "function";
}
