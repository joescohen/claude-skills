#!/usr/bin/env node
// Tests for diff-guard.mjs — the anti-gaming diff check.
// Run: node --test ei-loop/scripts/diff-guard.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkDiff } from './diff-guard.mjs';

const TEST_SUB = '.test.';

// --- existing behavior must be preserved ---

test('OK: clean in-scope modification', () => {
  const r = checkDiff('M\tsrc/app.js\n', TEST_SUB, 'src/');
  assert.equal(r.ok, true);
});

test('blocks any deletion', () => {
  const r = checkDiff('D\tsrc/app.js\n', TEST_SUB, 'src/');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'ANTI_GAMING_FILE_DELETED');
});

test('blocks modification of the acceptance-test file', () => {
  const r = checkDiff('M\tsrc/app.test.js\n', TEST_SUB, 'src/');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'ANTI_GAMING_TEST_MODIFIED');
});

test('blocks an out-of-scope edit', () => {
  const r = checkDiff('A\tlib/other.js\n', TEST_SUB, 'src/');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'ANTI_GAMING_SCOPE_VIOLATION');
});

test('no scope arg → scope check skipped', () => {
  const r = checkDiff('A\tanywhere/x.js\n', TEST_SUB, undefined);
  assert.equal(r.ok, true);
});

test('malformed line (no tab) is rejected', () => {
  const r = checkDiff('garbage-no-tab\n', TEST_SUB, 'src/');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'PARSE_ERROR');
});

test('rename into an acceptance-test path is caught', () => {
  const r = checkDiff('R100\tsrc/a.js\tsrc/a.test.js\n', TEST_SUB, 'src/');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'ANTI_GAMING_TEST_MODIFIED');
});

// --- BUG FIX: scope check must respect path boundaries ---

test('BUG: scope "src/foo" must REJECT sibling "src/foobar/x.js"', () => {
  const r = checkDiff('A\tsrc/foobar/evil.js\n', TEST_SUB, 'src/foo');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'ANTI_GAMING_SCOPE_VIOLATION');
});

test('scope "src/foo" allows a real child "src/foo/x.js"', () => {
  assert.equal(checkDiff('A\tsrc/foo/x.js\n', TEST_SUB, 'src/foo').ok, true);
});

test('scope "src/foo" allows the exact file "src/foo"', () => {
  assert.equal(checkDiff('M\tsrc/foo\n', TEST_SUB, 'src/foo').ok, true);
});

test('trailing-slash scope "src/foo/" allows "src/foo/x.js"', () => {
  assert.equal(checkDiff('A\tsrc/foo/x.js\n', TEST_SUB, 'src/foo/').ok, true);
});

test('multiple scope prefixes: in any one is allowed', () => {
  assert.equal(checkDiff('A\tsrc/b/x.js\n', TEST_SUB, 'src/a,src/b').ok, true);
});

test('BUG: path traversal escaping scope is rejected', () => {
  const r = checkDiff('A\tsrc/foo/../../etc/evil\n', TEST_SUB, 'src/foo');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'ANTI_GAMING_SCOPE_VIOLATION');
});
