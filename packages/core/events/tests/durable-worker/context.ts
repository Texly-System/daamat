import {
  durability,
  ensureEventStorage,
  pool,
} from "../durable/storage-context";

export { durability, pool };

export async function resetWorkerStorage(): Promise<void> {
  await ensureEventStorage();
  await pool.query(
    `TRUNCATE "damat"."_damat_event_activity", "damat"."_damat_event_logs",
      "damat"."_damat_event_delivery_attempts", "damat"."_damat_event_deliveries",
      "damat"."_damat_event_outbox" CASCADE`,
  );
}

export const uniqueEvent = (prefix: string) =>
  `${prefix}.${crypto.randomUUID()}`;
