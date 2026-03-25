import {
  ConstraintType,
  IndexType,
  ExcludeConstraint,
  ConstraintSchema,
} from "@/types/constrain";

/**
 * Constraint builder for fluent API
 */
export class ConstraintBuilder {
  private _name: string;
  private _type: ConstraintType;
  private _columns: string[] = [];
  private _condition?: string;
  private _expressions: {
    column: string;
    operator: string;
    expression?: string;
  }[] = [];
  private _indexType: IndexType = "gist";
  private _where?: string;
  private _deferrable?: boolean;
  private _initiallyDeferred?: boolean;

  constructor(name: string, type: ConstraintType) {
    this._name = name;
    this._type = type;
  }

  /**
   * Set columns for unique or primary key constraint
   */
  columns(columns: string[]): this {
    this._columns = columns;
    return this;
  }

  /**
   * Set condition for check constraint
   */
  condition(condition: string): this {
    this._condition = condition;
    return this;
  }

  /**
   * Set expressions for exclude constraint
   */
  expressions(
    expressions: {
      column: string;
      operator: string;
      expression?: string;
    }[],
  ): this {
    this._expressions = expressions;
    return this;
  }

  /**
   * Set index type for exclude constraint
   */
  indexType(indexType: IndexType): this {
    this._indexType = indexType;
    return this;
  }

  /**
   * Set partial constraint condition
   */
  where(condition: string): this {
    this._where = condition;
    return this;
  }

  /**
   * Make constraint deferrable
   */
  deferrable(initiallyDeferred: boolean = false): this {
    this._deferrable = true;
    this._initiallyDeferred = initiallyDeferred;
    return this;
  }

  /**
   * Convert to constraint schema
   */
  toSchema(): ConstraintSchema {
    // Create schema with required fields
    let schema: ConstraintSchema;

    // Type-specific properties
    if (this._type === "unique") {
      schema = {
        name: this._name,
        type: this._type,
        columns: this._columns,
      };
    } else if (this._type === "primary_key") {
      schema = {
        name: `${this._name}_pkey`,
        type: this._type,
        columns: this._columns,
      };
    } else if (this._type === "check") {
      schema = {
        name: this._name,
        type: this._type,
        condition: this._condition!,
      };
    } else if (this._type === "exclude") {
      schema = {
        name: this._name,
        type: this._type,
        expressions: this._expressions,
      };
      if (this._indexType !== undefined) {
        (schema as ExcludeConstraint).indexType = this._indexType;
      }
    } else {
      // This should never happen, but TypeScript needs this
      throw new Error(`Unknown constraint type: ${this._type}`);
    }

    // Common properties
    if (this._where !== undefined) schema.where = this._where;
    if (this._deferrable !== undefined) schema.deferrable = this._deferrable;
    if (this._initiallyDeferred !== undefined)
      schema.initiallyDeferred = this._initiallyDeferred;

    return schema;
  }
}