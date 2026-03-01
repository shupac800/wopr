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

  // Build a launch sequence for a strategy
  buildLaunchSequence(strategyName) {
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

    const originCities = this.getCitiesForRegions(originRegions);

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

    this.executionCount++;

    return {
      name: strategyName,
      defcon,
      missiles,
      regions,
    };
  }

  shouldEndGame() {
    return this.executionCount >= 4;
  }
}
