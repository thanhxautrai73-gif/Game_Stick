// Cinematic Intro Video Player
// Seamlessly integrates the user's high-octane 3D Stickman Hero Intro Video (gemini_generated_video_831f0253.mp4)
import { soundEngine } from '../engine/audio.js';
import introVideoSrc from '../gemini_generated_video_831f0253.mp4';

export class IntroCinematic {
  constructor(scene, cameraController, engineRenderer, particles) {
    this.scene = scene;
    this.camCtrl = cameraController;
    this.renderer = engineRenderer;
    this.particles = particles;

    this.isPlaying = false;
    this.onComplete = null;
    this.videoContainer = null;
    this.videoElement = null;
    this.progressBar = null;
    this.unmuteBtn = null;
  }

  start(onComplete) {
    this.onComplete = onComplete;
    this.isPlaying = true;

    // Stop background music so intro video audio plays cleanly
    soundEngine.ensureContext();
    soundEngine.stopBGM();

    // Show skip button
    const skipBtn = document.getElementById('btn-skip-intro');
    if (skipBtn) skipBtn.style.display = 'block';

    this.setupVideoDOM();
  }

  setupVideoDOM() {
    this.clear();

    // Container
    let container = document.getElementById('cinematic-video-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cinematic-video-container';
      container.className = 'cinematic-video-overlay';
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    container.classList.remove('cinematic-fade-out');
    container.style.display = 'flex';
    this.videoContainer = container;

    // Video Player
    const video = document.createElement('video');
    video.id = 'intro-mp4-video';
    video.className = 'cinematic-video-player';
    video.src = introVideoSrc || '/intro.mp4';
    video.playsInline = true;
    video.preload = 'auto';
    video.autoplay = true;
    this.videoElement = video;
    container.appendChild(video);

    // Bottom-right watermark cover to hide Gemini star logo
    const watermarkCover = document.createElement('div');
    watermarkCover.className = 'cinematic-watermark-cover';
    container.appendChild(watermarkCover);

    // Unmute button (in case browser autoplay policy blocks unmuted audio on first load)
    const unmuteBtn = document.createElement('button');
    unmuteBtn.id = 'btn-unmute-intro';
    unmuteBtn.className = 'cyber-btn cinematic-unmute-btn';
    unmuteBtn.innerHTML = '🔊 BẬT TIẾNG VIDEO INTRO (CLICK)';
    unmuteBtn.style.display = 'none';
    this.unmuteBtn = unmuteBtn;
    container.appendChild(unmuteBtn);

    const enableSound = () => {
      video.muted = false;
      unmuteBtn.style.display = 'none';
    };

    unmuteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      enableSound();
    });

    container.addEventListener('click', () => {
      if (video.muted) enableSound();
    });

    // On video completion -> transition to Menu
    video.addEventListener('ended', () => {
      this.finishIntro();
    });

    // Attempt unmuted play first; if blocked by browser policy, fall back to muted and show prompt
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log('Autoplay unmuted blocked by browser, falling back to muted with click prompt:', err);
        video.muted = true;
        video.play().catch(e => console.warn('Video play error:', e));
        unmuteBtn.style.display = 'flex';
      });
    }
  }

  update(dt) {
    // Video plays natively via HTML5 GPU pipeline
  }

  finishIntro() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.videoContainer) {
      this.videoContainer.classList.add('cinematic-fade-out');
    }

    setTimeout(() => {
      this.clear();
      const cb = this.onComplete;
      this.onComplete = null;
      if (cb) {
        cb();
      }
    }, 450);
  }

  skip() {
    this.isPlaying = false;
    this.clear();
    const cb = this.onComplete;
    this.onComplete = null;
    if (cb) {
      cb();
    }
  }

  clear() {
    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.removeAttribute('src');
        this.videoElement.load();
      } catch (e) {}
      this.videoElement = null;
    }

    if (this.videoContainer) {
      this.videoContainer.style.display = 'none';
      this.videoContainer.innerHTML = '';
    }

    const skipBtn = document.getElementById('btn-skip-intro');
    if (skipBtn) skipBtn.style.display = 'none';

    const sub = document.getElementById('cinematic-subtitle');
    if (sub) sub.style.display = 'none';

    const logo = document.getElementById('cinematic-logo');
    if (logo) logo.style.display = 'none';
  }
}
