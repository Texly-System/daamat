[Damat Guide](../GUIDE.md) › Durable pipelines

# 10.7 Durable pipelines

A pipeline is a persisted orchestration graph. Use one when the outer business
process must survive restarts, wait for external input, branch, expose each
stage to operators, or compose several jobs, events, workflows, and child
pipelines.

## Pipeline or workflow?

| Use a workflow when... | Use a pipeline when... |
| ---------------------- | ---------------------- |
| the saga completes in one live process | the process must resume after a crash or deploy |
| completed steps can compensate in reverse | the process waits for minutes, days, or external approval |
| you need local retries and timeouts | you need persisted branches, joins, signals, or child runs |

A pipeline can invoke a workflow as one node. The workflow handles a rich local
saga; the pipeline records the durable boundary before and after that node.

## Available graph behavior

Pipelines can:

- run registered `job`, `workflow`, or direct `action` capabilities;
- publish or wait for durable events;
- wait for an external signal or a delay;
- evaluate closed conditions and follow explicit branches;
- fork work and join with `all` or `any` behavior;
- start bounded `child`, `loop`, and `foreach` pipelines.

Graphs do not evaluate user-authored JavaScript. Inputs, outputs, and conditions
use a closed JSON reference/expression language. Ordinary cycles are rejected;
repetition must use bounded loop or child nodes.

## Design before coding

For each stage, decide:

1. What input does it need and which previous output supplies it?
2. Can its handler execute more than once safely?
3. Does a human or external system need to unblock it?
4. Which failures retry automatically, and which need an operator?
5. What final output should the pipeline expose?

---

Prev: [← Inspect and recover durable work](./10bb-events-jobs-observability.md) · [Guide home](../GUIDE.md) · Next: [Define a pipeline →](./10d-pipeline-definition.md)
