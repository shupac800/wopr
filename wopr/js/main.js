// WOPR War Room — Main Entry Point
// State machine: BOOT → IDLE → EXECUTING → AFTERMATH → (IDLE or ENDING)

(async function () {
  // === State ===
  const State = { BOOT: 0, IDLE: 1, EXECUTING: 2, AFTERMATH: 3, ENDING: 4 };
  let state = State.BOOT;

  // === Screen flash element ===
  const flashEl = document.getElementById('screen-flash');

  function screenFlash() {
    flashEl.classList.add('flash');
    setTimeout(() => flashEl.classList.remove('flash'), 100);
  }

  // === Initialize Renderer (3D or 2D) ===
  const globeContainer = document.getElementById('globe-container');
  let globe, missiles;

  if (USE_3D_GLOBE) {
    globe = new GlobeRenderer(globeContainer);
    await globe.coastlinesReady;
    missiles = new MissileSystem(globe.scene, globe);
  } else {
    globe = new MapRenderer2D(globeContainer);
    missiles = new MissileSystem2D(globe);
  }
  missiles.onDetonation = screenFlash;

  // === Initialize Terminal ===
  const terminal = new TerminalUI();
  terminal.setDefcon(5);
  terminal.setStatus('WOPR ONLINE');

  // === Initialize Strategy Engine ===
  const engine = new StrategyEngine();

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

  // Load strategies
  const strategies = await engine.load();
  terminal.buildStrategyList(strategies);

  // Enter IDLE
  state = State.IDLE;
  terminal.enableInput();

  // === Run a single strategy, return when complete ===
  async function runStrategy(strategyName) {
    // Build launch sequence
    const sequence = engine.buildLaunchSequence(strategyName);

    // Update DEFCON
    terminal.setDefcon(sequence.defcon);
    terminal.setStatus('EXECUTING STRATEGY');

    // Show log
    await terminal.showExecutionLog(strategyName, sequence.defcon);

    // Launch missiles
    missiles.launchSequence(sequence);

    // Wait for missiles to finish
    await waitForMissiles();

    // Show aftermath
    terminal.setStatus('ASSESSING DAMAGE');
    await terminal.showAftermath(sequence);

    // Dramatic "WINNER: NONE"
    terminal.printBlank();
    await terminal.typewriteAppend('WINNER: ', 'bright');
    await delay(1500);
    terminal.appendToLastLine('NONE');
    await delay(1000);
  }

  // === Run all strategies sequentially from a starting index, looping ===
  async function runSequentialFrom(startIndex) {
    state = State.EXECUTING;
    terminal.disableInput();

    let idx = startIndex;
    while (true) {
      const strategyName = strategies[idx];
      terminal.selectIndex(idx);

      await runStrategy(strategyName);

      // Clear blasts from globe
      missiles.clear();

      // Brief pause before next strategy
      terminal.setDefcon(5);
      terminal.setStatus('NEXT TARGET');
      await delay(800);

      // Advance to next, loop back to 0
      idx = (idx + 1) % strategies.length;
    }
  }

  // === Strategy Selection Handler ===
  terminal.onStrategySelect = async (strategyName, index) => {
    if (state !== State.IDLE) return;
    await runSequentialFrom(index);
  };

  // === Keyboard ===
  document.addEventListener('keydown', (e) => {
    terminal.handleKey(e);
  });

  // === Animation Loop ===
  function animate() {
    requestAnimationFrame(animate);

    const delta = globe.clock.getDelta();
    const elapsed = globe.clock.getElapsedTime();

    missiles.update(delta);

    if (USE_3D_GLOBE) {
      globe.render(elapsed);
    } else {
      globe.render(elapsed, missiles);
    }
  }

  animate();

  // === Helpers ===
  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function waitForMissiles() {
    return new Promise(resolve => {
      const check = () => {
        if (missiles.isIdle()) {
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
