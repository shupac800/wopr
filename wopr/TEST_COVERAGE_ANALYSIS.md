# WOPR Test Coverage Analysis

## Current State

The codebase has **11 source modules** (~5,500 lines) and **1 test file** (927 lines, 36 passing tests). Tests use a custom runner with Node.js `assert` + `vm` sandboxing — no external test framework.

### Coverage by Module

| Module | Lines | Has Tests | Coverage Level |
|---|---|---|---|
| `missiles.js` | 355 | Yes | Moderate — `isDestroyed`, `createDetonation`, `clear`, `isIdle` tested |
| `map2d.js` (MissileSystem2D) | 546 | Yes | Moderate — launch prevention, blast expansion, destroyed-origin logic |
| `scenarios-engine.js` | 608 | Yes | Moderate — `resolveLaunchOrigin`, escalation, retaliation filtering |
| `mapdata.js` | 786 | Partial | Submarine integrity validated, city/base data indirectly tested |
| `scenarios.js` | 1,300 | Partial | 20 scenarios sampled for submarine correctness |
| `infopanel.js` | 339 | Partial | Casualty rounding formula only |
| `terminal.js` | 337 | No | Not tested |
| `globe.js` | 372 | No | Not tested |
| `main.js` | 417 | No | Not tested |
| `mobile.js` | 213 | No | Not tested |
| `coastlines.js` | 250 | No | Not tested |

### What Existing Tests Cover Well

- Blast radius detection (3D and 2D) with inside/outside threshold
- Destroyed-origin launch prevention (land-based cancelled, submarines exempt)
- Detonation site recording and accumulation
- State reset (`clear()`) and idle detection (`isIdle()`)
- Scenario engine base substitution and round-robin reset
- Escalation engine appending and delay ordering
- Retaliation wave filtering (skips origins near prior targets)
- Submarine geographic integrity across nations
- Missile flight time vs haversine distance at 5 km/s
- Time compression effects on flight time and blast growth
- Casualty rounding consistency between terminal and info panel

---

## Proposed Improvements

### Priority 1: ScenarioEngine — `buildFromScenario` and `buildGenericSequence`

**Why:** These are the most complex functions in the codebase (120+ lines each) and represent the core game logic. They're currently untested despite having multiple branching paths.

**Specific tests to add:**

1. **`buildFromScenario` produces valid missiles for a hand-crafted scenario** — verify that a known scenario (e.g., one with `waves`, `from`, `to`, `fromSubs`) generates missiles with valid origins and targets, and that all missiles have non-negative delays.

2. **`buildGenericSequence` origin region detection** — the function parses scenario names to determine origin regions (`"USSR FIRST STRIKE"` → `originRegions = ["ussr"]`). Test each branch: USSR keywords, US/NATO keywords, China, India, and the default two-superpower fallback.

3. **`buildGenericSequence` fallback missile** — when no valid origin→target pairs exist, the function creates a single fallback missile. Verify this path produces exactly one missile.

4. **`buildFromScenario` retaliation filtering integration** — verify that in a multi-wave scenario with `retaliation: true`, origins near previously targeted cities are excluded from the retaliation wave (end-to-end, not just the filter function).

5. **`buildFromScenario` submarine origin pairing** — verify that `fromSubs` waves produce missiles with `type: "sub"` origins and that the proximity-based sub selection picks subs close to the target centroid.

6. **Escalation always reaches DEFCON 1** — verify the returned sequence has `defcon: 1` regardless of initial scenario DEFCON.

**Estimated impact:** Covers the most critical untested code path — ~250 lines of complex branching logic.

---

### Priority 2: ScenarioEngine — `getRegions` and `getDefcon`

**Why:** These functions parse scenario names to determine gameplay parameters. They're pure functions, easy to test, and incorrect behavior silently produces wrong scenarios.

**Specific tests to add:**

1. **`getRegions` keyword matching** — test that `"NATO VS WARSAW PACT"` returns `["us", "nato", "uk", "ussr", "pact"]` (or the appropriate mapped regions), `"CHINA-INDIA CONFRONTATION"` includes both `"china"` and `"india"`, etc.

2. **`getRegions` default fallback** — when no keywords match (e.g., `"UNKNOWN SCENARIO"`), verify it returns `["us", "ussr"]`.

3. **`getDefcon` escalation level mapping** — test that high-severity keywords like `"FIRST STRIKE"` or `"MASSIVE ATTACK"` return DEFCON 1-2, while moderate keywords return 3-4, and unmatched names return the default of 3.

4. **Case insensitivity** — verify both functions handle mixed-case input correctly.

---

### Priority 3: `haversineKm` / `haversineKm2D` Edge Cases

**Why:** The haversine function is used for missile flight time calculation and blast radius detection. Edge cases at geographic extremes could produce `NaN` or incorrect distances.

**Specific tests to add:**

1. **Same point returns 0** — `haversineKm({lat:0, lon:0}, {lat:0, lon:0})` should return 0.

2. **Antipodal points** — `haversineKm({lat:0, lon:0}, {lat:0, lon:180})` should return ~20,015 km (half Earth's circumference).

3. **Polar coordinates** — test with `lat: 89.99` to verify no division-by-zero or `NaN` near the poles.

4. **Longitude wraparound** — verify that `lon: -179` to `lon: 179` computes a short distance (~222 km at equator), not a long one.

5. **Consistency between `haversineKm` and `haversineKm2D`** — both functions should return identical results for the same inputs (they have identical implementations).

---

### Priority 4: `isDestroyed` Boundary Precision

**Why:** The current tests check inside (0.5°) and outside (5°) the 1.27° threshold, but never test AT the boundary. The function uses `<` (strict less-than), so a point at exactly 1.27° should NOT be destroyed.

**Specific tests to add:**

1. **Exactly at threshold (1.27°) — should NOT be destroyed** (strict `<`).
2. **Just inside threshold (1.269°) — should be destroyed**.
3. **Multiple destroyed sites — returns true for proximity to ANY site**.
4. **Negative coordinates** — verify with southern/western hemisphere points.

---

### Priority 5: `addEscalation` Phase Validation

**Why:** The escalation engine is a 200+ line function with 8 distinct phases. Only phase count and delay ordering are currently tested.

**Specific tests to add:**

1. **All 8 phases produce missiles** — verify that a full escalation from a US→USSR initial strike generates missiles in all phases (retaliatory counterstrike, submarine second-strike, full superpower exchange, NATO/Warsaw Pact, UK/France, China, India-Pakistan, global saturation).

2. **Escalation missile origins are valid** — every missile origin should reference a known city/base/sub position from `CITIES` or `SSBN_PATROLS`.

3. **No self-targeting** — verify `origin.lat !== target.lat || origin.lon !== target.lon` holds for every generated missile (the code checks this, but test it).

4. **Phase timing order** — verify that each phase's base delay is strictly greater than the previous phase's.

5. **West vs East side detection** — verify that when only one side is attacked initially, the other side retaliates (not the attacker against itself).

---

### Priority 6: InfoPanel Pure Logic

**Why:** `InfoPanel` has testable pure logic mixed with DOM operations. The calculation logic should be extracted or tested via the existing VM sandbox approach.

**Specific tests to add:**

1. **`formatTimestamp`** — verify `formatTimestamp(3661)` returns `"01:01"`, `formatTimestamp(0)` returns `"00:00"`, etc.

2. **`degradeForces` side detection** — verify that a US-region origin degrades NATO forces, while a USSR-region origin degrades Pact forces.

3. **Casualty deduplication** — verify that `logDetonation` called twice with the same city name only counts casualties once (the `destroyedCities` Set logic).

4. **Force status transitions** — verify `updateForceStatus` transitions from `"READY"` → `"ENGAGED"` (2+ hits) → `"DEGRADED"` (5+ hits).

---

### Priority 7: Scenario Data Integrity (Expand Current Tests)

**Why:** The current tests sample only 20 scenarios for submarine correctness. With 140+ scenarios, full coverage would catch data errors.

**Specific tests to add:**

1. **All scenarios produce at least one missile** — iterate every scenario name through `buildLaunchSequence` and verify `missiles.length > 0`.

2. **No scenario throws an exception** — verify `buildLaunchSequence` completes without error for every scenario name.

3. **All scenario targets resolve to valid cities** — verify every `target.name` in the output exists in `CITIES`.

4. **All scenario origins resolve to valid locations** — verify every `origin.name` exists in `CITIES` or `SSBN_PATROLS`.

---

### Priority 8: MissileSystem `update()` State Machine

**Why:** The `update()` method in both `MissileSystem` and `MissileSystem2D` is the core simulation loop (~80 lines each) and handles multiple state transitions. None of these transitions are directly tested.

**Specific tests to add:**

1. **Missile progresses from 0 to 1 over multiple update calls** — verify `progress` increases monotonically.

2. **Missile with delay waits before starting** — verify `_2dStarted` remains `false` until enough elapsed time.

3. **`onFirstLaunch` fires exactly once** — verify the callback fires on the first missile start and is nulled out afterward.

4. **`onLaunch` fires for each missile** — verify the callback receives correct `(origin, target)` pairs.

5. **Completed missile triggers `createDetonation`** — verify detonation is created when `progress >= 1.0`.

6. **Cleanup removes finished missiles** — in the 3D system, verify `activeMissiles` shrinks after cleaned missiles are filtered.

---

## Infrastructure Recommendations

1. **Run tests in CI** — add a GitHub Actions workflow that runs `node wopr/test/rules.test.js` on push/PR. This prevents regressions.

2. **Add a `--filter` flag to the test runner** — allow running specific test groups (e.g., `node test/rules.test.js --filter "escalation"`) for faster iteration during development.

3. **Consider test setup/teardown helpers** — several tests repeat the same sandbox creation boilerplate. A `createSandbox()` helper would reduce duplication and make new tests easier to write.

4. **Track test count** — add a test count assertion at the end (e.g., `assert.strictEqual(passed, 36)`) to catch accidentally skipped tests.
