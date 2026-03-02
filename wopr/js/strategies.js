// Strategy Engine — loads strategies.json, maps to cities, assigns DEFCON

class StrategyEngine {
  constructor() {
    this.strategies = [];
    this.executionCount = 0;
  }

  async load() {
    try {
      const res = await fetch('data/strategies.json');
      const data = await res.json();
      this.strategies = data.strategies;
    } catch (e) {
      // fetch fails on file:// protocol — fall back to embedded data
      console.warn('fetch failed (file:// protocol?), using embedded strategies');
      this.strategies = EMBEDDED_STRATEGIES;
    }
    return this.strategies;
  }

  // Parse a strategy name to determine involved regions
  getRegions(strategyName) {
    const regions = new Set();
    const upper = strategyName.toUpperCase();

    // Check each keyword against the strategy name
    for (const [keyword, regionList] of Object.entries(REGION_KEYWORDS)) {
      if (upper.includes(keyword)) {
        regionList.forEach(r => regions.add(r));
      }
    }

    // If no regions matched, assign some defaults
    if (regions.size === 0) {
      regions.add("us");
      regions.add("ussr");
    }

    return [...regions];
  }

  // Determine DEFCON level from strategy name
  getDefcon(strategyName) {
    const upper = strategyName.toUpperCase();

    for (const [level, keywords] of Object.entries(ESCALATION_KEYWORDS)) {
      for (const kw of keywords) {
        if (upper.includes(kw)) {
          return parseInt(level);
        }
      }
    }
    return 3; // default mid-level
  }

  // Get cities for a set of regions
  getCitiesForRegions(regions) {
    return CITIES.filter(c => regions.includes(c.region));
  }

  // Resolve a city name to a CITIES object (case-insensitive)
  resolveCity(name) {
    const upper = name.toUpperCase();
    return CITIES.find(c => c.name === upper);
  }

  // Resolve a launch origin — substitute cities with actual military launch sites
  // ICBMs launch from silos and cosmodromes, not city centers
  resolveLaunchOrigin(name) {
    const exact = this.resolveCity(name);
    if (!exact) return null;

    // If it's already a base, use it directly
    if (exact.type === 'base') return exact;

    // Find military bases in the same region
    if (!this._basesCache) {
      this._basesCache = {};
      for (const c of CITIES) {
        if (c.type === 'base') {
          if (!this._basesCache[c.region]) this._basesCache[c.region] = [];
          this._basesCache[c.region].push(c);
        }
      }
    }

    const regionBases = this._basesCache[exact.region];
    if (regionBases && regionBases.length > 0) {
      // Pick from the pool using a rotating index per region
      if (!this._baseIdx) this._baseIdx = {};
      if (!(exact.region in this._baseIdx)) this._baseIdx[exact.region] = 0;
      const base = regionBases[this._baseIdx[exact.region] % regionBases.length];
      this._baseIdx[exact.region]++;
      return base;
    }

    // No bases in this region — fall back to the city
    return exact;
  }

  // Reset the base rotation index (call between scenarios for variety)
  resetLaunchRotation() {
    this._baseIdx = {};
  }

  // Build a launch sequence for a strategy
  buildLaunchSequence(strategyName) {
    this.resetLaunchRotation();
    // Check for hand-crafted scenario first
    if (typeof STRATEGY_SCENARIOS !== 'undefined' && STRATEGY_SCENARIOS[strategyName]) {
      return this.buildFromScenario(strategyName, STRATEGY_SCENARIOS[strategyName]);
    }
    return this.buildGenericSequence(strategyName);
  }

  // Build launch sequence from a hand-crafted scenario
  buildFromScenario(strategyName, scenario) {
    const defcon = scenario.defcon || this.getDefcon(strategyName);
    const missiles = [];
    const regions = this.getRegions(strategyName);
    const submarines = assignSubmarines(regions, defcon);

    // Index subs by nation for quick lookup
    const subsByNation = {};
    for (const s of submarines) {
      if (!subsByNation[s.nation]) subsByNation[s.nation] = [];
      subsByNation[s.nation].push(s);
    }

    // Track which subs have been used as origins (round-robin per nation)
    const subUsageIdx = {};

    // Pick next available sub for a given nation
    const pickSub = (nation) => {
      const pool = subsByNation[nation];
      if (!pool || pool.length === 0) return null;
      if (!(nation in subUsageIdx)) subUsageIdx[nation] = 0;
      const sub = pool[subUsageIdx[nation] % pool.length];
      subUsageIdx[nation]++;
      return sub;
    };

    // Collect all target locations from prior waves (for retaliation filtering)
    const priorTargetLocs = []; // {lat, lon} of prior targets

    for (const wave of scenario.waves) {
      const baseDelay = wave.delay || 0;

      // Resolve targets
      const targets = (wave.to || []).map(n => this.resolveCity(n)).filter(Boolean);
      if (targets.length === 0) continue;

      // Resolve origins — substitute cities with actual military launch sites
      let origins = (wave.from || []).map(n => this.resolveLaunchOrigin(n)).filter(Boolean);

      // Resolve submarine origins — fromSubs: ["us", "uk"] or fromSubs: "ussr"
      let subOrigins = [];
      if (wave.fromSubs) {
        const nations = Array.isArray(wave.fromSubs) ? wave.fromSubs : [wave.fromSubs];
        for (const nation of nations) {
          // Pick enough subs to cover targets (round-robin)
          for (let i = 0; i < Math.ceil(targets.length / Math.max(nations.length, 1)); i++) {
            const sub = pickSub(nation);
            if (sub) {
              subOrigins.push({
                name: sub.name, lat: sub.lat, lon: sub.lon,
                region: sub.nation, type: "sub", pop: 0,
              });
            }
          }
        }
      }

      // Combine land + sub origins
      const allOrigins = origins.concat(subOrigins);

      // Filter origins for retaliation waves — skip origins near prior target sites
      // Uses ~1.44° proximity (same as runtime blast radius check)
      // Subs are never targeted so they always survive for retaliation
      const isNearPriorTarget = (c) => {
        const thresh = 1.44 * 1.44;
        return priorTargetLocs.some(t => {
          const dlat = c.lat - t.lat, dlon = c.lon - t.lon;
          return dlat * dlat + dlon * dlon < thresh;
        });
      };
      const activeOrigins = wave.retaliation
        ? allOrigins.filter(c => c.type === "sub" || !isNearPriorTarget(c))
        : allOrigins;

      if (activeOrigins.length === 0) continue;

      // Build missiles for this wave, staggering within the wave
      let missileIdx = 0;
      for (const target of targets) {
        const origin = activeOrigins[missileIdx % activeOrigins.length];
        if (origin.lat !== target.lat || origin.lon !== target.lon) {
          missiles.push({
            origin,
            target,
            delay: baseDelay + missileIdx * (300 + Math.random() * 200),
          });
        }
        missileIdx++;
      }

      // Record this wave's target locations for future retaliation checks
      for (const t of targets) {
        priorTargetLocs.push({ lat: t.lat, lon: t.lon });
      }
    }

    // Fallback: if no missiles resolved, use generic logic
    if (missiles.length === 0) {
      return this.buildGenericSequence(strategyName);
    }

    // ESCALATION — any nuclear use inevitably leads to global annihilation
    this.addEscalation(missiles, submarines, priorTargetLocs);

    // Escalation involves ALL submarine nations — ensure they're all shown
    const allSubs = assignSubmarines(
      ["us", "nato", "uk", "ussr", "pact", "france", "china"], 1
    );
    // Merge without duplicates
    const subNames = new Set(submarines.map(s => s.name));
    for (const s of allSubs) {
      if (!subNames.has(s.name)) { submarines.push(s); subNames.add(s.name); }
    }

    this.executionCount++;

    return {
      name: strategyName,
      defcon: 1, // escalation always reaches DEFCON 1
      missiles,
      regions,
      narrative: scenario.narrative || null,
      submarines,
    };
  }

  // Original generic launch sequence builder
  buildGenericSequence(strategyName) {
    const regions = this.getRegions(strategyName);
    const defcon = this.getDefcon(strategyName);
    const targetCities = this.getCitiesForRegions(regions);

    // Determine origin cities (aggressors)
    let originRegions;
    const upper = strategyName.toUpperCase();

    if (upper.includes("USSR") || upper.includes("RUSSIAN") || upper.includes("PACT") || upper.includes("WARSAW")) {
      originRegions = ["ussr"];
    } else if (upper.includes("U.S.") || upper.includes("NATO") || upper.includes("SEATO") || upper.includes("ALASKAN") || upper.includes("CANADIAN")) {
      originRegions = ["us"];
    } else if (upper.includes("CHINA")) {
      originRegions = ["china"];
    } else if (upper.includes("INDIA")) {
      originRegions = ["india"];
    } else {
      // Default: both superpowers exchange
      originRegions = ["us", "ussr"];
    }

    // Prefer military bases as launch origins; fall back to cities
    const allOriginCandidates = this.getCitiesForRegions(originRegions);
    const originBases = allOriginCandidates.filter(c => c.type === 'base');
    const originCities = originBases.length > 0 ? originBases : allOriginCandidates;

    // If targets overlap with origins, add the other superpower as target
    if (originRegions.includes("us") && targetCities.every(c => c.region === "us")) {
      this.getCitiesForRegions(["ussr"]).forEach(c => targetCities.push(c));
    }
    if (originRegions.includes("ussr") && targetCities.every(c => c.region === "ussr")) {
      this.getCitiesForRegions(["us"]).forEach(c => targetCities.push(c));
    }

    // Build missile pairs
    const missiles = [];
    const numMissiles = Math.min(
      Math.max(3, Math.ceil((6 - defcon) * 3)),
      targetCities.length,
      15
    );

    for (let i = 0; i < numMissiles; i++) {
      const origin = originCities[i % originCities.length];
      const target = targetCities[i % targetCities.length];
      if (origin && target && (origin.lat !== target.lat || origin.lon !== target.lon)) {
        missiles.push({
          origin,
          target,
          delay: i * 400 + Math.random() * 300,
        });
      }
    }

    // Ensure we have at least one missile
    if (missiles.length === 0 && originCities.length > 0 && CITIES.length > 0) {
      const fallbackTarget = CITIES.find(c => !originRegions.includes(c.region)) || CITIES[0];
      missiles.push({
        origin: originCities[0],
        target: fallbackTarget,
        delay: 0,
      });
    }

    const submarines = assignSubmarines(regions, defcon);

    // ESCALATION — any nuclear use inevitably leads to global annihilation
    this.addEscalation(missiles, submarines, []);

    // Escalation involves ALL submarine nations
    const allSubs = assignSubmarines(
      ["us", "nato", "uk", "ussr", "pact", "france", "china"], 1
    );
    const subNames = new Set(submarines.map(s => s.name));
    for (const s of allSubs) {
      if (!subNames.has(s.name)) { submarines.push(s); subNames.add(s.name); }
    }

    this.executionCount++;

    return {
      name: strategyName,
      defcon: 1, // escalation always reaches DEFCON 1
      missiles,
      regions,
      submarines,
    };
  }

  // ============================================================
  // ESCALATION ENGINE — "The only winning move is not to play."
  // Any nuclear exchange inevitably escalates to global annihilation.
  // Appends waves of counterstrikes, retaliations, and full exchanges
  // until every missile on earth has been launched.
  // ============================================================

  addEscalation(missiles, submarines, alreadyTargeted) {
    // Find the latest delay in the existing scenario
    let maxDelay = 0;
    for (const m of missiles) {
      if (m.delay > maxDelay) maxDelay = m.delay;
    }

    // Collect all cities and bases by region groupings
    const westBlock = ["us", "uk", "nato", "canada", "alaska", "hawaii", "french", "english",
                       "italian", "turkish", "danish", "iceland", "greenland", "portugal",
                       "australian", "seato", "fareast", "bavarian", "swiss", "norwegian"];
    const eastBlock = ["ussr", "pact", "czech", "romanian", "bulgarian", "albanian",
                       "mongolian", "caspian", "arctic"];
    const otherNuclear = ["china", "india", "pakistan", "israel", "france"];
    const allRegions = [...new Set([...westBlock, ...eastBlock, ...otherNuclear,
                       "cuba", "iraq", "iranian", "syrian", "libyan", "egypt",
                       "saudi", "s.african", "brazilian", "argentina", "chile",
                       "mexico", "venezuelan", "colombian", "kenya", "ethiopian",
                       "zaire", "uganda", "chad", "moroccan", "algerian", "tunisian",
                       "sudan", "gabon", "taiwan", "hongkong", "thai", "vietnamese",
                       "cambodian", "burmese", "malaysian", "bangladesh", "lebanon",
                       "nicaragua", "jamaica", "afghan", "cyprus"])];

    // Helper: get cities for a set of regions (non-base cities only, for targeting)
    const citiesFor = (regions) => CITIES.filter(c => regions.includes(c.region) && c.type !== 'base');
    const basesFor = (regions) => CITIES.filter(c => regions.includes(c.region) && c.type === 'base');
    const allCitiesFor = (regions) => CITIES.filter(c => regions.includes(c.region));

    // Track what's been targeted to avoid exact duplicates in same wave
    const targeted = new Set(alreadyTargeted || []);

    // Stagger constant for missile spacing within a wave
    const STAGGER = 180;

    // Which sides were involved in the initial exchange?
    const originRegions = new Set();
    const targetRegions = new Set();
    for (const m of missiles) {
      if (m.origin.region) originRegions.add(m.origin.region);
      if (m.target.region) targetRegions.add(m.target.region);
    }

    // Helper to add a salvo of missiles
    const addSalvo = (origins, targets, baseDelay) => {
      if (origins.length === 0 || targets.length === 0) return;
      let idx = 0;
      for (const target of targets) {
        const origin = origins[idx % origins.length];
        if (origin.lat !== target.lat || origin.lon !== target.lon) {
          missiles.push({
            origin,
            target,
            delay: baseDelay + idx * STAGGER + Math.random() * 100,
          });
        }
        idx++;
      }
    };

    // --- PHASE 1: Retaliatory counterstrikes (T + 4s after last missile) ---
    // The attacked side fires back at the attacker's major cities
    let t = maxDelay + 4000;

    // Did the West attack? East retaliates against Western cities
    const westAttacked = [...targetRegions].some(r => eastBlock.includes(r));
    const eastAttacked = [...targetRegions].some(r => westBlock.includes(r));

    if (westAttacked) {
      // East retaliates
      const eastBases = basesFor(eastBlock);
      const westCities = citiesFor(westBlock).sort((a, b) => (b.pop || 0) - (a.pop || 0)).slice(0, 25);
      addSalvo(eastBases.length > 0 ? eastBases : allCitiesFor(eastBlock).slice(0, 10), westCities, t);
    }
    if (eastAttacked) {
      // West retaliates
      const westBases = basesFor(westBlock);
      const eastCities = citiesFor(eastBlock).sort((a, b) => (b.pop || 0) - (a.pop || 0)).slice(0, 25);
      addSalvo(westBases.length > 0 ? westBases : allCitiesFor(westBlock).slice(0, 10), eastCities, t);
    }

    // --- PHASE 2: Submarine second-strike (T + 7s) ---
    // All submarine nations fire at enemy population centers
    t += 3000;
    const subNations = Object.keys(SSBN_PATROLS);
    for (const nation of subNations) {
      const subs = SSBN_PATROLS[nation];
      if (!subs || subs.length === 0) continue;

      let subTargets;
      if (["us", "uk", "france"].includes(nation)) {
        subTargets = citiesFor(eastBlock).sort((a, b) => (b.pop || 0) - (a.pop || 0)).slice(0, 8);
      } else if (nation === "ussr") {
        subTargets = citiesFor(westBlock).sort((a, b) => (b.pop || 0) - (a.pop || 0)).slice(0, 10);
      } else {
        // China etc — target regional rivals
        subTargets = citiesFor(westBlock.concat(["india", "fareast"])).sort((a, b) => (b.pop || 0) - (a.pop || 0)).slice(0, 4);
      }

      const subOrigins = subs.map(s => ({
        name: s.name, lat: s.lat, lon: s.lon,
        region: nation, type: "sub", pop: 0,
      }));
      addSalvo(subOrigins, subTargets, t);
    }

    // --- PHASE 3: Full superpower exchange (T + 12s) ---
    // US and USSR fire everything at each other's cities — countervalue strike
    t += 5000;
    const usCities = citiesFor(["us"]).sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const ussrCities = citiesFor(["ussr"]).sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const usBases = basesFor(["us", "alaska", "hawaii", "canada"]);
    const ussrBases = basesFor(["ussr"]);

    // USSR fires at all US cities
    addSalvo(ussrBases.length > 0 ? ussrBases : ussrCities.slice(0, 15), usCities, t);
    // US fires at all USSR cities
    addSalvo(usBases.length > 0 ? usBases : usCities.slice(0, 15), ussrCities, t + 500);

    // --- PHASE 4: NATO/Warsaw Pact full exchange (T + 17s) ---
    t += 5000;
    const natoCities = citiesFor(["nato", "uk", "french", "english", "italian", "turkish"]);
    const pactCities = citiesFor(["pact", "czech", "romanian", "bulgarian"]);
    const natoBases = basesFor(["nato", "uk"]);
    const pactBases = basesFor(["pact"]);

    addSalvo(pactBases.length > 0 ? pactBases : pactCities.slice(0, 8), natoCities, t);
    addSalvo(natoBases.length > 0 ? natoBases : natoCities.slice(0, 8), pactCities, t + 300);

    // UK/France fire at USSR
    const ukBases = basesFor(["uk"]);
    const frBases = basesFor(["france"]);
    addSalvo(ukBases.length > 0 ? ukBases : citiesFor(["uk"]).slice(0, 3), ussrCities.slice(0, 8), t + 600);
    addSalvo(frBases.length > 0 ? frBases : citiesFor(["french"]).slice(0, 3), ussrCities.slice(0, 6), t + 900);

    // --- PHASE 5: China enters (T + 22s) ---
    t += 5000;
    const chinaCities = citiesFor(["china"]);
    const chinaBases = basesFor(["china"]);
    const chinaOrigins = chinaBases.length > 0 ? chinaBases : chinaCities.slice(0, 5);

    // China fires at USSR and US
    addSalvo(chinaOrigins, ussrCities.slice(0, 10), t);
    addSalvo(chinaOrigins, usCities.slice(0, 6), t + 1500);

    // USSR and US fire at China
    addSalvo(ussrBases.length > 0 ? ussrBases.slice(0, 5) : ussrCities.slice(0, 5), chinaCities, t + 2000);
    addSalvo(usBases.length > 0 ? usBases.slice(0, 5) : usCities.slice(0, 5), chinaCities.slice(0, 10), t + 2500);

    // --- PHASE 6: Regional nuclear powers (T + 28s) ---
    t += 6000;

    // India-Pakistan exchange
    const indiaCities = citiesFor(["india"]).sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const pakCities = citiesFor(["pakistan"]).sort((a, b) => (b.pop || 0) - (a.pop || 0));
    if (indiaCities.length > 0 && pakCities.length > 0) {
      addSalvo(indiaCities.slice(0, 4), pakCities, t);
      addSalvo(pakCities.slice(0, 3), indiaCities.slice(0, 8), t + 800);
    }

    // Israel fires at regional threats
    const israelCities = allCitiesFor(["israel"]);
    const mideastTargets = citiesFor(["iraq", "iranian", "syrian", "egypt", "saudi", "libyan"]);
    if (israelCities.length > 0 && mideastTargets.length > 0) {
      addSalvo(israelCities, mideastTargets, t + 1500);
    }

    // --- PHASE 7: Global saturation — every remaining city targeted (T + 35s) ---
    // "USE IT OR LOSE IT" — all remaining forces fire at everything
    t += 7000;

    // Collect ALL bases and ALL cities
    const allBases = CITIES.filter(c => c.type === 'base');
    const allTargetCities = CITIES.filter(c => c.type !== 'base').sort((a, b) => (b.pop || 0) - (a.pop || 0));

    // Fire from every base at cities in other regions
    let globalIdx = 0;
    for (const base of allBases) {
      // Pick targets not in the same region
      const enemies = allTargetCities.filter(c => c.region !== base.region);
      // Each base fires 2-3 missiles at different targets
      const numShots = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numShots && i < enemies.length; i++) {
        const target = enemies[(globalIdx + i) % enemies.length];
        missiles.push({
          origin: base,
          target,
          delay: t + globalIdx * 80 + Math.random() * 150,
        });
      }
      globalIdx += numShots;
    }

    // --- PHASE 8: Final submarine salvo — empty the tubes (T + 42s) ---
    t += 7000;
    for (const nation of subNations) {
      const subs = SSBN_PATROLS[nation];
      if (!subs) continue;
      // Every sub fires at the nearest major enemy cities
      const enemies = (["us", "uk", "france"].includes(nation))
        ? citiesFor(eastBlock.concat(["china"])).sort((a, b) => (b.pop || 0) - (a.pop || 0))
        : citiesFor(westBlock).sort((a, b) => (b.pop || 0) - (a.pop || 0));

      for (let si = 0; si < subs.length; si++) {
        const sub = subs[si];
        const subOrigin = { name: sub.name, lat: sub.lat, lon: sub.lon, region: nation, type: "sub", pop: 0 };
        // Each sub fires 3-4 missiles
        const numShots = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numShots && i < enemies.length; i++) {
          const target = enemies[(si * numShots + i) % enemies.length];
          missiles.push({
            origin: subOrigin,
            target,
            delay: t + (si * numShots + i) * 200 + Math.random() * 100,
          });
        }
      }
    }

    return missiles;
  }

  shouldEndGame() {
    return this.executionCount >= 4;
  }
}
