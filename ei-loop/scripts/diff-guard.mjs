#!/usr/bin/env node
// diff-guard.mjs — deterministic anti-gaming diff check for ei-loop.
// Usage: node diff-guard.mjs <name-status.txt> <acceptance-test-substring> [<allowed-scope-prefixes-csv>]
//   arg1 = file containing `git diff --name-status <base> <head>` output (lines "STATUS\tpath").
//   arg2 = substring identifying the acceptance-test file(s) of record for this sub-task.
//   arg3 (OPTIONAL) = comma-separated allowed path prefixes (the item's scope_paths).
// Exit 0: prints "OK: diff within bounds" to stdout.
// Exit 1: prints "BLOCKED: <reason>" to stderr. Reasons:
//   ANTI_GAMING_FILE_DELETED       — a deletion (D status) was found.
//   ANTI_GAMING_TEST_MODIFIED      — an A/M path contains the acceptance-test substring.
//   ANTI_GAMING_SCOPE_VIOLATION    — (only if arg3 given) an A/M path is not under any allowed prefix.
//   PARSE_ERROR                    — a malformed name-status line.
//
// Logic lives in the exported `checkDiff()` so it can be unit-tested directly
// (see diff-guard.test.mjs). The CLI wrapper only runs when invoked directly.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// A path is in scope if it equals an allowed prefix exactly, or sits beneath it
// at a real path boundary. Plain string startsWith is NOT enough: prefix
// "src/foo" must NOT admit sibling "src/foobar". Paths that escape via ".." are
// always out of scope.
function pathInScope(path, prefixes) {
  if (path.split('/').includes('..')) return false;
  return prefixes.some((prefix) => {
    const clean = prefix.replace(/\/+$/, ''); // drop trailing slash(es)
    return path === clean || path.startsWith(clean + '/');
  });
}

// Returns { ok: true } or { ok: false, reason, detail }.
//   rawText      = contents of the name-status file (lines "STATUS\tpath").
//   testSubstring = acceptance-test substring of record.
//   scopeCsv     = comma-separated allowed prefixes, or null/undefined to skip the scope check.
export function checkDiff(rawText, testSubstring, scopeCsv) {
  const allowedPrefixes =
    scopeCsv === undefined || scopeCsv === null
      ? null
      : scopeCsv.split(',').map((p) => p.trim()).filter((p) => p.length > 0);

  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const tabIdx = line.indexOf('\t');
    if (tabIdx === -1) {
      return { ok: false, reason: 'PARSE_ERROR', detail: `malformed name-status line (no tab): ${JSON.stringify(line)}` };
    }

    const status = line.slice(0, tabIdx).trim();
    // For renames (R<score>\toldPath\tnewPath) the remainder may hold two paths;
    // we check the whole remainder for the test substring, and the LAST path for scope.
    const pathPart = line.slice(tabIdx + 1);

    // Rule 1: any deletion is blocked.
    if (status.startsWith('D')) {
      return { ok: false, reason: 'ANTI_GAMING_FILE_DELETED', detail: pathPart };
    }

    if (status.startsWith('M') || status.startsWith('A') || status.startsWith('R') || status.startsWith('C')) {
      // Rule 2: must not touch the acceptance-test file of record.
      if (pathPart.includes(testSubstring)) {
        return { ok: false, reason: 'ANTI_GAMING_TEST_MODIFIED', detail: `${pathPart} (matched substring "${testSubstring}")` };
      }

      // Rule 3 (only when scope given): every resulting path must be in scope.
      if (allowedPrefixes) {
        // A rename/copy line has tab-separated paths; check the destination (last).
        const paths = pathPart.split('\t').filter((p) => p.length > 0);
        const dest = paths[paths.length - 1] ?? pathPart;
        if (!pathInScope(dest, allowedPrefixes)) {
          return { ok: false, reason: 'ANTI_GAMING_SCOPE_VIOLATION', detail: `${dest} (not under any allowed prefix: ${allowedPrefixes.join(', ')})` };
        }
      }
    }
  }

  return { ok: true };
}

function main() {
  const [nameStatusPath, testSubstring, scopeCsv] = process.argv.slice(2);

  if (!nameStatusPath) {
    process.stderr.write('BLOCKED: no name-status file path argument given\n');
    process.exit(1);
  }
  if (!testSubstring) {
    process.stderr.write('BLOCKED: no acceptance-test substring argument given\n');
    process.exit(1);
  }

  let raw;
  try {
    raw = readFileSync(nameStatusPath, 'utf8');
  } catch (e) {
    process.stderr.write(`BLOCKED: could not read name-status file at ${nameStatusPath}: ${e.message}\n`);
    process.exit(1);
  }

  const result = checkDiff(raw, testSubstring, scopeCsv);
  if (result.ok) {
    process.stdout.write('OK: diff within bounds\n');
    process.exit(0);
  }
  process.stderr.write(`BLOCKED: ${result.reason}: ${result.detail}\n`);
  process.exit(1);
}

// Run the CLI only when invoked directly, not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
