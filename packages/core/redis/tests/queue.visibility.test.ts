import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { ageClaim, makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue > visibility timeout", () => {
  let redis: FakeRedis;
  let queue: RedisQueue<JobData>;

  beforeEach(() => {
    redis = createFakeRedis();
    queue = new RedisQueue<JobData>("test", redis);
  });

  it("redelivers unacked jobs after visibilityTimeoutMs", async () => {
    const visibilityTimeoutMs = 60_000;
    const vtQueue = new RedisQueue<JobData>("test", redis, {
      visibilityTimeoutMs,
    });
    await vtQueue.enqueue(makeJob({ id: "j1" }));
    const first = await vtQueue.dequeue(10);
    expect(first.map((j) => j.id)).toEqual(["j1"]);
    expect(await vtQueue.dequeue(10)).toEqual([]);

    await ageClaim(redis, "j1", visibilityTimeoutMs);
    const second = await vtQueue.dequeue(10);
    expect(second.map((j) => j.id)).toEqual(["j1"]);
    expect(await redis.zcard("queue:test:processing")).toBe(1);
  });

  it("does not redeliver jobs acked via updateStatus", async () => {
    const visibilityTimeoutMs = 60_000;
    const vtQueue = new RedisQueue<JobData>("test", redis, {
      visibilityTimeoutMs,
    });
    const job = makeJob({ id: "j1" });
    await vtQueue.enqueue(job);
    await vtQueue.dequeue(10);
    await ageClaim(redis, "j1", visibilityTimeoutMs);
    await vtQueue.updateStatus({ ...job, status: "completed" });

    expect(await vtQueue.dequeue(10)).toEqual([]);
    const stats = await vtQueue.getStats();
    expect(stats.completed).toBe(1);
    expect(stats.processing).toBe(0);
  });

  it("leaves claimed jobs in processing when the option is unset (legacy)", async () => {
    await queue.enqueue(makeJob({ id: "j1" }));
    await queue.dequeue(10);
    await ageClaim(redis, "j1", 60_000);

    expect(await queue.dequeue(10)).toEqual([]);
    expect(await redis.zcard("queue:test:processing")).toBe(1);
  });
});
