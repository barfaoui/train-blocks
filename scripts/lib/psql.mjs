/**
 * Shared helper for running SQL against the local Docker Postgres.
 * Used by reset-service-db so it does not inline the
 * `docker compose exec … psql` plumbing.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: join(root, '.env') });

export function runPsql(sql, { label } = {}) {
  const user = process.env.POSTGRES_USER || 'app';
  const db = process.env.POSTGRES_DB || 'training_planning';

  const result = spawnSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres', 'psql', '-U', user, '-d', db, '-v', 'ON_ERROR_STOP=1'],
    {
      cwd: root,
      input: sql,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );

  if (result.error) {
    console.error(`[sql] failed to run docker compose exec — is Docker running?`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    console.error(`[sql] psql exited with code ${result.status}${label ? ` (${label})` : ''}`);
    process.exit(result.status ?? 1);
  }

  if (label) {
    console.log(`[sql] applied ${label}`);
  }
}
