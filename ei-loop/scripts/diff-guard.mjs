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
import { readFileSync } from 'node:fs';

const [nameStatusPath, testSubstring, scopeCsv] = process.argv.slice(2);

if (!nameStatusPath) {
  process.stderr.write('BLOCKED: no name-status file path argument given\n');
  process.exit(1);
}
if (!testSubstring) {
  process.stderr.write('BLOCKED: no acceptance-test substring argument given\n');
  process.exit(1);
}

// arg3 is optional. If given, parse into a list of non-empty allowed path prefixes.
const allowedPrefixes =
  scopeCsv === undefined
    ? null
    : scopeCsv
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

let raw;
try {
  raw = readFileSync(nameStatusPath, 'utf8');
} catch (e) {
  process.stderr.write(`BLOCKED: could not read name-status file at ${nameStatusPath}: ${e.message}\n`);
  process.exit(1);
}

// Parse lines: each is "<STATUS>\t<path>" (git diff --name-status output).
// Skip blank lines.
const lines = raw.split('\n').filter((l) => l.trim().length > 0);

for (const line of lines) {
  // git name-status lines: status char(s) then a tab then path (renames have two paths)
  const tabIdx = line.indexOf('\t');
  if (tabIdx === -1) {
    // Malformed line — treat conservatively as a parse error
    process.stderr.write(`BLOCKED: malformed name-status line (no tab): ${JSON.stringify(line)}\n`);
    process.exit(1);
  }

  const status = line.slice(0, tabIdx).trim();
  // For renames (R<score>\toldPath\tnewPath), the path after the first tab may include another tab;
  // we check both paths for safety.
  const pathPart = line.slice(tabIdx + 1);

  // Rule 1: any deletion is blocked
  if (status.startsWith('D')) {
    process.stderr.write(`BLOCKED: ANTI_GAMING_FILE_DELETED: ${pathPart}\n`);
    process.exit(1);
  }

  // Rule 2: modified or added file whose path contains the acceptance-test substring
  if ((status.startsWith('M') || status.startsWith('A')) && pathPart.includes(testSubstring)) {
    process.stderr.write(`BLOCKED: ANTI_GAMING_TEST_MODIFIED: ${pathPart} (matched substring "${testSubstring}")\n`);
    process.exit(1);
  }

  // Rule 3 (only when arg3 given): any added/modified path must be under an allowed prefix.
  if (allowedPrefixes && (status.startsWith('M') || status.startsWith('A'))) {
    const inScope = allowedPrefixes.some((prefix) => pathPart.startsWith(prefix));
    if (!inScope) {
      process.stderr.write(`BLOCKED: ANTI_GAMING_SCOPE_VIOLATION: ${pathPart} (not under any allowed prefix: ${allowedPrefixes.join(', ')})\n`);
      process.exit(1);
    }
  }
}

process.stdout.write('OK: diff within bounds\n');
process.exit(0);
