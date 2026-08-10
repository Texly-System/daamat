import { columns, model } from "@damatjs/orm-model";
import { FakeConn, type FakeConnOptions } from "./fixtures";

export const VectorModel = model("vector_item", {
  id: columns.text().primaryKey(),
  embedding: columns.vector(3), compact: columns.halfVector(2).nullable(), samples: columns.real().array(),
}).timestamps(false).softDelete(false);

let ParentModel: ReturnType<typeof model>;
const RelatedVector = model("related_vector", {
  id: columns.text().primaryKey(), embedding: columns.vector(2),
  parent: columns.belongsTo(() => ParentModel).link({ foreignKey: "parent_id", reference: "id" }),
}).timestamps(false).softDelete(false);
ParentModel = model("vector_parent", {
  id: columns.text().primaryKey(), children: columns.hasMany(() => RelatedVector).mappedBy("parent"),
}).timestamps(false).softDelete(false);
export { ParentModel };

let PlainLeaf: ReturnType<typeof model>;
const NestedVector = model("nested_vector", {
  id: columns.text().primaryKey(), embedding: columns.vector(2),
  leaf: columns.belongsTo(() => PlainLeaf).link({ foreignKey: "leaf_id", reference: "id" }),
}).timestamps(false).softDelete(false);
PlainLeaf = model("plain_leaf", {
  id: columns.text().primaryKey(), nested: columns.hasMany(() => NestedVector).mappedBy("leaf"),
}).timestamps(false).softDelete(false);
export const PlainRoot = model("plain_root", {
  id: columns.text().primaryKey(),
  child: columns.belongsTo(() => PlainLeaf).link({ foreignKey: "child_id", reference: "id" }),
}).timestamps(false).softDelete(false);

export class VectorClient extends FakeConn {
  parsers = new Map<number, (value: string) => unknown>();
  released = 0;
  override async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
    if (sql.includes("pg_type")) {
      this.calls.push({ sql, params });
      return { rows: [{ typname: "vector", oid: 100 }, { typname: "halfvec", oid: 101 }], rowCount: 2 };
    }
    return super.query<T>(sql, params);
  }
  release(): void { this.released += 1; }
  setTypeParser(oid: number, _format: string, parser: (value: string) => unknown): void { this.parsers.set(oid, parser); }
}

export class VectorPool extends FakeConn {
  readonly client: VectorClient;
  constructor(options: FakeConnOptions = {}) { super(options); this.client = new VectorClient(options); }
  async connect(): Promise<VectorClient> { return this.client; }
}

export class RetryClient extends VectorClient {
  attempts = 0;
  override async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
    if (sql.includes("pg_type") && this.attempts++ === 0) {
      this.calls.push({ sql, params });
      return { rows: [], rowCount: 0 };
    }
    return super.query<T>(sql, params);
  }
}
