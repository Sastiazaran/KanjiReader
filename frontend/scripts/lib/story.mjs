import { COMPONENT_NAMES, WEAK_COMPONENTS } from './component-names.mjs'

const MAX_PARTS = 2
const REPEAT_WORDS = { 2: 'dos veces', 3: 'tres veces', 4: 'cuatro veces' }

/**
 * Componentes con carga semántica clara: son los que mejor funcionan al contar
 * una historia (agua, mano, corazón, árbol…).
 */
const ANCHORS = new Set([
  '汁', '忙', '扎', '犯', '艾', '邦', '阡', '礼', '初', '疔', '杰', '込', '刈',
  '化', '宀', '广', '穴', '雨', '口', '日', '月', '木', '水', '火', '土', '人',
  '女', '子', '心', '手', '目', '耳', '田', '山', '川', '石', '竹', '糸', '貝',
  '車', '金', '食', '言', '馬', '魚', '鳥', '虫', '力', '大', '小', '白', '米',
  '牛', '犬', '羊', '足', '走', '門', '刀', '弓', '矢', '舟', '衣', '糸', '見',
])

/** Piezas correctas pero difíciles de contar como historia para un niño. */
const ABSTRACT = new Set([
  '乞', '毋', '尚', '无', '及', '勿', '尤', '屯', '巴', '奄', '而', '釆', '舛',
  '隶', '韋', '鬯', '黹', '斉', '齊', '龠', '禹', '疋', '艮', '亠', '冂', '匚',
  '厶', '廴', '弋', '幺', '屮', '夂', '癶', '卩', '卜', '爿', '气', '殳', '冖',
  '勹', '匕', '廾', '彳', '彡', '尢', '尸', '曰', '聿', '耒', '虍', '豸', '髟',
  '鬥', '鬲', '鹵', '黽', '鼎',
])

/** Radicales que aparecen pegados a un lado del kanji. */
const SIDE_RADICALS = new Set([
  '化', '汁', '忙', '扎', '犯', '艾', '邦', '阡', '礼', '初', '疔', '杰', '込',
  '刈', '个', '并',
])

function joinNames(names) {
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

const COMBINED_TEMPLATES = [
  (parts, meaning) =>
    `Mira bien: aquí hay ${parts}. Cuando se juntan nace la idea de «${meaning}».`,
  (parts, meaning) =>
    `Había una vez ${parts} que decidieron vivir en el mismo cuadrito. Desde ese día significan «${meaning}».`,
  (parts, meaning) =>
    `Dibuja ${parts} dentro del mismo espacio y ya tienes «${meaning}».`,
  (parts, meaning) =>
    `Este kanji guarda ${parts}. Junta las piezas y te contarán «${meaning}».`,
  (parts, meaning) => `Imagina ${parts} en una misma escena: eso es «${meaning}».`,
]

const SIDE_TEMPLATES = [
  (part, meaning) =>
    `Fíjate en el lado del kanji: lleva ${part}. Esa pista te recuerda «${meaning}».`,
  (part, meaning) =>
    `Este kanji viaja acompañado de ${part}, y por eso habla de «${meaning}».`,
]

const SINGLE_TEMPLATES = [
  (part, meaning) =>
    `Este kanji es el dibujo de ${part}. Por eso significa «${meaning}».`,
  (part, meaning) =>
    `Fíjate en la forma: parece ${part}, y justo eso quiere decir «${meaning}».`,
  (part, meaning) =>
    `Es un dibujito antiguo de ${part}; con el tiempo se convirtió en «${meaning}».`,
]

const REPEAT_TEMPLATES = [
  (times, part, meaning) =>
    `Cuenta las piezas: ${part} repetido ${times}. Tantos juntos significan «${meaning}».`,
  (times, part, meaning) =>
    `Aquí no hay uno, sino ${part} ${times}. Por eso quiere decir «${meaning}».`,
]

const FALLBACK_TEMPLATES = [
  (kanji, meaning, strokes) =>
    `Dibuja ${kanji} con calma, trazo a trazo (${strokes} en total) y repite en voz alta: «${meaning}».`,
  (kanji, meaning, strokes) =>
    `Este kanji tiene ${strokes} trazos. Sigue la animación mientras piensas en «${meaning}».`,
]

function scoreComponent(part) {
  if (WEAK_COMPONENTS.has(part.char)) return 100
  if (ANCHORS.has(part.char)) return 1
  if (ABSTRACT.has(part.char)) return 70
  if (part.grade != null) return 20 + part.grade
  if (part.curated) return 40
  return 60
}

/**
 * Construye una historia mnemotécnica sencilla a partir de los componentes.
 *
 * @param {object} params
 * @param {string} params.literal Carácter del kanji.
 * @param {string} params.meaning Significado corto en español.
 * @param {string[]} params.components Componentes según RADKFILE.
 * @param {number} params.strokes Número de trazos del kanji.
 * @param {(char: string) => { keyword: string, grade: number | null, strokes: number } | null} params.lookupKanji
 *   Datos del componente cuando también es un kanji del curso.
 * @returns {{ text: string, parts: { char: string, name: string }[] }}
 */
export function buildStory({ literal, meaning, components, strokes, lookupKanji }) {
  const named = []
  for (const char of components) {
    if (char === literal) continue
    const curated = COMPONENT_NAMES[char]
    const asKanji = lookupKanji(char)
    const name = curated ?? (asKanji ? `«${asKanji.keyword}»` : null)
    if (!name) continue
    named.push({
      char,
      name,
      curated: Boolean(curated),
      grade: asKanji?.grade ?? null,
      strokes: asKanji?.strokes ?? null,
    })
  }

  const ranked = named
    .map((part) => ({ ...part, score: scoreComponent(part) }))
    .sort((a, b) => a.score - b.score)

  const useful = ranked.filter((p) => p.score <= 45)
  const chosen = (useful.length ? useful : ranked.slice(0, 1)).slice(0, MAX_PARTS)
  const seed = literal.codePointAt(0) ?? 0
  const parts = chosen.map(({ char, name }) => ({ char, name }))

  // 森 = 木 tres veces: RADKFILE solo lista cada componente una vez.
  if (chosen.length === 1 && chosen[0].strokes) {
    const times = strokes / chosen[0].strokes
    if (Number.isInteger(times) && times >= 2 && times <= 4) {
      const template = REPEAT_TEMPLATES[seed % REPEAT_TEMPLATES.length]
      return { text: template(REPEAT_WORDS[times], chosen[0].name, meaning), parts }
    }
  }

  if (chosen.length >= 2) {
    const template = COMBINED_TEMPLATES[seed % COMBINED_TEMPLATES.length]
    return { text: template(joinNames(chosen.map((c) => c.name)), meaning), parts }
  }

  if (chosen.length === 1) {
    const templates = SIDE_RADICALS.has(chosen[0].char)
      ? SIDE_TEMPLATES
      : SINGLE_TEMPLATES
    return { text: templates[seed % templates.length](chosen[0].name, meaning), parts }
  }

  const template = FALLBACK_TEMPLATES[seed % FALLBACK_TEMPLATES.length]
  return { text: template(literal, meaning, strokes), parts: [] }
}
