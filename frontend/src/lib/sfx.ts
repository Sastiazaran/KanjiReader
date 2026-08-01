/** Efectos de sonido del juego (Web Audio, sin archivos externos). */

type SfxKind = 'correct' | 'wrong' | 'finish'

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

function playTone(
  ctx: AudioContext,
  {
    frequency,
    startAt,
    duration,
    type = 'sine',
    peak = 0.12,
    slideTo,
  }: {
    frequency: number
    startAt: number
    duration: number
    type?: OscillatorType
    peak?: number
    slideTo?: number
  },
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startAt)
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, slideTo),
      startAt + duration,
    )
  }
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

function playCorrect(ctx: AudioContext) {
  const t = ctx.currentTime
  playTone(ctx, { frequency: 523.25, startAt: t, duration: 0.12, peak: 0.1 })
  playTone(ctx, { frequency: 659.25, startAt: t + 0.08, duration: 0.14, peak: 0.11 })
  playTone(ctx, { frequency: 783.99, startAt: t + 0.16, duration: 0.22, peak: 0.1 })
}

function playWrong(ctx: AudioContext) {
  const t = ctx.currentTime
  playTone(ctx, {
    frequency: 220,
    startAt: t,
    duration: 0.22,
    type: 'triangle',
    peak: 0.09,
    slideTo: 140,
  })
  playTone(ctx, {
    frequency: 180,
    startAt: t + 0.05,
    duration: 0.28,
    type: 'sine',
    peak: 0.06,
    slideTo: 110,
  })
}

function playFinish(ctx: AudioContext) {
  const t = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((frequency, i) => {
    playTone(ctx, {
      frequency,
      startAt: t + i * 0.1,
      duration: 0.28,
      peak: 0.1,
    })
  })
}

const PLAYERS: Record<SfxKind, (ctx: AudioContext) => void> = {
  correct: playCorrect,
  wrong: playWrong,
  finish: playFinish,
}

/** Reproduce un efecto; silencioso si el navegador bloquea audio. */
export function playSfx(kind: SfxKind) {
  try {
    const ctx = getCtx()
    if (!ctx) return
    PLAYERS[kind](ctx)
  } catch {
    // Sin audio no debe romper el juego.
  }
}
