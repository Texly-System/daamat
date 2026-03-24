import { IndexColumn } from '@/types';
import { IndexBuilder } from './base';

/**
 * Create a new index builder
 */
export function index(columns: (string | IndexColumn)[]): IndexBuilder {
  return new IndexBuilder(columns);
}

export * from "./base"