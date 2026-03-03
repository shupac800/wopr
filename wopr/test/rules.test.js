// Rule enforcement tests for WOPR missile systems
// Run: node test/rules.test.js

const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// ── Minimal Three.js mock ──────────────────────────────────────────────
const THREE_MOCK = `
const THREE = {
  Vector3: class { constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0;}
    copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
    clone(){return new THREE.Vector3(this.x,this.y,this.z);}
    lerpVectors(a,b,t){this.x=a.x+(b.x-a.x)*t;this.y=a.y+(b.y-a.y)*t;this.z=a.z+(b.z-a.z)*t;return this;}
    normalize(){const l=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)||1;this.x/=l;this.y/=l;this.z/=l;return this;}
    multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
    distanceTo(v){const d=this.x-v.x,e=this.y-v.y,f=this.z-v.z;return Math.sqrt(d*d+e*e+f*f);}
    subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}
    crossVectors(a,b){this.x=a.y*b.z-a.z*b.y;this.y=a.z*b.x-a.x*b.z;this.z=a.x*b.y-a.y*b.x;return this;}
    dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  },
  BufferGeometry: class { setFromPoints(){return this;} setAttribute(){} setIndex(){} computeVertexNormals(){} setDrawRange(){} get attributes(){return {position:{array:[]}};} },
  Float32BufferAttribute: class { constructor(){} },
  BufferAttribute: class { constructor(){} },
  LineBasicMaterial: class { constructor(o){Object.assign(this,o);} },
  MeshBasicMaterial: class { constructor(o){Object.assign(this,o);} },
  ShaderMaterial: class { constructor(o){Object.assign(this,o);} },
  Line: class { constructor(){this.position=new THREE.Vector3();} },
  LineSegments: class { constructor(){this.position=new THREE.Vector3();} setRotationFromMatrix(){} },
  Mesh: class { constructor(){this.position=new THREE.Vector3();this.scale={setScalar(){},set(){}};} lookAt(){} },
  EdgesGeometry: class { constructor(){} },
  RingGeometry: class { constructor(){} },
  SphereGeometry: class { constructor(){} },
  Matrix4: class { makeBasis(){return this;} },
  Color: class { constructor(){} },
  DoubleSide: 2,
};
`;

// ── Build sandbox with source files ────────────────────────────────────
function buildSandbox() {
  const sandbox = { console, Math, Object, Array, Set, Map, parseInt, setTimeout: ()=>{}, clearTimeout: ()=>{} };
  const ctx = vm.createContext(sandbox);

  // Global config flags (normally set in index.html)
  vm.runInContext('const THEATRICAL_TIMING = true; const TIME_COMPRESSION = 360;', ctx);

  // Load Three.js mock
  vm.runInContext(THREE_MOCK, ctx);

  // Load source files in dependency order
  const files = ['js/mapdata.js', 'js/scenarios.js', 'js/strategies.js', 'js/missiles.js', 'js/map2d.js'];
  for (const f of files) {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    // Strip lines that reference DOM/browser APIs not needed for logic tests
    const cleaned = src
      .replace(/document\.\w+/g, 'null')
      .replace(/window\.\w+/g, 'null');
    try {
      vm.runInContext(cleaned, ctx);
    } catch (e) {
      // map2d.js has a MapRenderer2D class that needs canvas — skip it, we only need MissileSystem2D
      if (!f.includes('map2d')) throw e;
      // Extract haversineKm2D helper and MissileSystem2D class
      const helperMatch = src.match(/function haversineKm2D[\s\S]*?\n\}/);
      if (helperMatch) vm.runInContext(helperMatch[0], ctx);
      const match = src.match(/class MissileSystem2D \{[\s\S]*\}\n\}/);
      if (match) vm.runInContext(match[0], ctx);
    }
  }
  return ctx;
}

// ── Helper: create a mock globe renderer ───────────────────────────────
function mockGlobe(ctx) {
  return vm.runInContext(`({
    latLonToVec3(lat, lon, r) { return new THREE.Vector3(lon * 0.01, lat * 0.01, r || 1); },
    scene: { add(){}, remove(){} },
  })`, ctx);
}

// ── Helper: create a mock scene ────────────────────────────────────────
function mockScene() { return { add(){}, remove(){} }; }

// ── Helper: step missiles forward by dt seconds ────────────────────────
function step(sys, dt) { sys.update(dt); }

// ── Helper: step until idle or max iterations ──────────────────────────
function runToCompletion(sys, dt = 0.5, maxIter = 500) {
  for (let i = 0; i < maxIter; i++) {
    step(sys, dt);
    if (sys.isIdle()) return i;
  }
  return -1;
}

// ════════════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
  }
}

console.log('\n=== WOPR Rule Enforcement Tests ===\n');

const ctx = buildSandbox();

// ── 1. isDestroyed — blast radius detection ────────────────────────────

console.log('--- isDestroyed (blast radius) ---');

test('3D: location at detonation site is destroyed', () => {
  const sys = vm.runInContext(`
    const _s = new MissileSystem({ add(){}, remove(){} }, {
      latLonToVec3(lat, lon, r) { return new THREE.Vector3(lon * 0.01, lat * 0.01, r || 1); }
    });
    _s.destroyedSites.push({ lat: 55.75, lon: 37.62 }); // Moscow
    _s;
  `, ctx);
  assert.strictEqual(sys.isDestroyed(55.75, 37.62), true);
});

test('3D: location 0.5° away from detonation is destroyed (within 1.27° threshold)', () => {
  const sys = vm.runInContext(`
    const _s2 = new MissileSystem({ add(){}, remove(){} }, {
      latLonToVec3(lat, lon, r) { return new THREE.Vector3(lon * 0.01, lat * 0.01, r || 1); }
    });
    _s2.destroyedSites.push({ lat: 55.75, lon: 37.62 });
    _s2;
  `, ctx);
  assert.strictEqual(sys.isDestroyed(55.75 + 0.5, 37.62 + 0.5), true);
});

test('3D: location 5° away from detonation is NOT destroyed', () => {
  const sys = vm.runInContext(`
    const _s3 = new MissileSystem({ add(){}, remove(){} }, {
      latLonToVec3(lat, lon, r) { return new THREE.Vector3(lon * 0.01, lat * 0.01, r || 1); }
    });
    _s3.destroyedSites.push({ lat: 55.75, lon: 37.62 });
    _s3;
  `, ctx);
  assert.strictEqual(sys.isDestroyed(60.75, 37.62), false);
});

test('3D: no destroyed sites means nothing is destroyed', () => {
  const sys = vm.runInContext(`
    new MissileSystem({ add(){}, remove(){} }, {
      latLonToVec3(lat, lon, r) { return new THREE.Vector3(lon * 0.01, lat * 0.01, r || 1); }
    });
  `, ctx);
  assert.strictEqual(sys.isDestroyed(40.71, -74.01), false);
});

test('2D: isDestroyed uses BLAST_RADIUS_DEG threshold', () => {
  const sys = vm.runInContext(`
    const _m2d = new MissileSystem2D({});
    _m2d.destroyedSites.push({ lat: 40.71, lon: -74.01 }); // NYC
    _m2d;
  `, ctx);
  // 1.0° away — within 1.27° threshold
  assert.strictEqual(sys.isDestroyed(41.71, -74.01), true);
  // 3° away — outside threshold
  assert.strictEqual(sys.isDestroyed(43.71, -74.01), false);
});

// ── 2. Missiles cannot launch from destroyed sites ─────────────────────

console.log('\n--- Destroyed-origin launch prevention ---');

test('2D: missile from destroyed origin is cancelled before launch', () => {
  const sys = vm.runInContext(`
    const _m = new MissileSystem2D({});
    // Launch a missile with 2000ms delay from Moscow
    _m.launchMissile(
      { lat: 55.75, lon: 37.62, type: 'city', region: 'ussr' },  // origin: Moscow
      { lat: 40.71, lon: -74.01, type: 'city', region: 'us' },    // target: NYC
      2000
    );
    // Destroy Moscow before missile launches
    _m.destroyedSites.push({ lat: 55.75, lon: 37.62 });
    _m;
  `, ctx);

  // Step past the delay
  for (let i = 0; i < 30; i++) step(sys, 0.1);

  // Missile should be marked done without ever starting
  const m = sys.activeMissiles[0];
  assert.strictEqual(m.done, true, 'missile should be done');
  assert.strictEqual(m._2dStarted, false, 'missile should never have started');
});

test('2D: missile from intact origin launches normally', () => {
  const sys = vm.runInContext(`
    const _m_intact = new MissileSystem2D({});
    _m_intact.launchMissile(
      { lat: 55.75, lon: 37.62, type: 'city', region: 'ussr' },
      { lat: 40.71, lon: -74.01, type: 'city', region: 'us' },
      500
    );
    _m_intact;
  `, ctx);

  for (let i = 0; i < 20; i++) step(sys, 0.1);

  const m = sys.activeMissiles[0];
  assert.strictEqual(m._2dStarted, true, 'missile should have started');
  assert.ok(m.progress > 0, 'missile should have progress');
});

test('2D: first missile detonates, second missile from same city is cancelled', () => {
  const sys = vm.runInContext(`
    const _m_chain = new MissileSystem2D({});
    // Missile 1: hits Moscow at t=0
    _m_chain.launchMissile(
      { lat: 40.71, lon: -74.01, type: 'city', region: 'us' },
      { lat: 55.75, lon: 37.62, type: 'city', region: 'ussr' },
      0
    );
    // Missile 2: launches FROM Moscow at t=5000ms (should be cancelled)
    _m_chain.launchMissile(
      { lat: 55.75, lon: 37.62, type: 'city', region: 'ussr' },
      { lat: 51.51, lon: -0.13, type: 'city', region: 'uk' },
      5000
    );
    _m_chain;
  `, ctx);

  // Run until all done
  runToCompletion(sys);

  const m1 = sys.activeMissiles[0];
  const m2 = sys.activeMissiles[1];
  assert.strictEqual(m1.done, true, 'first missile should complete');
  assert.strictEqual(m1._2dStarted, true, 'first missile should have launched');
  assert.strictEqual(m2.done, true, 'second missile should be done');
  assert.strictEqual(m2._2dStarted, false, 'second missile should NOT have launched (origin destroyed)');
});

// ── 3. Submarines are exempt from destroyed-origin check ───────────────

console.log('\n--- Submarine exemption ---');

test('2D: submarine missile launches even if sea position was "hit"', () => {
  const sys = vm.runInContext(`
    const _m_sub = new MissileSystem2D({});
    _m_sub.launchMissile(
      { lat: 62.0, lon: -35.0, type: 'sub', region: 'us' },
      { lat: 55.75, lon: 37.62, type: 'city', region: 'ussr' },
      2000
    );
    // "Destroy" the sub's position (shouldn't matter — subs are exempt)
    _m_sub.destroyedSites.push({ lat: 62.0, lon: -35.0 });
    _m_sub;
  `, ctx);

  for (let i = 0; i < 30; i++) step(sys, 0.1);

  const m = sys.activeMissiles[0];
  assert.strictEqual(m._2dStarted, true, 'submarine missile should still launch');
  assert.ok(m.progress > 0, 'submarine missile should have progress');
});

test('2D: land-based missile at same location IS cancelled', () => {
  const sys = vm.runInContext(`
    const _m_land = new MissileSystem2D({});
    _m_land.launchMissile(
      { lat: 62.0, lon: -35.0, type: 'base', region: 'us' },
      { lat: 55.75, lon: 37.62, type: 'city', region: 'ussr' },
      2000
    );
    _m_land.destroyedSites.push({ lat: 62.0, lon: -35.0 });
    _m_land;
  `, ctx);

  for (let i = 0; i < 30; i++) step(sys, 0.1);

  const m = sys.activeMissiles[0];
  assert.strictEqual(m.done, true);
  assert.strictEqual(m._2dStarted, false, 'land-based missile should be cancelled');
});

// ── 4. Detonation records destroyed sites ──────────────────────────────

console.log('\n--- Detonation site recording ---');

test('2D: createDetonation adds to destroyedSites', () => {
  const sys = vm.runInContext(`
    const _m_det = new MissileSystem2D({});
    _m_det;
  `, ctx);

  assert.strictEqual(sys.destroyedSites.length, 0);
  sys.createDetonation({ lat: 48.85, lon: 2.35, name: 'PARIS' });
  assert.strictEqual(sys.destroyedSites.length, 1);
  assert.strictEqual(sys.destroyedSites[0].lat, 48.85);
  assert.strictEqual(sys.destroyedSites[0].lon, 2.35);
});

test('2D: multiple detonations accumulate in destroyedSites', () => {
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  sys.createDetonation({ lat: 48.85, lon: 2.35, name: 'PARIS' });
  sys.createDetonation({ lat: 51.51, lon: -0.13, name: 'LONDON' });
  sys.createDetonation({ lat: 52.52, lon: 13.41, name: 'BERLIN' });
  assert.strictEqual(sys.destroyedSites.length, 3);
});

// ── 5. clear() resets destroyed sites ──────────────────────────────────

console.log('\n--- clear() resets state ---');

test('2D: clear() resets destroyedSites', () => {
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  sys.destroyedSites.push({ lat: 55.75, lon: 37.62 });
  sys.destroyedSites.push({ lat: 40.71, lon: -74.01 });
  assert.strictEqual(sys.destroyedSites.length, 2);
  sys.clear();
  assert.strictEqual(sys.destroyedSites.length, 0);
});

test('2D: clear() resets all missile arrays', () => {
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  sys.launchMissile({ lat: 0, lon: 0 }, { lat: 10, lon: 10 }, 0);
  sys.blastMarks.push({ lat: 5, lon: 5 });
  sys.clear();
  assert.strictEqual(sys.activeMissiles.length, 0);
  assert.strictEqual(sys.blastMarks.length, 0);
  assert.strictEqual(sys.detonations.length, 0);
  assert.strictEqual(sys.destroyedSites.length, 0);
});

// ── 6. isIdle checks ──────────────────────────────────────────────────

console.log('\n--- isIdle correctness ---');

test('2D: isIdle is true when no missiles exist', () => {
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  assert.strictEqual(sys.isIdle(), true);
});

test('2D: isIdle is false when active missiles exist', () => {
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  sys.launchMissile({ lat: 0, lon: 0 }, { lat: 10, lon: 10 }, 0);
  assert.strictEqual(sys.isIdle(), false);
});

test('2D: cancelled missile does not prevent isIdle', () => {
  const sys = vm.runInContext(`
    const _idle = new MissileSystem2D({});
    _idle.destroyedSites.push({ lat: 0, lon: 0 });
    _idle.launchMissile({ lat: 0, lon: 0, type: 'city' }, { lat: 10, lon: 10 }, 0);
    _idle;
  `, ctx);
  // Step past delay so it gets cancelled
  for (let i = 0; i < 10; i++) step(sys, 0.1);
  assert.strictEqual(sys.isIdle(), true, 'cancelled missile should not block isIdle');
});

// ── 7. Strategy engine: resolveLaunchOrigin ────────────────────────────

console.log('\n--- resolveLaunchOrigin (base substitution) ---');

test('cities are substituted with military bases from same region', () => {
  const engine = vm.runInContext(`new StrategyEngine()`, ctx);
  const result = engine.resolveLaunchOrigin('MOSCOW');
  assert.ok(result, 'should resolve to something');
  assert.strictEqual(result.type, 'base', 'should be a military base');
  assert.strictEqual(result.region, 'ussr', 'should be in the same region');
});

test('bases are returned as-is', () => {
  const engine = vm.runInContext(`new StrategyEngine()`, ctx);
  // Find a known base name
  const base = vm.runInContext(`CITIES.find(c => c.type === 'base')`, ctx);
  const result = engine.resolveLaunchOrigin(base.name);
  assert.ok(result);
  assert.strictEqual(result.name, base.name, 'base should be returned directly');
});

test('unknown city returns null', () => {
  const engine = vm.runInContext(`new StrategyEngine()`, ctx);
  const result = engine.resolveLaunchOrigin('ATLANTIS');
  assert.strictEqual(result, null);
});

test('resetLaunchRotation resets the round-robin index', () => {
  const engine = vm.runInContext(`new StrategyEngine()`, ctx);
  const r1 = engine.resolveLaunchOrigin('MOSCOW');
  const r2 = engine.resolveLaunchOrigin('MOSCOW');
  // After reset, should start from beginning again
  engine.resetLaunchRotation();
  const r3 = engine.resolveLaunchOrigin('MOSCOW');
  assert.strictEqual(r1.name, r3.name, 'should return same base after reset');
});

// ── 8. Escalation engine adds missiles ─────────────────────────────────

console.log('\n--- Escalation engine ---');

test('addEscalation appends missiles to existing array', () => {
  const engine = vm.runInContext(`new StrategyEngine()`, ctx);
  const missiles = [
    { origin: { lat: 40, lon: -74, region: 'us' }, target: { lat: 55, lon: 37, region: 'ussr' }, delay: 0 },
  ];
  const before = missiles.length;
  engine.addEscalation(missiles, [], []);
  assert.ok(missiles.length > before, `should add missiles (was ${before}, now ${missiles.length})`);
  assert.ok(missiles.length > 100, `should add many missiles for global exchange (got ${missiles.length})`);
});

test('escalation delays are after the initial scenario max delay', () => {
  const engine = vm.runInContext(`new StrategyEngine()`, ctx);
  const initialDelay = 5000;
  const missiles = [
    { origin: { lat: 40, lon: -74, region: 'us' }, target: { lat: 55, lon: 37, region: 'ussr' }, delay: initialDelay },
  ];
  engine.addEscalation(missiles, [], []);
  // All escalation missiles (index 1+) should have delay > initialDelay
  const escalationMissiles = missiles.slice(1);
  const allAfter = escalationMissiles.every(m => m.delay > initialDelay);
  assert.ok(allAfter, 'all escalation missiles should fire after initial scenario');
});

// ── 9. Retaliation wave filtering in buildFromScenario ─────────────────

console.log('\n--- Retaliation wave filtering ---');

test('retaliation wave skips origins near cities targeted in prior waves', () => {
  // Create a mini scenario where Moscow is targeted in wave 1,
  // then Moscow tries to retaliate in wave 2 (retaliation: true)
  // resolveLaunchOrigin may substitute Moscow with a nearby base,
  // but the proximity check should still filter it out
  const result = vm.runInContext(`
    const _eng = new StrategyEngine();
    const scenario = {
      defcon: 1,
      waves: [
        { from: ["WASHINGTON DC"], to: ["MOSCOW"], delay: 0 },
        { from: ["MOSCOW"], to: ["NEW YORK"], delay: 5000, retaliation: true },
      ]
    };
    _eng.buildFromScenario("TEST RETALIATION", scenario);
  `, ctx);

  // Moscow lat/lon: ~55.75, ~37.62
  // Find missiles in the retaliation wave (delay >= 5000, before escalation adds more)
  const retaliationMissiles = result.missiles.filter(m =>
    m.delay >= 5000 && m.delay < 9000
  );

  // Any origin near Moscow (within 1.27°) should have been filtered out
  const nearMoscow = retaliationMissiles.filter(m => {
    const dlat = m.origin.lat - 55.75, dlon = m.origin.lon - 37.62;
    return dlat * dlat + dlon * dlon < 1.27 * 1.27;
  });
  assert.strictEqual(nearMoscow.length, 0,
    'no retaliation missiles should originate near Moscow (it was targeted in wave 1)');
});

// ── 10. Submarine origin integrity across all scenarios ────────────────

console.log('\n--- Submarine origin integrity ---');

test('fromSubs waves produce missiles with type "sub", not city or base', () => {
  // Build a scenario that uses fromSubs — use unique var names to avoid collision
  const result = vm.runInContext(`
    const _subEng1 = new StrategyEngine();
    const _sc1 = {
      defcon: 2,
      waves: [
        { from: ["WASHINGTON DC"], to: ["MOSCOW"], delay: 0 },
        { fromSubs: ["us"], to: ["LENINGRAD", "MURMANSK"], delay: 3000 },
        { fromSubs: ["ussr"], to: ["NEW YORK", "NORFOLK"], delay: 6000 },
      ]
    };
    _subEng1.buildFromScenario("TEST SUB ORIGINS", _sc1);
  `, ctx);

  // Sub wave missiles: delay 3000-3999 and 6000-6999 (before escalation at ~10000+)
  const subMissiles = result.missiles.filter(m =>
    (m.delay >= 3000 && m.delay < 4500) || (m.delay >= 6000 && m.delay < 7500)
  );
  assert.ok(subMissiles.length > 0, 'should have submarine-launched missiles');
  for (const m of subMissiles) {
    assert.strictEqual(m.origin.type, 'sub',
      `missile to ${m.target.name} should originate from sub, got type="${m.origin.type}" name="${m.origin.name}"`);
  }
});

test('submarine origins are not located at any known city or base', () => {
  const result = vm.runInContext(`
    const _subEng2 = new StrategyEngine();
    const _sc2 = {
      defcon: 1,
      waves: [
        { fromSubs: ["us", "uk", "ussr", "france", "china"], to: ["MOSCOW", "NEW YORK", "LONDON", "PARIS", "BEIJING"], delay: 0 },
      ]
    };
    const _r2 = _subEng2.buildFromScenario("TEST ALL SUBS", _sc2);
    ({ missiles: _r2.missiles, cities: CITIES });
  `, ctx);

  const cityLocations = result.cities.map(c => ({ lat: c.lat, lon: c.lon, name: c.name }));

  // Only check the first wave's missiles (delay < 3000, before escalation)
  const firstWaveMissiles = result.missiles.filter(m => m.delay < 3000);
  assert.ok(firstWaveMissiles.length > 0, 'should have first-wave missiles');

  for (const m of firstWaveMissiles) {
    assert.strictEqual(m.origin.type, 'sub',
      `origin should be sub, got "${m.origin.type}" (${m.origin.name})`);

    // Verify this sub position doesn't match any city or base exactly
    const exactMatch = cityLocations.find(c =>
      c.lat === m.origin.lat && c.lon === m.origin.lon
    );
    assert.strictEqual(exactMatch, undefined,
      `sub origin ${m.origin.name} (${m.origin.lat}, ${m.origin.lon}) should not be at a city/base location` +
      (exactMatch ? ` but matches ${exactMatch.name}` : ''));
  }
});

test('no missile with origin type "sub" is located at a known city or base', () => {
  // Build all SSBN patrol positions for reference
  const patrols = vm.runInContext(`SSBN_PATROLS`, ctx);
  const subPositions = new Set();
  for (const nation of Object.keys(patrols)) {
    for (const s of patrols[nation]) {
      subPositions.add(`${s.lat},${s.lon}`);
    }
  }

  const cityPositions = new Set();
  const cities = vm.runInContext(`CITIES`, ctx);
  for (const c of cities) {
    cityPositions.add(`${c.lat},${c.lon}`);
  }

  const scenarios = vm.runInContext(`STRATEGY_SCENARIOS`, ctx);
  const failures = [];

  // Test a sample of scenarios that use fromSubs
  const subScenarios = Object.entries(scenarios).filter(([, s]) =>
    s.waves.some(w => w.fromSubs)
  ).slice(0, 20); // sample 20

  for (const [name, scenario] of subScenarios) {
    const engine = vm.runInContext(`new StrategyEngine()`, ctx);
    const result = engine.buildFromScenario(name, scenario);
    const maxScenarioDelay = Math.max(...scenario.waves.map(w => w.delay || 0));

    // Only check pre-escalation missiles
    const scenarioMissiles = result.missiles.filter(m => m.delay <= maxScenarioDelay + 3000);

    for (const m of scenarioMissiles) {
      const originKey = `${m.origin.lat},${m.origin.lon}`;

      if (m.origin.type === 'sub') {
        // Sub-type origin should be at an SSBN patrol position, NOT a city/base
        if (cityPositions.has(originKey)) {
          failures.push(`${name}: sub origin "${m.origin.name}" is at a city/base position`);
        }
      }
    }
  }

  assert.strictEqual(failures.length, 0,
    `Found ${failures.length} violations:\n  ${failures.join('\n  ')}`);
});

test('SSBN patrol positions are distinct from all city and base positions', () => {
  const result = vm.runInContext(`
    const _allCityPos = new Set(CITIES.map(c => c.lat + ',' + c.lon));
    const _subViolations = [];
    for (const [nation, subs] of Object.entries(SSBN_PATROLS)) {
      for (const s of subs) {
        if (_allCityPos.has(s.lat + ',' + s.lon)) {
          _subViolations.push(s.name + ' (' + nation + ') at ' + s.lat + ',' + s.lon);
        }
      }
    }
    _subViolations;
  `, ctx);

  assert.strictEqual(result.length, 0,
    `SSBN positions overlap with cities/bases: ${result.join(', ')}`);
});

// ════════════════════════════════════════════════════════════════════════

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
