// Missile Animations — ballistic arcs, trails, and detonations

function haversineKm(a, b) {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

class MissileSystem {
  constructor(scene, globeRenderer) {
    this.scene = scene;
    this.globe = globeRenderer;
    this.activeMissiles = [];
    this.detonations = [];
    this.blastMarks = []; // persistent blast circles on globe
    this.persistentTrails = []; // trails that persist until clear()
    this.onDetonation = null; // callback for screen flash
    this.onFirstLaunch = null; // callback when first missile starts flying
    this.onLaunch = null;      // callback(origin, target) for each missile launch

    // 88 miles in radians on globe surface (Earth radius ~3959 mi)
    // Globe radius = 1.0, so scale factor = 88 / 3959
    this.BLAST_RADIUS = 88 / 3959;
    this.destroyedSites = []; // lat/lon of detonation sites
  }

  // Check if a lat/lon is within blast radius of any detonation
  isDestroyed(lat, lon) {
    // Compare using great-circle distance approximation in degrees
    // BLAST_RADIUS is in globe-units (~88mi); convert to degrees (~1.27°)
    const threshDeg = 1.27;
    const threshSq = threshDeg * threshDeg;
    for (const site of this.destroyedSites) {
      const dlat = lat - site.lat;
      const dlon = lon - site.lon;
      if (dlat * dlat + dlon * dlon < threshSq) return true;
    }
    return false;
  }

  // Create a ballistic arc between two lat/lon points
  createArc(origin, target, numPoints = 80) {
    const start = this.globe.latLonToVec3(origin.lat, origin.lon, 1.01);
    const end = this.globe.latLonToVec3(target.lat, target.lon, 1.01);

    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;

      // Spherical interpolation
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      point.normalize();

      // Arc height — peaks at midpoint
      const arcHeight = Math.sin(t * Math.PI) * 0.3 * start.distanceTo(end);
      const radius = 1.01 + arcHeight;
      point.multiplyScalar(radius);

      points.push(point);
    }
    return points;
  }

  // Launch a single missile
  launchMissile(origin, target, delay = 0) {
    const arcPoints = this.createArc(origin, target);

    // Trail line (full arc, initially invisible)
    const trailGeom = new THREE.BufferGeometry().setFromPoints(arcPoints);
    trailGeom.setDrawRange(0, 0); // draw nothing until missile starts flying
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false, // prevent invisible trails from occluding scene objects
    });
    const trail = new THREE.Line(trailGeom, trailMat);
    this.scene.add(trail);

    // Missile head — red equilateral triangle (cone viewed from side)
    const triSize = 0.027;
    const triShape = new THREE.BufferGeometry();
    const h3 = triSize * Math.sqrt(3) / 2;
    // Triangle in local XY: point at +Y (forward), base at -Y
    triShape.setAttribute('position', new THREE.Float32BufferAttribute([
      0, h3 * 0.667, 0,              // tip (forward)
      -triSize / 2, -h3 * 0.333, 0,  // base left
      triSize / 2, -h3 * 0.333, 0,   // base right
    ], 3));
    triShape.setIndex([0, 1, 2]);
    triShape.computeVertexNormals();
    const edges = new THREE.EdgesGeometry(triShape);
    const headMat = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const head = new THREE.LineSegments(edges, headMat);
    head.position.copy(arcPoints[0]);
    this.scene.add(head);

    const missile = {
      trail,
      trailGeom,
      trailMat,
      head,
      headMat,
      arcPoints,
      progress: 0,
      delay,
      started: false,
      elapsed: 0,
      baseSpeed: 5 / Math.max(1, haversineKm(origin, target)), // ~5 km/s effective avg (boost+midcourse+reentry)
      done: false,
      target,
      origin,
      // For partial trail drawing
      drawnCount: 0,
    };

    this.activeMissiles.push(missile);
    return missile;
  }

  // Launch a full scenario sequence
  launchSequence(sequence) {
    sequence.missiles.forEach(m => {
      this.launchMissile(m.origin, m.target, m.delay);
    });
  }

  // Build a flat filled disc using Three.js CircleGeometry (no index bugs)
  buildBlastDiscGeometry(radius, segments = 48) {
    return new THREE.CircleGeometry(radius, segments);
  }

  // Create detonation at a point
  createDetonation(position, targetCity) {
    // Flash ring (temporary, expanding)
    const ringGeom = new THREE.RingGeometry(0.001, 0.005, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(position);
    ring.lookAt(0, 0, 0);
    this.scene.add(ring);

    this.detonations.push({
      ring, ringMat,
      position,
      age: 0,
      maxAge: 1.0,
      city: targetCity,
    });

    // Persistent blast mark — solid white filled disc, positioned on globe surface
    const blastGeom = this.buildBlastDiscGeometry(this.BLAST_RADIUS);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const blastMesh = new THREE.Mesh(blastGeom, blastMat);

    // Position on globe surface and orient to face outward
    const surfacePos = this.globe.latLonToVec3(targetCity.lat, targetCity.lon, 1.015);
    blastMesh.position.copy(surfacePos);
    blastMesh.lookAt(0, 0, 0); // face outward from globe center
    blastMesh.scale.setScalar(0.15); // start small but visible
    this.scene.add(blastMesh);

    this.blastMarks.push({
      line: blastMesh,
      mat: blastMat,
      lat: targetCity.lat,
      lon: targetCity.lon,
      age: 0,
      baseGrowDuration: 648, // real-world seconds for blast wave to reach full radius
      grown: false,
    });

    // Record this site as destroyed
    this.destroyedSites.push({ lat: targetCity.lat, lon: targetCity.lon });

    // Trigger screen flash and info panel update
    if (this.onDetonation) {
      this.onDetonation(targetCity);
    }
  }

  update(deltaTime) {
    // Update missiles
    for (const m of this.activeMissiles) {
      if (m.done) continue;

      m.elapsed += deltaTime * 1000 * TIME_COMPRESSION / BASE_TIME_COMPRESSION;

      if (m.elapsed < m.delay) continue;

      if (!m.started) {
        // Check if origin has been destroyed — missile can't launch from a crater
        if (m.origin.type !== 'sub' && this.isDestroyed(m.origin.lat, m.origin.lon)) {
          m.done = true;
          m.cleaned = true;
          this.scene.remove(m.trail);
          this.scene.remove(m.head);
          continue;
        }
        m.started = true;
        if (this.onFirstLaunch) { this.onFirstLaunch(); this.onFirstLaunch = null; }
        if (this.onLaunch) this.onLaunch(m.origin, m.target);
        m.headMat.opacity = 1.0;
        m.trailMat.opacity = 0.6;
      }

      const speed = Math.min(5.0, Math.max(0.1, TIME_COMPRESSION * m.baseSpeed));
      m.progress += deltaTime * speed;

      if (m.progress >= 1.0) {
        m.progress = 1.0;
        m.done = true;

        // Remove head
        m.headMat.opacity = 0;
        this.scene.remove(m.head);

        // Create detonation at target
        const targetPos = this.globe.latLonToVec3(m.target.lat, m.target.lon, 1.012);
        this.createDetonation(targetPos, m.target);

        // Trail persists — dim it slightly but keep visible until clear()
        m.trailMat.opacity = 0.55;
        this.persistentTrails.push(m.trail);
        m.cleaned = true;
        continue;
      }

      // Move head along arc — interpolate between arc points for smooth motion
      const rawIdx = m.progress * (m.arcPoints.length - 1);
      const idx = Math.floor(rawIdx);
      const clampIdx = Math.min(idx, m.arcPoints.length - 1);
      const nextIdx = Math.min(clampIdx + 1, m.arcPoints.length - 1);
      const frac = rawIdx - idx;

      if (nextIdx !== clampIdx) {
        m.head.position.lerpVectors(m.arcPoints[clampIdx], m.arcPoints[nextIdx], frac);
      } else {
        m.head.position.copy(m.arcPoints[clampIdx]);
      }

      // Compute tangent direction from current to next arc point
      if (nextIdx !== clampIdx) {
        const tangent = new THREE.Vector3().subVectors(m.arcPoints[nextIdx], m.arcPoints[clampIdx]).normalize();
        const interpPos = m.head.position;
        const up = interpPos.clone().normalize(); // radial "up" from globe center
        const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
        const mat4 = new THREE.Matrix4().makeBasis(right, tangent, correctedUp);
        m.head.setRotationFromMatrix(mat4);
      }

      // Draw trail up to current position
      const positions = m.trailGeom.attributes.position.array;
      const drawUpTo = Math.floor(m.progress * (m.arcPoints.length - 1));

      // Make trail behind missile dimmer toward the start
      // We just rely on the single line with partial draw range
      m.trailGeom.setDrawRange(0, drawUpTo + 1);
    }

    // (trails persist until clear() is called)

    // Update flash detonations (temporary expanding ring)
    for (const d of this.detonations) {
      d.age += deltaTime;

      if (d.age > d.maxAge) {
        d.ringMat.opacity = 0;
        this.scene.remove(d.ring);
        d.done = true;
        continue;
      }

      const t = d.age / d.maxAge;
      const easeOut = 1.0 - Math.pow(1.0 - t, 3);
      const s = 1 + easeOut * 2.5;
      d.ring.scale.set(s, s, 1);
      d.ringMat.opacity = Math.max(0, 1.0 - t);
    }

    // Update persistent blast marks (grow from tiny to full radius)
    for (const b of this.blastMarks) {
      if (b.grown) continue;

      b.age += deltaTime;
      const growDuration = b.baseGrowDuration / TIME_COMPRESSION;
      const t = Math.min(b.age / growDuration, 1.0);

      // Cubic ease-out — fast initial expansion, decelerating
      const eased = 1.0 - Math.pow(1.0 - t, 3);
      b.line.scale.setScalar(0.15 + eased * 0.85);
      b.mat.opacity = 0.9;

      if (t >= 1.0) {
        b.grown = true;
        b.mat.opacity = 0.9;
      }
    }

    // Cleanup
    this.activeMissiles = this.activeMissiles.filter(m => !m.cleaned);
    this.detonations = this.detonations.filter(d => !d.done);
  }

  // Check if all current missiles have finished
  isIdle() {
    const growing = this.blastMarks.some(b => !b.grown);
    return this.activeMissiles.length === 0 && this.detonations.length === 0 && !growing;
  }

  // Clear everything
  clear() {
    for (const m of this.activeMissiles) {
      this.scene.remove(m.trail);
      this.scene.remove(m.head);
    }
    for (const t of this.persistentTrails) {
      this.scene.remove(t);
    }
    for (const d of this.detonations) {
      this.scene.remove(d.ring);
    }
    for (const b of this.blastMarks) {
      this.scene.remove(b.line);
    }
    this.activeMissiles = [];
    this.persistentTrails = [];
    this.detonations = [];
    this.blastMarks = [];
    this.destroyedSites = [];
  }
}
