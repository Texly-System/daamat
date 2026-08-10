import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue > updateStatus", () => {
  let redis: FakeRedis;
  let queue: RedisQueue<JobData>;

  beforeEach(() => {
    redis = createFakeRedis();
    queue = new RedisQueue<JobData>("test", redis);
  });

  it("moves a completed job out of processing into completed", async () => {
    const job = makeJob({ id: "j1" });
    await queue.enqueue(job);
    await queue.dequeue(1);
    await queue.updateStatus({ ...job, status: "completed" });
    const stats = await queue.getStats();
    expect(stats.completed).toBe(1);
    expect(stats.processing).toBe(0);
    expect((await queue.getJob("j1"))?.status).toBe("completed");
  });

  it("routes failed jobs to the failed set", async () => {
    const job = makeJob({ id: "j1" });
    await queue.enqueue(job);
    await queue.dequeue(1);
    await queue.updateStatus({ ...job, status: "failed" });
    expect((await queue.getStats()).failed).toBe(1);
  });

  it("routes retrying jobs back to the pending set", async () => {
    const job = makeJob({ id: "j1" });
    await queue.enqueue(job);
    await queue.dequeue(1);
    await queue.updateStatus({ ...job, status: "retrying" });
    const stats = await queue.getStats();
    expect(stats.pending).toBe(1);
    expect(stats.processing).toBe(0);
  });
});
