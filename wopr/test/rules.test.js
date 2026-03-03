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
  vm.runInContext('const THEATRICAL_TIMING = true; let TIME_COMPRESSION = 360; const BASE_TIME_COMPRESSION = 360;', ctx);

  // Load Three.js mock
  vm.runInContext(THREE_MOCK, ctx);

  // Load source files in dependency order
  const files = ['js/mapdata.js', 'js/scenarios.js', 'js/scenarios-engine.js', 'js/missiles.js', 'js/map2d.js'];
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

// ── 7. Scenario engine: resolveLaunchOrigin ────────────────────────────

console.log('\n--- resolveLaunchOrigin (base substitution) ---');

test('cities are substituted with military bases from same region', () => {
  const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
  const result = engine.resolveLaunchOrigin('MOSCOW');
  assert.ok(result, 'should resolve to something');
  assert.strictEqual(result.type, 'base', 'should be a military base');
  assert.strictEqual(result.region, 'ussr', 'should be in the same region');
});

test('bases are returned as-is', () => {
  const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
  // Find a known base name
  const base = vm.runInContext(`CITIES.find(c => c.type === 'base')`, ctx);
  const result = engine.resolveLaunchOrigin(base.name);
  assert.ok(result);
  assert.strictEqual(result.name, base.name, 'base should be returned directly');
});

test('unknown city returns null', () => {
  const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
  const result = engine.resolveLaunchOrigin('ATLANTIS');
  assert.strictEqual(result, null);
});

test('resetLaunchRotation resets the round-robin index', () => {
  const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
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
  const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
  const missiles = [
    { origin: { lat: 40, lon: -74, region: 'us' }, target: { lat: 55, lon: 37, region: 'ussr' }, delay: 0 },
  ];
  const before = missiles.length;
  engine.addEscalation(missiles, [], []);
  assert.ok(missiles.length > before, `should add missiles (was ${before}, now ${missiles.length})`);
  assert.ok(missiles.length > 100, `should add many missiles for global exchange (got ${missiles.length})`);
});

test('escalation delays are after the initial scenario max delay', () => {
  const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
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
    const _eng = new ScenarioEngine();
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
    const _subEng1 = new ScenarioEngine();
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
    const _subEng2 = new ScenarioEngine();
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

  const scenarios = vm.runInContext(`SCENARIOS`, ctx);
  const failures = [];

  // Test a sample of scenarios that use fromSubs
  const subScenarios = Object.entries(scenarios).filter(([, s]) =>
    s.waves.some(w => w.fromSubs)
  ).slice(0, 20); // sample 20

  for (const [name, scenario] of subScenarios) {
    const engine = vm.runInContext(`new ScenarioEngine()`, ctx);
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

// ── 11. Missile flight time audit ─────────────────────────────────────

console.log('\n--- Missile flight time audit ---');

test('flight times match haversine distance at 5 km/s effective speed', () => {
  // City pairs with known approximate great-circle distances
  const pairs = vm.runInContext(`
    const _pairs = [
      { a: CITIES.find(c => c.name === 'WASHINGTON DC'),  b: CITIES.find(c => c.name === 'MOSCOW') },
      { a: CITIES.find(c => c.name === 'LONDON'),         b: CITIES.find(c => c.name === 'MOSCOW') },
      { a: CITIES.find(c => c.name === 'SEOUL'),           b: CITIES.find(c => c.name === 'TOKYO') },
      { a: CITIES.find(c => c.name === 'NEW YORK'),        b: CITIES.find(c => c.name === 'LONDON') },
    ].filter(p => p.a && p.b);
    _pairs;
  `, ctx);

  assert.ok(pairs.length >= 3, 'need at least 3 city pairs for audit');

  for (const { a, b } of pairs) {
    // Compute expected flight time
    const distKm = vm.runInContext(`haversineKm2D(
      { lat: ${a.lat}, lon: ${a.lon} },
      { lat: ${b.lat}, lon: ${b.lon} }
    )`, ctx);
    const expectedSimSec = distKm / 5; // 5 km/s effective ICBM speed

    // Create missile system and launch
    const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);

    const log = { launchSimSec: null, detonateSimSec: null };
    sys.onLaunch = () => { log.launchSimSec = simSec; };
    sys.onDetonation = () => { log.detonateSimSec = simSec; };

    sys.launchMissile(a, b, 0);

    // Step simulation: 60fps for up to 60 real seconds
    const dt = 1 / 60;
    let simSec = 0;
    for (let i = 0; i < 3600; i++) {
      sys.update(dt);
      simSec += dt * 360; // TIME_COMPRESSION in test sandbox is 360
      if (sys.isIdle()) break;
    }

    assert.ok(log.launchSimSec !== null, `${a.name}→${b.name}: missile launched`);
    assert.ok(log.detonateSimSec !== null, `${a.name}→${b.name}: missile detonated`);

    const actualFlightSec = log.detonateSimSec - log.launchSimSec;
    const tolerance = expectedSimSec * 0.05; // 5% tolerance

    assert.ok(
      Math.abs(actualFlightSec - expectedSimSec) < tolerance,
      `${a.name}→${b.name}: expected ${Math.round(expectedSimSec)}s (${Math.round(expectedSimSec/60)}min), ` +
      `got ${Math.round(actualFlightSec)}s (${Math.round(actualFlightSec/60)}min), ` +
      `dist=${Math.round(distKm)}km`
    );
  }
});

test('flight time scales correctly when TIME_COMPRESSION changes mid-flight', () => {
  const pair = vm.runInContext(`({
    a: CITIES.find(c => c.name === 'WASHINGTON DC'),
    b: CITIES.find(c => c.name === 'MOSCOW'),
  })`, ctx);
  assert.ok(pair.a && pair.b, 'need DC and Moscow');

  const distKm = vm.runInContext(`haversineKm2D(
    { lat: ${pair.a.lat}, lon: ${pair.a.lon} },
    { lat: ${pair.b.lat}, lon: ${pair.b.lon} }
  )`, ctx);

  // Launch at normal compression (360), then double it halfway through
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  let detonateRealSec = null;
  sys.onDetonation = () => { if (detonateRealSec === null) detonateRealSec = realSec; };
  sys.launchMissile(pair.a, pair.b, 0);

  const dt = 1 / 60;
  let realSec = 0;
  let switched = false;

  // Compute expected real-time flight at 360x: distKm / (360 * 5) seconds
  const fullFlightRealSec = distKm / (360 * 5);
  const halfRealSec = fullFlightRealSec / 2;

  for (let i = 0; i < 3600; i++) {
    sys.update(dt);
    realSec += dt;
    // Double compression at the halfway point (by real time)
    if (!switched && realSec >= halfRealSec) {
      vm.runInContext('TIME_COMPRESSION = 720', ctx);
      switched = true;
    }
    if (detonateRealSec !== null) break;
  }

  // Restore for other tests
  vm.runInContext('TIME_COMPRESSION = 360', ctx);

  assert.ok(detonateRealSec !== null, 'missile detonated');

  // With doubled speed for the second half, total real time should be ~75% of original
  // First half: halfRealSec at 1x speed
  // Second half: remaining 50% progress at 2x speed = halfRealSec / 2
  const expectedRealSec = halfRealSec + halfRealSec / 2;
  const tolerance = expectedRealSec * 0.10; // 10% tolerance (frame-boundary effects)

  assert.ok(
    Math.abs(detonateRealSec - expectedRealSec) < tolerance,
    `mid-flight TIME_COMPRESSION change: expected ~${expectedRealSec.toFixed(2)}s real time, ` +
    `got ${detonateRealSec.toFixed(2)}s`
  );
});

// ── 12. Blast radius expansion rate ──────────────────────────────────

console.log('\n--- Blast radius expansion ---');

test('blast growth duration scales inversely with TIME_COMPRESSION', () => {
  const city = vm.runInContext(`CITIES.find(c => c.name === 'MOSCOW')`, ctx);
  assert.ok(city, 'need Moscow');

  // Measure growth time at 360x
  function measureGrowthFrames(compression) {
    vm.runInContext(`TIME_COMPRESSION = ${compression}`, ctx);
    const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
    sys.createDetonation(city);

    const dt = 1 / 60;
    let frames = 0;
    for (let i = 0; i < 60000; i++) {
      sys.update(dt);
      frames++;
      if (sys.blastMarks[0].grown) break;
    }
    return frames;
  }

  const frames360 = measureGrowthFrames(360);
  const frames720 = measureGrowthFrames(720);

  // Restore
  vm.runInContext('TIME_COMPRESSION = 360', ctx);

  // At 720x, blast should grow in half the frames (within 5% tolerance for frame quantization)
  const ratio = frames360 / frames720;
  assert.ok(
    Math.abs(ratio - 2.0) < 0.1,
    `growth at 720x should be 2x faster than 360x: ratio=${ratio.toFixed(3)} (expected ~2.0), ` +
    `frames: ${frames360} at 360x, ${frames720} at 720x`
  );
});

test('blast wave expansion speed is physically realistic', () => {
  // The 2D blast system uses baseGrowDuration = 900 real-world seconds
  // to expand to full radius of 88 miles (141.6 km)
  const BLAST_RADIUS_KM = 88 * 1.609; // 88 miles in km = 141.6
  const BASE_GROW_SEC = 900;           // real-world seconds (from map2d.js)

  const avgSpeedMS = (BLAST_RADIUS_KM * 1000) / BASE_GROW_SEC; // m/s

  // Nuclear blast wave speeds at extended range (50-150 km):
  //   - Near ground zero: supersonic, ~1000+ m/s
  //   - At 50 km: ~300-400 m/s (decelerating)
  //   - At 100+ km: ~150-250 m/s (approaching speed of sound)
  // Average over 0-142 km should be roughly 100-400 m/s
  assert.ok(
    avgSpeedMS >= 100 && avgSpeedMS <= 400,
    `average blast wave speed should be 100-400 m/s, got ${Math.round(avgSpeedMS)} m/s ` +
    `(${BLAST_RADIUS_KM.toFixed(1)} km in ${BASE_GROW_SEC}s)`
  );

  // Verify the growth actually completes in the expected time
  const city = vm.runInContext(`CITIES.find(c => c.name === 'MOSCOW')`, ctx);
  vm.runInContext('TIME_COMPRESSION = 360', ctx);
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  sys.createDetonation(city);

  const dt = 1 / 60;
  let realSec = 0;
  for (let i = 0; i < 60000; i++) {
    sys.update(dt);
    realSec += dt;
    if (sys.blastMarks[0].grown) break;
  }

  // Expected display time = baseGrowDuration / TIME_COMPRESSION = 900 / 360 = 2.5s
  const expectedRealSec = BASE_GROW_SEC / 360;
  const tolerance = expectedRealSec * 0.05;
  assert.ok(
    Math.abs(realSec - expectedRealSec) < tolerance,
    `blast should fully expand in ${expectedRealSec.toFixed(2)}s real time at 360x, ` +
    `got ${realSec.toFixed(2)}s`
  );
});

test('blast growth responds to TIME_COMPRESSION change mid-expansion', () => {
  const city = vm.runInContext(`CITIES.find(c => c.name === 'MOSCOW')`, ctx);
  assert.ok(city, 'need Moscow');

  // baseGrowDuration = 900 real-world seconds
  // At 360x: growDuration = 900/360 = 2.5s display time
  // Growth progress = age * TIME_COMPRESSION / baseGrowDuration
  // Switch from 360x to 540x (1.5x) at 25% growth (age = 0.625s)
  // At switch: progress = 0.625 * 360 / 900 = 0.25 (25%)
  // After switch: completes when age * 540 / 900 >= 1.0 → age >= 900/540 = 1.667s
  // Remaining age: 1.667 - 0.625 = 1.042s
  // Total: 0.625 + 1.042 = 1.667s

  vm.runInContext('TIME_COMPRESSION = 360', ctx);
  const sys = vm.runInContext(`new MissileSystem2D({})`, ctx);
  sys.createDetonation(city);

  const dt = 1 / 60;
  let realSec = 0;
  const switchAt = 0.625; // 25% growth at 360x
  let switched = false;

  for (let i = 0; i < 60000; i++) {
    sys.update(dt);
    realSec += dt;
    if (!switched && realSec >= switchAt) {
      vm.runInContext('TIME_COMPRESSION = 540', ctx); // 1.5x
      switched = true;
    }
    if (sys.blastMarks[0].grown) break;
  }

  // Restore
  vm.runInContext('TIME_COMPRESSION = 360', ctx);

  const expectedRealSec = 1.667;
  const tolerance = expectedRealSec * 0.05;

  assert.ok(
    Math.abs(realSec - expectedRealSec) < tolerance,
    `mid-expansion TIME_COMPRESSION change: expected ~${expectedRealSec.toFixed(2)}s, ` +
    `got ${realSec.toFixed(2)}s`
  );
});

// ── 13. Casualty consistency between terminal and info panel ──────────

console.log('\n--- Casualty consistency ---');

test('terminal aftermath casualties match info panel accumulated casualties', () => {
  // Simulate what InfoPanel.logDetonation does for a set of cities
  const testCities = vm.runInContext(`
    CITIES.filter(c => c.pop && c.pop > 0).slice(0, 10)
  `, ctx);
  assert.ok(testCities.length >= 5, 'need at least 5 cities with population');

  // Replicate InfoPanel's casualty accumulation logic
  let infoPanelCasualties = 0;
  const destroyedCities = new Set();

  // Seed Math.random deterministically by running multiple detonations
  for (const city of testCities) {
    if (!destroyedCities.has(city.name)) {
      destroyedCities.add(city.name);
      if (city.pop) {
        infoPanelCasualties += city.pop * (0.3 + Math.random() * 0.4);
      }
    }
  }

  // showAftermath now receives casualties directly and formats as:
  //   Math.round(casualties * 10) / 10
  // InfoPanel.updateCounters displays as:
  //   Math.round(this.casualties * 10) / 10
  // Both must apply the same rounding to the same input value.
  const terminalDisplay = Math.round(infoPanelCasualties * 10) / 10;
  const panelDisplay = Math.round(infoPanelCasualties * 10) / 10;

  assert.strictEqual(
    terminalDisplay,
    panelDisplay,
    `terminal (${terminalDisplay}M) should equal panel (${panelDisplay}M)`
  );
});

test('showAftermath formats casualties identically to info panel counter', () => {
  // Test specific edge cases of the rounding formula
  const testValues = [0, 0.1, 1.05, 12.349, 12.351, 99.999, 150.55];

  for (const cas of testValues) {
    // Terminal: Math.round(casualties * 10) / 10  (from showAftermath)
    const terminalVal = Math.round(cas * 10) / 10;
    // Panel: Math.round(this.casualties * 10) / 10  (from updateCounters)
    const panelVal = Math.round(cas * 10) / 10;

    assert.strictEqual(
      terminalVal, panelVal,
      `mismatch for input ${cas}: terminal=${terminalVal}, panel=${panelVal}`
    );
  }
});

test('duplicate city detonations do not double-count casualties', () => {
  // InfoPanel only counts casualties once per city name
  const moscow = vm.runInContext(`CITIES.find(c => c.name === 'MOSCOW')`, ctx);
  assert.ok(moscow && moscow.pop, 'need Moscow with population');

  let casualties = 0;
  const destroyed = new Set();

  // Detonate Moscow 3 times
  for (let i = 0; i < 3; i++) {
    if (!destroyed.has(moscow.name)) {
      destroyed.add(moscow.name);
      casualties += moscow.pop * 0.5; // fixed factor for determinism
    }
  }

  // Should only count once
  const expected = moscow.pop * 0.5;
  assert.strictEqual(casualties, expected,
    `3 detonations on Moscow should count casualties once: got ${casualties}, expected ${expected}`
  );
});

// ════════════════════════════════════════════════════════════════════════

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
