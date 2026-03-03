// 3D Globe Renderer using Three.js

class GlobeRenderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.globe = null;
    this.cityMarkers = [];
    this.subMarkers = [];
    this.composer = null;
    this.clock = new THREE.Clock();
    this.autoRotate = true;

    this.coastlinesReady = this.init();
  }

  async init() {
    // Load Natural Earth coastlines before building scene
    await loadCoastlines();
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Rotation group — all globe objects go here so we can rotate
    // the globe independently of OrbitControls (which only handles
    // user camera interaction). This prevents drag from affecting
    // rotation speed.
    this.rotationGroup = new THREE.Group();
    this.scene.add(this.rotationGroup);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    // Tilt 25° toward viewer so north pole is visible
    const tilt = 25 * Math.PI / 180;
    const camDist = 2.91; // ~110% zoom vs original 3.2
    this.camera.position.set(0, camDist * Math.sin(tilt), camDist * Math.cos(tilt));

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 6;
    this.controls.autoRotate = false; // rotation handled by rotationGroup

    // Build globe
    this.buildWireframeGlobe();
    this.buildContinents();
    this.buildCityMarkers();

    // Post-processing (bloom)
    this.setupBloom();

    // Hover detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Mesh = { threshold: 0.03 };
    this.mouse = new THREE.Vector2();
    this.tooltip = document.getElementById('city-tooltip');
    this.hoveredCity = null;
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.renderer.domElement.addEventListener('mouseleave', () => this.hideTooltip());

    // Resize handler (window resize and browser zoom / DPR change)
    window.addEventListener('resize', () => this.onResize());
    this._watchDPR();
  }

  buildWireframeGlobe() {
    // Solid black occluder sphere — writes to depth buffer, hides far-side lines
    const occluderGeom = new THREE.SphereGeometry(0.998, 48, 24);
    const occluderMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const occluder = new THREE.Mesh(occluderGeom, occluderMat);
    this.rotationGroup.add(occluder);

    // Wireframe sphere (on top of occluder)
    const geometry = new THREE.SphereGeometry(1, 36, 18);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0a3d0a,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    this.globe = new THREE.Mesh(geometry, material);
    this.rotationGroup.add(this.globe);

    // Earth edge — fresnel/rim glow shader sphere (optional)
    if (typeof EDGE_GLOW !== 'undefined' && EDGE_GLOW) {
      const rimGeom = new THREE.SphereGeometry(1.001, 64, 32);
      const rimMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          rimColor: { value: new THREE.Color(0xffffff) },
          rimPower: { value: 3.0 },
          rimStrength: { value: 0.8 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform vec3 rimColor;
          uniform float rimPower;
          uniform float rimStrength;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
            rim = pow(rim, rimPower) * rimStrength;
            gl_FragColor = vec4(rimColor, rim);
          }
        `,
      });
      this.rotationGroup.add(new THREE.Mesh(rimGeom, rimMat));
    }

    // Equator ring — white
    const eqGeom = new THREE.BufferGeometry();
    const eqPts = [];
    for (let i = 0; i <= 360; i += 1) {
      const rad = (i * Math.PI) / 180;
      eqPts.push(Math.cos(rad) * 1.002, 0, Math.sin(rad) * 1.002);
    }
    eqGeom.setAttribute('position', new THREE.Float32BufferAttribute(eqPts, 3));
    const eqMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    this.rotationGroup.add(new THREE.Line(eqGeom, eqMat));
  }

  latLonToVec3(lat, lon, radius = 1.005) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  buildContinents() {
    const material = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.8,
    });

    for (const [name, coords] of Object.entries(CONTINENT_OUTLINES)) {
      const points = coords.map(([lat, lon]) => this.latLonToVec3(lat, lon));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.rotationGroup.add(line);
    }
  }

  buildCityMarkers() {
    CITIES.forEach(city => {
      const pos = this.latLonToVec3(city.lat, city.lon, 1.008);
      const isBase = city.type === 'base';

      // Small glowing dot — red for military bases, green for cities
      const dotGeom = new THREE.SphereGeometry(0.008, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color: isBase ? 0xff3333 : 0x33ff33,
        transparent: true,
        opacity: 0.8,
      });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.copy(pos);
      dot.userData = { city, baseOpacity: 0.8 };
      this.rotationGroup.add(dot);
      this.cityMarkers.push(dot);
    });
  }

  // Build a plus-sign geometry in local XY plane
  _buildPlusGeometry(size) {
    const pts = new Float32Array([
      // Horizontal bar
      -size, 0, 0,  size, 0, 0,
      // Vertical bar
      0, -size, 0,  0, size, 0,
    ]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return geom;
  }

  // Show submarine markers for a scenario (called from main.js)
  _subColor(nation) {
    if (nation === 'us') return 0xff3333;       // red
    if (nation === 'ussr') return 0xff8833;      // orange
    return 0xffff33;                              // yellow (uk, france, china, etc.)
  }

  showSubmarines(submarines) {
    this.clearSubmarines();
    for (const sub of submarines) {
      const pos = this.latLonToVec3(sub.lat, sub.lon, 1.008);
      const geom = this._buildPlusGeometry(0.012);
      const mat = new THREE.LineBasicMaterial({
        color: this._subColor(sub.nation),
        transparent: true,
        opacity: 0.9,
      });
      const plus = new THREE.LineSegments(geom, mat);
      plus.position.copy(pos);
      plus.lookAt(0, 0, 0);
      plus.userData = { city: { name: sub.name, lat: sub.lat, lon: sub.lon, type: 'sub' } };
      this.rotationGroup.add(plus);
      this.subMarkers.push(plus);
    }
  }

  clearSubmarines() {
    for (const m of this.subMarkers) {
      this.rotationGroup.remove(m);
    }
    this.subMarkers = [];
  }

  setupBloom() {
    // Use UnrealBloomPass if available
    if (typeof THREE.EffectComposer !== 'undefined') {
      this.composer = new THREE.EffectComposer(this.renderer);
      const renderPass = new THREE.RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        1.5,  // strength
        0.4,  // radius
        0.85  // threshold
      );
      this.composer.addPass(bloomPass);
    }
  }

  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  }

  // Watch for devicePixelRatio changes (browser pinch-zoom)
  _watchDPR() {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener('change', () => {
      this.onResize();
      this._watchDPR(); // re-register for the new DPR value
    }, { once: true });
  }

  // Pulse city and sub markers
  updateMarkers(time) {
    this.cityMarkers.forEach((marker, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i * 0.5);
      marker.material.opacity = 0.4 + pulse * 0.5;
    });
    this.subMarkers.forEach((marker, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(time * 3 + i * 0.7);
      marker.material.opacity = 0.5 + pulse * 0.4;
    });
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this._mouseClientX = event.clientX;
    this._mouseClientY = event.clientY;
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    // Screen-space proximity check — 10px threshold
    let closest = null;
    let bestDist = 10;
    const camPos = this.camera.position;
    const allMarkers = this.cityMarkers.concat(this.subMarkers);
    const worldPos = new THREE.Vector3();
    for (const marker of allMarkers) {
      // Get world position (accounts for rotationGroup rotation)
      marker.getWorldPosition(worldPos);
      // Skip markers on far side — dot product of (camera→marker) with surface normal
      // If marker faces away from camera, it's on the back of the globe
      const toCamera = new THREE.Vector3().subVectors(camPos, worldPos);
      if (toCamera.dot(worldPos) < 0) continue;
      const pos = worldPos.clone().project(this.camera);
      const sx = (pos.x * 0.5 + 0.5) * rect.width;
      const sy = (-pos.y * 0.5 + 0.5) * rect.height;
      const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        closest = marker;
      }
    }

    if (closest) {
      const city = closest.userData.city;
      this.tooltip.textContent = city.name;
      this.tooltip.classList.add('visible');
      this.tooltip.style.left = (event.clientX + 14) + 'px';
      this.tooltip.style.top = (event.clientY - 10) + 'px';
      this.hoveredCity = city;
      this._hoveredMarker = closest;
    } else {
      this.hideTooltip();
    }
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
      this.hoveredCity = null;
      this._hoveredMarker = null;
    }
  }

  // Hide tooltip if hovered city rotated away from pointer
  checkTooltipValidity() {
    if (!this._hoveredMarker || !this.hoveredCity) return;
    // Get world position (accounts for rotationGroup rotation)
    const wp = new THREE.Vector3();
    this._hoveredMarker.getWorldPosition(wp);
    // Back side of globe — marker faces away from camera
    const toCamera = new THREE.Vector3().subVectors(this.camera.position, wp);
    if (toCamera.dot(wp) < 0) { this.hideTooltip(); return; }
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pos = wp.clone().project(this.camera);
    const sx = (pos.x * 0.5 + 0.5) * rect.width + rect.left;
    const sy = (-pos.y * 0.5 + 0.5) * rect.height + rect.top;
    const dx = (this._mouseClientX || 0) - sx;
    const dy = (this._mouseClientY || 0) - sy;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      this.hideTooltip();
    }
  }

  render(time) {
    this.controls.update();
    this.updateMarkers(time);
    this.checkTooltipValidity();

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
