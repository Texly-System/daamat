import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue > failure lifecycle (retry then dead-letter)", () => {
  let redis: FakeRedis;
  let queue: RedisQueue<JobData>;

  beforeEach(() => {
    redis = createFakeRedis();
    queue = new RedisQueue<JobData>("test", redis);
  });

  it("retries a failed attempt and dead-letters after maxAttempts", async () => {
    const job = makeJob({ id: "j1", maxAttempts: 2 });
    await queue.enqueue(job);
    const [claimed] = await queue.dequeue(1);
    expect(claimed?.id).toBe("j1");
    expect(await redis.zcard("queue:test:pending")).toBe(0);
    expect(await redis.zcard("queue:test:processing")).toBe(1);

    await queue.updateStatus({
      ...job,
      status: "retrying",
      attempts: 1,
      error: "boom",
    });
    expect(await redis.zrange("queue:test:pending", 0, -1)).toEqual(["j1"]);
    expect(await redis.zcard("queue:test:processing")).toBe(0);
    expect(await redis.zcard("queue:test:failed")).toBe(0);
    const afterRetry = await queue.getJob("j1");
    expect(afterRetry?.status).toBe("retrying");
    expect(afterRetry?.attempts).toBe(1);
    expect(afterRetry?.error).toBe("boom");

    const [redelivered] = await queue.dequeue(1);
    expect(redelivered?.id).toBe("j1");
    expect(redelivered?.attempts).toBe(1);
    expect(await redis.zcard("queue:test:processing")).toBe(1);

    await queue.updateStatus({
      ...job,
      status: "failed",
      attempts: 2,
      error: "boom again",
    });
    expect(await redis.zrange("queue:test:failed", 0, -1)).toEqual(["j1"]);
    expect(await queue.getStats()).toEqual({
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 1,
    });
    const deadLettered = await queue.getJob("j1");
    expect(deadLettered?.status).toBe("failed");
    expect(deadLettered?.attempts).toBe(2);
    expect(deadLettered?.error).toBe("boom again");
    expect(await queue.dequeue(10)).toEqual([]);
  });
});
