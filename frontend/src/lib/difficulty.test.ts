import { describe, expect, it } from 'vitest'
import {
  reviewModesFor,
  reviewTier,
  stageQuestionKinds,
  stageTier,
  TIERS,
} from './difficulty'
import { MASTERED_LEVEL } from './srs'

describe('stageTier', () => {
  it('empieza en el nivel más fácil', () => {
    expect(stageTier(1, 1)).toBe(1)
    expect(stageTier(1, 3)).toBe(1)
  })

  it('sube dentro del primer mundo', () => {
    expect(stageTier(1, 4)).toBe(2)
    expect(stageTier(1, 9)).toBe(3)
  })

  it('no baja de dificultad al avanzar', () => {
    const path: number[] = []
    for (const world of [1, 2, 3, 4, 5]) {
      for (const stage of [1, 5, 10, 20]) path.push(stageTier(world, stage))
    }
    const sorted = [...path].sort((a, b) => a - b)
    expect(path).toEqual(sorted)
  })

  it('llega al nivel máximo en los mundos avanzados', () => {
    expect(stageTier(3, 1)).toBe(4)
    expect(stageTier(10, 20)).toBe(4)
  })
})

describe('stageQuestionKinds', () => {
  it('las primeras etapas solo piden reconocer', () => {
    expect(stageQuestionKinds(1, 1)).toEqual(['meaning', 'kanji'])
  })

  it('las lecturas entran cuando sube el nivel', () => {
    expect(stageQuestionKinds(1, 5)).toContain('reading-context')
  })

  it('las frases llegan más tarde', () => {
    expect(stageQuestionKinds(1, 1)).not.toContain('sentence')
    expect(stageQuestionKinds(3, 1)).toContain('sentence')
  })
})

describe('reviewTier', () => {
  it('lo recién visto se pregunta fácil', () => {
    expect(reviewTier(0)).toBe(1)
    expect(reviewTier(1)).toBe(1)
  })

  it('lo dominado se pregunta al máximo nivel', () => {
    expect(reviewTier(MASTERED_LEVEL)).toBe(4)
  })

  it('crece sin saltos hacia atrás', () => {
    const tiers = [0, 1, 2, 3, 4, 5].map(reviewTier)
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
  })
})

describe('reviewModesFor', () => {
  it('al empezar solo hay modos básicos', () => {
    const unlocked = reviewModesFor(0)
      .filter((entry) => entry.unlocked)
      .map((entry) => entry.mode.id)
    expect(unlocked).toEqual(['adaptive', 'classic'])
  })

  it('los modos difíciles se abren con más kanji estudiados', () => {
    const unlocked = reviewModesFor(30)
      .filter((entry) => entry.unlocked)
      .map((entry) => entry.mode.id)
    expect(unlocked).toContain('sentences')
    expect(unlocked).toContain('street')
  })
})

describe('TIERS', () => {
  it('cada nivel tiene al menos un tipo de pregunta', () => {
    for (const tier of Object.values(TIERS)) {
      expect(tier.kinds.length).toBeGreaterThan(0)
    }
  })
})
