#!/usr/bin/env node
// stop-condition.mjs — deterministic stop-decision evaluator for ei-loop.
// Usage: node stop-condition.mjs <loop-state.json>
// Exit 0: prints one decision word to stdout (DONE | CAP | DRY | BLOCKED | CONTINUE).
// Exit 1: prints INVALID: <reason> to stderr (malformed or missing input).
//
// Logic lives in the exported `decide(state)` so it can be unit-tested directly
// (see stop-condition.test.mjs). The CLI wrapper only runs when invoked directly.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Required fields a derived loop-state must carry.
const REQUIRED = [
  'iteration', 'iteration_cap', 'cost', 'cost_cap',
  'stall_counter', 'stall_window', 'worklist',
  'global_verdict', 'has_blocked', 'has_pending',
];

const NUMERIC = [
  'iteration', 'iteration_cap', 'cost', 'cost_cap',
  'stall_counter', 'stall_window',
];

// Throws Error('INVALID: ...') on malformed state.
function validate(state) {
  if (typeof state !== 'object' || state === null) {
    throw new Error('INVALID: loop-state must be a JSON object');
  }

  const missing = REQUIRED.filter((k) => !(k in state));
  if (missing.length) {
    throw new Error(`INVALID: missing required fields: ${missing.join(', ')}`);
  }

  if (!Array.isArray(state.worklist)) {
    throw new Error('INVALID: worklist must be an array');
  }
  // A locked worklist (Gate 3) always has ≥1 item. An empty worklist here means
  // the derivation is wrong — refuse it rather than looping CONTINUE forever.
  if (state.worklist.length === 0) {
    throw new Error('INVALID: worklist is empty (a locked worklist has at least one item)');
  }

  // Numeric fields must be FINITE numbers. typeof NaN/Infinity === 'number',
  // and NaN/Infinity comparisons silently never trip the caps — so guard them.
  for (const name of NUMERIC) {
    const val = state[name];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`INVALID: field "${name}" must be a finite number (got ${JSON.stringify(val)})`);
    }
  }

  if (typeof state.has_blocked !== 'boolean') {
    throw new Error('INVALID: has_blocked must be a boolean');
  }
  if (typeof state.has_pending !== 'boolean') {
    throw new Error('INVALID: has_pending must be a boolean');
  }

  for (let i = 0; i < state.worklist.length; i++) {
    const item = state.worklist[i];
    if (typeof item !== 'object' || item === null || !('status' in item)) {
      throw new Error(`INVALID: worklist[${i}] must be an object with a "status" field`);
    }
  }
}

// Returns one of: DONE | CAP | DRY | BLOCKED | CONTINUE. Throws on invalid input.
export function decide(state) {
  validate(state);

  const {
    iteration, iteration_cap, cost, cost_cap,
    stall_counter, stall_window,
    worklist, global_verdict,
    has_blocked, has_pending,
  } = state;

  // DONE: global_verdict is DONE AND every worklist item is PASS
  if (
    global_verdict === 'DONE' &&
    worklist.length > 0 &&
    worklist.every((item) => item.status === 'PASS')
  ) {
    return 'DONE';
  }

  // CAP: iteration or cost ceiling hit
  if (iteration >= iteration_cap || cost >= cost_cap) {
    return 'CAP';
  }

  // DRY: stall window exceeded
  if (stall_counter >= stall_window) {
    return 'DRY';
  }

  // BLOCKED: something is blocked and nothing is pending to progress
  if (has_blocked === true && has_pending === false) {
    return 'BLOCKED';
  }

  // Default: keep going
  return 'CONTINUE';
}

function main() {
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

  try {
    process.stdout.write(decide(state) + '\n');
    process.exit(0);
  } catch (e) {
    const msg = e.message.startsWith('INVALID') ? e.message : `INVALID: ${e.message}`;
    process.stderr.write(msg + '\n');
    process.exit(1);
  }
}

// Run the CLI only when invoked directly, not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
