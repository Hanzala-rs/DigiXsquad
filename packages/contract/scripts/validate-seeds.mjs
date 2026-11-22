// Validates seed/*.json against the OpenAPI component schemas and checks cross-references.
// Run: pnpm --filter @digixsquad/contract test
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spec = parse(readFileSync(join(root, 'openapi.yaml'), 'utf8'));
const load = (f) => JSON.parse(readFileSync(join(root, 'seed', f), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema({ $id: 'spec', components: spec.components });
const validator = (name) => ajv.getSchema(`spec#/components/schemas/${name}`);

let failed = false;
const check = (label, schemaName, data) => {
  const validate = validator(schemaName);
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item, i) => {
    if (!validate(item)) {
      failed = true;
      console.error(`✗ ${label}[${i}] vs ${schemaName}:`, ajv.errorsText(validate.errors));
    }
  });
  if (!failed) console.log(`✓ ${label} (${items.length}) matches ${schemaName}`);
};

const roles = load('roles.json');
const squads = load('squads.json');
const content = load('site-content.json');

check('roles.json', 'ServiceRoleInput', roles);
check('squads.json', 'SquadInput', squads);
check('site-content.json', 'SiteContent', content);

const roleSlugs = new Set(roles.map((r) => r.slug));
if (roleSlugs.size !== roles.length) {
  failed = true;
  console.error('✗ duplicate role slugs');
}
for (const s of squads) {
  for (const r of s.roles) {
    if (!roleSlugs.has(r.role_slug)) {
      failed = true;
      console.error(`✗ squad "${s.slug}" references unknown role "${r.role_slug}"`);
    }
  }
}
if (!failed) console.log('✓ squad → role references resolve');

process.exit(failed ? 1 : 0);
