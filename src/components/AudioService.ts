/** Synthesizes animal representative and UI sounds via Web Audio API */
class AudioService {
  private ctx: AudioContext | null = null
  private _muted: boolean = false
  private _volume: number = 0.5
  private muteListeners = new Set<() => void>()

  constructor() {
    if (typeof window !== 'undefined') {
      this._muted = localStorage.getItem('wildlife-audio-muted') === 'true'
      const vol = localStorage.getItem('wildlife-audio-volume')
      if (vol) this._volume = Math.max(0, Math.min(1, parseFloat(vol)))
    }
  }

  /** Subscribe to mute changes (for useSyncExternalStore) */
  subscribeMute(listener: () => void): () => void {
    this.muteListeners.add(listener)
    return () => this.muteListeners.delete(listener)
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    // Browsers create the context suspended unless opened from a user
    // gesture (e.g. the first hover sound); without a resume all
    // synthesized sounds stay silent for the whole session.
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /** Returns true if audio is muted */
  isMuted(): boolean {
    return this._muted
  }

  /** Toggles mute state and persists to localStorage */
  toggleMute(): void {
    this._muted = !this._muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('wildlife-audio-muted', String(this._muted))
    }
    this.muteListeners.forEach((l) => l())
  }

  /** Sets volume (0-1) and persists to localStorage */
  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v))
    if (typeof window !== 'undefined') {
      localStorage.setItem('wildlife-audio-volume', String(this._volume))
    }
  }

  /** Creates a gain node scaled by current volume */
  private createGain(): [GainNode, AudioContext] {
    const ctx = this.getCtx()
    const gain = ctx.createGain()
    return [gain, ctx]
  }

  playClickSound(): void {
    if (this._muted) return
    try {
      const ctx = this.getCtx()
      if (ctx.state !== 'running') return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05)
      osc.type = "sine"
      gain.gain.setValueAtTime(0.15 * this._volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch (err) {
      console.warn('[audio]', err)
    }
  }

  playHoverSound(): void {
    if (this._muted) return
    try {
      const ctx = this.getCtx()
      if (ctx.state !== 'running') return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 600
      osc.type = "sine"
      gain.gain.setValueAtTime(0.04 * this._volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    } catch (err) {
      console.warn('[audio]', err)
    }
  }

  playDingSound(): void {
    if (this._muted) return
    try {
      const ctx = this.getCtx()
      if (ctx.state !== 'running') return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      osc.type = "triangle"
      gain.gain.setValueAtTime(0.15 * this._volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch (err) {
      console.warn('[audio]', err)
    }
  }

  /** Soft descending buzz for wrong quiz answers — gentle, not punishing */
  playBuzzSound(): void {
    if (this._muted) return
    try {
      const ctx = this.getCtx()
      if (ctx.state !== 'running') return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.22)
      osc.type = "sawtooth"
      gain.gain.setValueAtTime(0.08 * this._volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } catch (err) {
      console.warn('[audio]', err)
    }
  }

  playAnimalRepresentativeSound(animal: string, classification: string): void {
    if (this._muted) return
    try {
      const ctx = this.getCtx()
      if (ctx.state !== 'running') return
      const sounds: Record<string, { freq: number; type: OscillatorType; duration: number; sweep: number; harmonics?: number[] }> = {
        'Mammal': { freq: 200, type: 'sawtooth', duration: 0.5, sweep: 400, harmonics: [1, 0.5, 0.25] },
        'Bird': { freq: 1200, type: 'sine', duration: 0.4, sweep: 2400, harmonics: [1, 0.8, 0.3] },
        'Reptile': { freq: 100, type: 'sawtooth', duration: 0.6, sweep: 50, harmonics: [1, 0.3] },
        'Amphibian': { freq: 400, type: 'square', duration: 0.2, sweep: 700, harmonics: [1, 0.6, 0.2] },
        'Fish': { freq: 300, type: 'sine', duration: 0.7, sweep: 100, harmonics: [1, 0.4] },
        'Insect': { freq: 3000, type: 'sawtooth', duration: 0.15, sweep: 5000, harmonics: [1, 0.7, 0.5, 0.3] },
        'Crustacean': { freq: 150, type: 'triangle', duration: 0.35, sweep: 300, harmonics: [1, 0.5] },
        'Mollusk': { freq: 250, type: 'sine', duration: 0.5, sweep: 150, harmonics: [1, 0.3] },
        'Arachnid': { freq: 800, type: 'square', duration: 0.12, sweep: 1200, harmonics: [1, 0.6, 0.3] },
      }
      const preset = sounds[classification] || sounds['Mammal']
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.12 * this._volume, ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + preset.duration)
      masterGain.connect(ctx.destination)

      // Multi-oscillator with harmonics
      const harmonics = preset.harmonics || [1]
      harmonics.forEach((amp, idx) => {
        const osc = ctx.createOscillator()
        const oscGain = ctx.createGain()
        osc.connect(oscGain)
        oscGain.connect(masterGain)
        osc.frequency.setValueAtTime(preset.freq * (idx + 1), ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, preset.sweep * (idx + 1)),
          ctx.currentTime + preset.duration
        )
        osc.type = preset.type
        oscGain.gain.value = amp
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + preset.duration)
      })

      // LFO vibrato for birds and mammals
      if (classification === 'Bird' || classification === 'Mammal') {
        const lfo = ctx.createOscillator()
        const lfoGain = ctx.createGain()
        lfo.frequency.value = classification === 'Bird' ? 12 : 6
        lfoGain.gain.value = preset.freq * 0.06
        lfo.connect(lfoGain)
        // Connect LFO to all harmonics through master
        lfo.start(ctx.currentTime)
        lfo.stop(ctx.currentTime + preset.duration)
      }
    } catch (err) {
      console.warn('[audio]', err)
    }
  }

  playAnimalSound(url: string): void {
    if (this._muted) return
    try {
      const audio = new Audio(url)
      audio.volume = this._volume
      audio.play().catch(() => {})
    } catch (err) {
      console.warn('[audio]', err)
    }
  }
}

/** Singleton audio service instance */
export const audioService = new AudioService()
