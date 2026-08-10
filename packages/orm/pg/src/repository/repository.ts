import type { Pool, PoolClient, QueryResultRow } from "@damatjs/orm-type";
import type { ILogger } from "@damatjs/logger";
import type { ModelDefinition } from "@damatjs/orm-model";
import { PgModelClient } from "../client";
import { repositoryCount, repositoryExists } from "./aggregates";
import { executeNearest, type FindNearestOptions } from "./nearest";
import type { FindOptions, CreateOptions, CreateManyOptions, UpdateOptions, DeleteOptions, UpsertOptions, UpsertManyOptions } from "../query";

export interface PgRepositoryConfig {
  model: ModelDefinition;
  connection: Pool | PoolClient;
  logger: ILogger;
  isInTransaction?: boolean;
}

export class PgRepository<T extends QueryResultRow = QueryResultRow, Cols extends string = string> {
  protected connection: Pool | PoolClient;
  protected logger: ILogger;
  protected isInTransaction: boolean;
  public readonly client: PgModelClient<T, Cols>;

  constructor(config: PgRepositoryConfig) {
    this.connection = config.connection;
    this.logger = config.logger;
    this.isInTransaction = config.isInTransaction ?? false;
    this.client = new PgModelClient<T, Cols>(config.model, config.connection as Pool, config.connection as PoolClient);
  }

  async findMany(opt: FindOptions<Cols> = {}): Promise<T[]> {
    return (await this.client.findMany(opt)).rows;
  }
  async findOne(opt: Omit<FindOptions<Cols>, "limit" | "offset"> = {}): Promise<T | undefined> {
    return (await this.client.findOne(opt)).rows[0];
  }
  async findById(id: string, opt: Omit<FindOptions<Cols>, "where"> = {}): Promise<T | undefined> {
    return this.findOne({ ...opt, where: { id } as any });
  }
  async findManyByIds(ids: string[], opt: Omit<FindOptions<Cols>, "where"> = {}): Promise<T[]> {
    return (
      await this.client.findMany({ ...opt, where: { id: { in: ids } } as any })
    ).rows;
  }

  async create(opt: CreateOptions<Cols>): Promise<T> {
    const res = await this.client.create(opt);
    if (!res.rows[0])
      throw new Error("Failed to create record: no rows returned");
    return res.rows[0];
  }

  async createMany(opt: CreateManyOptions<Cols>): Promise<T[]> {
    return (await this.client.createMany(opt)).rows;
  }
  async update(opt: UpdateOptions<Cols>): Promise<T[]> {
    return (await this.client.update(opt)).rows;
  }
  async updateOne(set: Record<string, unknown>, where: Record<string, unknown>, returning?: string[]): Promise<T | undefined> {
    return (await this.client.update({ set, where, returning } as any)).rows[0];
  }

  async delete(opt: DeleteOptions<Cols>): Promise<number> {
    return (await this.client.delete(opt)).rowCount;
  }
  async deleteById(id: string, returning?: string[]): Promise<T | undefined> {
    return (
      await this.client.delete({ where: { id } as any, returning } as any)
    ).rows[0];
  }

  async upsert(opt: UpsertOptions<Cols>): Promise<T> {
    const res = await this.client.upsert(opt);
    if (!res.rows[0]) throw new Error("Upsert failed: no rows returned");
    return res.rows[0];
  }

  async upsertMany(opt: UpsertManyOptions<Cols>): Promise<T[]> {
    return (await this.client.upsertMany(opt)).rows;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return repositoryCount(this.connection, this.client.accessor._model, where);
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    return repositoryExists(this.connection, this.client.accessor._model, where);
  }

  async findNearest(options: FindNearestOptions<Cols>): Promise<Array<{ row: T; distance: number }>> {
    return executeNearest<T>(this.connection, this.client.accessor._model, options);
  }

  getAccessor() {
    return this.client.accessor;
  }
}
