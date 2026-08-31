import { describe, expect, it } from 'vitest'
import { isStoryUnlocked, stagesClearedInWorld } from './stories'
import type { StoryRecord, World } from '../types/data'
import type { StageResultRow } from '../db/db'

const world: World = {
  id: 'g1',
  order: 1,
  name: 'Primeros trazos',
  subtitle: '',
  theme: 'sakura',
  kanjiCount: 12,
  stages: [
    { id: 'g1-1', index: 1, worldId: 'g1', kanjiIds: [1], title: 'a' },
    { id: 'g1-2', index: 2, worldId: 'g1', kanjiIds: [2], title: 'b' },
  ],
}

const story: StoryRecord = {
  id: 'g1-montana',
  worldId: 'g1',
  title: '山',
  titleEs: 'Montaña',
  summary: '',
  minStagesCleared: 2,
  tier: 1,
  kanjiIds: [],
  pages: [],
}

function result(stageId: string, stars: number): StageResultRow {
  return {
    stageId,
    worldId: 'g1',
    stars,
    bestAccuracy: 1,
    timesPlayed: 1,
    completedAt: 0,
  }
}

describe('stagesClearedInWorld', () => {
  it('cuenta solo las etapas con estrella', () => {
    const results = new Map([
      ['g1-1', result('g1-1', 2)],
      ['g1-2', result('g1-2', 0)],
    ])
    expect(stagesClearedInWorld(world, results)).toBe(1)
  })

  it('sin mundo no hay etapas', () => {
    expect(stagesClearedInWorld(undefined, new Map())).toBe(0)
  })
})

describe('isStoryUnlocked', () => {
  it('sigue cerrado hasta alcanzar el mínimo', () => {
    expect(isStoryUnlocked(story, 1)).toBe(false)
    expect(isStoryUnlocked(story, 2)).toBe(true)
  })
})
