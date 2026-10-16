# Audit Backlog

Actionable stories from the Ponytail repository audit. This file is the source of truth for audit follow-up work.

## How to use this backlog

- Work on one story at a time unless the user explicitly groups stories.
- Keep each change limited to the story's scope and acceptance criteria.
- Reuse existing helpers and dependencies; do not add a dependency unless the story requires it.
- Add or update the smallest test that proves the changed behavior.
- Run `npm test`, `npm run typecheck`, and `npm run build` before marking a story complete.
- Change `[ ]` to `[x]` only after the implementation and checks pass. Add the commit or PR beside the checkbox when available.
- Do not treat unchecked stories as permission to change unrelated code.

## Must fix

### [x] AUD-001 — Validate the feed body before saving its URL

**Problem:** `src/options/options.ts` treats a successful `HEAD` response as proof that a feed is usable. A URL can return `200` to `HEAD` and still return HTML, malformed JSON, or the wrong JSON shape to `GET`. The options page then reports success, but the extension fails on the next Yahoo page load.

**Smallest change:** Remove the `HEAD` probe. Fetch each configured URL once with `GET`, parse its JSON body, and validate it with the existing player-data schema before saving.

**Likely files:**

- `src/options/options.ts`
- `src/shared/playerData.ts` or `src/shared/types.ts`
- Options/feed-validation tests

**Acceptance criteria:**

- A valid player feed can be saved.
- HTML, malformed JSON, and schema-invalid JSON cannot be saved.
- The displayed error identifies which configured feed failed without exposing sensitive response content.
- Each URL is downloaded no more than once during one save attempt.

---

### [x] AUD-002 — Keep the good feed when the other feed fails

**Problem:** `Promise.all` in `src/background/background.ts` rejects the entire operation when either configured feed fails. A working draft feed therefore disappears when the current-value feed is temporarily unavailable, and vice versa.

**Smallest change:** Settle configured feed requests independently. Build an empty map for a failed side, log its error, and return a total error only when every configured feed fails.

**Likely files:**

- `src/background/background.ts`
- Background message-flow tests

**Acceptance criteria:**

- Two successful feeds both render.
- If one of two configured feeds fails, values from the successful feed still render.
- If every configured feed fails, the content script receives an error.
- An omitted optional feed is not treated as a failure.

---

### [x] AUD-003 — Prevent Reset from racing with Save

**Problem:** Save disables only the Save button while feed checks run. Clicking Reset before those checks finish writes defaults first, then the delayed Save writes the old URLs back.

**Smallest change:** Disable the Reset button whenever Save is disabled, and re-enable both when the save attempt finishes.

**Likely files:**

- `src/options/options.ts`
- Options-page tests if the button state is extracted or already testable

**Acceptance criteria:**

- Reset cannot be triggered while a save attempt is pending.
- Both buttons return to their usable state after success or failure.
- Existing save and reset behavior is otherwise unchanged.

---

### [x] AUD-004 — Make URL validation match host permissions

**Problem:** The options page accepts every HTTP URL, but `src/manifest.ts` permits plain HTTP only on `localhost`. For example, `http://example.com/feed.json` passes format validation and then fails because Chrome blocks the request.

**Smallest change:** Accept HTTPS URLs and local HTTP URLs supported by the manifest. Reject other HTTP URLs with a clear validation message instead of broadening extension permissions.

**Likely files:**

- `src/options/urlValidation.ts`
- `test/urlValidation.test.ts`

**Acceptance criteria:**

- HTTPS URLs remain valid.
- `http://localhost/...` remains valid.
- Non-local HTTP URLs are rejected before a network request.
- FTP and malformed URLs remain invalid.

## Should fix

### [x] AUD-005 — Do not render negative zero

**Problem:** A valid value such as `-0.4` is classified as negative before rounding and renders as `-$0`, while `0.4` renders as `$0`.

**Smallest change:** Format the rounded absolute amount first. If it rounds to zero, emit `$0`; otherwise apply the original sign.

**Likely files:**

- `src/shared/playerData.ts`
- `test/playerData.test.ts`

**Acceptance criteria:**

- `-0.4` and `0.4` both render as `$0`.
- Negative values that round to at least one dollar remain negative.
- Existing positive, negative, and zero cases still pass.

---

### [x] AUD-006 — Give feed requests a deadline

**Problem:** Feed requests in the options page and background worker have no timeout. A server that accepts a connection but never finishes can leave the settings page on "Testing URLs..." and prevent player values from loading for a long time.

**Smallest change:** Apply one documented timeout to all feed fetches using the browser's native abort support. Report a timeout through the existing error paths.

**Likely files:**

- `src/options/options.ts`
- `src/background/background.ts`
- Request tests

**Acceptance criteria:**

- A stalled feed request terminates within the chosen timeout.
- The options buttons are restored after a timeout.
- A background timeout follows the partial-feed behavior from AUD-002.
- No new dependency is added.

**Dependency:** Implement with or after AUD-001 and AUD-002 to avoid rewriting the same fetch paths twice.

---

### [x] AUD-007 — Remove the unused local-storage write

**Problem:** `src/background/background.ts` writes serialized value maps to `chrome.storage.local`, but no code reads them. A failed write can prevent otherwise valid values from reaching the page.

**Smallest change:** Return the response directly from the background handler and delete `savePlayerData`. Preserve the current response shape unless a separate story explicitly changes it.

**Likely files:**

- `src/background/background.ts`
- Background message-flow tests

**Acceptance criteria:**

- Successful feed maps are returned without writing to local storage.
- Synchronized URL settings continue to use `chrome.storage.sync`.
- Content rendering behavior and the message response shape remain unchanged.

---

### [x] AUD-008 — Reject Yahoo player IDs that cannot match a link

**Problem:** The feed schema accepts any non-empty string or integer as `YAHOOID`, while the content script only matches four- or five-digit player IDs. Values such as `"player-one"` pass validation but can never render.

**Smallest change:** Make feed validation and link matching use the same numeric Yahoo player-ID rule. Keep that rule in one shared place so the two paths cannot drift.

**Likely files:**

- `src/shared/types.ts`
- `src/content/playerValue.ts`
- `test/playerData.test.ts`
- Player-link matching tests

**Acceptance criteria:**

- IDs currently supported by Yahoo links remain valid.
- Non-numeric, negative, empty, and out-of-shape IDs are rejected.
- Feed validation and link matching share one definition of a supported ID.

---

### [x] AUD-009 — Test the background message flow

**Problem:** Existing tests cover pure helpers but never exercise the extension's main message handler. A regression that swaps draft and current values, breaks `sendResponse`, or mishandles a feed failure could leave all tests green.

**Smallest change:** Add a focused test that stubs `chrome` and `fetch`, captures the registered message listener, and verifies its response. Do not add a browser-testing framework for this story.

**Likely files:**

- `src/background/background.ts`
- A new background-flow test under `test/`

**Acceptance criteria:**

- The test proves successful draft and current maps are returned in the correct fields.
- The test covers one configured feed failing while the other succeeds after AUD-002.
- The test covers the all-configured-feeds-failed response.
- No new dependency is added.

**Dependency:** Complete after AUD-002 and AUD-007 so the test captures the intended final flow.

---

### [x] AUD-010 — Prevent an old status timer from hiding a new message

**Problem:** A success message schedules the status box to hide after three seconds. If a later error is displayed before that timer fires, the old timer hides the new error.

**Smallest change:** Store the active timeout ID and clear it before displaying any new status message.

**Likely files:**

- `src/options/options.ts`
- Status-message tests if practical without adding a DOM dependency

**Acceptance criteria:**

- Success messages still disappear automatically.
- A later error remains visible and is not hidden by an earlier timer.
- Repeated successes leave only one active hide timer.

## Nice to have

### [x] AUD-011 — Ignore DOM mutations created by the extension

**Problem:** Inserting `.player-value` spans triggers the extension's own page observer. That schedules an unnecessary second scan of every link after each render.

**Smallest change:** Ignore mutation batches whose added nodes are only value badges created by this extension.

**Likely files:**

- `src/content/playerValue.ts`
- Content observer tests if the mutation filter is extracted as a pure helper

**Acceptance criteria:**

- Adding value badges does not schedule another render.
- Yahoo adding or replacing player rows still schedules a render.
- The 500 ms debounce remains in place for real page changes.

---

### [x] AUD-012 — Remove small redundant pieces

**Problem:** The explicit S3 host permission is already covered by `https://*/*`; `getUrlsToTest` wraps a filter used once; and `showValues` is exported but never imported.

**Smallest change:** Delete the redundant permission and export. Inline the one-use URL filter and remove only the tests that exist solely for that trivial wrapper.

**Likely files:**

- `src/manifest.ts`
- `src/options/options.ts`
- `src/options/urlValidation.ts`
- `src/content/playerValue.ts`
- `test/urlValidation.test.ts`

**Acceptance criteria:**

- Extension behavior and effective host access are unchanged.
- No application or test imports the removed exports.
- Type checking, tests, and production build pass.

## Recommended order

1. AUD-001 and AUD-004
2. AUD-002 and AUD-007
3. AUD-009
4. AUD-003 and AUD-010
5. AUD-005 and AUD-008
6. AUD-006
7. AUD-011 and AUD-012
