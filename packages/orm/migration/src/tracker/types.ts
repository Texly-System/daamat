export interface AppliedMigration {
  module: string;
  name: string;
  applied_at: Date;
  checksum: string | null;
  adopted_at: Date | null;
  adoption_actor: string | null;
  adoption_reason: string | null;
}
