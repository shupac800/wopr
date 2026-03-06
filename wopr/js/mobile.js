// WOPR Mobile — Swipeable three-panel layout for narrow screens
// Transforms the side-by-side desktop layout into a horizontal carousel.

(function () {
  const MOBILE_BREAKPOINT = 768;
  const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

  let active = false;
  let currentPage = 1; // 0=terminal, 1=globe, 2=info
  let dots = null;
  let hints = null;
  let hintsShown = false;

  // Touch tracking
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let touchLocked = null; // 'horizontal' | 'vertical' | null
  const LOCK_THRESHOLD = 10; // px before we decide swipe direction
  const SNAP_THRESHOLD = 50; // px to commit to page change

  const app = document.getElementById('app');

  // === Page dots ===
  function createDots() {
    if (dots) return;
    dots = document.createElement('div');
    dots.id = 'page-dots';
    const labels = ['TERMINAL', 'GLOBE', 'INTEL'];
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'page-dot' + (i === currentPage ? ' active' : '');
      dot.dataset.page = i;
      dot.setAttribute('aria-label', labels[i]);
      dot.addEventListener('click', () => goToPage(i));
      dots.appendChild(dot);
    }
    document.body.appendChild(dots);
  }

  function updateDots() {
    if (!dots) return;
    dots.querySelectorAll('.page-dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentPage);
    });
  }

  // === Edge hints (shown once) ===
  function createHints() {
    if (hints) return;
    hints = document.createElement('div');
    hints.id = 'swipe-hints';
    hints.innerHTML =
      '<div class="swipe-hint left">\u25C0 TERMINAL</div>' +
      '<div class="swipe-hint right">INTEL \u25B6</div>';
    document.body.appendChild(hints);
    // Auto-hide after 3s
    setTimeout(() => {
      hints.classList.add('fade');
      setTimeout(() => { hints.remove(); hints = null; }, 600);
    }, 3000);
  }

  // === Navigation ===
  function goToPage(page) {
    currentPage = Math.max(0, Math.min(2, page));
    app.style.transition = 'transform 0.3s ease-out';
    app.style.transform = `translateX(-${currentPage * 100}vw)`;
    updateDots();

    // Dismiss hints on first manual swipe
    if (!hintsShown && hints) {
      hintsShown = true;
      hints.classList.add('fade');
      setTimeout(() => { if (hints) { hints.remove(); hints = null; } }, 600);
    }

    // Fire resize so globe re-measures its container
    setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
  }

  // === Touch handlers ===
  function onTouchStart(e) {
    if (!active) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchDeltaX = 0;
    touchLocked = null;
    app.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!active) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    // Determine lock direction
    if (touchLocked === null && (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD)) {
      touchLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    if (touchLocked === 'vertical') return; // let scroll/OrbitControls handle it

    if (touchLocked === 'horizontal') {
      e.preventDefault(); // prevent scroll
      touchDeltaX = dx;
      const baseOffset = -currentPage * window.innerWidth;
      app.style.transform = `translateX(${baseOffset + touchDeltaX}px)`;
    }
  }

  function onTouchEnd() {
    if (!active || touchLocked !== 'horizontal') {
      touchLocked = null;
      return;
    }

    let target = currentPage;
    if (touchDeltaX > SNAP_THRESHOLD && currentPage > 0) {
      target = currentPage - 1;
    } else if (touchDeltaX < -SNAP_THRESHOLD && currentPage < 2) {
      target = currentPage + 1;
    }
    goToPage(target);
    touchLocked = null;
  }

  // === Disable OrbitControls horizontal drag on mobile ===
  // We intercept at the globe's canvas level: if a horizontal swipe is detected,
  // we disable controls temporarily so the page swipe takes over.
  function patchOrbitControls() {
    // Globe renderer may not exist yet if 2D mode; check both
    const globeContainer = document.getElementById('globe-container');
    const canvas = globeContainer && globeContainer.querySelector('canvas');
    if (!canvas) return;

    // The controls object lives on the GlobeRenderer; we just need to prevent
    // the canvas from capturing horizontal swipes. We do this by stopping
    // touch events that our swipe handler has claimed.
    canvas.addEventListener('touchmove', (e) => {
      if (touchLocked === 'horizontal') {
        e.stopPropagation();
      }
    }, { passive: false });
  }

  // === Activate / deactivate mobile layout ===
  const scenarioHeader = document.getElementById('scenario-panel-header');
  const scenarioHeaderDesktop = scenarioHeader ? scenarioHeader.textContent : '';

  function activate() {
    if (active) return;
    active = true;
    document.documentElement.classList.add('mobile-layout');
    currentPage = 1; // start on globe
    app.style.transform = `translateX(-${currentPage * 100}vw)`;

    // Swap scenario header to touch-friendly text
    if (scenarioHeader) scenarioHeader.textContent = 'SELECT SCENARIO — TAP TO LAUNCH';

    createDots();
    updateDots();

    // Show hints after a short delay
    setTimeout(createHints, 800);

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    patchOrbitControls();

    // Trigger resize so globe remeasures
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    document.documentElement.classList.remove('mobile-layout');
    app.style.transform = '';
    app.style.transition = '';

    if (dots) { dots.remove(); dots = null; }
    if (hints) { hints.remove(); hints = null; }

    // Restore desktop header
    if (scenarioHeader) scenarioHeader.textContent = scenarioHeaderDesktop;

    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);

    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }

  // === Init ===
  function check() {
    if (mq.matches) activate();
    else deactivate();
  }

  mq.addEventListener('change', check);

  // Delay initial check so globe has time to initialize
  if (document.readyState === 'complete') {
    setTimeout(check, 200);
  } else {
    window.addEventListener('load', () => setTimeout(check, 200));
  }
})();
