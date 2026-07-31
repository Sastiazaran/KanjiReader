import { useContext } from 'react'
import { KanjiDataContext } from '../context/kanji-data-context-internal'

export function useKanjiData() {
  const ctx = useContext(KanjiDataContext)
  if (!ctx) throw new Error('useKanjiData debe usarse dentro de KanjiDataProvider')
  return ctx
}
