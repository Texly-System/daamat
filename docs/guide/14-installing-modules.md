[Damat Guide](../GUIDE.md) › Installing modules

# 14. Installing an existing module

A module can come from a registry reference, local path, Git URL, npm package,
or tarball. Always inspect the plan before allowing an unfamiliar artifact to
write files.

```bash
damat module plan <registry-ref|path|git-url>
damat module add <registry-ref|path|git-url>
```

The plan shows source identity, trust status, capability destinations, package
changes, owned files, and integration notices. Installation is transactional
for managed files and records checksums and provenance in `damat.lock.json`.

Installation does not finish application integration. Continue with:

- [Planning, destinations, and host wiring](./14aa-module-install-flow.md)
- [Source/package modes, update, and removal](./14ab-module-package-lifecycle.md)

---

Prev: [← Module testing and publishing](./13c-module-testing-and-publishing.md) · [Guide home](../GUIDE.md) · Next: [Plan and integrate an install →](./14aa-module-install-flow.md)
