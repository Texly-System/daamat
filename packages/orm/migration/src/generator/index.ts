/**
 * Migration Creation
 *
 * Creates initial migrations that set up all tables for a module.
 * Useful for new modules or baseline migrations.
 */

import { snapshotExist } from '@/snapshot';
import { MigrationGeneratorOptions } from '@/types';
import { createInitialMigration } from './initialMigration';
import { createDiffMigration } from './diffMigration';

/**
 * Create an initial migration that creates all tables for a module.
 * Useful for setting up a new module or creating a baseline migration.
 *
 * @param modulesDir - Path to the modules directory
 * @param moduleName - Name of the module
 * @param entities - Entity classes for the module
 * @param orm - MikroORM instance for metadata extraction
 * @param options - Generation options
 * @returns Path to the created migration file
 *
 * @example
 * ```typescript
 * const filePath = createInitialMigration(
 *   './src/modules',
 *   'user',
 *   [User, UserProfile],
 *   orm,
 * );
 * ```
 */
export function createMigration(
    modulesDir: string,
    moduleName: string,
    options: MigrationGeneratorOptions = {},
): string {

    const snapshotStatus = snapshotExist(modulesDir)
    let filePath;
    if (snapshotStatus) {
        filePath = createDiffMigration(modulesDir, moduleName, options)
    } else {
        filePath = createInitialMigration(modulesDir, moduleName, options)
    }

    return filePath;
}
