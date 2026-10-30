# Independent review

- Candidate: `de7ab0c483523ac5d8e7d3337825709b0d1cd591`
- Base and direct parent: `eb23ae1454fd727f2fcbe22a0fb6d89a627a2d29`
- Reviewer session: Paseo `08067304-4c3b-4c92-847c-bccd5225bc73` (Codex thread `01a18cb0-5ebb-7053-913a-ff7cadc438c8`)
- Model: `codex/gpt-5.6-sol`, thinking `ultra`, mode `full-access` (requested Haiku 5.5 was unavailable and the substitution was disclosed)
- Isolation: exact commit tree `7bd87cf7e9633d757d9263710e27009cd37466d9` extracted with `git archive` to `/tmp/flowly-independent-review.RbrTzh/archive`; only the existing checkout's `node_modules` was symlinked
- Corrected full-suite checkout: `/home/ai-dev/projects/flowly`, with HEAD confirmed as the candidate and tracked tree/index clean; this report was the only untracked file

## Conclusion

Code/spec review and corrected checkout verification pass with no candidate findings. The three production changes replace only `Linking.openURL` with the public host `openExternalUrl`, retain the existing rejection feedback, HTTP(S) guards and preview behavior, and are compatible with the pinned Paseo SDK 0.11.2. The component verification passed and all six generated screenshots were visually inspected at 960 px and 390 px. The full suite passed on the exact candidate in its real Git checkout: 141/141 files, 1,199 passed and 1 skipped.

The initial archive full-suite failure remains part of the record. One unchanged Git-stats test assumes that `process.cwd()` contains `.git`, which a `git archive` deliberately omits. It therefore discovered zero repositories and never called its injected failing runner. A single corrected rerun in the original checkout passed, confirming this was an isolation setup limitation rather than a candidate regression.

## Checks

| Command | Result |
| --- | --- |
| `NODE_ENV=test FLOWLY_TELEMETRY=0 TMPDIR=/tmp/flowly-independent-review.RbrTzh/tmp npm run typecheck` | Exit 0. |
| Initial archive run: `NODE_ENV=test FLOWLY_TELEMETRY=0 TMPDIR=/tmp/flowly-independent-review.RbrTzh/tmp npm test` | Exit 1: 140/141 files passed; 1,198 passed, 1 failed, 1 skipped (1,200 total). Only `server/git-stats.test.ts` failed: expected `"git is not installed."`, received `null`. `server/git-stats.ts` and its test are unchanged from the base. |
| Corrected original-checkout run: `NODE_ENV=test FLOWLY_TELEMETRY=0 TMPDIR=/tmp/flowly-independent-test.VyTBqz/runtime npm test` | Exit 0: 141/141 files passed; 1,199 passed, 1 skipped (1,200 total). |
| `NODE_ENV=test FLOWLY_TELEMETRY=0 TMPDIR=/tmp/flowly-independent-review.RbrTzh/tmp UI_DEPS=/tmp/flowly-browser-fork-work/ui-deps PLAYWRIGHT_BROWSERS_PATH=/tmp/flowly-browser-fork-work/browsers EVIDENCE_DIR=/tmp/flowly-independent-review.RbrTzh/screenshots node docs/verification/external-browser-2026-10-30/check.mjs` | Exit 0: 62 assertions, 960 px and 390 px, Chromium 156.0.8078.4, six screenshots. |
| `git diff --check eb23ae1454fd727f2fcbe22a0fb6d89a627a2d29 de7ab0c483523ac5d8e7d3337825709b0d1cd591` | Exit 0. |

## Evidence boundaries

No inaccurate claim was found in the committed evidence. Its host opener and modal are explicitly identified as mocks; the screenshots demonstrate component rendering and calls into the mocked host API, not a Firefox launch, native mobile behavior or real Paseo modal chrome. The public opener injection and behavior stated for Paseo 0.11.2 and 0.14.0 agree with the pinned types and the linked host source. The author's legacy-opener mutation probes were reviewed but not independently rerun.

Unrun by this review: a real Paseo desktop opening the system Firefox, native mobile, live plugin install/reload, and the upstream PR. These were respectively unavailable or prohibited/deferred by the assignment.

Cleanup: `/tmp/flowly-independent-review.RbrTzh` and `/tmp/flowly-independent-test.VyTBqz`, including the archive, logs, generated screenshots and `node_modules` symlink, were removed after this report was written; no project, card, workspace, session, plugin installation or live data was created or changed.
