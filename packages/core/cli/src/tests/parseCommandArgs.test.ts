import { describe, test, expect } from "bun:test";
import { parseCommandArgs } from "../run/buildCommand";
import type { CommandOption } from "../types";

const defs: CommandOption[] = [
  {
    name: "typecheck",
    description: "Type-check",
    type: "boolean",
    default: true,
  },
  { name: "minify", description: "Minify", type: "boolean", default: false },
  { name: "output", alias: "o", description: "Output", type: "string" },
  { name: "port", description: "Port", type: "number" },
  {
    name: "target",
    alias: "t",
    description: "Capability target",
    type: "string",
    repeatable: true,
  },
];

describe("parseCommandArgs", () => {
  test("applies boolean and string/number option defaults", () => {
    const { options } = parseCommandArgs([], defs);
    expect(options.typecheck).toBe(true);
    expect(options.minify).toBe(false);
  });

  test("--no-<name> negates a boolean option (down to false)", () => {
    const { options } = parseCommandArgs(["--no-typecheck"], defs);
    expect(options.typecheck).toBe(false);
  });

  test("a bare boolean flag sets it true", () => {
    const { options } = parseCommandArgs(["--minify"], defs);
    expect(options.minify).toBe(true);
  });

  test("parses --name value, --name=value, alias, number, and positionals", () => {
    const { options, positional } = parseCommandArgs(
      ["build", "--output", "out", "--port=8080", "extra"],
      defs,
    );
    expect(options.output).toBe("out");
    expect(options.port).toBe(8080);
    expect(positional).toEqual(["build", "extra"]);
  });

  test("reports unknown options while leaving defaults unchanged", () => {
    const { options, unknown } = parseCommandArgs(["--no-unknown"], defs);
    expect(options.typecheck).toBe(true);
    expect("unknown" in options).toBe(false);
    expect(unknown).toEqual(["--no-unknown"]);
  });

  test("treats every token after -- as positional", () => {
    const { positional, unknown } = parseCommandArgs(
      ["target", "--", "--literal", "-x"],
      defs,
    );
    expect(positional).toEqual(["target", "--literal", "-x"]);
    expect(unknown).toEqual([]);
  });

  test("accumulates repeated repeatable values in argument order", () => {
    const { options } = parseCommandArgs(
      [
        "--target",
        "routes=src/http",
        "--target=jobs=src/workers",
        "-t",
        "events=src/events",
      ],
      defs,
    );
    expect(options.target).toEqual([
      "routes=src/http",
      "jobs=src/workers",
      "events=src/events",
    ]);
  });

  test("keeps one repeatable occurrence scalar and non-repeatable last", () => {
    const one = parseCommandArgs(["--target=routes=src/http"], defs);
    expect(one.options.target).toBe("routes=src/http");
    const repeated = parseCommandArgs(
      ["--output", "first", "--output=second"],
      defs,
    );
    expect(repeated.options.output).toBe("second");
  });
});
