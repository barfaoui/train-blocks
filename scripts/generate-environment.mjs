import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, 'common', 'environment.json');
const outPath = join(root, 'common', 'environment.ts');

const { basePort, apps } = JSON.parse(readFileSync(configPath, 'utf8'));

if (!Number.isInteger(basePort) || basePort < 0) {
  throw new Error(
    `common/environment.json: basePort must be a non-negative integer, got ${basePort}`,
  );
}
if (!Array.isArray(apps) || apps.length === 0) {
  throw new Error('common/environment.json: apps must be a non-empty array');
}
if (new Set(apps).size !== apps.length) {
  throw new Error('common/environment.json: apps must be unique');
}

const ports = Object.fromEntries(apps.map((id, index) => [id, basePort + index + 1]));
const portLines = apps.map((id) => `    '${id.replace(/'/g, "\\'")}': ${ports[id]},`).join('\n');

const source = `/** Generated based on common/environment.json - do not edit. */

export const environment = {
  ports: {
${portLines}
  },
} as const;

export type AppId = keyof typeof environment.ports;
`;

writeFileSync(outPath, source, 'utf8');
console.log(`Wrote ${outPath.replace(root + '\\', '').replace(root + '/', '')}`);
for (const id of apps) {
  console.log(`  ${id}: ${ports[id]}`);
}
