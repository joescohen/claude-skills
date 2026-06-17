#!/usr/bin/env node
// stop-condition.mjs — deterministic stop-decision evaluator for ei-loop.
// Usage: node stop-condition.mjs <loop-state.json>
// Exit 0: prints one decision word to stdout (DONE | CAP | DRY | BLOCKED | CONTINUE).
// Exit 1: prints INVALID: <reason> to stderr (malformed or missing input).
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  process.stderr.write('INVALID: no loop-state path argument given\n');
  process.exit(1);
}

let state;
try {
  state = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
  process.stderr.write(`INVALID: could not read/parse JSON at ${path}: ${e.message}\n`);
  process.exit(1);
}

// Required fields
const REQUIRED = [
  'iteration', 'iteration_cap', 'cost', 'cost_cap',
  'stall_counter', 'stall_window', 'worklist',
  'global_verdict', 'has_blocked', 'has_pending',
];
const missing = REQUIRED.filter((k) => !(k in state));
if (missing.length) {
  process.stderr.write(`INVALID: missing required fields: ${missing.join(', ')}\n`);
  process.exit(1);
}

if (!Array.isArray(state.worklist)) {
  process.stderr.write('INVALID: worklist must be an array\n');
  process.exit(1);
}

const {
  iteration, iteration_cap, cost, cost_cap,
  stall_counter, stall_window,
  worklist,
  global_verdict,
  has_blocked, has_pending,
} = state;

// Validate numeric fields
for (const [name, val] of [
  ['iteration', iteration], ['iteration_cap', iteration_cap],
  ['cost', cost], ['cost_cap', cost_cap],
  ['stall_counter', stall_counter], ['stall_window', stall_window],
]) {
  if (typeof val !== 'number') {
    process.stderr.write(`INVALID: field "${name}" must be a number (got ${typeof val})\n`);
    process.exit(1);
  }
}

if (typeof has_blocked !== 'boolean') {
  process.stderr.write(`INVALID: has_blocked must be a boolean\n`);
  process.exit(1);
}
if (typeof has_pending !== 'boolean') {
  process.stderr.write(`INVALID: has_pending must be a boolean\n`);
  process.exit(1);
}

// Validate worklist items have a status field
for (let i = 0; i < worklist.length; i++) {
  const item = worklist[i];
  if (typeof item !== 'object' || item === null || !('status' in item)) {
    process.stderr.write(`INVALID: worklist[${i}] must be an object with a "status" field\n`);
    process.exit(1);
  }
}

// --- Deterministic decision tree ---

// DONE: global_verdict is DONE AND every worklist item is PASS
if (
  global_verdict === 'DONE' &&
  worklist.length > 0 &&
  worklist.every((item) => item.status === 'PASS')
) {
  process.stdout.write('DONE\n');
  process.exit(0);
}

// CAP: iteration or cost ceiling hit
if (iteration >= iteration_cap || cost >= cost_cap) {
  process.stdout.write('CAP\n');
  process.exit(0);
}

// DRY: stall window exceeded
if (stall_counter >= stall_window) {
  process.stdout.write('DRY\n');
  process.exit(0);
}

// BLOCKED: something is blocked and nothing is pending to progress
if (has_blocked === true && has_pending === false) {
  process.stdout.write('BLOCKED\n');
  process.exit(0);
}

// Default: keep going
process.stdout.write('CONTINUE\n');
process.exit(0);
