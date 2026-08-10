import type { ColumnType } from "@/types";

const range = "{ lower: number | null; upper: number | null; isLowerBoundClosed: boolean; isUpperBoundClosed: boolean; isEmpty: boolean }";
const bigRange = "{ lower: bigint | null; upper: bigint | null; isLowerBoundClosed: boolean; isUpperBoundClosed: boolean; isEmpty: boolean }";
const dateRange = "{ lower: Date | null; upper: Date | null; isLowerBoundClosed: boolean; isUpperBoundClosed: boolean; isEmpty: boolean }";
const rangeArray = `Array<${range}>`;
const bigRangeArray = `Array<${bigRange}>`;
const dateRangeArray = `Array<${dateRange}>`;

/** Runtime TypeScript shapes returned by node-postgres for each SQL type. */
export const PG_TYPE_TO_TS_BASE: Record<ColumnType, string> = {
  smallint: "number", integer: "number", bigint: "bigint", decimal: "number",
  numeric: "number", real: "number", "double precision": "number",
  smallserial: "number", serial: "number", bigserial: "bigint", money: "string",
  character: "string", "character varying": "string", text: "string", bytea: "Buffer",
  "timestamp without time zone": "Date", "timestamp with time zone": "Date", date: "Date",
  "time without time zone": "string", "time with time zone": "string",
  interval: "{ years: number; months: number; days: number; hours: number; minutes: number; seconds: number; milliseconds: number }",
  boolean: "boolean", enum: "string", point: "{ x: number; y: number }",
  line: "string", lseg: "{ x1: number; y1: number; x2: number; y2: number }",
  box: "{ x1: number; y1: number; x2: number; y2: number }", path: "string",
  polygon: "string", circle: "{ x: number; y: number; radius: number }",
  cidr: "string", inet: "string", macaddr: "string", macaddr8: "string",
  bit: "string", "bit varying": "string", tsvector: "string", tsquery: "string",
  uuid: "string", xml: "string", json: "unknown", jsonb: "unknown", jsonpath: "string",
  int4range: range, int8range: bigRange, numrange: range, tsrange: dateRange,
  tstzrange: dateRange, daterange: dateRange,
  int4multirange: rangeArray, int8multirange: bigRangeArray,
  nummultirange: rangeArray, tsmultirange: dateRangeArray,
  tstzmultirange: dateRangeArray, datemultirange: dateRangeArray,
  oid: "number", pg_lsn: "string", pg_snapshot: "string",
  vector: "number[]", halfvec: "number[]",
};
