import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue > enqueue / getJob", () => {
  let redis: FakeRedis;
  let queue: RedisQueue<JobData>;

  beforeEach(() => {
    redis = createFakeRedis();
    queue = new RedisQueue<JobData>("test", redis);
  });

  it("stores the job and makes it retrievable by id", async () => {
    await queue.enqueue(makeJob({ id: "j1" }));
    const fetched = await queue.getJob("j1");
    expect(fetched?.id).toBe("j1");
    expect(fetched?.data).toEqual({ task: "do-thing" });
  });

  it("returns null for an unknown job id", async () => {
    expect(await queue.getJob("missing")).toBeNull();
  });

  it("adds the job to the pending set", async () => {
    await queue.enqueue(makeJob({ id: "j1" }));
    expect(await redis.zcard("queue:test:pending")).toBe(1);
  });
});
