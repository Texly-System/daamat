const DAMAT_SCHEMA = "damat";
const RELATION_PATTERN = /^_?damat_[a-z0-9_]+$/;

const DAMAT_SCHEMA_SETUP = `DO $damat_schema$
DECLARE
  schema_owner OID;
  incompatible_relation TEXT;
BEGIN
  SELECT nspowner INTO schema_owner FROM pg_namespace WHERE nspname = '${DAMAT_SCHEMA}';
  IF schema_owner IS NULL THEN
    BEGIN
      EXECUTE 'CREATE SCHEMA "${DAMAT_SCHEMA}"';
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE EXCEPTION 'Cannot create Damat schema "${DAMAT_SCHEMA}": role % requires CREATE on the database', current_user;
    END;
    SELECT nspowner INTO schema_owner FROM pg_namespace WHERE nspname = '${DAMAT_SCHEMA}';
  END IF;
  IF NOT pg_has_role(current_user, schema_owner, 'USAGE') THEN
    RAISE EXCEPTION 'Cannot use Damat schema "${DAMAT_SCHEMA}": role % does not own or inherit its owner role', current_user;
  END IF;
  IF NOT has_schema_privilege(current_user, '${DAMAT_SCHEMA}', 'USAGE')
     OR NOT has_schema_privilege(current_user, '${DAMAT_SCHEMA}', 'CREATE') THEN
    RAISE EXCEPTION 'Cannot use Damat schema "${DAMAT_SCHEMA}": role % requires USAGE and CREATE', current_user;
  END IF;
  SELECT c.relname INTO incompatible_relation
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = '${DAMAT_SCHEMA}' AND c.relkind IN ('r','p','v','m','S','f')
     AND c.relname !~ '^_damat_'
   ORDER BY c.relname LIMIT 1;
  IF incompatible_relation IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot use Damat schema "${DAMAT_SCHEMA}": non-Damat relation "%" exists; move or rename it before migrating', incompatible_relation;
  END IF;
END
$damat_schema$;`;

function normalizeRelation(name: string): string {
  const relation = name.startsWith("_damat_") ? name : `_damat_${name}`;
  if (!RELATION_PATTERN.test(relation)) {
    throw new Error(`Invalid Damat relation name: ${name}`);
  }
  return relation;
}

/** Return a fully qualified identifier for a Damat-owned relation. */
export function damatRelation(name: string): string {
  return `"${DAMAT_SCHEMA}"."${normalizeRelation(name)}"`;
}

/**
 * Build transactional SQL that moves existing public Damat relations into
 * the dedicated schema without copying rows or replacing a conflicting table.
 */
export function relocateDamatRelations(names: readonly string[]): string {
  const relations = [...new Set(names.map(normalizeRelation))];
  const moves = relations
    .map((relation) => {
      const source = `"public"."${relation}"`;
      const target = damatRelation(relation);
      return `DO $damat_relocate$
BEGIN
  IF to_regclass('${source}') IS NOT NULL
     AND to_regclass('${target}') IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot relocate Damat relation: both ${source} and ${target} exist. Remove or reconcile one relation before migrating';
  ELSIF to_regclass('${source}') IS NOT NULL THEN
    ALTER TABLE ${source} SET SCHEMA "${DAMAT_SCHEMA}";
  END IF;
END
$damat_relocate$;`;
    })
    .join("\n");
  return [DAMAT_SCHEMA_SETUP, moves].filter(Boolean).join("\n");
}
