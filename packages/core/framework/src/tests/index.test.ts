import { describe, it, expect } from "bun:test";
import { initFramework } from "../index.js";

describe("Framework Core", () => {
    it("should initialize correctly", () => {
        expect(initFramework()).toBe(true);
    });
});
