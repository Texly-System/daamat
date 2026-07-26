[Damat Guide](../GUIDE.md) › Configuration & environment

# 4. Configuration & environment

`damat.config.ts` is the application's composition contract. It selects modules,
provider roles, links, durable services, HTTP settings, and process roles.

Keep secrets in environment variables. Module code should receive validated
credentials through its config loader rather than reading `process.env`
throughout services and workflows.

Start with section detail here, then use the environment and startup pages:

- [Configuration sections](./04aa-configuration-sections.md)
- [Environment loading](./04a-configuration-environment.md)
- [Choosing runtime roles](./04ab-configuration-runtime-modes.md)
- [Startup behavior](./04b-runtime-startup.md)

---

Prev: [← Getting started](./03-getting-started.md) · [Guide home](../GUIDE.md) · Next: [Configuration sections →](./04aa-configuration-sections.md)
