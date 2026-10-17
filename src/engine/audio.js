// Audio Engine using Web Audio API procedural synthesis
// No external asset dependencies - instantly reliable, zero latency, zero CORS or 404 errors

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.currentTrack = null;
    this.bpm = 132;
    this.stepIndex = 0;
    this.clockTimer = null;
    this.isUltimateMuted = false;
    this.cachedVoice = null;
    this.initVoiceSynthesis();

    // Official Game Theme Song
    this.themeAudio = null;
    this.themeVolume = 0.28; // Subtle, non-intrusive volume fitting real gameplay
    this.initThemeAudio();
  }

  initThemeAudio() {
    if (typeof window === 'undefined') return;
    try {
      this.themeAudio = new Audio('/theme_song.mp3');
      this.themeAudio.loop = true;
      this.themeAudio.volume = this.themeVolume;
      this.themeAudio.preload = 'auto';
    } catch (e) {
      console.warn('Failed to load theme song audio', e);
    }
  }

  playThemeSong(volume = 0.28) {
    if (!this.themeAudio) this.initThemeAudio();
    if (!this.themeAudio) return;

    this.themeVolume = volume;
    this.themeAudio.volume = this.isMuted ? 0 : this.themeVolume;
    this.themeAudio.muted = this.isMuted;

    const playPromise = this.themeAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const resumeOnInteract = () => {
          if (this.themeAudio && !this.isMuted) {
            this.themeAudio.play().catch(() => {});
          }
          window.removeEventListener('click', resumeOnInteract);
          window.removeEventListener('keydown', resumeOnInteract);
        };
        window.addEventListener('click', resumeOnInteract, { once: true });
        window.addEventListener('keydown', resumeOnInteract, { once: true });
      });
    }
  }

  pauseThemeSong() {
    if (this.themeAudio) {
      this.themeAudio.pause();
    }
  }

  setThemeVolume(vol) {
    this.themeVolume = vol;
    if (this.themeAudio && !this.isMuted) {
      this.themeAudio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  initVoiceSynthesis() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          // Prioritize authentic Southern Vietnamese voices (Microsoft HoaiMy, Microsoft An, South/Saigon accents)
          const southernVoice = voices.find(v => {
            const name = (v.name || '').toLowerCase();
            const lang = (v.lang || '').toLowerCase();
            return (lang.includes('vi') || lang.includes('vn')) && 
                   (name.includes('hoaimy') || name.includes('an') || name.includes('south') || name.includes('nam') || name.includes('saigon'));
          });
          const anyViVoice = voices.find(v => {
            const lang = (v.lang || '').toLowerCase();
            return lang.startsWith('vi') || lang.includes('vn');
          });
          this.cachedVoice = southernVoice || anyViVoice || null;
        } catch (e) {}
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
    }
    if (this.themeAudio) {
      this.themeAudio.muted = muted;
      this.themeAudio.volume = muted ? 0 : this.themeVolume;
    }
  }

  // --- SOUND EFFECTS (SFX) ---

  playSlash(comboStep = 1) {
    this.ensureContext();
    if (this.isMuted || this.isUltimateMuted) return;
    const t = this.ctx.currentTime;

    // Filtered noise swoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = comboStep === 3 ? 1200 : comboStep === 2 ? 2200 : 3000;
    filter.frequency.setValueAtTime(baseFreq, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);
    filter.Q.setValueAtTime(3, t);

    // High frequency sci-fi laser tone
    const osc = this.ctx.createOscillator();
    osc.type = comboStep === 3 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(comboStep === 3 ? 420 : 750, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.12);
    osc.stop(t + 0.12);
  }

  playHit(isCrit = false) {
    this.ensureContext();
    if (this.isMuted || this.isUltimateMuted) return;
    const t = this.ctx.currentTime;

    // Crisp metallic slash
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(isCrit ? 980 : 650, t);
    osc1.frequency.exponentialRampToValueAtTime(110, t + 0.08);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(isCrit ? 1850 : 1200, t);
    osc2.frequency.exponentialRampToValueAtTime(240, t + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isCrit ? 0.7 : 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.18 : 0.08));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.2);
    osc2.stop(t + 0.2);

    // If critical: resonant metallic "Keng!"
    if (isCrit) {
      this.playCritGong();
    }
  }

  playCritGong() {
    const t = this.ctx.currentTime;
    const gong = this.ctx.createOscillator();
    gong.type = 'sine';
    gong.frequency.setValueAtTime(2400, t);
    gong.frequency.exponentialRampToValueAtTime(900, t + 0.35);

    const gongGain = this.ctx.createGain();
    gongGain.gain.setValueAtTime(0.55, t);
    gongGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    gong.connect(gongGain);
    gongGain.connect(this.sfxGain);
    gong.start(t);
    gong.stop(t + 0.35);
  }

  playParry() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sharp metallic ring chime
    const freqs = [1760, 2637, 3520];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.95, t + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 + i * 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  playDash() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  playJump() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playBlinkSlash() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    // Instant teleport "whoosh"
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);

    // 5 rapid slashes
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playHit(i === 4);
      }, 70 * (i + 1));
    }
  }

  playOverdrive() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sci-fi charging
    const charge = this.ctx.createOscillator();
    charge.type = 'sawtooth';
    charge.frequency.setValueAtTime(120, t);
    charge.frequency.exponentialRampToValueAtTime(880, t + 0.2);

    const chargeGain = this.ctx.createGain();
    chargeGain.gain.setValueAtTime(0.25, t);
    chargeGain.gain.exponentialRampToValueAtTime(0.6, t + 0.2);

    charge.connect(chargeGain);
    chargeGain.connect(this.sfxGain);
    charge.start(t);
    charge.stop(t + 0.2);

    // Low-bass explosion
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const boom = this.ctx.createOscillator();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(160, t2);
      boom.frequency.exponentialRampToValueAtTime(35, t2 + 0.6);

      const boomGain = this.ctx.createGain();
      boomGain.gain.setValueAtTime(0.9, t2);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.6);

      boom.connect(boomGain);
      boomGain.connect(this.sfxGain);
      boom.start(t2);
      boom.stop(t2 + 0.6);
    }, 200);
  }

  playUltimateZeroAbsolute() {
    this.ensureContext();
    if (this.isMuted) return;

    // 0.2s mute suspense
    this.isUltimateMuted = true;
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    }

    setTimeout(() => {
      this.isUltimateMuted = false;
      if (this.bgmGain && !this.isMuted) {
        this.bgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      }

      // Spatial slicing burst
      const t = this.ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400 - i * 120, t + i * 0.03);
        osc.frequency.exponentialRampToValueAtTime(100, t + i * 0.03 + 0.15);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.35, t + i * 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.15);

        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t + i * 0.03);
        osc.stop(t + i * 0.03 + 0.16);
      }

      // Glass shatter / code dissolve noise
      setTimeout(() => {
        if (!this.ctx) return;
        const t3 = this.ctx.currentTime;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < d.length; j++) {
          d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (this.ctx.sampleRate * 0.1));
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'highpass';
        flt.frequency.setValueAtTime(3000, t3);

        const g3 = this.ctx.createGain();
        g3.gain.setValueAtTime(0.6, t3);
        src.connect(flt);
        flt.connect(g3);
        g3.connect(this.sfxGain);
        src.start(t3);
      }, 350);

    }, 200);
  }

  playHeartbeat() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.7, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Second thump
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(65, t + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(35, t + 0.3);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.5, t + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.18);
    osc2.stop(t + 0.32);
  }

  playThunder() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;
    const dur = 1.2;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(450, t);
    flt.frequency.linearRampToValueAtTime(120, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
  }

  playVictoryFanfare() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chords.forEach((note, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t + i * 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + 1.7);
    });
  }

  playDefeatSound() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    // Soft, short, gentle sub-bass drop (only 0.25s, no annoying long sawtooth notes)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  playClashSound() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.20);

    this.playCritGong();
  }

  playMassiveExplosion() {
    this.ensureContext();
    if (this.isMuted) return;
    const t = this.ctx.currentTime;

    // 1. Deep Sub-Bass Rumble (35Hz)
    const boom = this.ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(200, t);
    boom.frequency.exponentialRampToValueAtTime(32, t + 0.9);

    const boomGain = this.ctx.createGain();
    boomGain.gain.setValueAtTime(1.0, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(t);
    boom.stop(t + 0.95);

    // 2. High-energy explosion blast noise
    const dur = 0.8;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(1400, t);
    flt.frequency.linearRampToValueAtTime(120, t + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(flt);
    flt.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    this.playCritGong();
  }

  // --- HERO BATTLE SHOUTS & VOICE LINES ---

  speakVoice(text) {
    if (this.isMuted) return;
    // Cyber robotic vocoder harmonic effect matching the cinematic intro voice tone
    this.playCyberVocoderVoiceHarmonic();

    // Run speech synthesis asynchronously
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'vi-VN';
          utter.pitch = 0.85; // Deep heroic masculine warrior pitch matching the cinematic trailer
          utter.rate = 1.20;  // Dynamic combat shout speed
          utter.volume = 1.0;
          if (this.cachedVoice) utter.voice = this.cachedVoice;
          window.speechSynthesis.speak(utter);
        }
      } catch (e) {}
    }, 0);
  }

  playHeroShoutChime() {
    this.playCyberVocoderVoiceHarmonic();
  }

  playCyberVocoderVoiceHarmonic() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Sub-bass chest resonance (85Hz down to 55Hz)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(85, t);
    subOsc.frequency.exponentialRampToValueAtTime(55, t + 0.35);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(180, t);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.42, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.36);

    // 2. High-tech cyber vocoder formant ring (1350Hz mecha resonant bandpass)
    const vocOsc = this.ctx.createOscillator();
    vocOsc.type = 'square';
    vocOsc.frequency.setValueAtTime(420, t);
    vocOsc.frequency.linearRampToValueAtTime(280, t + 0.30);

    const vocFilter = this.ctx.createBiquadFilter();
    vocFilter.type = 'bandpass';
    vocFilter.frequency.setValueAtTime(1350, t);
    vocFilter.Q.value = 5.0; // High Q gives a robotic formant resonance

    const vocGain = this.ctx.createGain();
    vocGain.gain.setValueAtTime(0.25, t);
    vocGain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);

    vocOsc.connect(vocFilter);
    vocFilter.connect(vocGain);
    vocGain.connect(this.sfxGain);
    vocOsc.start(t);
    vocOsc.stop(t + 0.31);

    // 3. Crisp energy chime pulse
    const chimeOsc = this.ctx.createOscillator();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(740, t);
    chimeOsc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);

    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.20, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chimeOsc.start(t);
    chimeOsc.stop(t + 0.15);
  }

  playVoiceLine(actionType) {
    const now = performance.now();
    if (this._lastVoiceTime && now - this._lastVoiceTime < 750) return null; // Throttle to prevent overlap
    this._lastVoiceTime = now;

    let quotes = [];
    switch (actionType) {
      case 'comboFinisher':
        quotes = ['Coi chừng tui nè!', 'Trảm nát mi nè!', 'Đỡ cú này đi!', 'Ăn trọn kiếm nè!'];
        break;
      case 'heavy':
        quotes = ['HÃY COI CHỪNG TUI ĐÂY!', 'ĐỊA LÔI CHẤN NÈ MÀY!', 'Ăn trọn đòn này đi!', 'Tan xác nè mày!'];
        break;
      case 'skill1': // Blink Slash (Image 3)
        quotes = ['Lôi Quang Trảm nè!', 'Biến mất nè!', 'Tốc biến chém liền!', 'Coi chừng phía sau lưng nè!'];
        break;
      case 'skill2': // Overdrive Ground Slam (Image 2)
        quotes = ['HÃY COI CHỪNG TUI ĐÂY! BỘC PHÁ NÈ!', 'NỔ BANH XÁC NÈ MÀY!', 'BÙNG NỔ HẾT CỠ NÈ!'];
        break;
      case 'ult': // Zero-Absolute
        quotes = ['TUYỆT ĐỐI KHÔNG GIAN! CHẾT HẾT CHO TAO!', 'ĐỨNG YÊN ĐÓ MÀ CHẾT NÈ! ZERO ABSOLUTE!'];
        break;
      case 'parry':
        quotes = ['Chặn đứng nè!', 'Không xi nhê đâu nha!', 'Quá non nha mạy!'];
        break;
      case 'dash':
        quotes = ['Né nè!', 'Hụt rồi cưng!', 'Chậm quá mạy!'];
        break;
      default:
        quotes = ['Coi chừng tui nè!'];
    }

    const text = quotes[Math.floor(Math.random() * quotes.length)];
    this.speakVoice(text);
    return text;
  }

  // --- DYNAMIC PROCEDURAL BGM (Cyberpunk Synthwave & Boss Dubstep) ---

  startBGM(track = 'cyberpunk') {
    this.ensureContext();
    this.currentTrack = track;
    this.bpm = 138; // Driving cinematic combat tempo
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.stepIndex = 0;

    const stepDuration = 60 / this.bpm / 4; // 16th notes
    const tick = () => {
      if (!this.bgmPlaying) return;
      this.playSequencerStep(this.stepIndex, this.currentTrack);
      this.stepIndex = (this.stepIndex + 1) % 64;
      this.clockTimer = setTimeout(tick, stepDuration * 1000);
    };
    tick();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.clockTimer) clearTimeout(this.clockTimer);
  }

  playSequencerStep(step, track) {
    if (this.isMuted || !this.ctx || this.isUltimateMuted) return;
    const t = this.ctx.currentTime;

    // Drum beat: Kick on 0, 4, 8, 12... (4 on the floor punchy sub-bass)
    if (step % 4 === 0) {
      this.triggerKick(t);
    }
    // Gated Snare on 4, 12 (beats 2 and 4)
    if (step % 8 === 4) {
      this.triggerSnare(t);
    }
    // Hi-hat on every odd 16th + extra roll on beat 14
    if (step % 2 === 1 || step === 14) {
      this.triggerHat(t);
    }

    if (track === 'boss') {
      // Dubstep Wobble Bass + Dark Minor Chords
      if (step % 4 === 0) {
        const root = (step < 32) ? 45 : 41; // A1 or F1
        this.triggerWobbleBass(t, root);
      }
      if (step % 16 === 0) {
        this.triggerBossPad(t);
      }
    } else {
      // Cinematic Cyber Combat Rolling Synth Bass (D minor / F / C / Bb)
      const bar = Math.floor(step / 16);
      const roots = [73.42, 65.41, 87.31, 58.27]; // D2, C2, F2, Bb1
      const rootFreq = roots[bar % roots.length];
      const oct = (step % 4 === 0 || step % 4 === 3) ? 1 : 2;
      this.triggerSynthBass(t, rootFreq * oct);

      // Heroic Driving Arpeggio Synth Lead
      if (step % 2 === 0) {
        const leadNotes = [293.66, 349.23, 440, 523.25, 587.33, 698.46]; // D4, F4, A4, C5, D5, F5
        const note = leadNotes[(step * 5) % leadNotes.length];
        this.triggerSynthLead(t, note);
      }
    }
  }

  triggerKick(t) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  triggerSnare(t) {
    const bufSize = this.ctx.sampleRate * 0.12;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.setValueAtTime(900, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.bgmGain);
    src.start(t);
  }

  triggerHat(t) {
    const bufSize = this.ctx.sampleRate * 0.04;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.setValueAtTime(6000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.bgmGain);
    src.start(t);
  }

  triggerSynthBass(t, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(650, t);
    flt.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  triggerSynthLead(t, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(1600, t);
    flt.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  triggerWobbleBass(t, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(150, t);
    flt.frequency.linearRampToValueAtTime(1200, t + 0.1);
    flt.frequency.linearRampToValueAtTime(180, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  triggerBossPad(t) {
    const chord = [220, 261.63, 329.63]; // A minor
    chord.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const flt = this.ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(450, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(flt);
      flt.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(t);
      osc.stop(t + 1.9);
    });
  }
}

export const soundEngine = new SoundEngine();
