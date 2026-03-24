import { ColumnSchema, ColumnType } from "@/types";
import { pgTypeToTsBase } from "@/utils/pgTypeToTsBase";

/**
 * Base column builder providing fluent API for column definition
 */
export class ColumnBuilder {
  protected _name: string = "";
  protected _type: ColumnType;
  protected _primaryKey: boolean = false;
  protected _nullable: boolean = false;
  protected _unique: boolean = false;
  protected _default?: string;
  protected _length?: number;
  protected _scale?: number;
  protected _enumName?: string;
  protected _enumValues?: string[];
  protected _array: boolean = false;
  protected _fieldName?: string;
  protected _autoincrement: boolean = false;

  constructor(type: ColumnType) {
    this._type = type;
  }

  /** Mark column as primary key */
  primaryKey(): this {
    this._primaryKey = true;
    return this;
  }

  /** Mark column as nullable */
  nullable(): this {
    this._nullable = true;
    return this;
  }

  /** Mark column as unique */
  unique(): this {
    this._unique = true;
    return this;
  }

  /** Set default value */
  default(value: string | number | boolean): this {
    if (typeof value === "string") {
      this._default = `'${value}'`;
    } else {
      this._default = String(value);
    }
    return this;
  }

  /** Set default to raw SQL expression */
  defaultRaw(expression: string): this {
    this._default = expression;
    return this;
  }

  /** Set column as array type */
  array(): this {
    this._array = true;
    return this;
  }

  /** Set database field name if different from property name */
  fieldName(name: string): this {
    this._fieldName = name;
    return this;
  }

  /** Internal: set column name */
  _setName(name: string): this {
    this._name = name;
    return this;
  }

  /** Convert to ColumnSchema */
  toSchema(): ColumnSchema {
    const schema: ColumnSchema = {
      name: this._name,
      type: this._type,
      primaryKey: this._primaryKey,
      nullable: this._nullable,
      unique: this._unique,
      array: this._array,
      autoincrement: this._autoincrement,
    };

    // Only add optional properties if they have values
    if (this._default !== undefined) {
      schema.default = this._default;
    }
    if (this._length !== undefined) {
      schema.length = this._length;
    }
    if (this._scale !== undefined) {
      schema.scale = this._scale;
    }
    if (this._enumName !== undefined) {
      schema.enumName = this._enumName;
    }
    if (this._enumValues !== undefined) {
      schema.enumValues = this._enumValues;
    }
    if (this._fieldName !== undefined) {
      schema.fieldName = this._fieldName;
    }

    return schema;
  }

  /**
   * Returns the TypeScript type string for this column as it would be written
   * by hand — accounting for the PG→TS type mapping, array wrapping, and
   * nullability.
   *
   * Special cases handled:
   *   - Multirange types already produce Array<...> from pgTypeToTsBase; a
   *     second .array() call wraps the whole thing again correctly.
   *   - Structured types (ranges, geometric, interval) that contain spaces or
   *     braces are parenthesised before appending | null so the union is
   *     unambiguous.
   *   - Enum unions with multiple members are parenthesised before | null.
   *
   * Examples:
   *   integer                            → "number"
   *   integer         + nullable         → "number | null"
   *   text            + array            → "Array<string>"
   *   text            + array + nullable → "Array<string> | null"
   *   real            + array            → "Array<number>"  (embedding vector)
   *   enum(['a','b'])                    → "'a' | 'b'"
   *   enum(['a','b']) + nullable         → "('a' | 'b') | null"
   *   point                              → "{ x: number; y: number }"
   *   point           + nullable         → "{ x: number; y: number } | null"
   *   int4range                          → "{ lower: number | null; upper: number | null; ... }"
   *   int4range       + nullable         → "{ lower: number | null; ... } | null"
   *   interval                           → "{ years: number; months: number; ... }"
   */
  toTsType(): string {
    const base = pgTypeToTsBase(this._type, this._enumValues);

    // Determine whether the base string itself needs parentheses when combined
    // with | null. This is needed for:
    //   - enum unions:  'a' | 'b'  →  ('a' | 'b') | null
    //   - object types: { x: number; y: number }  →  no parens needed (braces
    //     already delimit the type), BUT we add them anyway for consistency when
    //     there is a top-level union inside (range types have "| null" inside).
    const baseNeedsParens = (b: string): boolean => {
      // Multi-member enum union — contains " | " at the top level outside braces
      if (this._type === "enum" && (this._enumValues?.length ?? 0) > 1)
        return true;
      // Any other top-level union in the base string (e.g. bigint | null inside ranges)
      // We detect this by checking for " | " outside of any <> or {} nesting.
      let depth = 0;
      for (let i = 0; i < b.length - 3; i++) {
        const ch = b[i];
        if (ch === "{" || ch === "<") depth++;
        else if (ch === "}" || ch === ">") depth--;
        else if (depth === 0 && b.slice(i, i + 3) === " | ") return true;
      }
      return false;
    };

    // Apply array wrapping when _array is true.
    // Structured base types (objects, unions) are safe inside Array<>.
    const withArray = this._array ? `Array<${base}>` : base;

    if (!this._nullable) {
      return withArray;
    }

    // For nullable: decide whether to parentheses.
    // After array-wrapping the result is always unambiguous (Array<X> | null
    // needs no parentheses). Only bare base types that contain top-level unions need it.
    if (!this._array && baseNeedsParens(base)) {
      return `(${base}) | null`;
    }

    return `${withArray} | null`;
  }
}
