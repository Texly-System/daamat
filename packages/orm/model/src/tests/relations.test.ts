import { describe, it, expect } from "bun:test";
import { model } from "@/schema";
import { columns } from "@/properties";
import { UserSchema, OrderItemSchema } from "./__fixtures__/models";

// ─────────────────────────────────────────────────────────────────────────────
// hasMany / hasOne relations — schema relations array
// ─────────────────────────────────────────────────────────────────────────────

describe("transform › hasMany / hasOne relations", () => {
  it("User has a hasMany relation to orders in schema", () => {
    const schema = UserSchema.toTableSchema();
    expect(schema.relations).toHaveLength(1);
    expect(schema.relations[0]!.name).toBe("orders");
    expect(schema.relations[0]!.type).toBe("hasMany");
    expect(schema.relations[0]!.targetTable).toBe("orders");
    expect(schema.relations[0]!.mappedBy).toBe("user");
  });

  it("belongsTo creates FK columns, not relation entries", () => {
    const schema = OrderItemSchema.toTableSchema();
    expect(schema.relations).toHaveLength(0);
    expect(schema.columns.find((c) => c.name === "order_id")).toBeDefined();
    expect(schema.columns.find((c) => c.name === "product_id")).toBeDefined();
  });

  it("hasMany without inverse skips mappedBy", () => {
    const Parent = model("parents", {
      id: columns.id().primaryKey(),
      children: columns.hasMany(() =>
        model("children", { id: columns.id().primaryKey() }),
      ),
    });
    const schema = Parent.toTableSchema();
    expect(schema.relations).toHaveLength(1);
    expect(schema.relations[0]!.mappedBy).toBeUndefined();
  });

  it("hasOne is captured in relations array", () => {
    const Profile = model("profiles", { id: columns.id().primaryKey() });
    const Account = model("accounts", {
      id: columns.id().primaryKey(),
      profile: columns.hasOne(Profile).inverse("account"),
    });
    const schema = Account.toTableSchema();
    expect(schema.relations).toHaveLength(1);
    expect(schema.relations[0]!.type).toBe("hasOne");
    expect(schema.relations[0]!.targetTable).toBe("profiles");
    expect(schema.relations[0]!.mappedBy).toBe("account");
  });
});
