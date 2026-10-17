import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Custom Post-Processing Shader for Glitch, Screen Shake & Overdrive Monochromatic Desaturation
const PostProcessingShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGlitch: { value: 0 },
    uOverdrive: { value: 0 }, // 0 = normal color, 1 = monochromatic high contrast
    uDamageFlash: { value: 0 }, // Red flash on damage
    uExplosionFlash: { value: 0 }, // Supernova white-gold explosion flash
    uVignette: { value: 0.18 } // Subtle cinematic vignette, not overly dark
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGlitch;
    uniform float uOverdrive;
    uniform float uDamageFlash;
    uniform float uExplosionFlash;
    uniform float uVignette;
    varying vec2 vUv;

    // Random generator
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Glitch displacement
      if (uGlitch > 0.01) {
        float sliceY = floor(uv.y * 30.0);
        float noiseVal = rand(vec2(sliceY, floor(uTime * 15.0)));
        if (noiseVal > 0.75) {
          uv.x += (noiseVal - 0.75) * 0.08 * uGlitch;
        }
      }

      // Chromatic aberration on glitch
      vec4 cr = texture2D(tDiffuse, uv + vec2(0.003 * uGlitch, 0.0));
      vec4 cg = texture2D(tDiffuse, uv);
      vec4 cb = texture2D(tDiffuse, uv - vec2(0.003 * uGlitch, 0.0));
      vec4 color = vec4(cr.r, cg.g, cb.b, cg.a);

      // Overdrive Monochromatic filter: desaturate except for high brightness (glowing neon cyan remains!)
      if (uOverdrive > 0.01) {
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float isGlow = step(0.85, max(color.r, max(color.g, color.b)));
        vec3 mono = mix(vec3(gray * 1.3), color.rgb, isGlow);
        color.rgb = mix(color.rgb, mono, uOverdrive);
      }

      // Damage Red Flash
      if (uDamageFlash > 0.01) {
        color.rgb = mix(color.rgb, vec3(1.0, 0.05, 0.1), uDamageFlash * 0.4);
      }

      // Supernova White-Gold Explosion Flash
      if (uExplosionFlash > 0.01) {
        vec3 flashColor = vec3(1.0, 0.96, 0.82);
        color.rgb = mix(color.rgb, flashColor, uExplosionFlash * 0.85);
      }

      // Subtle Vignette
      vec2 d = uv - vec2(0.5);
      float vig = 1.0 - dot(d, d) * uVignette * 1.5;
      color.rgb *= clamp(vig, 0.0, 1.0);

      gl_FragColor = color;
    }
  `
};

export class EngineRenderer {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Scene with moody cyber street twilight and turquoise mist matching reference images
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1424);
    this.scene.fog = new THREE.FogExp2(0x0a1424, 0.002);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 200);
    this.camera.position.set(0, 3.5, 12);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.10; // Crisp, balanced, comfortable contrast without blinding glare
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Post-Processing Composer
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Unreal Bloom Pass: tuned to only catch special white-hot weapon sparks, leaving scene clear and non-glaring!
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.38, // Soft, subtle, controlled glow
      0.22, // Tight radius
      0.88  // High threshold: prevents lights and background from blowing out
    );
    this.composer.addPass(this.bloomPass);

    // Custom Shader Pass
    this.customPass = new ShaderPass(PostProcessingShader);
    this.composer.addPass(this.customPass);

    // Balanced Lighting System
    this.initLights();

    // Hitstop / Screen Shake / Time
    this.hitstopTimer = 0;
    this.screenShakeIntensity = 0;
    this.screenShakeTimer = 0;
    this.baseCameraPos = new THREE.Vector3(0, 3.5, 12);

    // Event listeners
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  initLights() {
    // 1. Hemisphere Light: balanced sky & ground fill
    this.hemiLight = new THREE.HemisphereLight(0x7898b8, 0x1a2230, 1.4);
    this.scene.add(this.hemiLight);

    // 2. Ambient Light for balanced contrast across all angles
    this.ambientLight = new THREE.AmbientLight(0x303c50, 1.2);
    this.scene.add(this.ambientLight);

    // 3. Directional Key Light
    this.dirLight = new THREE.DirectionalLight(0xfff6ec, 1.8);
    this.dirLight.position.set(12, 22, 14);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 70;
    this.dirLight.shadow.camera.left = -25;
    this.dirLight.shadow.camera.right = 25;
    this.dirLight.shadow.camera.top = 25;
    this.dirLight.shadow.camera.bottom = -25;
    this.scene.add(this.dirLight);

    // 4. Subtle Cyan Front-Side Accent Light
    this.accentLightCyan = new THREE.DirectionalLight(0x00d4ff, 0.85);
    this.accentLightCyan.position.set(-10, 10, 8);
    this.scene.add(this.accentLightCyan);

    // 5. Subtle Warm Orange Rim Light
    this.rimLight = new THREE.DirectionalLight(0xff7700, 0.95);
    this.rimLight.position.set(-14, 16, -12);
    this.scene.add(this.rimLight);
  }

  // Reset all dynamic post-processing and time freezes (critical for smooth transitions)
  resetEffects() {
    this.hitstopTimer = 0;
    this.screenShakeTimer = 0;
    this.screenShakeIntensity = 0;
    if (this.customPass) {
      this.customPass.uniforms.uGlitch.value = 0;
      this.customPass.uniforms.uOverdrive.value = 0;
      this.customPass.uniforms.uDamageFlash.value = 0;
      this.customPass.uniforms.uExplosionFlash.value = 0;
    }
  }

  // Trigger hitstop freeze frame for high-juice impact feel
  triggerHitstop(duration = 0.04) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  // Trigger screen shake
  triggerScreenShake(intensity = 0.15, duration = 0.15) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTimer = duration;
  }

  // Trigger visual glitch
  triggerGlitch(duration = 0.2) {
    if (this.customPass) {
      this.customPass.uniforms.uGlitch.value = 1.0;
      setTimeout(() => {
        if (this.customPass) this.customPass.uniforms.uGlitch.value = 0;
      }, duration * 1000);
    }
  }

  // Trigger damage flash
  triggerDamageFlash() {
    if (this.customPass) {
      this.customPass.uniforms.uDamageFlash.value = 1.0;
      setTimeout(() => {
        if (this.customPass) this.customPass.uniforms.uDamageFlash.value = 0;
      }, 120);
    }
  }

  // Trigger blinding supernova explosion flash
  triggerExplosionFlash(duration = 0.45) {
    if (this.customPass) {
      this.customPass.uniforms.uExplosionFlash.value = 1.0;
      const startTime = performance.now();
      const interval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(1.0, elapsed / duration);
        if (this.customPass) {
          this.customPass.uniforms.uExplosionFlash.value = Math.max(0, 1.0 - progress);
        }
        if (progress >= 1.0) {
          clearInterval(interval);
        }
      }, 16);
    }
  }

  // Overdrive monochrome toggle
  setOverdriveEffect(active) {
    if (this.customPass) {
      this.customPass.uniforms.uOverdrive.value = active ? 1.0 : 0.0;
    }
  }

  update(dt, totalTime) {
    // Process hitstop: returns effective dt for game objects (punchy impact slow-mo without freezing frame loop)
    let effectiveDt = dt;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      effectiveDt = dt * 0.08; // 92% cinematic impact slowdown instead of freezing physics to zero
    }

    // Process screen shake
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
      const progress = Math.max(0, this.screenShakeTimer / 0.25);
      const curIntensity = this.screenShakeIntensity * progress;
      this.camera.position.x = this.baseCameraPos.x + (Math.random() - 0.5) * curIntensity * 2;
      this.camera.position.y = this.baseCameraPos.y + (Math.random() - 0.5) * curIntensity * 2;
      this.camera.position.z = this.baseCameraPos.z + (Math.random() - 0.5) * curIntensity * 0.5;
    } else {
      this.camera.position.copy(this.baseCameraPos);
    }

    // Update uniforms
    if (this.customPass) {
      this.customPass.uniforms.uTime.value = totalTime;
    }

    return effectiveDt;
  }

  render() {
    this.composer.render();
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
