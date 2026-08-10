import type { ModelDefinition } from "@damatjs/orm-model";
import type { z } from "@damatjs/deps/zod";
import type { PgEntityManager, TransactionalEntityManager } from "@damatjs/orm-pg";
import type { QueryResultRow, RelationSchema } from "@damatjs/orm-type";
import { count, exists, find, findById, findMany, findOne } from "./methods/read";
import { create, createMany, update, updateOne, upsert, upsertMany } from "./methods/writes";
import { deleteRows, restoreRows, softDeleteRows } from "./methods/delete";
import { stateOf } from "./methods/state";
import type { CountOptions, CreateManyOptions, CreateOptions, DeleteOptions, ExistsOptions, FindOptions, SoftDeleteOptions, UpdateOptions, UpsertManyOptions, UpsertOptions } from "./type";

export class ModelMethods<T extends QueryResultRow = QueryResultRow> {
  private model: ModelDefinition;
  private modelName: string;
  private transactionalEm: TransactionalEntityManager | null = null;
  private entityManager?: PgEntityManager<Record<string, ModelDefinition>>;
  private _relations: RelationSchema[] | null = null;
  private _validationSchema: z.ZodObject<z.ZodRawShape> | null = null;

  constructor(model: ModelDefinition, modelName: string, em: PgEntityManager<Record<string, ModelDefinition>>) {
    this.model = model;
    this.modelName = modelName;
    this.entityManager = em;
    void this.model;
    void this.modelName;
    void this.transactionalEm;
    void this.entityManager;
    void this._relations;
    void this._validationSchema;
  }

  setTransactionalEm(txEm: TransactionalEntityManager | null): void { this.transactionalEm = txEm; }

  getModelDefinition(): ModelDefinition {
    return stateOf(this).model;
  }

  create(options: CreateOptions): Promise<T> {
    return create<T>(this, options);
  }

  createMany(options: CreateManyOptions): Promise<T[]> {
    return createMany<T>(this, options);
  }

  upsert(options: UpsertOptions): Promise<T> {
    return upsert<T>(this, options);
  }

  upsertMany(options: UpsertManyOptions): Promise<T[]> {
    return upsertMany<T>(this, options);
  }

  find(options: FindOptions = {}): Promise<(T & Record<string, any>) | null> { return find<T>(this, options); }

  findMany(options: FindOptions = {}): Promise<(T & Record<string, any>)[]> { return findMany<T>(this, options); }

  findById(id: unknown, options: Omit<FindOptions, "where"> = {}): Promise<(T & Record<string, any>) | null> {
    return findById<T>(this, id, options);
  }

  findOne(where: Record<string, unknown>, options: Omit<FindOptions, "where"> = {}): Promise<(T & Record<string, any>) | null> {
    return findOne<T>(this, where, options);
  }

  update(options: UpdateOptions): Promise<T[]> {
    return update<T>(this, options);
  }

  updateOne(options: UpdateOptions): Promise<T | null> {
    return updateOne<T>(this, options);
  }

  delete(options: DeleteOptions): Promise<number> {
    return deleteRows(this, options);
  }

  softDelete(options: SoftDeleteOptions): Promise<T[]> {
    return softDeleteRows(this, options) as Promise<T[]>;
  }

  restore(options: { where: Record<string, unknown>; returning?: string[] }): Promise<T[]> {
    return restoreRows(this, options) as Promise<T[]>;
  }

  count(options: CountOptions = {}): Promise<number> {
    return count(this, options.where, options.withDeleted);
  }

  exists(options: ExistsOptions): Promise<boolean> {
    return exists(this, options.where, options.withDeleted);
  }
}
