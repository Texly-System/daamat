import { expect, test } from "bun:test";
import { deriveNames } from "../../scaffold/naming";
import { routeCollectionApi, routeIdApi } from "../../scaffold/templates/route";

const names = deriveNames("inventory", {
  name: "items",
  columns: [{ name: "id", type: "text", nullable: false, primaryKey: true }],
});

test("route docs include the framework API prefix", () => {
  const collection = routeCollectionApi(names, "@workflows", "@types");
  const item = routeIdApi(names, "@workflows", "@types");
  expect(collection).toContain("GET /api/items");
  expect(collection).toContain("POST /api/items");
  expect(item).toContain("GET /api/items/:id");
  expect(item).toContain("PATCH /api/items/:id");
  expect(item).toContain("DELETE /api/items/:id");
});

test("single custom primary keys keep the URL id but update the real key", () => {
  const custom = deriveNames("catalog", {
    name: "sections",
    columns: [
      { name: "section_id", type: "text", nullable: false, primaryKey: true },
    ],
  });
  const route = routeIdApi(custom, "@workflows", "@types");
  expect(route).toContain("PATCH /api/sections/:id");
  expect(route).toContain("execute({ section_id: id, data })");
});
