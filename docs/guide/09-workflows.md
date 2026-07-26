[Damat Guide](../GUIDE.md) › Workflows

# 9. Workflows (the saga engine)

A workflow is an in-process saga. It runs typed steps, retries failed attempts,
and compensates completed steps in reverse order when a handled failure occurs.

Use a workflow when:

- steps are short-lived
- completed steps have meaningful compensation behavior;
- the process does not need to survive a host crash or wait for external input.

Use a durable pipeline when the flow must:

- survive host restarts across long waits,
- branch or loop across explicit graph state,
- combine external callbacks with durable control.

Workflow state lives in memory. If the process is killed, the workflow cannot
resume and already completed steps are not automatically compensated. Use
idempotent steps and reconciliation, or invoke the workflow as one node in a
durable pipeline.

Continue:

- [Implement workflow steps and execution →](./09a-workflow-implementation.md)
- [Reliability and errors →](./09b-workflows-reliability.md)

---

Prev: [← Integration providers](./08d-provider-implementation.md) · [Guide home](../GUIDE.md) · Next: [Workflow implementation →](./09a-workflow-implementation.md)
