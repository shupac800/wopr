// 2D Mercator Map Renderer (Canvas-based)
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

// === Geographic bounds of conts.png ===
// The image is equirectangular. These define what lat/lon the image edges map to.
// The image fills the full canvas; latLonToXY uses these same bounds.
// This guarantees dots always align with the image by construction.
// Calibrated from user click data (least-squares fit):
//   London (51.5°N, 0.1°W) at x=46.1% y=37.3%
//   Moscow (55.8°N, 37.6°E) at x=54.9% y=35.5%
//   Washington (38.9°N, 77.0°W) at x=26.5% y=45.0%
//   Equator at y=62.0%
const MAP_LON_LEFT  = -186.0;
const MAP_LON_RIGHT =  217.5;
const MAP_LAT_TOP   =  129.2;
const MAP_LAT_BOTTOM = -79.2;

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

    // Load continent outline image and pre-tint it blue
    this._mapImage = null;
    this._tintedMap = null;
    const img = new Image();
    img.onload = () => {
      this._mapImage = img;
      this._buildTintedMap();
    };
    img.src = 'data/conts.png';

    this._resize();
    window.addEventListener('resize', () => this._resize());

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

    // Find closest city within 10px screen distance
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

    // Also check submarine markers
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

  // Pre-render a blue-tinted version of the map image
  // Uses composite ops only (no getImageData) to avoid CORS issues on file://
  // White lines × blue = blue lines, black × blue = black
  _buildTintedMap() {
    if (!this._mapImage) return;
    const iw = this._mapImage.width;
    const ih = this._mapImage.height;

    const off = document.createElement('canvas');
    off.width = iw;
    off.height = ih;
    const octx = off.getContext('2d');

    // Draw original white-on-black image
    octx.drawImage(this._mapImage, 0, 0);

    // Multiply with blue: white→blue, black stays black
    octx.globalCompositeOperation = 'multiply';
    octx.fillStyle = '#4488ff';
    octx.fillRect(0, 0, iw, ih);

    this._tintedMap = off;
  }

  _resize() {
    this.canvas.width = this.container.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.container.clientHeight * window.devicePixelRatio;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this._buildTintedMap();
  }

  // Convert lat/lon to canvas pixel coordinates
  // Calibrated at consistent window size:
  //   London (51.5°N, 0.1°W) → x=46.1% y=37.1%
  //   Miami  (25.8°N, 80.2°W) → x=25.9% y=53.5%
  //   Equator → y=64.9%
  latLonToXY(lat, lon) {
    while (lon < -180) lon += 360;
    while (lon > 180) lon -= 360;

    const xFrac = 0.002522 * lon + 0.4613;
    const x = xFrac * this.w;

    const yFrac = -0.00003811 * lat * lat - 0.003435 * lat + 0.6490;
    const y = yFrac * this.h;
    return [x, y];
  }

  // Dummy to satisfy missile system interface (returns object with lat/lon for compatibility)
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

    // Draw continent outlines from image — fills the entire canvas
    // latLonToXY uses the same bounds, so everything aligns by construction
    if (this._tintedMap) {
      ctx.globalCompositeOperation = 'lighten';
      ctx.drawImage(this._tintedMap, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Draw city markers
    const pulse = 0.5 + 0.5 * Math.sin(time * 2);
    const dotAlpha = 0.4 + pulse * 0.5;
    for (const city of CITIES) {
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
    for (const sub of this._submarines) {
      const [sx, sy] = this.latLonToXY(sub.lat, sub.lon);
      if (sub.nation === 'us') {
        ctx.strokeStyle = `rgba(255, 51, 51, ${dotAlpha})`;       // red
      } else if (sub.nation === 'ussr') {
        ctx.strokeStyle = `rgba(255, 136, 51, ${dotAlpha})`;      // orange
      } else {
        ctx.strokeStyle = `rgba(255, 255, 51, ${dotAlpha})`;      // yellow
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
          const t = Math.min(b.age / b.growDuration, 1.0);
          const eased = 1.0 - Math.pow(1.0 - t, 3);
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
        const easeOut = 1.0 - Math.pow(1.0 - t, 3);
        const flashR = (1 + easeOut * 2.5) * this._blastPixelRadius();
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
            // Compute tangent by sampling a tiny step ahead
            const dt = 0.01;
            const [hx2, hy2] = this._arcPoint(ox, oy, tx, ty, Math.min(prog + dt, 1.0));
            const angle = Math.atan2(hy2 - hy, hx2 - hx);
            const size = 7.5;
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // Tip: forward along angle
            ctx.moveTo(hx + Math.cos(angle) * size, hy + Math.sin(angle) * size);
            // Base left
            ctx.lineTo(hx + Math.cos(angle + 2.356) * size * 0.7, hy + Math.sin(angle + 2.356) * size * 0.7);
            // Base right
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
    // Arc height proportional to distance
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const arcH = Math.sin(t * Math.PI) * dist * 0.2;
    return [x, baseY - arcH];
  }

  // Blast radius in pixels (88 miles on map)
  _blastPixelRadius() {
    // 88 miles ≈ 1.27 degrees latitude
    return (1.27 / (MAP_LAT_TOP - MAP_LAT_BOTTOM)) * this.h;
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
    this.onFirstLaunch = null;
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
      speed: Math.min(5.0, Math.max(0.1, TIME_COMPRESSION * 7 / haversineKm2D(origin, target))),
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
      growDuration: THEATRICAL_TIMING ? 2.5 : 2.5 * 360 / TIME_COMPRESSION,
      grown: false,
    });

    this.destroyedSites.push({ lat: targetCity.lat, lon: targetCity.lon });

    if (this.onDetonation) {
      this.onDetonation(targetCity);
    }
  }

  update(deltaTime) {
    // Update missiles
    for (const m of this.activeMissiles) {
      if (m.done) continue;

      m.elapsed += deltaTime * 1000;
      if (m.elapsed < m.delay) continue;

      if (!m._2dStarted) {
        // Check if origin has been destroyed — missile can't launch from a crater
        if (m.origin.type !== 'sub' && this.isDestroyed(m.origin.lat, m.origin.lon)) {
          m.done = true;
          continue;
        }
        m._2dStarted = true;
        m.started = true;
        if (this.onFirstLaunch) { this.onFirstLaunch(); this.onFirstLaunch = null; }
      }

      m.progress += deltaTime * m.speed;

      if (m.progress >= 1.0) {
        m.progress = 1.0;
        m.done = true;
        this.createDetonation(m.target);
        continue;
      }
    }

    // (trails persist until clear() is called)

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

    // Cleanup — keep done missiles for persistent trail rendering
    // (removed from list only on clear())
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
