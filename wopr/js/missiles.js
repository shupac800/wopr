// Missile Animations — ballistic arcs, trails, and detonations

class MissileSystem {
  constructor(scene, globeRenderer) {
    this.scene = scene;
    this.globe = globeRenderer;
    this.activeMissiles = [];
    this.detonations = [];
    this.blastMarks = []; // persistent blast circles on globe
    this.onDetonation = null; // callback for screen flash

    // 100 miles in radians on globe surface (Earth radius ~3959 mi)
    // Globe radius = 1.0, so scale factor = 100 / 3959
    this.BLAST_RADIUS = 100 / 3959;
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
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x33ff33,
      transparent: true,
      opacity: 0.0,
    });
    const trail = new THREE.Line(trailGeom, trailMat);
    this.scene.add(trail);

    // Missile head (bright point)
    const headGeom = new THREE.SphereGeometry(0.012, 6, 6);
    const headMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
    });
    const head = new THREE.Mesh(headGeom, headMat);
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
      speed: 0.4 + Math.random() * 0.15, // vary speed slightly
      done: false,
      target,
      origin,
      // For partial trail drawing
      drawnCount: 0,
    };

    this.activeMissiles.push(missile);
    return missile;
  }

  // Launch a full strategy sequence
  launchSequence(sequence) {
    sequence.missiles.forEach(m => {
      this.launchMissile(m.origin, m.target, m.delay);
    });
  }

  // Build a flat filled disc in local space (XY plane, centered at origin)
  buildBlastDiscGeometry(radius, segments = 48) {
    const vertices = [0, 0, 0]; // center
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    return geom;
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
      maxAge: 1.5,
      city: targetCity,
    });

    // Persistent blast mark — solid white filled disc, positioned on globe surface
    const blastGeom = this.buildBlastDiscGeometry(this.BLAST_RADIUS);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const blastMesh = new THREE.Mesh(blastGeom, blastMat);

    // Position on globe surface and orient to face outward
    const surfacePos = this.globe.latLonToVec3(targetCity.lat, targetCity.lon, 1.003);
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
      growDuration: 2.5, // seconds to reach full size
      grown: false,
    });

    // Trigger screen flash
    if (this.onDetonation) {
      this.onDetonation();
    }
  }

  update(deltaTime) {
    // Update missiles
    for (const m of this.activeMissiles) {
      if (m.done) continue;

      m.elapsed += deltaTime * 1000; // to ms

      if (m.elapsed < m.delay) continue;

      if (!m.started) {
        m.started = true;
        m.headMat.opacity = 1.0;
        m.trailMat.opacity = 0.6;
      }

      m.progress += deltaTime * m.speed;

      if (m.progress >= 1.0) {
        m.progress = 1.0;
        m.done = true;

        // Remove head
        m.headMat.opacity = 0;
        this.scene.remove(m.head);

        // Create detonation at target
        const targetPos = this.globe.latLonToVec3(m.target.lat, m.target.lon, 1.01);
        this.createDetonation(targetPos, m.target);

        // Start fading trail
        m.fading = true;
        m.fadeAge = 0;
        continue;
      }

      // Move head along arc
      const idx = Math.floor(m.progress * (m.arcPoints.length - 1));
      m.head.position.copy(m.arcPoints[Math.min(idx, m.arcPoints.length - 1)]);

      // Draw trail up to current position
      const positions = m.trailGeom.attributes.position.array;
      const drawUpTo = Math.floor(m.progress * (m.arcPoints.length - 1));

      // Make trail behind missile dimmer toward the start
      // We just rely on the single line with partial draw range
      m.trailGeom.setDrawRange(0, drawUpTo + 1);
    }

    // Fade completed missile trails
    for (const m of this.activeMissiles) {
      if (m.fading) {
        m.fadeAge += deltaTime;
        const fade = 1.0 - (m.fadeAge / 2.0);
        if (fade <= 0) {
          m.trailMat.opacity = 0;
          this.scene.remove(m.trail);
          m.fading = false;
          m.cleaned = true;
        } else {
          m.trailMat.opacity = fade * 0.6;
        }
      }
    }

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
      d.ring.scale.set(1 + t * 2.5, 1 + t * 2.5, 1);
      d.ringMat.opacity = Math.max(0, 1.0 - t);
    }

    // Update persistent blast marks (grow from tiny to full radius)
    for (const b of this.blastMarks) {
      if (b.grown) continue;

      b.age += deltaTime;
      const t = Math.min(b.age / b.growDuration, 1.0);

      // Ease-out curve for gradual slowdown
      const eased = 1.0 - Math.pow(1.0 - t, 2);
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
    for (const d of this.detonations) {
      this.scene.remove(d.ring);
    }
    for (const b of this.blastMarks) {
      this.scene.remove(b.line);
    }
    this.activeMissiles = [];
    this.detonations = [];
    this.blastMarks = [];
  }
}
