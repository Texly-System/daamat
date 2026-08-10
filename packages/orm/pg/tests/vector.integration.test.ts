import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { columns, model, toModuleSchema } from "@damatjs/orm-model";
import { generateMigration } from "@damatjs/orm-processor";
import { PgModelClient, createRepository } from "../src";
import { noopLogger } from "./helpers/fixtures";

const DATABASE_URL = process.env.DATABASE_URL;
const schema = "orm_vector_it";
const Asset = model("vector_asset", {
  id: columns.text().primaryKey(), embedding: columns.halfVector(2048),
}, { schema }).timestamps(false).softDelete(false);
const moduleSchema = toModuleSchema("orm_vector_it", [Asset], { schema });
type Pool = any;

function basis(index: number): number[] {
  const value = Array.from({ length: 2048 }, () => 0);
  value[index] = 1;
  return value;
}

describe.skipIf(!DATABASE_URL)("native pgvector PostgreSQL integration", () => {
  let pool: Pool;

  beforeAll(async () => {
    const { Pool } = await import("@damatjs/deps/pg");
    pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${schema}"`);
    const migration = generateMigration.generateFromSnapshot(moduleSchema);
    await pool.query(migration.upStatements.join(";\n"));
  });

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.end();
  });

  test("inserts and reads number[] values, then finds cosine nearest", async () => {
    const client = new PgModelClient(Asset, pool);
    const anchor = basis(0);
    await client.create({ data: { id: "anchor", embedding: anchor } });
    await client.create({ data: { id: "other", embedding: basis(1) } });
    const found = await client.findOne({ where: { id: "anchor" } });
    expect(found.rows[0]?.embedding).toEqual(anchor);
    const repo = createRepository(Asset, pool, noopLogger);
    const nearest = await repo.findNearest({ column: "embedding", vector: anchor, distance: "cosine", limit: 1 });
    expect(nearest[0]?.row.id).toBe("anchor");
    expect(nearest[0]?.distance).toBeCloseTo(0);
  });

  test("rejects a non-2048 vector before executing SQL", async () => {
    const client = new PgModelClient(Asset, pool);
    await expect(client.create({ data: { id: "invalid", embedding: basis(0).slice(1) } })).rejects.toThrow(/exactly 2048/);
    await expect(client.create({ data: { id: "long", embedding: [...basis(0), 0] } })).rejects.toThrow(/exactly 2048/);
    await expect(client.create({ data: { id: "nan", embedding: basis(0).map((value, index) => index === 1 ? Number.NaN : value) } })).rejects.toThrow(/finite/);
  });
});
