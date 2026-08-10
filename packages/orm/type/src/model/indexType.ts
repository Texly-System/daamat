/**
 * Index type
 */
export type IndexType =
  | "btree"
  | "hash"
  | "gin"
  | "gist"
  | "brin"
  | "hnsw"
  | "ivfflat";

export type VectorOperatorClass =
  | "vector_l2_ops"
  | "vector_cosine_ops"
  | "vector_ip_ops"
  | "vector_l1_ops"
  | "halfvec_l2_ops"
  | "halfvec_cosine_ops"
  | "halfvec_ip_ops"
  | "halfvec_l1_ops";

export type IndexColumn =
  | {
      name: string;
      expression?: never;
      operatorClass?: VectorOperatorClass;
      order?: "ASC" | "DESC";
    }
  | {
      name?: never;
      expression: string;
      operatorClass?: VectorOperatorClass;
      order?: "ASC" | "DESC";
    };

/**
 * Index Schema
 */
export interface IndexSchema {
  /** Index name */
  name?: string | undefined;
  /** Columns in the index */
  columns: (string | IndexColumn)[];
  /** Whether index is unique */
  unique?: boolean | undefined;
  /** Index type */
  type?: IndexType | undefined;
  /** Partial index condition */
  where?: string | undefined;
  /** Whether index is concurrently created */
  concurrently?: boolean | undefined;
  /** PostgreSQL index storage parameters */
  with?: Record<string, string | number | boolean> | undefined;
}
