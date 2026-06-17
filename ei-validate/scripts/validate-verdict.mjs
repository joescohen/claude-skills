#!/usr/bin/env node
// validate-verdict.mjs — zero-dependency validator for ei-validate's verdict.json.
// Usage: node validate-verdict.mjs <path-to-verdict.json>
// Exit 0 = valid & internally consistent; exit 1 = invalid (one reason per line on stderr).
import { readFileSync } from 'node:fs';

const OVERALL = ['PASS', 'FAIL', 'INCONCLUSIVE'];
const STOP = ['DONE', 'NOT_YET', 'INCONCLUSIVE'];
const CRIT = ['PASS', 'FAIL', 'UNPROVEN', 'BLOCKED'];
const CALIB = ['ok', 'recalibrated', 'n/a'];

function die(errors) {
  for (const e of errors) console.error(`INVALID: ${e}`);
  process.exit(1);
}

const path = process.argv[2];
if (!path) die(['no verdict path argument given']);

let doc;
try {
  doc = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
  die([`could not read/parse JSON at ${path}: ${e.message}`]);
}

const errors = [];
for (const k of ['schema_version', 'run_id', 'target', 'timestamp', 'overall', 'stop_recommendation', 'criteria', 'adversarial']) {
  if (!(k in doc)) errors.push(`missing required field: ${k}`);
}
if ('overall' in doc && !OVERALL.includes(doc.overall)) errors.push(`overall not in {${OVERALL}}`);
if ('stop_recommendation' in doc && !STOP.includes(doc.stop_recommendation)) errors.push(`stop_recommendation not in {${STOP}}`);

if (!Array.isArray(doc.criteria)) {
  errors.push('criteria must be an array');
} else {
  doc.criteria.forEach((c, i) => {
    if (typeof c !== 'object' || c === null) { errors.push(`criteria[${i}] not an object`); return; }
    if (!c.id) errors.push(`criteria[${i}].id missing`);
    if (!CRIT.includes(c.status)) errors.push(`criteria[${i}].status not in {${CRIT}}`);
  });
}

const adv = doc.adversarial;
if (typeof adv !== 'object' || adv === null) {
  errors.push('adversarial must be an object');
} else {
  if (typeof adv.applied !== 'boolean') errors.push('adversarial.applied must be boolean');
  if (!CALIB.includes(adv.canary_calibration)) errors.push(`adversarial.canary_calibration not in {${CALIB}}`);
}

// Internal consistency — re-derive overall + stop from the rules (deterministic anti-gaming guard).
if (Array.isArray(doc.criteria) && OVERALL.includes(doc.overall) && adv && typeof adv === 'object') {
  const statuses = doc.criteria.map((c) => c && c.status);
  const anyFail = statuses.includes('FAIL');
  const anySoft = statuses.includes('UNPROVEN') || statuses.includes('BLOCKED');
  const recalib = adv.canary_calibration === 'recalibrated';
  const derived = anyFail ? 'FAIL' : (anySoft || recalib) ? 'INCONCLUSIVE' : 'PASS';
  if (derived !== doc.overall) {
    errors.push(`overall="${doc.overall}" inconsistent with criteria/adversarial (derived "${derived}")`);
  }
  const blocking = Array.isArray(doc.blocking_findings) ? doc.blocking_findings.length : 0;
  const derivedStop = derived === 'PASS' && blocking === 0 ? 'DONE' : derived === 'FAIL' ? 'NOT_YET' : 'INCONCLUSIVE';
  if (STOP.includes(doc.stop_recommendation) && derivedStop !== doc.stop_recommendation) {
    errors.push(`stop_recommendation="${doc.stop_recommendation}" inconsistent (derived "${derivedStop}")`);
  }
}

if (errors.length) die(errors);
console.log(`VALID: ${path} (overall=${doc.overall}, stop=${doc.stop_recommendation})`);
process.exit(0);
