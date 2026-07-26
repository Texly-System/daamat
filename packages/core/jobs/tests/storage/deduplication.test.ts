import { expect, test } from "bun:test";
import { enqueueJob, listJobActivity, listJobRuns } from "../../src/client";
import { ensureStorage, pool, uniqueName } from "./context";

test("concurrent deduplicated enqueue replays one run", async () => {
  await ensureStorage();
  const name = uniqueName("dedup");
  const key = crypto.randomUUID();
  const [left, right] = await Promise.all([
    enqueueJob(name, { side: "left" }, { deduplication: { key } }),
    enqueueJob(name, { side: "left" }, { deduplication: { key } }),
  ]);
  expect(left.id).toBe(right.id);
  const runs = await listJobRuns({ name });
  expect(runs).toHaveLength(1);
  expect(await listJobActivity(left.id)).toHaveLength(1);
});

test("deduplication rejects a key reused with different intent", async () => {
  await ensureStorage();
  const name = uniqueName("dedup-conflict");
  const key = crypto.randomUUID();
  await enqueueJob(name, { side: "left" }, { deduplication: { key } });
  await expect(
    enqueueJob(name, { side: "right" }, { deduplication: { key } }),
  ).rejects.toThrow(/existing intent/i);
});

test("expired deduplication keys create a fresh run", async () => {
  await ensureStorage();
  const name = uniqueName("dedup-expired");
  const key = crypto.randomUUID();
  const first = await enqueueJob(
    name,
    {},
    {
      deduplication: { key, expiresAt: new Date(Date.now() - 1_000) },
    },
  );
  const second = await enqueueJob(name, {}, { deduplication: { key } });
  expect(second.id).not.toBe(first.id);
});

test("legacy deduplication rows fail closed even after expiry", async () => {
  await ensureStorage();
  const name = uniqueName("dedup-legacy");
  const key = crypto.randomUUID();
  const first = await enqueueJob(name, {});
  await pool.query(
    `INSERT INTO "_damat_job_deduplication"
      ("queue","job_name","deduplication_key","run_id","expires_at")
     VALUES ($1,$2,$3,$4,NOW() - INTERVAL '1 second')`,
    [first.queue, name, key, first.id],
  );
  await expect(
    enqueueJob(name, {}, { queue: first.queue, deduplication: { key } }),
  ).rejects.toThrow(/existing intent/i);
});
