# WOPR Game Mode — Implementation Plan

## Concept: "STRATEGIC DEFENSE"

The player takes the role of a **defender** trying to minimize casualties against an incoming nuclear strike. The attacker (WOPR/AI) launches missiles according to the existing scenario system. The player's job is to **allocate limited interceptors and civil defense resources** to save as many lives as possible.

This preserves the WarGames theme — the lesson is still "you can't win a nuclear war" — but now the player has agency, decisions matter, and there's a score.

---

## Game Mechanics

### 1. Resource Allocation Phase (Pre-Strike)

Before the scenario executes, the player gets a **30-second planning window** (with a terminal countdown) to allocate defenses. They receive a limited budget of **defense points** (e.g., 12) to spend on:

| Defense | Cost | Effect |
|---|---|---|
| **ABM Site** | 3 pts | Place an anti-ballistic missile battery at a city. Intercepts 1 incoming missile within ~3° radius. Single-use. |
| **Civil Defense** | 1 pt | Evacuate a city. Reduces casualties there by 60% if hit. |
| **Decoy City** | 2 pts | Place a false radar signature. 40% chance an incoming missile targeting a nearby city retargets to the decoy (misses). |
| **EMP Hardening** | 2 pts | Protect a military base from destruction, keeping it operational for retaliation (delays escalation). |

**Interaction model:** The player clicks cities on the map (2D or 3D) to place defenses. A small radial menu appears on click with the available options. The terminal panel shows remaining budget and placed defenses.

### 2. Execution Phase (Strike Plays Out)

The scenario runs as it does today, but with defense interactions:

- **ABM intercepts**: When a missile enters the radius of an ABM site, the missile is destroyed mid-flight. A blue flash plays instead of a white detonation. The trail turns blue and fades. The ABM is consumed.
- **Civil defense**: Cities with evacuation show a shield icon. If hit, casualties are reduced by 60% and the detonation flash is dimmer.
- **Decoys**: If a missile's target is within range of a decoy, roll a 40% chance to redirect. The missile visibly curves toward empty ground and detonates harmlessly.
- **Hardened bases**: Protected bases survive detonation and continue launching retaliatory missiles, potentially changing the escalation dynamics.

The player **cannot act** during the execution phase — all decisions were made in the planning window. This keeps the existing animation system intact and reinforces the theme of irreversibility.

### 3. Aftermath & Scoring

After the scenario completes, the existing aftermath display is extended with:

```
SCENARIO ASSESSMENT
  MISSILES LAUNCHED:     247
  MISSILES INTERCEPTED:    3
  CITIES HIT:             89
  CITIES DEFENDED:         4
  CASUALTIES:          211.4M
  CASUALTIES PREVENTED: 18.7M

  RATING: D+ (CATASTROPHIC)
```

**Rating scale** (based on % of total possible casualties prevented):

| Rating | Casualties Prevented |
|---|---|
| A+ (MIRACULOUS) | > 40% |
| A (EXCEPTIONAL) | 30–40% |
| B (COMMENDABLE) | 20–30% |
| C (ADEQUATE) | 10–20% |
| D (INSUFFICIENT) | 5–10% |
| F (CATASTROPHIC) | < 5% |

The rating is intentionally harsh — even a perfect game can't prevent most casualties. The best you can do is an A+, never 100%. This preserves the WarGames message.

**High scores** are stored in `localStorage` per scenario name, displayed on the scenario list as letter grades.

---

## Implementation Plan

### Step 1: Game State Manager (`js/gamestate.js`)

New module that tracks game mode and defense placements.

```js
class GameState {
  constructor() {
    this.mode = 'classic';        // 'classic' | 'defense'
    this.budget = 12;
    this.placements = [];         // {type, lat, lon, cityName, radius}
    this.intercepted = 0;
    this.casualtiesPrevented = 0;
    this.scores = JSON.parse(localStorage.getItem('wopr_scores') || '{}');
  }

  placeDef(type, city) { /* deduct budget, record placement */ }
  removeDef(index) { /* refund budget, remove placement */ }
  getRating(casualtiesPrevented, totalCasualties) { /* return letter grade */ }
  saveScore(scenarioName, rating) { /* persist to localStorage */ }
  reset() { /* clear placements for new scenario */ }
}
```

**Estimated size:** ~120 lines.

### Step 2: Defense Placement UI (`js/defense-ui.js`)

Handles the planning phase interaction — clicking cities, showing the radial menu, rendering placed defense markers on the map.

- Listens for clicks on the map/globe during planning phase
- Shows a radial menu with available defenses (filtered by budget)
- Renders defense markers: shield icons for civil defense, diamond icons for ABMs, ghost icons for decoys
- Shows budget counter in the terminal panel
- Countdown timer (30s) in the terminal, with "DEPLOY DEFENSES" prompt

**Interaction with existing code:**
- Hooks into `MapRenderer2D.canvas` click events (2D mode)
- Hooks into `GlobeRenderer` raycasting (3D mode) — the globe already has `latLonToVec3`
- Uses `latLonToXY` / `latLonToVec3` to position markers

**Estimated size:** ~250 lines.

### Step 3: Intercept Logic in MissileSystem (`js/missiles.js` + `js/map2d.js`)

Add defense resolution to the `update()` loop in both missile systems.

```js
// In update(), after a missile starts but before it detonates:
if (gameState && gameState.mode === 'defense') {
  // Check ABM intercept
  for (const def of gameState.placements) {
    if (def.type === 'abm' && !def.used) {
      const dist = haversineKm(missileCurrentPos, def);
      if (dist < ABM_RANGE_KM) {
        def.used = true;
        m.intercepted = true;
        m.done = true;
        gameState.intercepted++;
        this.createInterception(missileCurrentPos); // blue flash
        break;
      }
    }
  }

  // Check decoy redirect (at launch time, not mid-flight)
  // Check civil defense (at detonation time — reduce casualties)
}
```

**Changes to existing files:**
- `missiles.js`: ~40 new lines in `update()`, new `createInterception()` method (~20 lines)
- `map2d.js`: ~40 new lines in `MissileSystem2D.update()`, blue flash rendering (~15 lines)

### Step 4: Modified Casualty Calculation (`js/infopanel.js`)

Modify `logDetonation` to check for civil defense:

```js
if (gameState && gameState.mode === 'defense') {
  const civilDef = gameState.placements.find(
    d => d.type === 'civildefense' && d.cityName === targetCity.name
  );
  if (civilDef) {
    // 60% reduction
    const baseCasualties = targetCity.pop * (0.3 + Math.random() * 0.4);
    const reduced = baseCasualties * 0.4;
    gameState.casualtiesPrevented += baseCasualties - reduced;
    this.casualties += reduced;
  } else {
    // existing logic
  }
}
```

**Changes:** ~20 lines in `infopanel.js`.

### Step 5: Planning Phase in Main Loop (`js/main.js`)

Insert a planning phase between scenario selection and missile launch:

```js
async function runScenario(scenarioName) {
  // ... existing setup ...

  if (gameState.mode === 'defense') {
    // Show planning UI
    terminal.setStatus('DEPLOY DEFENSES');
    await terminal.typewrite('INCOMING THREAT DETECTED. ALLOCATE DEFENSES.', 'bright');
    await terminal.typewrite(`DEFENSE BUDGET: ${gameState.budget} POINTS`, 'dim');
    await terminal.typewrite('CLICK CITIES TO PLACE DEFENSES. PRESS ENTER WHEN READY.', 'dim');

    // Enable defense placement clicks
    defenseUI.enable(gameState);

    // 30-second countdown (or Enter to skip)
    await defenseUI.waitForReady(30000);

    defenseUI.disable();
    await terminal.typewrite('DEFENSES LOCKED. INITIATING SCENARIO...', 'bright');
  }

  // ... existing missile launch code ...
}
```

**Changes:** ~30 lines in `main.js`.

### Step 6: Mode Toggle

Add a "GAME MODE" toggle to the terminal boot sequence or scenario list. Simple keyboard shortcut: press `G` to toggle between `CLASSIC` (current behavior) and `DEFENSE` (new game mode). Display current mode in the terminal header.

**Changes:** ~15 lines in `terminal.js`, ~10 lines in `main.js`.

### Step 7: Aftermath Enhancement (`js/terminal.js`)

Extend `showAftermath` to display defense statistics and rating when in game mode:

```js
if (gameState.mode === 'defense') {
  await this.typewrite(`  MISSILES INTERCEPTED: ${gameState.intercepted}`, 'dim');
  await this.typewrite(`  CASUALTIES PREVENTED: ${gameState.casualtiesPrevented.toFixed(1)}M`, 'dim');
  const rating = gameState.getRating(gameState.casualtiesPrevented, totalCasualties);
  await this.typewrite(`  RATING: ${rating}`, 'bright');
  gameState.saveScore(scenarioName, rating);
}
```

**Changes:** ~25 lines in `terminal.js`.

### Step 8: Score Display on Scenario List

Show the player's best rating next to each scenario name in the list:

```
  1. USSR FIRST STRIKE              [B]
  2. NATO VS WARSAW PACT            [D+]
  3. CHINA-INDIA CONFRONTATION      [--]
```

**Changes:** ~15 lines in `terminal.js` `buildScenarioList`.

---

## New Files

| File | Purpose | Est. Lines |
|---|---|---|
| `js/gamestate.js` | Game state, budget, scores, ratings | ~120 |
| `js/defense-ui.js` | Planning phase UI, click handlers, defense markers | ~250 |

## Modified Files

| File | Changes | Est. Lines Added |
|---|---|---|
| `js/main.js` | Planning phase, mode toggle, gameState wiring | ~50 |
| `js/missiles.js` | ABM intercept check, `createInterception()` | ~60 |
| `js/map2d.js` | ABM intercept check, blue flash rendering | ~55 |
| `js/infopanel.js` | Civil defense casualty reduction | ~20 |
| `js/terminal.js` | Extended aftermath, score display, mode indicator | ~40 |
| `index.html` | Load new JS files, add mode toggle UI element | ~5 |

**Total new code: ~600 lines** across 2 new files and 6 modified files.

---

## Why This Design Works

1. **Minimal disruption** — Classic mode is completely unchanged. All new behavior is gated behind `gameState.mode === 'defense'`.

2. **Fits the architecture** — No new frameworks, no build tools, no npm. Pure vanilla JS, same patterns as existing code.

3. **Preserves the theme** — You can't win. Even an optimal defense barely dents total casualties. The rating scale is deliberately brutal. The message remains: nuclear war is unwinnable.

4. **Reuses everything** — The scenario engine, escalation system, missile physics, rendering, and info panel all work as-is. Defenses are a thin layer on top.

5. **Player agency is real** — Where you place ABMs matters (high-population cities vs. military bases). Civil defense is cheap but weak. Decoys are a gamble. Budget forces hard tradeoffs. Different scenarios reward different strategies.

6. **Replayability** — 140+ scenarios × strategic variety = high replay value. Per-scenario high scores encourage replaying with different strategies.
