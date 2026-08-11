import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPsql } from './lib/psql.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { apps } = JSON.parse(readFileSync(join(root, 'common', 'environment.json'), 'utf8'));

const service = process.argv[2];

if (!service || !apps.includes(service)) {
  console.error(`Usage: node scripts/reset-service-db.mjs <${apps.join('|')}>`);
  process.exit(1);
}

// Schema name always matches the service folder name
runPsql(
  `DROP SCHEMA IF EXISTS ${service} CASCADE;\nCREATE SCHEMA ${service};\n`,
  { label: `${service}: reset schema "${service}"` },
);

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
  console.log(`[sql] ${service}: no statements in ${service}/service/sql/default_data.sql — skipping`);
  process.exit(0);
}

runPsql(sql, { label: `${service}/service/sql/default_data.sql` });
