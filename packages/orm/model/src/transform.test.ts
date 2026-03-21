import { describe, it, expect } from "bun:test";
import { model } from "./schema/model";
import {
  validateRelations,
  assertValidRelations,
  RelationValidationError,
} from "./schema/validateRelations";
import {
  Category,
  User,
  Product,
  Order,
  OrderItem,
} from "./__fixtures__/models";

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot tests — each sample model's full TableSchema is captured.
// On the first run bun writes the .snap file automatically.
// On subsequent runs the output is diffed against the stored snapshot.
// ─────────────────────────────────────────────────────────────────────────────

describe("transform snapshots", () => {
  it("Category schema", () => {
    expect(Category.toTableSchema()).toMatchSnapshot();
  });

  it("User schema (with postgres schema name + indexes)", () => {
    expect(User.toTableSchema()).toMatchSnapshot();
  });

  it("Product schema (decimal, enum, array, nullable FK)", () => {
    expect(Product.toTableSchema()).toMatchSnapshot();
  });

  it("Order schema (belongsTo User)", () => {
    expect(Order.toTableSchema()).toMatchSnapshot();
  });

  it("OrderItem schema (two belongsTo + composite unique index)", () => {
    expect(OrderItem.toTableSchema()).toMatchSnapshot();
  });

  it("minimal model snapshot", () => {
    const T = model.define("simple", { id: model.id().primaryKey() });
    expect(T.toTableSchema()).toMatchSnapshot();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — targeted assertions against the sample models
// ─────────────────────────────────────────────────────────────────────────────

describe("transform", () => {
  // ── model.define ──────────────────────────────────────────────────────────

  describe("model.define", () => {
    it("sets table name", () => {
      expect(Category.toTableSchema().name).toBe("categories");
    });

    it("sets postgres schema name when provided", () => {
      expect(User.toTableSchema().schema).toBe("store");
    });

    it("omits schema when not provided", () => {
      expect(Category.toTableSchema().schema).toBeUndefined();
    });
  });

  // ── column types ──────────────────────────────────────────────────────────

  describe("column types", () => {
    it("id column emits text type with prefixed default", () => {
      const col = Category.toTableSchema().columns.find(
        (c) => c.name === "id",
      )!;
      expect(col.type).toBe("text");
      expect(col.default).toBe("generate_id('cat')");
      expect(col.primaryKey).toBe(true);
    });

    it("varchar column carries length", () => {
      const col = Category.toTableSchema().columns.find(
        (c) => c.name === "name",
      )!;
      expect(col.type).toBe("varchar");
      expect(col.length).toBe(128);
    });

    it("unique varchar column is marked unique", () => {
      const col = Category.toTableSchema().columns.find(
        (c) => c.name === "slug",
      )!;
      expect(col.unique).toBe(true);
    });

    it("nullable text column is marked nullable", () => {
      const col = Category.toTableSchema().columns.find(
        (c) => c.name === "description",
      )!;
      expect(col.nullable).toBe(true);
    });

    it("timestamptz column has correct type and default", () => {
      const col = Category.toTableSchema().columns.find(
        (c) => c.name === "createdAt",
      )!;
      expect(col.type).toBe("timestamptz");
      expect(col.default).toBe("now()");
    });

    it("boolean column with default false", () => {
      const col = User.toTableSchema().columns.find(
        (c) => c.name === "verified",
      )!;
      expect(col.type).toBe("boolean");
      expect(col.default).toBe("false");
    });

    it("jsonb column (binary: true)", () => {
      const col = User.toTableSchema().columns.find(
        (c) => c.name === "metadata",
      )!;
      expect(col.type).toBe("jsonb");
      expect(col.nullable).toBe(true);
    });

    it("decimal column carries precision and scale", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "price",
      )!;
      expect(col.type).toBe("decimal");
      expect(col.length).toBe(10);
      expect(col.scale).toBe(2);
    });

    it("number column with integer default value", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "stock",
      )!;
      expect(col.type).toBe("integer");
      expect(col.default).toBe("0");
    });

    it("enum column carries inline values", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "status",
      )!;
      expect(col.type).toBe("enum");
      expect(col.enumValues).toEqual(["draft", "active", "archived"]);
    });

    it("array text column is flagged as array and nullable", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "tags",
      )!;
      expect(col.array).toBe(true);
      expect(col.nullable).toBe(true);
    });

    it("json column (no options) uses json type", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "specs",
      )!;
      expect(col.type).toBe("json");
    });

    it("timestamp (no TZ option) uses timestamp type", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "createdAt",
      )!;
      expect(col.type).toBe("timestamp");
    });
  });

  // ── primary key ───────────────────────────────────────────────────────────

  describe("primary key", () => {
    it("single PK column is tracked", () => {
      expect(Order.toTableSchema().primaryKey.columns).toEqual(["id"]);
    });

    it("constraint name follows <table>_pkey convention", () => {
      expect(Order.toTableSchema().primaryKey.name).toBe("orders_pkey");
    });

    it("composite primary key lists all columns", () => {
      const Pivot = model.define("role_permissions", {
        roleId: model.text().primaryKey(),
        permId: model.text().primaryKey(),
      });
      const pk = Pivot.toTableSchema().primaryKey;
      expect(pk.columns).toContain("roleId");
      expect(pk.columns).toContain("permId");
      expect(pk.columns).toHaveLength(2);
    });
  });

  // ── indexes ───────────────────────────────────────────────────────────────

  describe("indexes", () => {
    it("User has two indexes", () => {
      expect(User.toTableSchema().indexes).toHaveLength(2);
    });

    it("named unique index is emitted correctly", () => {
      const idx = User.toTableSchema().indexes.find(
        (i) => i.name === "uniq_users_email",
      )!;
      expect(idx.unique).toBe(true);
      expect(idx.columns[0]!.name).toBe("email");
    });

    it("auto-named non-unique index", () => {
      const idx = User.toTableSchema().indexes.find(
        (i) => i.name === "idx_users_created_at",
      )!;
      expect(idx.unique).toBe(false);
    });

    it("Product sku unique index is auto-named with uniq_ prefix", () => {
      const idx = Product.toTableSchema().indexes.find((i) =>
        i.name.includes("sku"),
      )!;
      expect(idx.unique).toBe(true);
      expect(idx.name).toMatch(/^uniq_/);
    });

    it("multi-column index lists columns in order with type", () => {
      const idx = Product.toTableSchema().indexes.find((i) =>
        i.columns.some((c) => c.name === "status"),
      )!;
      expect(idx.columns.map((c) => c.name)).toEqual(["status", "createdAt"]);
      expect(idx.type).toBe("btree");
    });

    it("OrderItem has a named composite unique index", () => {
      const idx = OrderItem.toTableSchema().indexes.find(
        (i) => i.name === "uniq_order_items_order_product",
      )!;
      expect(idx.unique).toBe(true);
      expect(idx.columns.map((c) => c.name)).toEqual([
        "order_id",
        "product_id",
      ]);
    });

    it("no indexes when none are defined", () => {
      expect(Category.toTableSchema().indexes).toHaveLength(0);
    });
  });

  // ── belongsTo / foreign keys ──────────────────────────────────────────────

  describe("belongsTo / foreign keys", () => {
    it("Order has a user_id FK column", () => {
      const cols = Order.toTableSchema().columns.map((c) => c.name);
      expect(cols).toContain("user_id");
    });

    it("Order FK column is text type", () => {
      const col = Order.toTableSchema().columns.find(
        (c) => c.name === "user_id",
      )!;
      expect(col.type).toBe("text");
    });

    it("Order FK constraint references users table", () => {
      const fk = Order.toTableSchema().foreignKeys.find(
        (f) => f.name === "fk_orders_user_id",
      )!;
      expect(fk.referencedTable).toBe("users");
      expect(fk.referencedColumns).toEqual(["id"]);
    });

    it("FK default onDelete is SET NULL", () => {
      const fk = Order.toTableSchema().foreignKeys[0]!;
      expect(fk.onDelete).toBe("SET NULL");
    });

    it("Product has nullable FK column (category_id)", () => {
      const col = Product.toTableSchema().columns.find(
        (c) => c.name === "category_id",
      )!;
      expect(col.nullable).toBe(true);
    });

    it("Product FK constraint references categories table", () => {
      const fk = Product.toTableSchema().foreignKeys.find((f) =>
        f.columns.includes("category_id"),
      )!;
      expect(fk.referencedTable).toBe("categories");
    });

    it("OrderItem has two FK columns (order_id and product_id)", () => {
      const colNames = OrderItem.toTableSchema().columns.map((c) => c.name);
      expect(colNames).toContain("order_id");
      expect(colNames).toContain("product_id");
    });

    it("OrderItem has two FK constraints", () => {
      expect(OrderItem.toTableSchema().foreignKeys).toHaveLength(2);
    });

    it("hasMany does not create a column on the owner side", () => {
      const colNames = User.toTableSchema().columns.map((c) => c.name);
      expect(colNames).not.toContain("orders");
      expect(colNames).not.toContain("orders_id");
    });
  });

  // ── hasMany / hasOne relations ────────────────────────────────────────────

  describe("hasMany / hasOne relations", () => {
    it("User has a hasMany relation to orders in schema", () => {
      const schema = User.toTableSchema();
      expect(schema.relations).toHaveLength(1);
      expect(schema.relations[0]!.name).toBe("orders");
      expect(schema.relations[0]!.type).toBe("hasMany");
      expect(schema.relations[0]!.targetTable).toBe("orders");
      expect(schema.relations[0]!.mappedBy).toBe("user");
    });

    it("belongsTo does not create relation entries (it creates FK columns)", () => {
      const schema = Order.toTableSchema();
      // Order has belongsTo User, but that creates an FK column, not a relation entry
      expect(schema.relations).toHaveLength(0);
      // But it does have the FK column
      const fkColumn = schema.columns.find((c) => c.name === "user_id");
      expect(fkColumn).toBeDefined();
    });

    it("hasMany mappedBy is optional", () => {
      const Parent = model.define("parents", {
        id: model.id().primaryKey(),
        // hasMany without mappedBy
        children: model.hasMany(() => ({ _tableName: "children" })),
      });

      const schema = Parent.toTableSchema();
      expect(schema.relations).toHaveLength(1);
      expect(schema.relations[0]!.name).toBe("children");
      expect(schema.relations[0]!.mappedBy).toBeUndefined();
    });

    it("hasOne is captured in relations array", () => {
      const Profile = model.define("profiles", {
        id: model.id().primaryKey(),
      });

      const Account = model.define("accounts", {
        id: model.id().primaryKey(),
        profile: model.hasOne(Profile, { mappedBy: "account" }),
      });

      const schema = Account.toTableSchema();
      expect(schema.relations).toHaveLength(1);
      expect(schema.relations[0]!.type).toBe("hasOne");
      expect(schema.relations[0]!.targetTable).toBe("profiles");
      expect(schema.relations[0]!.mappedBy).toBe("account");
    });
  });

  // ── belongsTo FK naming ───────────────────────────────────────────────────

  describe("belongsTo FK naming", () => {
    it("FK column name defaults to property name + _id", () => {
      const Author = model.define("authors", {
        id: model.id().primaryKey(),
      });

      const Book = model.define("books", {
        id: model.id().primaryKey(),
        // Property name is "author", so FK should be "author_id"
        author: model.belongsTo(Author),
      });

      const schema = Book.toTableSchema();
      const fkColumn = schema.columns.find((c) => c.name === "author_id");
      expect(fkColumn).toBeDefined();
      expect(fkColumn!.type).toBe("text");
    });

    it("FK column name can be overridden via foreignKey option", () => {
      const Publisher = model.define("publishers", {
        id: model.id().primaryKey(),
      });

      const Magazine = model.define("magazines", {
        id: model.id().primaryKey(),
        // Property name is "publisher", but we override FK to "pub_ref"
        publisher: model.belongsTo(Publisher, { foreignKey: "pub_ref" }),
      });

      const schema = Magazine.toTableSchema();
      const fkColumn = schema.columns.find((c) => c.name === "pub_ref");
      expect(fkColumn).toBeDefined();
      // Default name should NOT exist
      const defaultFk = schema.columns.find((c) => c.name === "publisher_id");
      expect(defaultFk).toBeUndefined();
    });

    it("Order FK column is user_id (property name based)", () => {
      // Verify the existing fixture uses property-based naming
      const orderSchema = Order.toTableSchema();
      const fkColumn = orderSchema.columns.find((c) => c.name === "user_id");
      expect(fkColumn).toBeDefined();
    });
  });

  // ── relation validation ───────────────────────────────────────────────────

  describe("relation validation", () => {
    it("validates correct bidirectional relations (no errors)", () => {
      // Define Child first, then Parent references it
      const Child = model.define("children", {
        id: model.id().primaryKey(),
      });

      const Parent = model.define("parents", {
        id: model.id().primaryKey(),
        children: model.hasMany(Child, { mappedBy: "parent" }),
      });

      // Add belongsTo to Child after Parent is defined
      const ChildWithRelation = model.define("children_v2", {
        id: model.id().primaryKey(),
        parent: model.belongsTo(Parent),
      });

      // Use Parent with hasMany pointing to ChildWithRelation
      const ParentFinal = model.define("parents_final", {
        id: model.id().primaryKey(),
        children: model.hasMany(ChildWithRelation, { mappedBy: "parent" }),
      });

      const result = validateRelations([ParentFinal, ChildWithRelation]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects missing belongsTo for hasMany", () => {
      const Book = model.define("books_test", {
        id: model.id().primaryKey(),
        title: model.text(),
        // Missing: author: model.belongsTo(Author)
      });

      const Author = model.define("authors_test", {
        id: model.id().primaryKey(),
        books: model.hasMany(Book, { mappedBy: "author" }),
      });

      const result = validateRelations([Author, Book]);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.errorType).toBe("missing_belongsTo");
      expect(result.errors[0]!.message).toContain(
        'does not have a property named "author"',
      );
    });

    it("detects missing belongsTo for hasOne", () => {
      const Passport = model.define("passports_test", {
        id: model.id().primaryKey(),
        number: model.text(),
        // Missing: owner: model.belongsTo(Person)
      });

      const Person = model.define("persons_test", {
        id: model.id().primaryKey(),
        passport: model.hasOne(Passport, { mappedBy: "owner" }),
      });

      const result = validateRelations([Person, Passport]);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.errorType).toBe("missing_belongsTo");
    });

    it("detects mappedBy pointing to non-belongsTo property", () => {
      const Member = model.define("members_test", {
        id: model.id().primaryKey(),
        // "group" exists but is not a belongsTo - it's a text column
        group: model.text(),
      });

      const Group = model.define("groups_test", {
        id: model.id().primaryKey(),
        members: model.hasMany(Member, { mappedBy: "group" }),
      });

      const result = validateRelations([Group, Member]);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.errorType).toBe("mappedBy_mismatch");
      expect(result.errors[0]!.message).toContain(
        "is not a belongsTo relation",
      );
    });

    it("detects missing hasMany for belongsTo with mappedBy", () => {
      const Department = model.define("departments_test", {
        id: model.id().primaryKey(),
        name: model.text(),
        // Missing: employees: model.hasMany(Employee, { mappedBy: "department" })
      });

      const Employee = model.define("employees_test", {
        id: model.id().primaryKey(),
        department: model.belongsTo(Department, { mappedBy: "employees" }),
      });

      const result = validateRelations([Department, Employee]);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.errorType).toBe("missing_hasMany");
      expect(result.errors[0]!.message).toContain(
        'does not have a property named "employees"',
      );
    });

    it("skips validation for models not in the provided list", () => {
      // Only provide Author, not Book - validation should pass (nothing to check)
      const Author = model.define("authors_skip", {
        id: model.id().primaryKey(),
        books: model.hasMany(() => ({ _tableName: "books_skip" }), {
          mappedBy: "author",
        }),
      });

      const result = validateRelations([Author]);
      expect(result.valid).toBe(true);
    });

    it("hasMany without mappedBy skips inverse validation", () => {
      const Folder = model.define("folders_test", {
        id: model.id().primaryKey(),
        // hasMany without mappedBy - no inverse validation needed
        files: model.hasMany(() => ({ _tableName: "files_test" })),
      });

      const result = validateRelations([Folder]);
      expect(result.valid).toBe(true);
    });

    it("assertValidRelations throws on first error", () => {
      const B = model.define("table_b_test", {
        id: model.id().primaryKey(),
        // Missing belongsTo
      });

      const A = model.define("table_a_test", {
        id: model.id().primaryKey(),
        bs: model.hasMany(B, { mappedBy: "a" }),
      });

      expect(() => assertValidRelations([A, B])).toThrow(
        RelationValidationError,
      );
    });

    it("assertValidRelations passes for valid relations", () => {
      const Y = model.define("table_y_test", {
        id: model.id().primaryKey(),
      });

      const X = model.define("table_x_test", {
        id: model.id().primaryKey(),
        ys: model.hasMany(Y, { mappedBy: "x" }),
      });

      // Create Y with belongsTo
      const YWithRelation = model.define("table_y_final", {
        id: model.id().primaryKey(),
        x: model.belongsTo(X),
      });

      const XFinal = model.define("table_x_final", {
        id: model.id().primaryKey(),
        ys: model.hasMany(YWithRelation, { mappedBy: "x" }),
      });

      expect(() => assertValidRelations([XFinal, YWithRelation])).not.toThrow();
    });
  });
});
