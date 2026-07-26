import { beforeAll, expect, test } from "bun:test";
import { publishDurableEvent } from "../../src";
import { ensureEventStorage, uniqueEvent } from "./storage-context";

beforeAll(ensureEventStorage);

test("idempotent publish rejects different intent", async () => {
  const name = uniqueEvent("intent-conflict");
  const options = { idempotencyKey: crypto.randomUUID() };
  await publishDurableEvent(name, { amount: 1 }, options);
  await expect(
    publishDurableEvent(name, { amount: 2 }, options),
  ).rejects.toThrow(/existing intent/i);
});
