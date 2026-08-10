import { expect, test } from "bun:test";
import { eventsSystemMigrations } from "../../src/durable/migrations/catalog";
import { ensureEventStorage, pool } from "./storage-context";

test("events catalog has stable ownership and order", () => {
  expect(eventsSystemMigrations.owner).toBe("@damatjs/events");
  expect(
    eventsSystemMigrations.migrations.map(({ id, order }) => [id, order]),
  ).toEqual([
    ["001", 500],
    ["002", 600],
    ["003", 700],
    ["004", 800],
    ["005", 900],
    ["006", 950],
    ["007", 1220],
  ]);
});

test("events migrations create outbox, delivery, and history tables", async () => {
  await ensureEventStorage();
  const names = [
    "damat._damat_event_outbox",
    "damat._damat_event_deliveries",
    "damat._damat_event_delivery_attempts",
    "damat._damat_event_activity",
    "damat._damat_event_logs",
  ];
  const result = await pool.query<{ name: string | null }>(
    "SELECT to_regclass(value) AS name FROM unnest($1::text[]) value",
    [names],
  );
  expect(result.rows.map(({ name }) => name)).toEqual(names);
});

test("events relocation migration qualifies its catalog", () => {
  const migration = eventsSystemMigrations.migrations.find(({ id }) => id === "007");
  expect(migration?.sql).toContain('CREATE SCHEMA "damat"');
  expect(migration?.sql).toContain('"_damat_event_outbox"');
  expect(migration?.sql).toContain('ALTER TABLE "public"."_damat_event_outbox"');
});

test("outbox and deliveries enforce separate idempotency", async () => {
  await ensureEventStorage();
  const constraints = await pool.query<{ conname: string }>(
    `SELECT conname FROM pg_constraint c
     JOIN pg_namespace n ON n.oid=c.connamespace
     WHERE n.nspname='damat' AND conname IN
      ('_damat_event_outbox_idempotency_uidx',
       '_damat_event_deliveries_consumer_uidx') ORDER BY conname`,
  );
  expect(constraints.rows.map(({ conname }) => conname)).toEqual([
    "_damat_event_deliveries_consumer_uidx",
    "_damat_event_outbox_idempotency_uidx",
  ]);
});
