[Damat Guide](../GUIDE.md) › Concepts

# 2. Concepts and architecture

This chapter gives you the three decisions that make the rest of Damat easier:

- What belongs inside a reusable module?
- What must the host application decide?
- Which execution primitive fits each kind of work?

A **module** owns one portable domain capability. The **application** assembles
modules and chooses runtime policy. Jobs, durable events, and pipelines make
asynchronous work explicit instead of hiding it in request handlers.

Read these short pages in order:

- [Module boundaries and portability →](./02aa-concepts-module-boundaries.md)
- [Execution primitives →](./02ab-concepts-execution-primitives.md)

---

Prev: [← Introduction](./01-introduction.md) · [Guide home](../GUIDE.md) · Next: [Module boundaries and portability →](./02aa-concepts-module-boundaries.md)
