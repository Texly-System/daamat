import { expect, test } from "bun:test";
import { Pool } from "@damatjs/deps/pg";
import { damatRelation, relocateDamatRelations } from "../src";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

function probeName(label: string): string {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  return `_damat_reloc_${label}_${suffix}`;
}

test("relocation preserves rows, identity, indexes, and is idempotent", async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const name = probeName("upgrade");
  const source = `"public"."${name}"`;
  const target = damatRelation(name);
  try {
    await pool.query(`CREATE TABLE ${source} (
      "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      "payload" TEXT NOT NULL
    ); CREATE INDEX "${name}_payload_idx" ON ${source} ("payload");
    INSERT INTO ${source} ("payload") VALUES ('before-upgrade')`);

    await pool.query(relocateDamatRelations([name]));
    await pool.query(relocateDamatRelations([name]));

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query('SET LOCAL search_path TO "public"');
      const relations = await client.query(
        "SELECT to_regclass($1) AS source, to_regclass($2) AS target",
        [`public.${name}`, `damat.${name}`],
      );
      expect(relations.rows[0]).toEqual({
        source: null,
        target: `damat.${name}`,
      });
      const inserted = await client.query(
        `INSERT INTO ${target} ("payload") VALUES ('after-upgrade') RETURNING "id"`,
      );
      expect(inserted.rows[0]?.id).toBe(2);
      const rows = await client.query(`SELECT "payload" FROM ${target} ORDER BY "id"`);
      expect(rows.rows).toEqual([
        { payload: "before-upgrade" },
        { payload: "after-upgrade" },
      ]);
      await client.query("COMMIT");
    } finally {
      client.release();
    }
    const indexes = await pool.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname='damat' AND tablename=$1",
      [name],
    );
    expect(indexes.rows.map(({ indexname }) => indexname)).toContain(
      `${name}_payload_idx`,
    );
  } finally {
    await pool.query(`DROP TABLE IF EXISTS ${source}, ${target} CASCADE`);
    await pool.end();
  }
});
