import { beforeEach, describe, expect, it } from "bun:test";
import { RedisQueue } from "../src/index";
import { createFakeRedis, type FakeRedis } from "./helpers/fakeRedis";
import { makeJob, type JobData } from "./helpers/queueFixture";

describe("RedisQueue", () => {
  let redis: FakeRedis;
  let queue: RedisQueue<JobData>;

  beforeEach(() => {
    redis = createFakeRedis();
    queue = new RedisQueue<JobData>("test", redis);
  });

  describe("cancelJob", () => {
    it("removes a pending job and returns true", async () => {
      await queue.enqueue(makeJob({ id: "j1" }));
      expect(await queue.cancelJob("j1")).toBe(true);
      expect(await redis.zcard("queue:test:pending")).toBe(0);
      expect(await queue.getJob("j1")).toBeNull();
    });

    it("returns false when the job is not pending", async () => {
      expect(await queue.cancelJob("missing")).toBe(false);
      await queue.enqueue(makeJob({ id: "j2" }));
      await queue.dequeue(1);
      expect(await queue.cancelJob("j2")).toBe(false);
    });
  });

  describe("getStats", () => {
    it("counts jobs across all sets", async () => {
      await queue.enqueue(makeJob({ id: "p1" }));
      await queue.enqueue(makeJob({ id: "p2" }));
      await queue.dequeue(1);
      expect(await queue.getStats()).toEqual({
        pending: 1,
        processing: 1,
        completed: 0,
        failed: 0,
      });
    });

    it("returns all zeros for an empty queue", async () => {
      expect(await queue.getStats()).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      });
    });
  });

  describe("clear", () => {
    it("removes all jobs and sets", async () => {
      const job = makeJob({ id: "j1" });
      await queue.enqueue(job);
      await queue.enqueue(makeJob({ id: "j2" }));
      await queue.dequeue(1);
      await queue.updateStatus({ ...job, status: "completed" });
      await queue.clear();
      expect(await queue.getStats()).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      });
      expect(await queue.getJob("j1")).toBeNull();
      expect(await queue.getJob("j2")).toBeNull();
    });
  });
});
