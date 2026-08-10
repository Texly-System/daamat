import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue > dequeue", () => {
  let redis: FakeRedis;
  let queue: RedisQueue<JobData>;

  beforeEach(() => {
    redis = createFakeRedis();
    queue = new RedisQueue<JobData>("test", redis);
  });

  it("returns due jobs and moves them to processing", async () => {
    await queue.enqueue(makeJob({ id: "j1" }));
    await queue.enqueue(makeJob({ id: "j2" }));
    const jobs = await queue.dequeue(10);
    expect(jobs.map((j) => j.id).sort()).toEqual(["j1", "j2"]);
    expect(await redis.zcard("queue:test:pending")).toBe(0);
    expect(await redis.zcard("queue:test:processing")).toBe(2);
  });

  it("respects the count limit", async () => {
    await queue.enqueue(makeJob({ id: "j1" }));
    await queue.enqueue(makeJob({ id: "j2" }));
    await queue.enqueue(makeJob({ id: "j3" }));
    expect(await queue.dequeue(2)).toHaveLength(2);
    expect(await redis.zcard("queue:test:pending")).toBe(1);
  });

  it("returns an empty array when nothing is due", async () => {
    expect(await queue.dequeue(5)).toEqual([]);
  });

  it("does not return jobs whose delay has not elapsed", async () => {
    await queue.enqueue(makeJob({ id: "delayed", delay: 60_000 }));
    expect(await queue.dequeue(5)).toEqual([]);
    expect(await redis.zcard("queue:test:pending")).toBe(1);
  });

  it("orders higher-priority jobs ahead of lower-priority ones", async () => {
    await queue.enqueue(makeJob({ id: "low", priority: "low" }));
    await queue.enqueue(makeJob({ id: "critical", priority: "critical" }));
    const jobs = await queue.dequeue(10);
    expect(jobs[0]?.id).toBe("critical");
    expect(jobs[1]?.id).toBe("low");
  });

  it("never delivers the same job to concurrent dequeues", async () => {
    await queue.enqueue(makeJob({ id: "j1" }));
    await queue.enqueue(makeJob({ id: "j2" }));
    const [a, b] = await Promise.all([
      queue.dequeue(10),
      queue.dequeue(10),
    ]);
    const ids = [...a, ...b].map((j) => j.id);
    expect(ids.sort()).toEqual(["j1", "j2"]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
