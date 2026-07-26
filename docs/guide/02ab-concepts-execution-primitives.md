[Damat Guide](../GUIDE.md) › Concepts

# 2.2 Execution primitives

Choose the smallest primitive that matches the work. This keeps request code
simple and makes durable work visible to operators.

| Primitive | Use it for | State boundary |
| --------- | ---------- | -------------- |
| Route | Validate HTTP input, call application logic, shape a response | one request |
| Workflow | A short, in-process saga with compensating steps | memory only |
| Local event | In-process notification with zero or more listeners | memory only |
| Job | One deferred, retryable unit of work | PostgreSQL job run |
| Durable event | A fact delivered independently to named consumers | PostgreSQL event and deliveries |
| Pipeline | A restart-safe process with waits, branches, or several durable stages | PostgreSQL graph state |

Durable workers use **at-least-once** delivery. A retry can execute handler code
again, so database effects and external provider calls need stable idempotency
keys.

### Flow sketch

```text
HTTP request
  -> route
  -> local workflow (optional)
  -> module service + transaction
  -> PostgreSQL
```

If the request commits domain data and starts durable work, pass the active
transaction executor to the durable API. The domain row and durable record then
commit or roll back together.

Next, learn where PostgreSQL, Redis, and process roles fit around these
primitives.

---

Prev: [← Module boundaries](./02aa-concepts-module-boundaries.md) · [Guide home](../GUIDE.md) · Next: [Composition and durability runtime](./02b-composition-and-durability-runtime.md)
