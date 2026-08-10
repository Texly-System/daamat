import { describe, expect, test } from "bun:test";
import { installerOptions } from "../../installer";

const context = (options: Record<string, unknown>) => ({
  command: "kit add",
  args: [],
  options,
  cwd: "/work",
  logger: {
    debug() {},
    info() {},
    success() {},
    skip() {},
    warn() {},
    error() {},
  },
});

describe("installerOptions", () => {
  test("keeps one target occurrence as a scalar before mapping", () => {
    expect(installerOptions(context({ target: "routes=src/http" }))).toEqual({
      targets: { routes: "src/http" },
    });
  });

  test("parses independent mode, backend, and target overrides", () => {
    expect(
      installerOptions(
        context({
          mode: "package",
          "package-backend": "damat",
          target: ["routes=src/http", "jobs=src/workers"],
        }),
      ),
    ).toEqual({
      mode: "package",
      packageBackend: "damat",
      targets: { routes: "src/http", jobs: "src/workers" },
    });
  });

  test("uses the last path for duplicate capabilities deterministically", () => {
    expect(
      installerOptions(
        context({ target: ["routes=src/old", "routes=src/new"] }),
      ).targets,
    ).toEqual({ routes: "src/new" });
  });

  test("rejects malformed target values", () => {
    expect(() => installerOptions(context({ target: "routes" }))).toThrow(
      "capability=path",
    );
  });
});
