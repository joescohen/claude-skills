#!/usr/bin/env node
// Tests for stop-condition.mjs — the loop's terminate/continue oracle.
// Run: node --test ei-loop/scripts/stop-condition.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide } from './stop-condition.mjs';

// A minimal valid loop-state that, as written, resolves to DONE.
const base = () => ({
  iteration: 0,
  iteration_cap: 5,
  cost: 0,
  cost_cap: 10,
  stall_counter: 0,
  stall_window: 3,
  worklist: [{ status: 'PASS' }],
  global_verdict: 'DONE',
  has_blocked: false,
  has_pending: false,
});

// --- existing behavior must be preserved ---

test('DONE when global verdict is DONE and every item PASSes', () => {
  assert.equal(decide(base()), 'DONE');
});

test('CONTINUE when not done and no ceiling hit', () => {
  const s = { ...base(), global_verdict: 'NOT_YET', worklist: [{ status: 'BUILDING' }], has_pending: true };
  assert.equal(decide(s), 'CONTINUE');
});

test('CAP when iteration ceiling reached', () => {
  assert.equal(decide({ ...base(), global_verdict: 'NOT_YET', iteration: 5 }), 'CAP');
});

test('CAP when cost ceiling reached', () => {
  assert.equal(decide({ ...base(), global_verdict: 'NOT_YET', cost: 10 }), 'CAP');
});

test('DRY when stall window exceeded', () => {
  assert.equal(decide({ ...base(), global_verdict: 'NOT_YET', stall_counter: 3 }), 'DRY');
});

test('BLOCKED when something is blocked and nothing pending', () => {
  const s = { ...base(), global_verdict: 'NOT_YET', worklist: [{ status: 'BLOCKED' }], has_blocked: true, has_pending: false };
  assert.equal(decide(s), 'BLOCKED');
});

test('throws on missing required field', () => {
  const s = base();
  delete s.cost_cap;
  assert.throws(() => decide(s), /cost_cap/);
});

test('throws when a numeric field is the wrong type', () => {
  assert.throws(() => decide({ ...base(), cost: '0' }), /cost/);
});

test('throws when has_blocked is not boolean', () => {
  assert.throws(() => decide({ ...base(), has_blocked: 'false' }), /has_blocked/);
});

// --- BUG FIXES this change introduces ---

test('BUG: non-finite cost (NaN) must not silently CONTINUE — it is invalid', () => {
  // NaN >= cost_cap is always false, so a mis-derived cost would never trip CAP.
  assert.throws(() => decide({ ...base(), global_verdict: 'NOT_YET', cost: NaN }), /finite|cost/i);
});

test('BUG: Infinity iteration must be rejected, not treated as a number', () => {
  assert.throws(() => decide({ ...base(), global_verdict: 'NOT_YET', iteration: Infinity }), /finite|iteration/i);
});

test('BUG: empty worklist must not loop forever — it is invalid (G3 locks a non-empty worklist)', () => {
  assert.throws(() => decide({ ...base(), global_verdict: 'NOT_YET', worklist: [] }), /worklist|empty/i);
});
