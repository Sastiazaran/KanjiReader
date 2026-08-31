/**
 * Fotos reales de Japón donde se puede leer un kanji en su uso cotidiano.
 *
 * Todas vienen de Wikimedia Commons con licencia libre y se descargan con
 * `npm run fetch-photos` (ver `scripts/fetch-photos.mjs`), que además compara
 * la licencia real con la que está anotada aquí.
 *
 * `focus` es el kanji protagonista y `caption` explica qué lectura usa y por qué,
 * que es justo lo que no se aprende en una lista de lecturas.
 */

export const PHOTOS = [
  {
    id: 'salida-exit',
    file: '/photos/salida-exit.jpg',
    commonsTitle: 'File:出口 EXIT (6888409648).jpg',
    focus: '出',
    text: '出口',
    textReading: 'でぐち',
    where: 'Pasillo de un edificio en Japón',
    caption:
      'Este cartel marca la salida. 出口 son dos kanji con lectura kun: 出 suena で y 口 se sonoriza de くち a ぐち.',
    credit: {
      author: 'chinnian',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%87%BA%E5%8F%A3_EXIT_(6888409648).jpg',
    },
  },
  {
    id: 'entrada-mirador',
    file: '/photos/entrada-mirador.jpg',
    commonsTitle: 'File:入口 出口 (31265698585).jpg',
    focus: '入',
    text: '入口',
    textReading: 'いりぐち',
    where: 'Entrada de un mirador',
    caption:
      'A la izquierda 入口 (entrada) y a la derecha 出口 (salida). 入 suena いり con su lectura kun.',
    credit: {
      author: 'Kzaral',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%85%A5%E5%8F%A3_%E5%87%BA%E5%8F%A3_(31265698585).jpg',
    },
  },
  {
    id: 'stop-osaka',
    file: '/photos/stop-osaka.jpg',
    commonsTitle: 'File:止まれ (46992567184).jpg',
    focus: '止',
    text: '止まれ',
    textReading: 'とまれ',
    where: 'Calle de Osaka de noche',
    caption:
      'Pintado en el asfalto, 止まれ quiere decir «para». Como lleva hiragana pegado (まれ), 止 usa su lectura kun と.',
    credit: {
      author: 'm-louis .® (Osaka, Japón)',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E6%AD%A2%E3%81%BE%E3%82%8C_(46992567184).jpg',
    },
  },
  {
    id: 'maquina-50-yenes',
    file: '/photos/maquina-50-yenes.jpg',
    commonsTitle: 'File:50円の自販機 新開地 (54909242646).jpg',
    focus: '円',
    text: '50円',
    textReading: 'ごじゅうえん',
    where: 'Máquina de bebidas en Kobe',
    caption:
      'Todas las bebidas a 50円. En los precios, 円 suena siempre えん: es su lectura on y funciona como palabra.',
    credit: {
      author: 'Masahiko OHKUBO (Kobe, Japón)',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:50%E5%86%86%E3%81%AE%E8%87%AA%E8%B2%A9%E6%A9%9F_%E6%96%B0%E9%96%8B%E5%9C%B0_(54909242646).jpg',
    },
  },
  {
    id: 'ferreteria-tienda',
    file: '/photos/ferreteria.jpg',
    commonsTitle: 'File:金物店 2007 (4358774405).jpg',
    focus: '店',
    text: '金物店',
    textReading: 'かなものてん',
    where: 'Ferretería de barrio',
    caption:
      'El toldo dice なごや金物店. En este compuesto 店 suena てん, su lectura on, como en casi todos los nombres de tiendas.',
    credit: {
      author: 't.ohashi',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E9%87%91%E7%89%A9%E5%BA%97_2007_(4358774405).jpg',
    },
  },
  {
    id: 'ferreteria-metal',
    file: '/photos/ferreteria.jpg',
    commonsTitle: 'File:金物店 2007 (4358774405).jpg',
    focus: '金',
    text: '金物店',
    textReading: 'かなものてん',
    where: 'Ferretería de barrio',
    caption:
      'Aquí 金 no suena きん como en 金曜日, sino かな: 金物 (objetos de metal) es una palabra con lectura kun.',
    credit: {
      author: 't.ohashi',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E9%87%91%E7%89%A9%E5%BA%97_2007_(4358774405).jpg',
    },
  },
  {
    id: 'bano-mujeres',
    file: '/photos/banos-noren.jpg',
    commonsTitle: 'File:女湯 KUMON 男湯 (7685078888).jpg',
    focus: '女',
    text: '女湯',
    textReading: 'おんなゆ',
    where: 'Baño público en Fukushima',
    caption:
      'La cortina roja dice 女湯: el baño de mujeres. 女 suena おんな, su lectura kun.',
    credit: {
      author: 'M Murakami (Fukushima, Japón)',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%A5%B3%E6%B9%AF_KUMON_%E7%94%B7%E6%B9%AF_(7685078888).jpg',
    },
  },
  {
    id: 'bano-hombres',
    file: '/photos/banos-noren.jpg',
    commonsTitle: 'File:女湯 KUMON 男湯 (7685078888).jpg',
    focus: '男',
    text: '男湯',
    textReading: 'おとこゆ',
    where: 'Baño público en Fukushima',
    caption:
      'La cortina azul dice 男湯: el baño de hombres. 男 suena おとこ, su lectura kun.',
    credit: {
      author: 'M Murakami (Fukushima, Japón)',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%A5%B3%E6%B9%AF_KUMON_%E7%94%B7%E6%B9%AF_(7685078888).jpg',
    },
  },
  {
    id: 'estacion-ushita',
    file: '/photos/estacion-ushita.jpg',
    commonsTitle: 'File:Station name sign at Ushita Station.jpg',
    focus: '田',
    text: '牛田',
    textReading: 'うしだ',
    where: 'Estación de Ushita, Hiroshima',
    caption:
      'El nombre de la estación, 牛田, se lee うしだ: la lectura kun た se sonoriza en だ al ir detrás de otra palabra.',
    credit: {
      author: 'もわーんとした空気',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Station_name_sign_at_Ushita_Station.jpg',
    },
  },
  {
    id: 'rio-onda',
    file: '/photos/rio-onda.jpg',
    commonsTitle: 'File:Sign of Onda River.jpg',
    focus: '川',
    text: '恩田川',
    textReading: 'おんだがわ',
    where: 'Cartel del río Onda',
    caption:
      'El propio cartel lleva furigana: おんだがわ. En los nombres de ríos, 川 suena がわ (かわ sonorizada).',
    credit: {
      author: 'Nikm',
      license: 'Public domain',
      licenseUrl: 'https://commons.wikimedia.org/wiki/File:Sign_of_Onda_River.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sign_of_Onda_River.jpg',
    },
  },
  {
    id: 'rio-yuge',
    file: '/photos/rio-yuge.jpg',
    commonsTitle: 'File:弓削川の河川名板.jpg',
    focus: '一',
    text: '一級河川',
    textReading: 'いっきゅうかせん',
    where: 'Río Yuge, Kioto',
    caption:
      'Arriba dice 一級河川 («río de primera categoría»). Ahí 一 suena いっ: su lectura on いち acortada delante de き.',
    credit: {
      author: '経済特区',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%BC%93%E5%89%8A%E5%B7%9D%E3%81%AE%E6%B2%B3%E5%B7%9D%E5%90%8D%E6%9D%BF.jpg',
    },
  },
]
