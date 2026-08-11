import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPsql } from './lib/psql.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Postgres schema name per service folder (may differ from folder name). */
const SCHEMA_BY_SERVICE = {
  auths: 'auth',
  planner: 'planner',
};

const service = process.argv[2];
const dropOnly = process.argv.includes('--drop-only');
const seedOnly = process.argv.includes('--seed-only');
const schema = SCHEMA_BY_SERVICE[service];

if (!schema || (dropOnly && seedOnly)) {
  console.error(
    `Usage: node scripts/reset-service-db.mjs <${Object.keys(SCHEMA_BY_SERVICE).join('|')}> [--drop-only|--seed-only]`,
  );
  process.exit(1);
}

if (!seedOnly) {
  // Drop service schema. Clear Prisma migration history so `migrate deploy` re-applies.
  // TODO(planner-prisma): wiping all of `_prisma_migrations` is wrong once planner has its
  // own migrations — delete only this service's rows (or use per-schema migration tracking).
  // TODO(planner-prisma): planner `reset-db` should mirror auths (drop → migrate deploy → seed).
  runPsql(
    `DROP SCHEMA IF EXISTS ${schema} CASCADE;\n` +
      `DO $$\n` +
      `BEGIN\n` +
      `  IF EXISTS (\n` +
      `    SELECT 1 FROM information_schema.tables\n` +
      `    WHERE table_schema = 'public' AND table_name = '_prisma_migrations'\n` +
      `  ) THEN\n` +
      `    DELETE FROM "_prisma_migrations";\n` +
      `  END IF;\n` +
      `END $$;\n`,
    { label: `${service}: reset schema "${schema}"` },
  );
}

if (dropOnly) {
  process.exit(0);
}

const sqlPath = join(root, service, 'service', 'sql', 'default_data.sql');
if (!existsSync(sqlPath)) {
  console.error(`Missing seed file: ${sqlPath}`);
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf8');
const statements = sql
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/--.*$/gm, '')
  .trim();

if (!statements) {
  console.log(
    `[sql] ${service}: no statements in ${service}/service/sql/default_data.sql — skipping`,
  );
  process.exit(0);
}

runPsql(sql, { label: `${service}/service/sql/default_data.sql` });
