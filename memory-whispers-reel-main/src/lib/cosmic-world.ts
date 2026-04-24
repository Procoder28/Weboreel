import * as THREE from "three";
import { CosmicAudio } from "./cosmic-audio";

export type StoryBeat = {
  id: number;
  title: string;
  body: (name: string) => string;
};

export const STORY: StoryBeat[] = [
  {
    id: 0,
    title: "Childhood",
    body: (n) =>
      `Before the world had a name, ${n || "you"} ran barefoot through afternoons that never seemed to end.`,
  },
  {
    id: 1,
    title: "School Years",
    body: () =>
      "Chalk dust, paper planes, the quiet thrill of being chosen — and the louder ache of not being.",
  },
  {
    id: 2,
    title: "First Failure",
    body: (n) =>
      `${n || "You"} learned that falling does not break you. It only teaches gravity its proper weight.`,
  },
  {
    id: 3,
    title: "Becoming",
    body: () =>
      "Somewhere between who you were and who you wanted to be, a new shape began to form — quiet, certain, yours.",
  },
  {
    id: 4,
    title: "Love",
    body: (n) =>
      `${n || "You"} discovered that the heart, once opened, refuses to close the same way again.`,
  },
  {
    id: 5,
    title: "Dreams Ahead",
    body: () =>
      "Up ahead, the sky keeps unfolding — patient, infinite, waiting for the next version of you.",
  },
];

export type WorldEvents = {
  onCheckpoint: (beat: StoryBeat, index: number, total: number) => void;
  onComplete: () => void;
  onProgress: (visited: number, total: number) => void;
};

export class CosmicWorld {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private container: HTMLElement;
  private audio: CosmicAudio;
  private events: WorldEvents;

  private player = new THREE.Object3D();
  private playerVelocity = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private joystick = { x: 0, y: 0, active: false };
  private touchLook = { active: false, lastX: 0, lastY: 0, pointerId: -1 };

  private checkpoints: {
    group: THREE.Group;
    beat: StoryBeat;
    visited: boolean;
    light: THREE.PointLight;
    core: THREE.Mesh;
  }[] = [];

  private particles!: THREE.Points;
  private fireflies!: THREE.Points;
  private skyMat!: THREE.ShaderMaterial;
  private raycaster = new THREE.Raycaster();
  private hovered: number | null = null;
  private finished = false;
  private cinematic = false;
  private cinematicT = 0;
  private cinematicTarget = new THREE.Vector3();
  private stepTimer = 0;
  private rafId = 0;
  private resizeObs?: ResizeObserver;
  private disposed = false;

  constructor(container: HTMLElement, audio: CosmicAudio, events: WorldEvents) {
    this.container = container;
    this.audio = audio;
    this.events = events;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07051a, 0.018);

    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );
    this.player.position.set(0, 1.7, 18);
    this.scene.add(this.player);
    this.player.add(this.camera);

    this.buildSky();
    this.buildLighting();
    this.buildGround();
    this.buildScatter();
    this.buildCheckpoints();
    this.buildParticles();
    this.buildFireflies();

    this.bindEvents();

    this.resizeObs = new ResizeObserver(() => this.onResize());
    this.resizeObs.observe(container);

    this.events.onProgress(0, this.checkpoints.length);
    this.loop();
  }

  // ─── World construction ──────────────────────────────────────────

  private buildSky() {
    const geo = new THREE.SphereGeometry(200, 32, 32);
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uTop: { value: new THREE.Color(0x0a0420) },
        uMid: { value: new THREE.Color(0x1a0a3e) },
        uBot: { value: new THREE.Color(0x2a1262) },
        uIntensity: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform float uTime;
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uBot;
        uniform float uIntensity;

        // hash + noise for stars
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        }

        void main() {
          vec3 dir = normalize(vPos);
          float h = dir.y * 0.5 + 0.5;
          vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.5, h));
          col = mix(col, uTop, smoothstep(0.45, 1.0, h));

          // nebula bands
          float n = sin(dir.x * 3.0 + uTime * 0.05) * cos(dir.z * 2.0 - uTime * 0.04);
          col += vec3(0.3, 0.15, 0.5) * n * 0.08 * (1.0 + uIntensity);

          // stars
          vec3 sp = floor(dir * 220.0);
          float s = hash(sp);
          float star = step(0.997, s);
          float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + s * 50.0);
          col += vec3(1.0, 0.95, 1.0) * star * twinkle;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(geo, this.skyMat));
  }

  private buildLighting() {
    this.scene.add(new THREE.AmbientLight(0x6b5cff, 0.35));
    const moon = new THREE.DirectionalLight(0xa8b4ff, 0.6);
    moon.position.set(20, 40, 10);
    this.scene.add(moon);
    const rim = new THREE.DirectionalLight(0xff7ad9, 0.25);
    rim.position.set(-20, 10, -20);
    this.scene.add(rim);
  }

  private buildGround() {
    // a glass-like reflective disc plane
    const geo = new THREE.CircleGeometry(120, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0c0830,
      metalness: 0.7,
      roughness: 0.35,
      emissive: 0x180838,
      emissiveIntensity: 0.4,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);

    // subtle radial grid
    const gridGeo = new THREE.RingGeometry(0.5, 120, 64, 32);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x6a4dff,
      transparent: true,
      opacity: 0.06,
      wireframe: true,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.01;
    this.scene.add(grid);
  }

  private buildScatter() {
    // floating crystalline shards scattered around
    const geom = new THREE.OctahedronGeometry(0.6, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x9a7dff,
      emissive: 0x4a2dff,
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const count = 80;
    const inst = new THREE.InstancedMesh(geom, mat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const r = 25 + Math.random() * 70;
      const a = Math.random() * Math.PI * 2;
      dummy.position.set(Math.cos(a) * r, 1 + Math.random() * 12, Math.sin(a) * r);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      const s = 0.4 + Math.random() * 1.4;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(inst);
  }

  private buildCheckpoints() {
    // arrange beats on a gentle arc through the world
    const radius = 14;
    STORY.forEach((beat, i) => {
      const t = i / (STORY.length - 1);
      const angle = -Math.PI * 0.85 + t * Math.PI * 1.7;
      const x = Math.sin(angle) * (radius + i * 2.2);
      const z = -Math.cos(angle) * (radius + i * 2.2);
      const y = 1.6 + Math.sin(i * 1.3) * 0.6;

      const group = new THREE.Group();
      group.position.set(x, y, z);

      // glowing core
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7, 1),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: new THREE.Color().setHSL(0.55 + i * 0.08, 0.8, 0.55),
          emissiveIntensity: 1.6,
          roughness: 0.2,
          metalness: 0.1,
        })
      );
      group.add(core);

      // halo ring
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.04, 16, 64),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.55 + i * 0.08, 0.8, 0.7),
          transparent: true,
          opacity: 0.6,
        })
      );
      halo.rotation.x = Math.PI / 2;
      group.add(halo);

      // light beam pillar to the sky
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.55 + i * 0.08, 0.8, 0.6),
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, 60, 16, 1, true), beamMat);
      beam.position.y = 28;
      group.add(beam);

      const light = new THREE.PointLight(
        new THREE.Color().setHSL(0.55 + i * 0.08, 0.9, 0.6),
        2.4,
        20,
        2
      );
      group.add(light);

      this.scene.add(group);
      this.checkpoints.push({ group, beat, visited: false, light, core });
    });
  }

  private buildParticles() {
    // ambient drifting motes
    const count = 1200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5 + Math.random() * 90;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xb8a8ff,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  private buildFireflies() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 60;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 1 + Math.random() * 10;
      positions[i * 3 + 2] = Math.sin(a) * r;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aOffset;
        uniform float uTime;
        varying float vGlow;
        void main() {
          vec3 p = position;
          p.y += sin(uTime * 0.8 + aOffset) * 0.6;
          p.x += cos(uTime * 0.5 + aOffset) * 0.4;
          vGlow = 0.5 + 0.5 * sin(uTime * 2.0 + aOffset * 3.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.0 + vGlow * 2.5) * (200.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vGlow;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float a = smoothstep(0.5, 0.0, d) * vGlow;
          gl_FragColor = vec4(vec3(1.0, 0.85, 1.0), a);
        }
      `,
    });
    this.fireflies = new THREE.Points(geo, mat);
    this.scene.add(this.fireflies);
  }

  // ─── Input ───────────────────────────────────────────────────────

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    const canvas = this.renderer.domElement;
    canvas.addEventListener("click", this.onCanvasClick);
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onMouseMove = (e: MouseEvent) => {
    // hover detection only; look uses pointer drag below
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const meshes = this.checkpoints.map((c) => c.core);
    const hits = this.raycaster.intersectObjects(meshes);
    if (hits.length) {
      const idx = meshes.indexOf(hits[0].object as THREE.Mesh);
      if (this.hovered !== idx) {
        this.hovered = idx;
        this.audio.hover();
        this.renderer.domElement.style.cursor = "pointer";
      }
    } else {
      if (this.hovered !== null) {
        this.hovered = null;
        this.renderer.domElement.style.cursor = "grab";
      }
    }
  };

  private onCanvasClick = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const meshes = this.checkpoints.map((c) => c.core);
    const hits = this.raycaster.intersectObjects(meshes);
    if (hits.length) {
      const idx = meshes.indexOf(hits[0].object as THREE.Mesh);
      this.triggerCheckpoint(idx);
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      // left half = joystick, right half = look
      const rect = this.renderer.domElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        this.joystick.active = true;
        this.joystick.x = 0;
        this.joystick.y = 0;
      } else {
        this.touchLook.active = true;
        this.touchLook.lastX = e.clientX;
        this.touchLook.lastY = e.clientY;
        this.touchLook.pointerId = e.pointerId;
      }
    } else if (e.pointerType === "mouse" && e.button === 0) {
      // start drag-look
      this.touchLook.active = true;
      this.touchLook.lastX = e.clientX;
      this.touchLook.lastY = e.clientY;
      this.touchLook.pointerId = e.pointerId;
      this.renderer.domElement.style.cursor = "grabbing";
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.touchLook.active && e.pointerId === this.touchLook.pointerId) {
      const dx = e.clientX - this.touchLook.lastX;
      const dy = e.clientY - this.touchLook.lastY;
      this.touchLook.lastX = e.clientX;
      this.touchLook.lastY = e.clientY;
      this.yaw -= dx * 0.0035;
      this.pitch -= dy * 0.0035;
      this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
    }
    if (this.joystick.active && e.pointerType === "touch") {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const cx = rect.width * 0.2;
      const cy = rect.height * 0.75;
      const dx = e.clientX - rect.left - cx;
      const dy = e.clientY - rect.top - cy;
      const max = 60;
      const len = Math.min(Math.hypot(dx, dy), max);
      const a = Math.atan2(dy, dx);
      this.joystick.x = (Math.cos(a) * len) / max;
      this.joystick.y = (Math.sin(a) * len) / max;
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId === this.touchLook.pointerId) {
      this.touchLook.active = false;
      this.touchLook.pointerId = -1;
      if (e.pointerType === "mouse")
        this.renderer.domElement.style.cursor = this.hovered !== null ? "pointer" : "grab";
    }
    if (e.pointerType === "touch") {
      this.joystick.active = false;
      this.joystick.x = 0;
      this.joystick.y = 0;
    }
  };

  // ─── Loop ────────────────────────────────────────────────────────

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private triggerCheckpoint(index: number) {
    const c = this.checkpoints[index];
    if (!c || c.visited || this.cinematic || this.finished) return;
    c.visited = true;
    this.audio.chime(index);
    const visited = this.checkpoints.filter((x) => x.visited).length;
    this.audio.setIntensity(visited / this.checkpoints.length);
    this.events.onCheckpoint(c.beat, index, this.checkpoints.length);
    this.events.onProgress(visited, this.checkpoints.length);

    if (visited === this.checkpoints.length) {
      // Trigger ending after a beat
      window.setTimeout(() => this.startFinale(), 5500);
    }
  }

  private startFinale() {
    if (this.finished) return;
    this.finished = true;
    this.cinematic = true;
    this.cinematicT = 0;
    this.cinematicTarget.set(0, 18, 30);
    this.audio.finale();
    window.setTimeout(() => this.events.onComplete(), 7000);
  }

  private loop = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.skyMat.uniforms.uTime.value = t;
    this.skyMat.uniforms.uIntensity.value = this.checkpoints.filter((c) => c.visited).length /
      this.checkpoints.length;
    (this.fireflies.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    // animate checkpoints
    this.checkpoints.forEach((c, i) => {
      c.group.rotation.y += dt * 0.3;
      const bob = Math.sin(t * 1.2 + i) * 0.0025;
      c.group.position.y += bob;
      const targetIntensity = c.visited ? 0.4 : 1.6;
      const m = c.core.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity += (targetIntensity - m.emissiveIntensity) * 0.04;
      c.light.intensity += ((c.visited ? 0.6 : 2.4) - c.light.intensity) * 0.04;
    });

    if (this.particles) this.particles.rotation.y += dt * 0.01;

    if (this.cinematic) {
      this.cinematicT = Math.min(1, this.cinematicT + dt * 0.12);
      const eased = 1 - Math.pow(1 - this.cinematicT, 3);
      this.player.position.lerp(this.cinematicTarget, 0.02);
      // sweep look toward center
      this.yaw += (0 - this.yaw) * 0.02;
      this.pitch += (-0.5 - this.pitch) * 0.02;
      void eased;
    } else {
      this.updateMovement(dt);
    }

    this.player.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // proximity auto-trigger
    if (!this.cinematic) {
      this.checkpoints.forEach((c, i) => {
        if (c.visited) return;
        const d = c.group.position.distanceTo(this.player.position);
        if (d < 3.2) this.triggerCheckpoint(i);
      });
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateMovement(dt: number) {
    let fwd = 0;
    let strafe = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) fwd += 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) fwd -= 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) strafe -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) strafe += 1;

    if (this.joystick.active) {
      strafe += this.joystick.x;
      fwd -= this.joystick.y;
    }

    const speed = 7;
    const dir = new THREE.Vector3(strafe, 0, -fwd);
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed * dt);
      // rotate by yaw
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      const x = dir.x * cos + dir.z * sin;
      const z = -dir.x * sin + dir.z * cos;
      this.playerVelocity.set(x, 0, z);
      this.player.position.add(this.playerVelocity);
      // clamp inside disc
      const r = Math.hypot(this.player.position.x, this.player.position.z);
      if (r > 95) {
        this.player.position.x *= 95 / r;
        this.player.position.z *= 95 / r;
      }
      // footsteps
      this.stepTimer += dt;
      if (this.stepTimer > 0.42) {
        this.stepTimer = 0;
        this.audio.step();
      }
    } else {
      this.stepTimer = 0;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.resizeObs?.disconnect();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
