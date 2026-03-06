# WOPR Strategy Game — Design Plan

## Vision

Transform the current WOPR nuclear war *simulation* (a passive viewer experience where escalation is predetermined) into an interactive **strategy game** where the player takes the role of a nuclear command authority making real-time decisions under pressure. The game preserves the WarGames aesthetic and the core thesis — "The only winning move is not to play" — but now the player *discovers* that truth through gameplay rather than being told.

---

## Current State (What We Have)

| Asset | Reusable? | Notes |
|-------|-----------|-------|
| 3D globe + 2D map renderers | **Yes** | Core visual canvas for the game |
| ~400 city/base database with lat/lon, population, regions | **Yes** | Becomes the game board |
| Missile arc system (launch, flight, detonation, blast marks) | **Yes** | Core combat animation |
| Escalation engine (8-phase cascade) | **Partially** | Becomes AI opponent logic |
| Terminal UI with typewriter effects | **Yes** | Command input interface |
| Info panel (casualties, force readout, attack graph) | **Yes** | Player HUD |
| CRT aesthetic (CSS) | **Yes** | Defines the mood |
| 30+ hand-crafted scenarios | **Adapt** | Become campaign missions / starting conditions |
| SSBN submarine patrols | **Yes** | Hidden second-strike assets |
| Scenario name list (136 entries) | **Adapt** | Mission select screen |

---

## Game Design

### Core Loop

```
┌─────────────────────────────────────────────────────┐
│                  STRATEGIC PHASE                     │
│  Player allocates forces, sets DEFCON, positions     │
│  submarines, chooses diplomacy vs. escalation        │
│                    (turn-based)                      │
└──────────────────────┬──────────────────────────────┘
                       │ Player commits orders
                       ▼
┌─────────────────────────────────────────────────────┐
│                 EXECUTION PHASE                      │
│  Missiles fly, AI opponent responds, escalation      │
│  cascades play out in compressed real-time           │
│                 (real-time, existing engine)          │
└──────────────────────┬──────────────────────────────┘
                       │ All missiles resolve
                       ▼
┌─────────────────────────────────────────────────────┐
│                 ASSESSMENT PHASE                     │
│  Damage report, casualties, remaining forces,        │
│  diplomatic consequences, score update               │
└──────────────────────┬──────────────────────────────┘
                       │ Next turn or game over
                       ▼
              (back to STRATEGIC PHASE)
```

### Player Role & Objectives

The player commands one side (US/NATO by default, USSR/Pact unlockable). Objectives shift based on the scenario:

| Objective Type | Description | Win Condition |
|---------------|-------------|---------------|
| **Deterrence** | Prevent nuclear war entirely | Survive X turns at DEFCON 3+ without launch |
| **Limited Strike** | Destroy specific military targets without triggering full escalation | Hit targets, keep civilian casualties below threshold |
| **Damage Limitation** | Respond to enemy first strike, minimize own losses | Retain more surviving population than opponent |
| **De-escalation** | Crisis is underway — reduce DEFCON back to 5 | Reach DEFCON 5 without any detonations |

The twist: **there is no "win the nuclear war" objective.** Any scenario that escalates to full exchange results in "WINNER: NONE" — preserving the film's message. The real victories are in *preventing* or *limiting* war.

### Player Actions (Strategic Phase)

Each turn, the player can issue orders via the terminal:

| Command | Effect |
|---------|--------|
| `DEFCON [1-5]` | Raise/lower alert level (affects AI behavior and available actions) |
| `TARGET [city/base]` | Queue a strike on a specific target |
| `LAUNCH` | Execute all queued strikes |
| `RETARGET [from] [to]` | Reassign a missile's target |
| `DEPLOY SUB [patrol-area]` | Reposition an SSBN to a new patrol zone |
| `RECALL` | Cancel queued strikes (only before LAUNCH) |
| `NEGOTIATE` | Attempt diplomatic de-escalation (% chance based on DEFCON + casualties so far) |
| `INTEL` | Reveal enemy force positions (costs 1 turn, partial information) |
| `SHELTER [city]` | Order civil defense for a city (reduces casualty % if hit) |
| `STATUS` | Display current forces, targets, DEFCON |
| `END TURN` | Commit orders and advance to execution phase |

### AI Opponent

The existing escalation engine becomes the AI's decision-making system, enhanced with strategic behaviors:

| AI Behavior | Trigger | Response |
|-------------|---------|----------|
| **Retaliation** | Player launches strikes | AI fires proportional counterstrike |
| **Escalation** | Player hits cities (not just bases) | AI escalates DEFCON, broadens targeting |
| **First Strike** | DEFCON 1 + player inaction for 2 turns | AI may launch preemptive strike |
| **De-escalation** | Player negotiates at DEFCON 3+ | % chance AI agrees to stand down |
| **Second Strike** | AI land forces destroyed | SSBNs fire everything (guaranteed) |
| **Posturing** | DEFCON 2 | AI repositions forces, deploys subs |

The AI should feel like a mirror — it follows the same rules and constraints as the player, creating a genuine strategic dilemma.

### Resource System

Adapt the existing `strategicForces` data into a resource system:

```
US/NATO Forces:
├── ICBMs: 1,054 (fixed silos — vulnerable to first strike)
├── SLBMs: 640 (submarine-launched — survivable)
├── Bombers: 297 (slow but recallable)
└── Total Warheads: 11,000

USSR/Pact Forces:
├── ICBMs: 1,398
├── SLBMs: 980
├── Bombers: 150
└── Total Warheads: 10,000
```

Key mechanics:
- **Silos are targetable** — enemy strikes can destroy unlaunched ICBMs ("use it or lose it" pressure)
- **Submarines are hidden** — position only revealed to opponent via INTEL action
- **Bombers are slow but recallable** — can be launched and recalled before detonation (unique among delivery systems)
- **Warheads are finite** — force depletion is tracked per the existing info panel logic

---

## Implementation Plan

### Phase 1: Game State & Turn System
**Files:** `js/game.js` (new), modify `js/main.js`

- [ ] Create `GameState` object tracking: current turn, DEFCON, forces remaining, queued strikes, diplomacy status, score
- [ ] Add new states to the main state machine: `STRATEGIC`, `EXECUTING`, `ASSESSMENT` (replace current `IDLE`→`EXECUTING`→`AFTERMATH`)
- [ ] Implement turn counter and turn transition logic
- [ ] Wire DEFCON level to be player-controlled (currently auto-derived from scenario name)
- [ ] Add game-over detection (full exchange = "WINNER: NONE", deterrence success, etc.)

### Phase 2: Terminal Command Interface
**Files:** modify `js/terminal.js`

- [ ] Replace scenario selection list with command prompt (`WOPR>` cursor)
- [ ] Implement command parser for: `DEFCON`, `TARGET`, `LAUNCH`, `RECALL`, `DEPLOY SUB`, `NEGOTIATE`, `INTEL`, `SHELTER`, `STATUS`, `END TURN`
- [ ] Add command autocomplete (tab-completion for city names from mapdata.js)
- [ ] Show available commands with `HELP`
- [ ] Add input validation and feedback ("TARGET ACKNOWLEDGED", "INSUFFICIENT FORCES", etc.)
- [ ] Preserve typewriter effect for system responses

### Phase 3: AI Opponent
**Files:** `js/ai.js` (new), modify `js/scenarios-engine.js`

- [ ] Extract escalation logic from `scenarios-engine.js` into reusable AI decision functions
- [ ] Implement AI turn evaluation: assess threat level, choose response (retaliate, escalate, negotiate, posture)
- [ ] Add proportional response logic (AI doesn't always go to full exchange — it mirrors player aggression level)
- [ ] Implement negotiation probability system (based on DEFCON, casualties, turns elapsed)
- [ ] Add AI "personality" variants per scenario (aggressive Soviet hardliner vs. cautious Politburo, etc.)
- [ ] AI telegraph system — show player hints about AI intentions ("SATELLITE DETECTION: ENEMY FORCES MOBILIZING")

### Phase 4: Campaign / Mission System
**Files:** `js/campaign.js` (new), modify `js/scenarios.js`

- [ ] Convert existing 30+ scenarios into campaign missions with:
  - Starting conditions (DEFCON level, pre-positioned forces, geopolitical context)
  - Objective type (deterrence, limited strike, damage limitation, de-escalation)
  - Victory/failure thresholds (casualty caps, turn limits, force preservation requirements)
  - Narrative briefing (reuse existing `narrative` field from scenario definitions)
- [ ] Add mission select screen (replaces current scenario list)
- [ ] Implement scoring: civilian casualties, forces preserved, turns to resolution, escalation avoidance
- [ ] Add mission replay with different strategies
- [ ] "Free Play" mode — sandbox with no objectives (closest to current experience)

### Phase 5: Enhanced Visuals & Feedback
**Files:** modify `js/globe.js`, `js/map2d.js`, `js/infopanel.js`, `js/missiles.js`

- [ ] Add target selection on globe (click city/base to queue as target — highlight in red)
- [ ] Show queued strike lines (dashed arcs from silo to target before launch)
- [ ] Distinguish player missiles (blue/green trails) from AI missiles (red trails)
- [ ] Add DEFCON visual indicator on globe (color shift: green→yellow→orange→red)
- [ ] Submarine position markers (player's subs visible, enemy subs hidden until INTEL)
- [ ] Shelter icons on cities where civil defense is active
- [ ] Add turn counter and objective tracker to info panel
- [ ] Victory/defeat screen with statistics summary

### Phase 6: Polish & Balance
**Files:** all

- [ ] Playtest and tune: negotiation probabilities, AI aggression curves, casualty thresholds
- [ ] Add difficulty levels (AI reaction speed, negotiation willingness, first-strike threshold)
- [ ] Sound effects (optional): launch klaxon, detonation rumble, teletype clicks, DEFCON change alarm
- [ ] Save/load game state (localStorage)
- [ ] Tutorial mission ("FALKEN'S MAZE") that teaches commands step-by-step
- [ ] Ensure mobile touch support works with new command input (virtual keyboard or simplified tap-to-target)

---

## Architecture Notes

### No Build System Required
The project currently uses vanilla JS with script tags. The plan maintains this — new files (`game.js`, `ai.js`, `campaign.js`) are simply added to `index.html` in the correct load order. No bundler, no framework.

### State Machine Evolution

```
Current:    BOOT → IDLE → EXECUTING → AFTERMATH → IDLE
                    ↑ (select scenario)

Proposed:   BOOT → MENU → BRIEFING → STRATEGIC ⇄ EXECUTING → ASSESSMENT → STRATEGIC
                   ↑ (select mission)                                          │
                   └──────────────────── GAME OVER ◄───────────────────────────┘
```

### Data Flow

```
Player Input (terminal.js)
    │
    ▼
Game State (game.js)         ←→  AI Decision (ai.js)
    │                                │
    ├─→ Globe/Map (globe.js)         │
    ├─→ Info Panel (infopanel.js)    │
    └─→ Missile System (missiles.js) ◄┘
```

### Backwards Compatibility
- "Free Play" / sandbox mode preserves the current passive simulation experience
- All existing scenarios remain available as campaign missions
- Globe rendering, missile physics, and CRT aesthetic are unchanged

---

## Summary

The transformation adds **player agency** to an already-polished simulation. The key insight is that most of the hard work is done — the globe, missiles, cities, escalation engine, and terminal UI are all excellent foundations. The main new systems are:

1. **Turn structure** (game.js) — ~300 lines
2. **Command parser** (terminal.js modifications) — ~200 lines
3. **AI opponent** (ai.js) — ~400 lines
4. **Campaign missions** (campaign.js + scenarios.js modifications) — ~300 lines
5. **Visual feedback** (globe/map/panel modifications) — ~200 lines

Estimated total: **~1,400 lines of new/modified code** across 6 phases, building on the existing 5,500-line codebase.

The game's thesis remains intact: the player who "wins" is the one who prevents nuclear war. Every other outcome is mutual destruction. But now, the player learns that lesson by *playing* — not just watching.

> "A strange game. The only winning move is not to play. How about a nice game of chess?"
