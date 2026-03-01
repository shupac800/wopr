// 2D Mercator Map Renderer (Canvas-based)
// Implements the same interface as GlobeRenderer + MissileSystem for main.js

// === LON_OFFSET shifts the map center (positive = shift right/east) ===
// 10 degrees puts the Atlantic Ocean in the center
const LON_OFFSET = 10;

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
    this.clock.getDelta = () => {
      const now = performance.now() / 1000;
      const dt = now - this._lastTime;
      this._lastTime = now;
      return dt;
    };
    this.clock.getElapsedTime = () => {
      return performance.now() / 1000 - this._startTime;
    };

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = this.container.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.container.clientHeight * window.devicePixelRatio;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  // Convert lat/lon to canvas pixel coordinates (Mercator, centered on Atlantic)
  latLonToXY(lat, lon) {
    // Shift longitude so Atlantic is centered
    let adjustedLon = lon + LON_OFFSET;
    // Wrap to [-180, 180]
    if (adjustedLon > 180) adjustedLon -= 360;
    if (adjustedLon < -180) adjustedLon += 360;

    const x = (adjustedLon + 180) / 360 * this.w;
    const y = (90 - lat) / 180 * this.h;
    return [x, y];
  }

  // Dummy to satisfy missile system interface (returns object with lat/lon for compatibility)
  latLonToVec3(lat, lon) {
    const [x, y] = this.latLonToXY(lat, lon);
    return { x, y, z: 0, lat, lon, copy: function() {} };
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
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = this.latLonToXY(lat, 0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Equator — white
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const [, eqY] = this.latLonToXY(0, 0);
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(w, eqY);
    ctx.stroke();

    // Draw continents
    ctx.strokeStyle = 'rgba(68, 136, 255, 0.8)';
    ctx.lineWidth = 1.5;
    for (const [name, coords] of Object.entries(CONTINENT_OUTLINES)) {
      this._drawCoastline(ctx, coords);
    }

    // Draw city markers
    const pulse = 0.5 + 0.5 * Math.sin(time * 2);
    const dotAlpha = 0.4 + pulse * 0.5;
    ctx.fillStyle = `rgba(51, 255, 51, ${dotAlpha})`;
    for (const city of CITIES) {
      const [cx, cy] = this.latLonToXY(city.lat, city.lon);
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
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
          const t = Math.min(b.age / b.growDuration, 1.0);
          const eased = 1.0 - Math.pow(1.0 - t, 2);
          r = (0.15 + eased * 0.85) * maxR;
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw detonation flashes
      for (const d of missileSystem.detonations) {
        const [dx, dy] = this.latLonToXY(d.city.lat, d.city.lon);
        const t = d.age / d.maxAge;
        const flashR = (1 + t * 2.5) * this._blastPixelRadius();
        const alpha = Math.max(0, 1.0 - t);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dx, dy, flashR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw missile trails and heads
      for (const m of missileSystem.activeMissiles) {
        if (!m.started && !m._2dStarted) continue;

        const [ox, oy] = this.latLonToXY(m.origin.lat, m.origin.lon);
        const [tx, ty] = this.latLonToXY(m.target.lat, m.target.lon);

        // Trail — curved arc
        if (m._2dStarted || m.started) {
          const prog = m.progress;
          const trailAlpha = m.fading ? Math.max(0, (1 - m.fadeAge / 2.0) * 0.6) : 0.6;
          if (trailAlpha > 0) {
            ctx.strokeStyle = `rgba(51, 255, 51, ${trailAlpha})`;
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

          // Missile head
          if (!m.done) {
            const [hx, hy] = this._arcPoint(ox, oy, tx, ty, prog);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(hx, hy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // Compute a point along a parabolic arc between two screen points
  _arcPoint(x1, y1, x2, y2, t) {
    const x = x1 + (x2 - x1) * t;
    const baseY = y1 + (y2 - y1) * t;
    // Arc height proportional to distance
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const arcH = Math.sin(t * Math.PI) * dist * 0.2;
    return [x, baseY - arcH];
  }

  // Blast radius in pixels (100 miles on Mercator)
  _blastPixelRadius() {
    // 100 miles ≈ 1.45 degrees latitude
    // Map height = 180 degrees
    return (1.45 / 180) * this.h;
  }

  _drawCoastline(ctx, coords) {
    if (coords.length < 2) return;

    // Split into segments that don't cross the date line (after offset)
    ctx.beginPath();
    let moved = false;
    for (let i = 0; i < coords.length; i++) {
      const [lat, lon] = coords[i];
      const [x, y] = this.latLonToXY(lat, lon);

      // Check for wrap-around (large x jump)
      if (i > 0) {
        const [prevLat, prevLon] = coords[i - 1];
        const [px] = this.latLonToXY(prevLat, prevLon);
        if (Math.abs(x - px) > this.w * 0.5) {
          // Date line crossing — break the line
          ctx.stroke();
          ctx.beginPath();
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
    ctx.stroke();
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
    this.BLAST_RADIUS_DEG = 1.45; // 100 miles in degrees
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
      speed: 0.4 + Math.random() * 0.15,
      done: false,
      fading: false,
      fadeAge: 0,
      cleaned: false,
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
      growDuration: 2.5,
      grown: false,
    });

    if (this.onDetonation) {
      this.onDetonation();
    }
  }

  update(deltaTime) {
    // Update missiles
    for (const m of this.activeMissiles) {
      if (m.done) continue;

      m.elapsed += deltaTime * 1000;
      if (m.elapsed < m.delay) continue;

      if (!m._2dStarted) {
        m._2dStarted = true;
        m.started = true;
      }

      m.progress += deltaTime * m.speed;

      if (m.progress >= 1.0) {
        m.progress = 1.0;
        m.done = true;
        this.createDetonation(m.target);
        m.fading = true;
        m.fadeAge = 0;
        continue;
      }
    }

    // Fade trails
    for (const m of this.activeMissiles) {
      if (m.fading) {
        m.fadeAge += deltaTime;
        if (m.fadeAge >= 2.0) {
          m.cleaned = true;
        }
      }
    }

    // Update detonation flashes
    for (const d of this.detonations) {
      d.age += deltaTime;
      if (d.age > d.maxAge) d.done = true;
    }

    // Update blast marks
    for (const b of this.blastMarks) {
      if (b.grown) continue;
      b.age += deltaTime;
      if (b.age / b.growDuration >= 1.0) b.grown = true;
    }

    // Cleanup
    this.activeMissiles = this.activeMissiles.filter(m => !m.cleaned);
    this.detonations = this.detonations.filter(d => !d.done);
  }

  isIdle() {
    const growing = this.blastMarks.some(b => !b.grown);
    return this.activeMissiles.length === 0 && this.detonations.length === 0 && !growing;
  }

  clear() {
    this.activeMissiles = [];
    this.detonations = [];
    this.blastMarks = [];
  }
}
