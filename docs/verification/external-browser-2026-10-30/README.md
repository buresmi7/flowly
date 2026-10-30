# External browser links — verification

2026-10-30. Port of the three client changes from
[upstream PR #46](https://github.com/JasprW/flowly/pull/46) onto
`eb23ae1454fd727f2fcbe22a0fb6d89a627a2d29` (Flowly 1.7.2).

## Results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 with the declared Paseo SDK 0.11.2. |
| `npm test` | Exit 0: 141 files, 1,199 passed, 1 skipped. The existing crash-child helper is intentionally inactive in the parent test process. |
| `node docs/verification/external-browser-2026-10-30/check.mjs` | Exit 0: 62 assertions, 960px and 390px content widths, Chromium 156.0.8078.4. |
| Regression probes | Restoring `Linking.openURL` independently at each of the three call sites makes the same component suite fail on the missing host-opener call (3/3 detected). Only temporary bundles were changed. |
| `git diff --check` | Exit 0. |
| Real Paseo desktop → system Firefox; native mobile | Not run: this Linux host has no graphical session. |

The headless suite renders the real `TaskArtifacts`, `ExternalPreview` and
`SessionMarkdown`, their shared UI, parser and React Query. Only the Paseo host
boundary and input data are fixtures. It clicks all three entry points, records
exact URLs and synchronous calls during the click, checks both toast callbacks
and the rendered Markdown error, retries after rejection, verifies HTTP/HTTPS,
rejects unsupported Markdown schemes, preserves file/external previews, and
opens the source even when its connection was removed. No production component
is copied or rewritten for the test.

The opener is mocked: this proves Flowly's API handoff, not real Firefox launch,
popup behavior or the host toast's appearance. Modal chrome and icons are test
substitutes. The compact viewport is a narrow web component test, not native
mobile or the whole Flowly board. Screenshots use `docs/promo/shot-lib.mjs`; the
reserved host-sidebar area is excluded. No daemon connection, real card, token,
external-service write, installation or plugin reload is involved.

## Screenshots

| State | Wide | Compact |
| --- | --- | --- |
| Artifacts and session links | [960px](screenshots/960-links.png) | [390px](screenshots/390-links.png) |
| Source opens despite a removed connection | [960px](screenshots/960-external-preview.png) | [390px](screenshots/390-external-preview.png) |
| Rejected Markdown open | [960px](screenshots/960-markdown-error.png) | [390px](screenshots/390-markdown-error.png) |

## Reproduce

Dependencies stay outside the product manifest and lockfile. Run from the repo
root; the disposable prefix holds only test tools and Chromium. Network access
is needed for installation, not for the component checks.

```sh
export NODE_ENV=test FLOWLY_TELEMETRY=0
export TMPDIR=$(mktemp -d /tmp/flowly-browser-check.XXXXXX)
export UI_DEPS="$TMPDIR/ui-deps"
export PLAYWRIGHT_BROWSERS_PATH="$TMPDIR/browsers"
npm ci --ignore-scripts --no-audit --no-fund --legacy-peer-deps
npm install --prefix "$UI_DEPS" --ignore-scripts --no-audit --no-fund --save-exact \
  esbuild@0.28.2 playwright@1.64.1 react@19.1.0 react-dom@19.1.0 react-native-web@0.21.2
node "$UI_DEPS/node_modules/playwright/cli.js" install chromium
npm run typecheck
npm test
EVIDENCE_DIR="$TMPDIR/screenshots" node docs/verification/external-browser-2026-10-30/check.mjs
```

The runner closes its browser/server and removes its temporary bundle in
`finally`. Keep any wanted screenshots, then remove the disposable directory
created above. It does not create Paseo projects, workspaces or sessions.

## API compatibility and remaining manual check

The host supplies `openExternalUrl` in both
[Paseo 0.11.2](https://github.com/getpaseo/paseo/blob/v0.11.2/packages/app/src/plugins/evaluate.ts)
and [0.14.0](https://github.com/getpaseo/paseo/blob/v0.14.0/packages/app/src/plugins/evaluate.ts).
The [0.14.0 opener](https://github.com/getpaseo/paseo/blob/v0.14.0/packages/app/src/utils/open-external-url.ts)
uses the desktop client OS opener; it does not read the `serviceUrlBehavior`
setting for script URLs. Firefox is used when it is the client system's default
browser. No SDK or minimum-version bump is needed.

On a graphical Linux client with Firefox as default, install this branch in a
test Paseo profile and click an HTTP(S) artifact, an external preview's **Open
in GitHub/GitLab** button and an HTTP(S) session link. Confirm Firefox opens
while file/external previews remain inside Flowly. This manual check remains
unverified; do not infer it from the screenshots.

No onboarding, What's new, translation or telemetry changes are warranted:
this restores existing link actions without new controls, concepts or counters.
An upstream PR is intentionally deferred for the requesting user's approval.
