// Synthesised sound effects for the paper scene (Web Audio, no sample files).
//
// Browsers only allow audio after a user gesture, so the context is created
// lazily and `unlock()` is called from pointer/click handlers; anything played
// before that is silently skipped.

export interface Sfx {
  unlock(): void
  land(): void
  rustle(speed: number): void // continuous, call every frame while dragging (0 = silent)
  slap(strength: number): void
  stamp(): void
  chime(): void
  shredStart(): void
  shredFeed(on: boolean): void
  shredStop(): void
}

const STORAGE_KEY = 'paper-desk:sound'

export function soundPref(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundPref(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {}
}

export function createSfx(): Sfx & { setEnabled(on: boolean): void } {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let enabled = soundPref()
  let noise: AudioBuffer | null = null
  let crackle: AudioBuffer | null = null
  let rustleGain: GainNode | null = null
  let motor: { osc: OscillatorNode[]; gain: GainNode; grind: GainNode; src: AudioBufferSourceNode; lfo: OscillatorNode } | null = null

  const ready = () => (enabled && ctx && ctx.state === 'running' ? ctx : null)

  function buffers(c: AudioContext) {
    const len = c.sampleRate * 2
    noise = c.createBuffer(1, len, c.sampleRate)
    crackle = c.createBuffer(1, len, c.sampleRate)
    const n = noise.getChannelData(0), k = crackle.getChannelData(0)
    for (let i = 0; i < len; i++) {
      n[i] = Math.random() * 2 - 1
      // paper is crackly, not hissy: mostly quiet with sparse loud ticks
      k[i] = (Math.random() * 2 - 1) * (Math.random() < 0.12 ? 1 : 0.12)
    }
  }

  function noiseBurst(c: AudioContext, opts: { dur: number; gain: number; lp: number; hp?: number; buf?: AudioBuffer }) {
    const src = c.createBufferSource()
    src.buffer = opts.buf ?? noise!
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = opts.lp
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = opts.hp ?? 40
    const g = c.createGain()
    const t = c.currentTime
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(opts.gain, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur)
    src.connect(hp).connect(lp).connect(g).connect(master!)
    src.start(t, Math.random() * 1.5)
    src.stop(t + opts.dur + 0.05)
  }

  function thump(c: AudioContext, from: number, to: number, dur: number, gain: number) {
    const o = c.createOscillator()
    o.type = 'sine'
    const g = c.createGain()
    const t = c.currentTime
    o.frequency.setValueAtTime(from, t)
    o.frequency.exponentialRampToValueAtTime(to, t + dur)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(master!)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  function ensureRustle(c: AudioContext) {
    if (rustleGain) return rustleGain
    const src = c.createBufferSource()
    src.buffer = crackle!
    src.loop = true
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200
    bp.Q.value = 0.7
    rustleGain = c.createGain()
    rustleGain.gain.value = 0
    src.connect(bp).connect(rustleGain).connect(master!)
    src.start()
    return rustleGain
  }

  return {
    setEnabled(on) {
      enabled = on
      setSoundPref(on)
      if (master && ctx) master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.03)
      if (on) this.unlock()
    },
    unlock() {
      if (!enabled) return
      if (!ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AC) return
        ctx = new AC()
        master = ctx.createGain()
        master.gain.value = 0.9
        master.connect(ctx.destination)
        buffers(ctx)
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    },
    land() {
      const c = ready()
      if (!c) return
      noiseBurst(c, { dur: 0.16, gain: 0.5, lp: 900 })
      thump(c, 95, 45, 0.12, 0.25)
    },
    rustle(speed) {
      const c = ready()
      if (!c) return
      const g = ensureRustle(c)
      const target = Math.min(0.32, speed * 0.12)
      g.gain.setTargetAtTime(target, c.currentTime, target > g.gain.value ? 0.02 : 0.08)
    },
    slap(strength) {
      const c = ready()
      if (!c || strength < 0.05) return
      const s = Math.min(1, strength)
      noiseBurst(c, { dur: 0.07 + 0.05 * s, gain: 0.15 + 0.45 * s, lp: 2600, hp: 300, buf: crackle! })
      thump(c, 140, 70, 0.06, 0.1 * s)
    },
    stamp() {
      const c = ready()
      if (!c) return
      thump(c, 130, 50, 0.22, 0.9)
      noiseBurst(c, { dur: 0.06, gain: 0.5, lp: 1600 })
    },
    chime() {
      const c = ready()
      if (!c) return
      ;[880, 1318.5].forEach((f, i) => {
        const o = c.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        const g = c.createGain()
        const t = c.currentTime + 0.12 + i * 0.11
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
        o.connect(g).connect(master!)
        o.start(t)
        o.stop(t + 1)
      })
    },
    shredStart() {
      const c = ready()
      if (!c || motor) return
      const t = c.currentTime
      const gain = c.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.35)
      const lp = c.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 700
      const osc = [c.createOscillator(), c.createOscillator()]
      osc[0].type = 'sawtooth'
      osc[1].type = 'square'
      osc[0].frequency.setValueAtTime(30, t)
      osc[0].frequency.exponentialRampToValueAtTime(96, t + 0.35)
      osc[1].frequency.setValueAtTime(60, t)
      osc[1].frequency.exponentialRampToValueAtTime(192, t + 0.35)
      osc.forEach((o) => o.connect(lp))
      lp.connect(gain).connect(master!)
      // grinding: crackly noise chopped by the cutter rhythm
      const src = c.createBufferSource()
      src.buffer = crackle!
      src.loop = true
      const bp = c.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1900
      bp.Q.value = 0.9
      const grind = c.createGain()
      grind.gain.value = 0
      const chop = c.createGain()
      chop.gain.value = 0.6
      const lfo = c.createOscillator()
      lfo.type = 'square'
      lfo.frequency.value = 23
      const depth = c.createGain()
      depth.gain.value = 0.4
      lfo.connect(depth).connect(chop.gain)
      src.connect(bp).connect(chop).connect(grind).connect(master!)
      osc.forEach((o) => o.start(t))
      src.start(t)
      lfo.start(t)
      motor = { osc, gain, grind, src, lfo }
    },
    shredFeed(on) {
      const c = ready()
      if (!c || !motor) return
      motor.grind.gain.setTargetAtTime(on ? 0.55 : 0, c.currentTime, 0.04)
      motor.osc[0].frequency.setTargetAtTime(on ? 84 : 96, c.currentTime, 0.05) // motor bogs down under load
    },
    shredStop() {
      const c = ready()
      if (!c || !motor) return
      const t = c.currentTime
      const m = motor
      motor = null
      m.grind.gain.setTargetAtTime(0, t, 0.03)
      m.osc[0].frequency.exponentialRampToValueAtTime(20, t + 0.7)
      m.osc[1].frequency.exponentialRampToValueAtTime(40, t + 0.7)
      m.gain.gain.setTargetAtTime(0.0001, t + 0.2, 0.15)
      const end = t + 1.2
      m.osc.forEach((o) => o.stop(end))
      m.src.stop(end)
      m.lfo.stop(end)
    },
  }
}
