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

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 3.2);

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
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.3;

    // Build globe
    this.buildWireframeGlobe();
    this.buildContinents();
    this.buildCityMarkers();

    // Post-processing (bloom)
    this.setupBloom();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  buildWireframeGlobe() {
    // Solid black occluder sphere — writes to depth buffer, hides far-side lines
    const occluderGeom = new THREE.SphereGeometry(0.998, 48, 24);
    const occluderMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const occluder = new THREE.Mesh(occluderGeom, occluderMat);
    this.scene.add(occluder);

    // Wireframe sphere (on top of occluder)
    const geometry = new THREE.SphereGeometry(1, 36, 18);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0a3d0a,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);

    // Earth edge — fresnel/rim glow shader sphere
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
    this.scene.add(new THREE.Mesh(rimGeom, rimMat));

    // Equator ring — white
    const eqGeom = new THREE.BufferGeometry();
    const eqPts = [];
    for (let i = 0; i <= 360; i += 1) {
      const rad = (i * Math.PI) / 180;
      eqPts.push(Math.cos(rad) * 1.002, 0, Math.sin(rad) * 1.002);
    }
    eqGeom.setAttribute('position', new THREE.Float32BufferAttribute(eqPts, 3));
    const eqMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    this.scene.add(new THREE.Line(eqGeom, eqMat));
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
      this.scene.add(line);
    }
  }

  buildCityMarkers() {
    CITIES.forEach(city => {
      const pos = this.latLonToVec3(city.lat, city.lon, 1.008);

      // Small glowing dot
      const dotGeom = new THREE.SphereGeometry(0.008, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x33ff33,
        transparent: true,
        opacity: 0.8,
      });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.copy(pos);
      dot.userData = { city, baseOpacity: 0.8 };
      this.scene.add(dot);
      this.cityMarkers.push(dot);
    });
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
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  }

  // Pulse city markers
  updateMarkers(time) {
    this.cityMarkers.forEach((marker, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i * 0.5);
      marker.material.opacity = 0.4 + pulse * 0.5;
    });
  }

  render(time) {
    this.controls.update();
    this.updateMarkers(time);

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
