import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue > terminal-set retention", () => {
  let redis: FakeRedis;

  beforeEach(() => {
    redis = createFakeRedis();
  });

  it("trims the completed set to maxCompletedEntries, dropping the oldest", async () => {
    const capped = new RedisQueue<JobData>("test", redis, {
      maxCompletedEntries: 3,
    });
    for (const [score, id] of [[1, "c1"], [2, "c2"], [3, "c3"], [4, "c4"]] as const) {
      await redis.zadd("queue:test:completed", score, id);
    }
    await capped.updateStatus({
      ...makeJob({ id: "c5" }),
      status: "completed",
    });
    expect(await redis.zcard("queue:test:completed")).toBe(3);
    expect(await redis.zrange("queue:test:completed", 0, -1)).toEqual([
      "c3",
      "c4",
      "c5",
    ]);
  });

  it("trims the failed set to maxFailedEntries", async () => {
    const capped = new RedisQueue<JobData>("test", redis, {
      maxFailedEntries: 2,
    });
    for (const [score, id] of [[1, "f1"], [2, "f2"], [3, "f3"]] as const) {
      await redis.zadd("queue:test:failed", score, id);
    }
    await capped.updateStatus({ ...makeJob({ id: "f4" }), status: "failed" });
    expect(await redis.zcard("queue:test:failed")).toBe(2);
    expect(await redis.zrange("queue:test:failed", 0, -1)).toEqual([
      "f3",
      "f4",
    ]);
  });

  it("does not trim under the generous default cap", async () => {
    const queue = new RedisQueue<JobData>("test", redis);
    for (let i = 0; i < 5; i++) {
      await queue.updateStatus({
        ...makeJob({ id: `d${i}` }),
        status: "completed",
      });
    }
    expect(await redis.zcard("queue:test:completed")).toBe(5);
  });

  it("leaves the set unbounded when the cap is set to 0", async () => {
    const uncapped = new RedisQueue<JobData>("test", redis, {
      maxCompletedEntries: 0,
    });
    await redis.zadd("queue:test:completed", 1, "c1");
    await redis.zadd("queue:test:completed", 2, "c2");
    await uncapped.updateStatus({
      ...makeJob({ id: "c3" }),
      status: "completed",
    });
    expect(await redis.zcard("queue:test:completed")).toBe(3);
  });
});
