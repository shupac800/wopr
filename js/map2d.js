// 2D Equirectangular Map Renderer (Canvas-based)
// Renders coastlines from the same CONTINENT_OUTLINES vector data used by the 3D globe.
// Implements the same interface as GlobeRenderer + MissileSystem for main.js

function haversineKm2D(a, b) {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Visible latitude range — clips polar extremes for a cleaner map
const MAP_LAT_MAX = 84;
const MAP_LAT_MIN = -70;

class MapRenderer2D {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.clock = { getDelta: null, getElapsedTime: null };
    this._lastTime = performance.now() / 1000;
    this._startTime = this._lastTime;
    this.showEquator = false;
    this.clock.getDelta = () => {
      const now = performance.now() / 1000;
      const dt = now - this._lastTime;
      this._lastTime = now;
      return dt;
    };
    this.clock.getElapsedTime = () => {
      return performance.now() / 1000 - this._startTime;
    };

    // Offscreen coastline cache (rebuilt on resize)
    this._coastlineCache = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._watchDPR();

    // Submarine markers for current scenario
    this._submarines = [];

    // Hover detection for city labels
    this.tooltip = document.getElementById('city-tooltip');
    this.hoveredCity = null;
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this._hideTooltip());
  }

  _onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (event.clientX - rect.left) / rect.width * this.w;
    const my = (event.clientY - rect.top) / rect.height * this.h;

    const threshold = 10 * window.devicePixelRatio;
    let closest = null;
    let bestDist = threshold;

    for (const city of CITIES) {
      const [cx, cy] = this.latLonToXY(city.lat, city.lon);
      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        closest = city;
      }
    }

    for (const sub of this._submarines) {
      const [sx, sy] = this.latLonToXY(sub.lat, sub.lon);
      const dx = mx - sx;
      const dy = my - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        closest = sub;
      }
    }

    if (closest) {
      this.tooltip.textContent = closest.name;
      this.tooltip.classList.add('visible');
      this.tooltip.style.left = (event.clientX + 14) + 'px';
      this.tooltip.style.top = (event.clientY - 10) + 'px';
      this.hoveredCity = closest;
    } else {
      this._hideTooltip();
    }
  }

  _hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
      this.hoveredCity = null;
    }
  }

  // Pre-render coastlines from CONTINENT_OUTLINES to an offscreen canvas.
  // Three layers: dark land fill, soft glow, sharp coastline outlines.
  _buildCoastlineCache() {
    if (!CONTINENT_OUTLINES || Object.keys(CONTINENT_OUTLINES).length === 0) return;

    const off = document.createElement('canvas');
    off.width = this.w;
    off.height = this.h;
    const ctx = off.getContext('2d');

    // Layer 1: glow — thick blurred coastline outlines
    ctx.strokeStyle = 'rgba(68, 136, 255, 0.15)';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    for (const [name, coords] of Object.entries(CONTINENT_OUTLINES)) {
      this._tracePath(ctx, coords);
      ctx.stroke();
    }

    // Layer 3: sharp coastline outlines
    ctx.strokeStyle = 'rgba(68, 136, 255, 0.8)';
    ctx.lineWidth = 1.0;
    ctx.lineJoin = 'round';
    for (const [name, coords] of Object.entries(CONTINENT_OUTLINES)) {
      this._tracePath(ctx, coords);
      ctx.stroke();
    }

    this._coastlineCache = off;
  }

  // Trace a coastline polygon path, breaking at date-line crossings
  _tracePath(ctx, coords) {
    if (coords.length < 2) return;
    ctx.beginPath();
    let moved = false;
    for (let i = 0; i < coords.length; i++) {
      const [lat, lon] = coords[i];
      const [x, y] = this.latLonToXY(lat, lon);

      // Break at date-line crossings (large x jump)
      if (i > 0) {
        const [, prevLon] = coords[i - 1];
        if (Math.abs(lon - prevLon) > 180) {
          moved = false;
        }
      }

      if (!moved) {
        ctx.moveTo(x, y);
        moved = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
  }

  _resize() {
    this.canvas.width = this.container.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.container.clientHeight * window.devicePixelRatio;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this._buildCoastlineCache();
  }

  _watchDPR() {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener('change', () => {
      this._resize();
      this._watchDPR();
    }, { once: true });
  }

  // Equirectangular projection: lat/lon → canvas pixel coordinates
  latLonToXY(lat, lon) {
    while (lon < -180) lon += 360;
    while (lon > 180) lon -= 360;

    const x = ((lon + 180) / 360) * this.w;
    const y = ((MAP_LAT_MAX - lat) / (MAP_LAT_MAX - MAP_LAT_MIN)) * this.h;
    return [x, y];
  }

  // Dummy to satisfy missile system interface
  latLonToVec3(lat, lon) {
    const [x, y] = this.latLonToXY(lat, lon);
    return { x, y, z: 0, lat, lon, copy: function() {} };
  }

  showSubmarines(submarines) {
    this._submarines = submarines || [];
  }

  clearSubmarines() {
    this._submarines = [];
  }

  render(time, missileSystem) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(10, 61, 10, 0.15)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x] = this.latLonToXY(0, lon);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 80; lat += 30) {
      const [, y] = this.latLonToXY(lat, 0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Equator — white (toggled with E key)
    if (this.showEquator) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      const [, eqY] = this.latLonToXY(0, 0);
      ctx.beginPath();
      ctx.moveTo(0, eqY);
      ctx.lineTo(w, eqY);
      ctx.stroke();
    }

    // Blit pre-rendered coastlines
    if (this._coastlineCache) {
      ctx.drawImage(this._coastlineCache, 0, 0);
    }

    // Draw city markers
    for (const city of CITIES) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 2 + city.pulsePhase);
      const dotAlpha = 0.4 + pulse * 0.5;
      const [cx, cy] = this.latLonToXY(city.lat, city.lon);
      ctx.fillStyle = city.type === 'base'
        ? `rgba(255, 51, 51, ${dotAlpha})`
        : `rgba(51, 255, 51, ${dotAlpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw submarine markers (colored plus signs)
    const subSize = 4;
    ctx.lineWidth = 1.5;
    for (let si = 0; si < this._submarines.length; si++) {
      const sub = this._submarines[si];
      const subPulse = 0.5 + 0.5 * Math.sin(time * 3 + si * 0.7);
      const subAlpha = 0.5 + subPulse * 0.4;
      const [sx, sy] = this.latLonToXY(sub.lat, sub.lon);
      if (sub.nation === 'us') {
        ctx.strokeStyle = `rgba(255, 51, 51, ${subAlpha})`;
      } else if (sub.nation === 'ussr') {
        ctx.strokeStyle = `rgba(255, 136, 51, ${subAlpha})`;
      } else {
        ctx.strokeStyle = `rgba(255, 255, 51, ${subAlpha})`;
      }
      ctx.beginPath();
      ctx.moveTo(sx - subSize, sy);
      ctx.lineTo(sx + subSize, sy);
      ctx.moveTo(sx, sy - subSize);
      ctx.lineTo(sx, sy + subSize);
      ctx.stroke();
    }

    // Draw blast marks (persistent)
    if (missileSystem) {
      for (const b of missileSystem.blastMarks) {
        const [bx, by] = this.latLonToXY(b.lat, b.lon);
        const maxR = this._blastPixelRadius();
        let r;
        if (b.grown) {
          r = maxR;
        } else {
          const growDuration = b.baseGrowDuration / TIME_COMPRESSION;
          const t = Math.min(b.age / growDuration, 1.0);
          const eased = 1.0 - Math.pow(1.0 - t, 3);
          r = (0.15 + eased * 0.85) * maxR;
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw missile trails and heads
      for (const m of missileSystem.activeMissiles) {
        if (!m.started && !m._2dStarted) continue;

        const [ox, oy] = this.latLonToXY(m.origin.lat, m.origin.lon);
        const [tx, ty] = this.latLonToXY(m.target.lat, m.target.lon);

        // Trail — curved arc
        if (m._2dStarted || m.started) {
          const prog = m.progress;
          const trailAlpha = m.done ? 0.55 : 0.6;
          if (trailAlpha > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${trailAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const steps = 40;
            const drawSteps = m.done ? steps : Math.floor(prog * steps);
            for (let i = 0; i <= drawSteps; i++) {
              const t = i / steps;
              const [px, py] = this._arcPoint(ox, oy, tx, ty, t);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          // Missile head — red triangle pointing in direction of travel
          if (!m.done) {
            const [hx, hy] = this._arcPoint(ox, oy, tx, ty, prog);
            const dt = 0.01;
            const [hx2, hy2] = this._arcPoint(ox, oy, tx, ty, Math.min(prog + dt, 1.0));
            const angle = Math.atan2(hy2 - hy, hx2 - hx);
            const size = 7.5;
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hx + Math.cos(angle) * size, hy + Math.sin(angle) * size);
            ctx.lineTo(hx + Math.cos(angle + 2.356) * size * 0.7, hy + Math.sin(angle + 2.356) * size * 0.7);
            ctx.lineTo(hx + Math.cos(angle - 2.356) * size * 0.7, hy + Math.sin(angle - 2.356) * size * 0.7);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    }
  }

  // Compute a point along a parabolic arc between two screen points
  _arcPoint(x1, y1, x2, y2, t) {
    const x = x1 + (x2 - x1) * t;
    const baseY = y1 + (y2 - y1) * t;
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const arcH = Math.sin(t * Math.PI) * dist * 0.2;
    return [x, baseY - arcH];
  }

  // Blast radius in pixels (88 miles ≈ 1.27° latitude)
  _blastPixelRadius() {
    return (1.27 / (MAP_LAT_MAX - MAP_LAT_MIN)) * this.h;
  }
}


// === 2D Missile System ===
// Wraps the same interface as MissileSystem but operates on 2D canvas data
// The actual rendering is done by MapRenderer2D.render()

class MissileSystem2D {
  constructor(mapRenderer) {
    this.map = mapRenderer;
    this.activeMissiles = [];
    this.detonations = [];
    this.blastMarks = [];
    this.onDetonation = null;
    this.onFirstLaunch = null;
    this.onLaunch = null;
    this.BLAST_RADIUS_DEG = 1.27; // 88 miles in degrees
    this.destroyedSites = [];
  }

  isDestroyed(lat, lon) {
    const threshSq = this.BLAST_RADIUS_DEG * this.BLAST_RADIUS_DEG;
    for (const site of this.destroyedSites) {
      const dlat = lat - site.lat;
      const dlon = lon - site.lon;
      if (dlat * dlat + dlon * dlon < threshSq) return true;
    }
    return false;
  }

  launchSequence(sequence) {
    sequence.missiles.forEach(m => {
      this.launchMissile(m.origin, m.target, m.delay);
    });
  }

  launchMissile(origin, target, delay = 0) {
    const missile = {
      origin,
      target,
      progress: 0,
      delay,
      _2dStarted: false,
      started: false,
      elapsed: 0,
      baseSpeed: 5 / Math.max(1, haversineKm2D(origin, target)),
      done: false,
    };
    this.activeMissiles.push(missile);
    return missile;
  }

  createDetonation(targetCity) {
    this.detonations.push({
      city: targetCity,
      age: 0,
      maxAge: 1.5,
      done: false,
    });

    this.blastMarks.push({
      lat: targetCity.lat,
      lon: targetCity.lon,
      age: 0,
      baseGrowDuration: 900,
      grown: false,
    });

    this.destroyedSites.push({ lat: targetCity.lat, lon: targetCity.lon });

    if (this.onDetonation) {
      this.onDetonation(targetCity);
    }
  }

  update(deltaTime) {
    for (const m of this.activeMissiles) {
      if (m.done) continue;

      m.elapsed += deltaTime * 1000 * TIME_COMPRESSION / BASE_TIME_COMPRESSION;
      if (m.elapsed < m.delay) continue;

      if (!m._2dStarted) {
        if (m.origin.type !== 'sub' && this.isDestroyed(m.origin.lat, m.origin.lon)) {
          m.done = true;
          continue;
        }
        m._2dStarted = true;
        m.started = true;
        if (this.onFirstLaunch) { this.onFirstLaunch(); this.onFirstLaunch = null; }
        if (this.onLaunch) this.onLaunch(m.origin, m.target);
      }

      const speed = Math.min(5.0, Math.max(0.1, TIME_COMPRESSION * m.baseSpeed));
      m.progress += deltaTime * speed;

      if (m.progress >= 1.0) {
        m.progress = 1.0;
        m.done = true;
        this.createDetonation(m.target);
        continue;
      }
    }

    for (const d of this.detonations) {
      d.age += deltaTime;
      if (d.age > d.maxAge) d.done = true;
    }

    for (const b of this.blastMarks) {
      if (b.grown) continue;
      b.age += deltaTime;
      const growDuration = b.baseGrowDuration / TIME_COMPRESSION;
      if (b.age / growDuration >= 1.0) b.grown = true;
    }

    this.detonations = this.detonations.filter(d => !d.done);
  }

  isIdle() {
    const growing = this.blastMarks.some(b => !b.grown);
    const active = this.activeMissiles.some(m => !m.done);
    return !active && this.detonations.length === 0 && !growing;
  }

  clear() {
    this.activeMissiles = [];
    this.detonations = [];
    this.blastMarks = [];
    this.destroyedSites = [];
  }
}
