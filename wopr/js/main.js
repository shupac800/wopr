// WOPR War Room — Main Entry Point
// State machine: BOOT → IDLE → EXECUTING → AFTERMATH → (IDLE or ENDING)

(async function () {
  // === State ===
  const State = { BOOT: 0, IDLE: 1, EXECUTING: 2, AFTERMATH: 3, ENDING: 4 };
  let state = State.BOOT;
  let infoPanel = null;
  let runGen = 0;              // generation counter — incremented to abort current run

  // === Elapsed time display ===
  const elapsedEl = document.getElementById('elapsed-display');
  const elapsedValueEl = document.getElementById('elapsed-value');
  const tfLabelEl = document.getElementById('time-factor-label');
  const tfValueEl = document.getElementById('time-factor-value');
  let simElapsedSec = 0;
  let simRunning = false;

  function resetElapsed() {
    simElapsedSec = 0;
    simRunning = false;
    updateElapsedDisplay();
  }

  function startElapsed() {
    simRunning = true;
  }

  function pauseElapsed() {
    simRunning = false;
  }

  function updateElapsedDisplay() {
    const totalMin = Math.floor(simElapsedSec / 60);
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    elapsedValueEl.textContent = hh + ' : ' + mm;
  }

  // Show time factor and elapsed display immediately (before any awaits)
  tfLabelEl.textContent = 'TIME FACTOR'; tfValueEl.textContent = TIME_COMPRESSION + 'x';
  updateElapsedDisplay();
  elapsedEl.classList.add('visible');

  // === Time compression adjustment (+/- and arrow keys) ===
  let timeAdjustDir = 0;       // -1, 0, or +1
  let timeAdjustHeldSec = 0;   // how long the key has been held
  const TIME_ADJUST_BASE = 280; // base rate: 280x per second
  const TIME_COMPRESSION_MIN = 10;
  const TIME_COMPRESSION_MAX = 99999;
  let animateRunning = false;   // true once animation loop starts
  let earlyAdjustInterval = null; // drives updates before animate() starts

  function startEarlyAdjust() {
    if (animateRunning || earlyAdjustInterval) return;
    earlyAdjustInterval = setInterval(() => {
      if (animateRunning) { clearInterval(earlyAdjustInterval); earlyAdjustInterval = null; return; }
      if (timeAdjustDir === 0) return;
      const delta = 1 / 60;
      timeAdjustHeldSec += delta;
      const accel = 1 + timeAdjustHeldSec * 1.0;
      const change = TIME_ADJUST_BASE * accel * delta * timeAdjustDir;
      TIME_COMPRESSION = Math.round(Math.min(TIME_COMPRESSION_MAX, Math.max(TIME_COMPRESSION_MIN, TIME_COMPRESSION + change)));
      tfLabelEl.textContent = 'TIME FACTOR'; tfValueEl.textContent = TIME_COMPRESSION + 'x';
    }, 1000 / 60);
  }

  document.addEventListener('keydown', (e) => {
    if ((e.key === '+' || e.key === '=' || e.key === 'ArrowRight') && timeAdjustDir !== 1) {
      timeAdjustDir = 1;
      timeAdjustHeldSec = 0;
      if (!animateRunning) startEarlyAdjust();
    } else if ((e.key === '-' || e.key === '_' || e.key === 'ArrowLeft') && timeAdjustDir !== -1) {
      timeAdjustDir = -1;
      timeAdjustHeldSec = 0;
      if (!animateRunning) startEarlyAdjust();
    }
  });

  document.addEventListener('keyup', (e) => {
    if ((e.key === '+' || e.key === '=' || e.key === 'ArrowRight') && timeAdjustDir === 1) {
      timeAdjustDir = 0;
      timeAdjustHeldSec = 0;
      localStorage.setItem('wopr_timeFactor', TIME_COMPRESSION);
    } else if ((e.key === '-' || e.key === '_' || e.key === 'ArrowLeft') && timeAdjustDir === -1) {
      timeAdjustDir = 0;
      timeAdjustHeldSec = 0;
      localStorage.setItem('wopr_timeFactor', TIME_COMPRESSION);
    }
  });

  // === Screen flash element ===
  const flashEl = document.getElementById('screen-flash');

  function screenFlash(targetCity) {
    if (typeof SCREEN_FLASH === 'undefined' || SCREEN_FLASH) {
      flashEl.classList.add('flash');
      setTimeout(() => flashEl.classList.remove('flash'), 100);
    }
    if (infoPanel) {
      infoPanel.logDetonation(targetCity, simElapsedSec);
    }
  }

  // === Initialize Both Renderers (3D and 2D) ===
  const globeContainer = document.getElementById('globe-container');
  let globe, missiles;

  // 3D renderer
  const globe3d = new GlobeRenderer(globeContainer);
  await globe3d.coastlinesReady;
  const missiles3d = new MissileSystem(globe3d.rotationGroup, globe3d);

  // 2D renderer (canvas hidden initially if starting in 3D)
  const globe2d = new MapRenderer2D(globeContainer);
  const missiles2d = new MissileSystem2D(globe2d);

  if (USE_3D_GLOBE) {
    globe = globe3d;
    missiles = missiles3d;
    globe2d.canvas.style.display = 'none';
  } else {
    globe = globe2d;
    missiles = missiles2d;
    globe3d.renderer.domElement.style.display = 'none';
  }
  missiles3d.onDetonation = screenFlash;
  missiles2d.onDetonation = screenFlash;

  // === 2D/3D Toggle ===
  const viewToggle = document.getElementById('view-toggle');
  const toggleTrack = document.getElementById('view-toggle-track');
  const label2d = document.getElementById('view-label-2d');
  const label3d = document.getElementById('view-label-3d');

  function setRendererMode(use3d) {
    USE_3D_GLOBE = use3d;

    // Toggle panel width class FIRST so CSS transition starts immediately
    document.documentElement.classList.toggle('mode-2d', !use3d);

    // Clear missiles from both systems
    missiles3d.clear();
    missiles2d.clear();
    globe3d.clearSubmarines();
    globe2d.clearSubmarines();

    if (use3d) {
      globe = globe3d;
      missiles = missiles3d;
      globe3d.renderer.domElement.style.display = 'block';
      globe2d.canvas.style.display = 'none';
      toggleTrack.classList.remove('mode-2d');
      label3d.classList.add('active');
      label2d.classList.remove('active');
    } else {
      globe = globe2d;
      missiles = missiles2d;
      globe2d.canvas.style.display = 'block';
      globe3d.renderer.domElement.style.display = 'none';
      toggleTrack.classList.add('mode-2d');
      label2d.classList.add('active');
      label3d.classList.remove('active');
    }

    missiles.onDetonation = screenFlash;
    localStorage.setItem('wopr_viewMode', use3d ? '3d' : '2d');

    // Re-measure after panel width transition completes (300ms CSS transition)
    setTimeout(() => {
      if (use3d) globe3d.onResize();
      else globe2d._resize();
    }, 350);
  }

  // Restore saved preference
  const savedMode = localStorage.getItem('wopr_viewMode');
  if (savedMode === '2d') {
    setRendererMode(false);
  }

  viewToggle.addEventListener('click', () => {
    setRendererMode(!USE_3D_GLOBE);
  });

  // === Initialize Terminal ===
  const terminal = new TerminalUI();
  terminal.setStatus('WOPR ONLINE');

  // === Initialize Info Panel (right side) ===
  infoPanel = new InfoPanel();

  // === Initialize Scenario Engine ===
  const engine = new ScenarioEngine();

  // === Boot Sequence ===
  const bootScreen = document.getElementById('boot-screen');

  // Show initial boot screen
  const bootText = bootScreen.querySelector('.boot-text');
  bootText.style.opacity = '0';
  await delay(50);
  bootText.style.opacity = '1';
  bootText.style.transition = 'opacity 0.3s';

  await delay(400);

  // Fade out boot screen
  bootScreen.style.transition = 'opacity 0.3s';
  bootScreen.style.opacity = '0';
  await delay(300);
  bootScreen.classList.add('hidden');

  // Run terminal boot sequence
  await terminal.runBootSequence();

  // Load scenarios
  const scenarios = await engine.load();
  terminal.buildScenarioList(scenarios);

  // Enter IDLE
  state = State.IDLE;
  terminal.enableInput();

  // === Scenario name display (lower-left of center panel) ===
  const scenarioNameEl = document.getElementById('scenario-name');

  // === Run a single scenario, return when complete ===
  async function runScenario(scenarioName) {
    const myGen = runGen;
    const aborted = () => runGen !== myGen;

    scenarioNameEl.textContent = scenarioName;

    // Build launch sequence
    const sequence = engine.buildLaunchSequence(scenarioName);

    // Determine initial DEFCON from the scenario (before escalation forced it to 1)
    const initialDefcon = (typeof SCENARIOS !== 'undefined' && SCENARIOS[scenarioName])
      ? (SCENARIOS[scenarioName].defcon || engine.getDefcon(scenarioName))
      : engine.getDefcon(scenarioName);

    // Show elapsed timer at 00:00 (starts ticking on first missile launch)
    resetElapsed();

    terminal.setStatus('EXECUTING SCENARIO');

    // Prepare right panel
    infoPanel.beginScenario(sequence);

    // Show submarine markers on globe/map
    if (sequence.submarines && sequence.submarines.length > 0) {
      globe.showSubmarines(sequence.submarines);
    }

    // Show log (with narrative if scenario provides one)
    await terminal.showExecutionLog(scenarioName, sequence.narrative);
    if (aborted()) return;

    // Launch missiles — start elapsed timer on first actual launch
    missiles.onFirstLaunch = () => startElapsed();
    missiles.onLaunch = (origin, target) => {
      infoPanel.logLaunch(origin.name, target.name, simElapsedSec);
    };
    missiles.launchSequence(sequence);

    // Wait for missiles to finish
    await waitForMissiles();
    if (aborted()) return;
    pauseElapsed();

    // Show aftermath
    terminal.setStatus('ASSESSING DAMAGE');
    await terminal.showAftermath(sequence, simElapsedSec, infoPanel.casualties);
    if (aborted()) return;

    // Dramatic "WINNER: NONE"
    terminal.printBlank();
    await terminal.typewriteAppend('WINNER: ', 'bright');
    if (aborted()) return;
    await delay(1500);
    if (aborted()) return;
    terminal.appendToLastLine('NONE');
    await delay(1000);
  }

  // === Run all scenarios sequentially from a starting index, looping ===
  async function runSequentialFrom(startIndex) {
    const myGen = ++runGen;
    state = State.EXECUTING;
    terminal.enableInput(); // keep input enabled so user can click a new scenario

    let idx = startIndex;
    while (myGen === runGen) {
      const scenarioName = scenarios[idx];
      terminal.selectIndex(idx);

      await runScenario(scenarioName);
      if (myGen !== runGen) return;

      // Clear blasts, subs, and elapsed display from globe
      pauseElapsed();
      missiles.clear();
      globe.clearSubmarines();

      // Brief pause before next scenario
      terminal.setStatus('NEXT TARGET');
      await delay(800);
      if (myGen !== runGen) return;

      // Advance to next, loop back to 0
      idx = (idx + 1) % scenarios.length;
    }
  }

  // === Scenario Selection Handler ===
  terminal.onScenarioSelect = async (scenarioName, index) => {
    if (state === State.EXECUTING) {
      // Abort the current run: bump generation, clear visuals, timers, and terminal effects
      runGen++;
      pauseElapsed();
      terminal.abortEffects();
      terminal.clearMessages();
      missiles.clear();
      globe.clearSubmarines();
    }
    if (state === State.IDLE || state === State.EXECUTING) {
      await runSequentialFrom(index);
    }
  };

  // === Keyboard ===
  document.addEventListener('keydown', (e) => {
    terminal.handleKey(e);
  });

  // === Animation Loop ===
  // Use a dedicated clock so renderer swaps don't affect delta timing
  const animClock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = animClock.getDelta();
    const elapsed = animClock.getElapsedTime();

    // Adjust time compression if +/- held
    if (timeAdjustDir !== 0) {
      timeAdjustHeldSec += delta;
      const accel = 1 + timeAdjustHeldSec * 1.0;
      const change = TIME_ADJUST_BASE * accel * delta * timeAdjustDir;
      TIME_COMPRESSION = Math.round(Math.min(TIME_COMPRESSION_MAX, Math.max(TIME_COMPRESSION_MIN, TIME_COMPRESSION + change)));
      tfLabelEl.textContent = 'TIME FACTOR'; tfValueEl.textContent = TIME_COMPRESSION + 'x';
    }

    // Rotate 3D globe group (always, even when viewing 2D, so it stays in sync)
    if (globe3d.rotationGroup) {
      globe3d.rotationGroup.rotation.y += (2 * Math.PI * TIME_COMPRESSION / 86400) * delta;
    }

    if (simRunning) {
      simElapsedSec += delta * TIME_COMPRESSION;
      updateElapsedDisplay();
    }

    missiles.update(delta);

    if (USE_3D_GLOBE) {
      globe3d.render(elapsed);
    } else {
      globe2d.render(elapsed, missiles2d);
    }
  }

  animateRunning = true;
  animate();

  // === Helpers ===
  function delay(ms) {
    const gen = runGen;
    return new Promise(r => {
      const timer = setTimeout(r, ms);
      // Poll for abort so the old run exits quickly (skip during boot)
      if (gen > 0) {
        const poll = setInterval(() => {
          if (runGen !== gen) { clearTimeout(timer); clearInterval(poll); r(); }
        }, 50);
      }
    });
  }

  function waitForMissiles() {
    const gen = runGen;
    return new Promise(resolve => {
      const check = () => {
        if (runGen !== gen || missiles.isIdle()) {
          resolve();
        } else {
          setTimeout(check, 200);
        }
      };
      // Give missiles time to start
      setTimeout(check, 1000);
    });
  }

  function typewriteElement(el, html) {
    return new Promise(resolve => {
      // Strip tags for character-by-character typing, then set as HTML at end
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const text = temp.textContent;
      const startHTML = el.innerHTML;

      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          el.innerHTML = startHTML + html.substring(0, findHTMLIndex(html, i + 1));
          i++;
        } else {
          el.innerHTML = startHTML + html;
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  // Find the HTML index that corresponds to `n` visible characters
  function findHTMLIndex(html, n) {
    let visible = 0;
    let inTag = false;
    for (let i = 0; i < html.length; i++) {
      if (html[i] === '<') inTag = true;
      if (!inTag) {
        visible++;
        if (visible >= n) return i + 1;
      }
      if (html[i] === '>') inTag = false;
    }
    return html.length;
  }
})();
