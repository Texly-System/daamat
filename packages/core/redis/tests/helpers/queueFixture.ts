import { type QueueJob } from "../../src/index";
import { type FakeRedis } from "./fakeRedis";

export type JobData = { task: string };

export function makeJob(
  overrides: Partial<QueueJob<JobData>> = {},
): QueueJob<JobData> {
  return {
    id: overrides.id ?? "job-1",
    queue: "test",
    data: overrides.data ?? { task: "do-thing" },
    status: overrides.status ?? "pending",
    priority: overrides.priority ?? "normal",
    attempts: overrides.attempts ?? 0,
    maxAttempts: overrides.maxAttempts ?? 3,
    createdAt: overrides.createdAt ?? new Date(),
    delay: overrides.delay,
    ...overrides,
  };
}

export async function ageClaim(
  redis: FakeRedis,
  id: string,
  visibilityTimeoutMs: number,
): Promise<void> {
  await redis.zadd(
    "queue:test:processing",
    Date.now() - visibilityTimeoutMs - 1,
    id,
  );
}
