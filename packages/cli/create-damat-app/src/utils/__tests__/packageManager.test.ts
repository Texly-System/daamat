import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import PackageManager from "../package/manager";
import ProcessManager from "../commands/manager";

// Create mock functions
const mockExecute = mock(() => Promise.resolve({ stdout: "", stderr: "" }));
const mockExistsSync = mock(() => false);
const mockRmSync = mock(() => { });
const mockLogMessage = mock(() => { });

// Mock the modules
mock.module("../execute", () => ({
  default: mockExecute,
}));

mock.module("fs", () => ({
  existsSync: mockExistsSync,
  rmSync: mockRmSync,
}));

mock.module("../logMessage", () => ({
  default: mockLogMessage,
}));

describe("PackageManager", () => {
  let processManager: ProcessManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    processManager = new ProcessManager();
    originalEnv = { ...process.env };
    mockExecute.mockClear();
    mockExistsSync.mockClear();
    mockRmSync.mockClear();
    mockLogMessage.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const pm = new PackageManager(processManager);
      expect(pm.getPackageManager()).toBeUndefined();
    });

    it("should set npm as chosen package manager when useNpm is true", () => {
      const pm = new PackageManager(processManager, { useNpm: true });
      expect((pm as any)["chosenPackageManager"]).toBe("npm");
    });

    it("should set bun as chosen package manager when useYarn is true", () => {
      const pm = new PackageManager(processManager, { useYarn: true });
      expect((pm as any)["chosenPackageManager"]).toBe("bun");
    });

    it("should set pnpm as chosen package manager when usePnpm is true", () => {
      const pm = new PackageManager(processManager, { usePnpm: true });
      expect((pm as any)["chosenPackageManager"]).toBe("pnpm");
    });

    it("should respect verbose option", () => {
      const pm = new PackageManager(processManager, { verbose: true });
      expect((pm as any)["verbose"]).toBe(true);
    });

    it("should prioritize npm over other options", () => {
      const pm = new PackageManager(processManager, {
        useNpm: true,
        useYarn: true,
        usePnpm: true,
      });
      expect((pm as any)["chosenPackageManager"]).toBe("npm");
    });
  });

  describe("detectFromUserAgent", () => {
    it("should detect pnpm from user agent with version", () => {
      process.env.npm_config_user_agent = "pnpm/8.0.0";
      const pm = new PackageManager(processManager);
      const result = (pm as any)["detectFromUserAgent"]();
      expect(result.manager).toBe("pnpm");
      expect(result.version).toBe("8.0.0");
    });

    it("should detect pnpm from pnpx with version", () => {
      process.env.npm_config_user_agent = "pnpx/8.0.0";
      const pm = new PackageManager(processManager);
      const result = (pm as any)["detectFromUserAgent"]();
      expect(result.manager).toBe("pnpm");
      expect(result.version).toBe("8.0.0");
    });

    it("should detect bun from user agent with version", () => {
      process.env.npm_config_user_agent = "bun/1.22.0";
      const pm = new PackageManager(processManager);
      const result = (pm as any)["detectFromUserAgent"]();
      expect(result.manager).toBe("bun");
      expect(result.version).toBe("1.22.0");
    });

    it("should default to npm for unknown user agent", () => {
      process.env.npm_config_user_agent = "some-unknown-manager/1.0.0";
      const pm = new PackageManager(processManager);
      const result = (pm as any)["detectFromUserAgent"]();
      expect(result.manager).toBe("npm");
      expect(result.version).toBeUndefined();
    });

    it("should default to npm when user agent is undefined", () => {
      delete process.env.npm_config_user_agent;
      const pm = new PackageManager(processManager);
      const result = (pm as any)["detectFromUserAgent"]();
      expect(result.manager).toBe("npm");
      expect(result.version).toBeUndefined();
    });
  });

  describe("getCommandStr", () => {
    it("should throw error if package manager is not set", () => {
      const pm = new PackageManager(processManager);

      expect(() => pm.getCommandStr("dev")).toThrow("Package manager not set");
    });

    it("should return bun command format", () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "bun";

      expect(pm.getCommandStr("dev")).toBe("bun dev");
    });

    it("should return pnpm command format", () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "pnpm";

      expect(pm.getCommandStr("build")).toBe("pnpm build");
    });

    it("should return npm command format with 'run'", () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "npm";

      expect(pm.getCommandStr("test")).toBe("npm run test");
    });
  });

  describe("getPackageManager", () => {
    it("should return undefined when not set", () => {
      const pm = new PackageManager(processManager);
      expect(pm.getPackageManager()).toBeUndefined();
    });

    it("should return the current package manager", () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "bun";
      expect(pm.getPackageManager()).toBe("bun");
    });
  });

  describe("getPackageManagerString", () => {
    it("should return undefined when version is not set", async () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "bun";
      expect(await pm.getPackageManagerString()).toBeUndefined();
    });

    it("should return packageManager@version format", async () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "bun";
      (pm as any)["packageManagerVersion"] = "4.9.0";
      expect(await pm.getPackageManagerString()).toBe("bun@4.9.0");
    });

    it("should work with pnpm", async () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "pnpm";
      (pm as any)["packageManagerVersion"] = "8.15.0";
      expect(await pm.getPackageManagerString()).toBe("pnpm@8.15.0");
    });

    it("should work with npm", async () => {
      const pm = new PackageManager(processManager);
      (pm as any)["packageManager"] = "npm";
      (pm as any)["packageManagerVersion"] = "10.0.0";
      expect(await pm.getPackageManagerString()).toBe("npm@10.0.0");
    });
  });
});
