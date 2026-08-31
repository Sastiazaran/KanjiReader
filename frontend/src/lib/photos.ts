/**
 * Fotos: varias entradas pueden compartir archivo (女湯 y 男湯 en la misma
 * cortina). En la galería queremos una sola imagen; en el juego, las dos.
 */
import type { PhotoRecord } from '../types/data'

/**
 * Primera aparición de cada archivo, para no repetir la misma foto en la
 * galería ni en la ficha del kanji.
 *
 * @param photos - Lista de fotos (puede tener duplicados de archivo)
 * @returns Fotos únicas por `file`, en el orden original
 */
export function uniquePhotosByFile(photos: PhotoRecord[]): PhotoRecord[] {
  const seen = new Set<string>()
  const unique: PhotoRecord[] = []
  for (const photo of photos) {
    if (seen.has(photo.file)) continue
    seen.add(photo.file)
    unique.push(photo)
  }
  return unique
}

/**
 * Todas las entradas que usan el mismo archivo (p. ej. 女 y 男 en la misma foto).
 *
 * @param photos - Lista completa
 * @param file - Ruta de la imagen
 */
export function photosSharingFile(
  photos: PhotoRecord[],
  file: string,
): PhotoRecord[] {
  return photos.filter((photo) => photo.file === file)
}
