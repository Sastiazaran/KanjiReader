import { describe, expect, it } from 'vitest'
import { photosSharingFile, uniquePhotosByFile } from './photos'
import type { PhotoRecord } from '../types/data'

function photo(id: string, file: string, focus: string): PhotoRecord {
  return {
    id,
    file,
    kanjiIds: [1],
    focus,
    text: focus,
    textReading: 'x',
    where: 'Japón',
    caption: 'Un cartel.',
    credit: {
      author: 'Autor',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourceUrl: 'https://commons.wikimedia.org',
    },
  }
}

describe('uniquePhotosByFile', () => {
  it('deja una sola copia de cada archivo', () => {
    const a = photo('mujer', '/photos/banos.jpg', '女')
    const b = photo('hombre', '/photos/banos.jpg', '男')
    const c = photo('salida', '/photos/exit.jpg', '出')
    expect(uniquePhotosByFile([a, b, c]).map((p) => p.id)).toEqual([
      'mujer',
      'salida',
    ])
  })
})

describe('photosSharingFile', () => {
  it('devuelve todas las lecturas de la misma foto', () => {
    const a = photo('mujer', '/photos/banos.jpg', '女')
    const b = photo('hombre', '/photos/banos.jpg', '男')
    const c = photo('salida', '/photos/exit.jpg', '出')
    expect(photosSharingFile([a, b, c], '/photos/banos.jpg').map((p) => p.focus)).toEqual(
      ['女', '男'],
    )
  })
})
