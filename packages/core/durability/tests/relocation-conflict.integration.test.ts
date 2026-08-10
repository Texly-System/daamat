import { expect, test } from "bun:test";
import { Pool } from "@damatjs/deps/pg";
import { damatRelation, relocateDamatRelations } from "../src";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

test("a later conflict rolls back earlier moves without data loss", async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const movable = `_damat_reloc_first_${suffix}`;
  const conflict = `_damat_reloc_conflict_${suffix}`;
  const movableSource = `"public"."${movable}"`;
  const movableTarget = damatRelation(movable);
  const conflictSource = `"public"."${conflict}"`;
  const conflictTarget = damatRelation(conflict);
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "damat";
      CREATE TABLE ${movableSource} ("value" TEXT);
      CREATE TABLE ${conflictSource} ("value" TEXT);
      CREATE TABLE ${conflictTarget} ("value" TEXT);
      INSERT INTO ${movableSource} VALUES ('movable');
      INSERT INTO ${conflictSource} VALUES ('source');
      INSERT INTO ${conflictTarget} VALUES ('target')`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await expect(
        client.query(relocateDamatRelations([movable, conflict])),
      ).rejects.toThrow(/both .*public.* and .*damat.* exist/i);
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
    const state = await pool.query(
      `SELECT to_regclass($1) AS movable_source,
              to_regclass($2) AS movable_target,
              (SELECT "value" FROM ${conflictSource}) AS source,
              (SELECT "value" FROM ${conflictTarget}) AS target`,
      [`public.${movable}`, `damat.${movable}`],
    );
    expect(state.rows[0]).toEqual({
      movable_source: movable,
      movable_target: null,
      source: "source",
      target: "target",
    });
  } finally {
    await pool.query(
      `DROP TABLE IF EXISTS ${movableSource}, ${movableTarget},
       ${conflictSource}, ${conflictTarget} CASCADE`,
    );
    await pool.end();
  }
});
