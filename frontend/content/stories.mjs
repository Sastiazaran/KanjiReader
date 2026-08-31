/**
 * Cuentos cortos escritos para este proyecto, al estilo de un libro infantil.
 *
 * Regla de oro (como en los libros de lectura graduada japoneses): en cada
 * cuento **solo** aparecen kanji que ya se han estudiado en las etapas
 * anteriores; todo lo demás va en hiragana. Así se puede leer de verdad, no
 * adivinar.
 *
 * `minStagesCleared` es el número de etapas superadas del mundo que hacen falta
 * para abrir el cuento, y `tier` marca su dificultad de lectura.
 *
 * Notación: ver `scripts/lib/jp-tokens.mjs`.
 */

const MOUNTAIN_CHILD = {
  id: 'g1-montana',
  worldId: 'g1',
  title: '小さな山の子',
  titleEs: 'El niño de la montaña',
  summary: 'Un niño baja de la montaña antes de que salga el sol.',
  minStagesCleared: 6,
  tier: 1,
  pages: [
    {
      jp: '山:やま の 上:うえ に 小:ちい さな 子:こ が 立:た って いました。',
      es: 'En lo alto de la montaña había un niño pequeño, de pie.',
      illustration: '/stories/montana-luna.svg',
    },
    {
      jp: '子:こ は 大:おお きな 目:め で 月:つき を 見:み ました。',
      es: 'El niño miró la luna con sus ojos grandes.',
      illustration: '/stories/montana-luna.svg',
    },
    {
      jp: '「日:ひ が 出:で る まえに、下:した の 田:た へ おりよう。」',
      es: '«Antes de que salga el sol, bajaré a los arrozales.»',
      illustration: '/stories/amanecer-campo.svg',
    },
    {
      jp: '田:た では 三人:さんにん の 人:ひと が 手:て を ふって いました。',
      es: 'En los arrozales, tres personas agitaban la mano.',
      illustration: '/stories/amanecer-campo.svg',
    },
    {
      jp: '子:こ は 力:ちから いっぱい はしりました。 気:き もちが いい あさです。',
      es: 'El niño corrió con todas sus fuerzas. Es una mañana que da gusto.',
      illustration: '/stories/amanecer-campo.svg',
    },
    {
      jp: '一年:いちねん で いちばん いい 日:ひ でした。',
      es: 'Fue el mejor día del año.',
      illustration: '/stories/amanecer-campo.svg',
    },
  ],
}

const TOWN_SOUNDS = {
  id: 'g1-pueblo',
  worldId: 'g1',
  title: '町の音',
  titleEs: 'Los sonidos del pueblo',
  summary: 'Un viaje del pueblo a la ciudad escuchando todo lo que suena.',
  minStagesCleared: 11,
  tier: 2,
  pages: [
    {
      jp: '早:はや い あさ、村:むら から 町:まち へ 車:くるま で 出:で ました。',
      es: 'Temprano por la mañana salimos del pueblo hacia la ciudad en coche.',
      illustration: '/stories/pueblo-rio.svg',
    },
    {
      jp: '川:かわ の 水:みず は 空:そら の ように 青:あお い。',
      es: 'El agua del río es azul como el cielo.',
      illustration: '/stories/pueblo-rio.svg',
    },
    {
      jp: '学校:がっこう で 先生:せんせい が 白:しろ い 字:じ を かいて いました。',
      es: 'En la escuela, el profesor escribía letras blancas.',
      illustration: '/stories/escuela.svg',
    },
    {
      jp: '男:おとこ の 子:こ と 女:おんな の 子:こ が 石:いし を 百:ひゃく まで かぞえました。',
      es: 'Un niño y una niña contaron piedras hasta cien.',
      illustration: '/stories/escuela.svg',
    },
    {
      jp: '木:き の 上:うえ で 音:おと が しました。 赤:あか い 花:はな が ゆれて います。',
      es: 'Se oyó un ruido arriba, en el árbol. Las flores rojas se mueven.',
      illustration: '/stories/bosque-flores.svg',
    },
    {
      jp: 'その 音:おと は 山:やま の 上:うえ まで とどきました。',
      es: 'Ese sonido llegó hasta lo alto de la montaña.',
      illustration: '/stories/bosque-flores.svg',
    },
  ],
}

const TOKYO_DAY = {
  id: 'g2-tokio',
  worldId: 'g2',
  title: '東京へ行く日',
  titleEs: 'El día que fuimos a Tokio',
  summary: 'Una excursión a la ciudad grande, con una promesa al final.',
  minStagesCleared: 6,
  tier: 3,
  pages: [
    {
      jp: '今日:きょう は 東京:とうきょう へ 行:い く 日:ひ です。',
      es: 'Hoy es el día de ir a Tokio.',
      illustration: '/stories/ciudad-tren.svg',
    },
    {
      jp: '新:あたら しい 会社:かいしゃ の 前:まえ で 一人:ひとり まって いました。',
      es: 'Esperaba solo delante de la empresa nueva.',
      illustration: '/stories/ciudad-tren.svg',
    },
    {
      jp: '時間:じかん が 来:き ました。 高:たか い 山:やま が 見:み える 方:ほう を 見:み ます。',
      es: 'Llegó la hora. Miro hacia donde se ve la montaña alta.',
      illustration: '/stories/ciudad-tren.svg',
    },
    {
      jp: '「今:いま から 一:ひと つ 言:い う。」と 先生:せんせい が 言:い いました。',
      es: '«Voy a decir una cosa», dijo el profesor.',
      illustration: '/stories/escuela.svg',
    },
    {
      jp: '「自分:じぶん の 国:くに と 同:おな じ 米:こめ を 作:つく ろう。」',
      es: '«Vamos a cultivar el mismo arroz que en nuestro país.»',
      illustration: '/stories/amanecer-campo.svg',
    },
    {
      jp: '明:あか るい 日:ひ の 中:なか で、みんなで 円:まる く なって わらいました。',
      es: 'Bajo la luz del día, todos hicimos un círculo y nos reímos.',
      illustration: '/stories/bosque-flores.svg',
    },
  ],
}

export const STORIES = [MOUNTAIN_CHILD, TOWN_SOUNDS, TOKYO_DAY]
