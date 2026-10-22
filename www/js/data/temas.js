"use strict";
SIAB.temas = [
  [
    "acidos-bases",
    "Ácidos e bases",
    "Um ácido de Brønsted doa prótons; uma base os recebe. Em água, o comportamento depende do equilíbrio e da composição.",
    "hcl",
    "repolho-roxo",
  ],
  [
    "forca",
    "Força ácido-base",
    "Força expressa a extensão da ionização. Concentração expressa quantidade por volume. Compare ambas mantendo uma variável fixa.",
    "acetic",
    "forte-concentrado",
  ],
  [
    "concentracao",
    "Concentração",
    "C = n/V, com V em litros. Diluir conserva os mols do soluto e aumenta o volume; o equilíbrio se ajusta.",
    "hcl",
    "diluicao",
  ],
  [
    "ph-poh",
    "pH e pOH",
    "pH = −log₁₀[H₃O⁺] no modelo ideal. pH + pOH = pKw(T); neutralidade exige [H₃O⁺] = [OH⁻].",
    "water",
    "temperatura",
  ],
  [
    "indicadores",
    "Indicadores",
    "Indicadores têm formas ácida e básica com cores diferentes. Uma cor restringe uma faixa e não determina o pH exato.",
    "hcl",
    "indicadores",
  ],
  [
    "neutralizacao",
    "Neutralização",
    "A extensão da reação depende da quantidade de matéria. Equivalência estequiométrica não obriga pH 7.",
    "hcl",
    "neutralizar",
  ],
  [
    "sais",
    "Sais",
    "Os íons de um sal podem participar do equilíbrio com a água. Investigue a natureza de cada íon.",
    "nh4cl",
    "sais-cores",
  ],
  [
    "hidrolise",
    "Hidrólise",
    "Íons conjugados de ácidos ou bases fracos reagem com a água. A composição e as constantes determinam o pH.",
    "ch3coona",
    "sais-cores",
  ],
  [
    "titulacao",
    "Titulação",
    "Adicione titulante conhecido, meça após a estabilização e compare ponto final do indicador e equivalência.",
    "acetic",
    "titulacao-fraco",
  ],
  [
    "tampoes",
    "Tampões",
    "Um par conjugado consome pequenas adições de ácido ou base. A capacidade é limitada pela composição e quantidade de matéria.",
    "acetateBuffer",
    "tampao",
  ],
  [
    "poliproticos",
    "Polipróticos",
    "Ácidos polipróticos doam mais de um próton em etapas. As frações dependem do pH e de cada constante.",
    "h3po4",
    "poliproticos",
  ],
  [
    "especies",
    "Espécies químicas",
    "Conserve matéria e carga ao interpretar moléculas, íons e pares conjugados. A contagem desenhada é proporcional e simplificada.",
    "acetic",
    "moleculas-ions",
  ],
  [
    "condutividade",
    "Condutividade",
    "A condução depende das concentrações e mobilidades de todos os íons. Uma solução muito condutora não é necessariamente muito ácida.",
    "nacl",
    "condutividade",
  ],
  [
    "aplicacoes",
    "Aplicações",
    "Amostras do cotidiano são representativas. Uma mesma categoria de alimento ou produto pode variar de composição e pH.",
    "vinegar",
    "chuva-acida",
  ],
].map(([id, titulo, conceito, solution, missao]) => ({
  id,
  titulo,
  conceito,
  solution,
  missao,
}));
SIAB.missaoAlias = {
  detetive: "amostra-misteriosa",
  titulacao: "missao-titulacao",
  regua: "regua-ph",
  construtor: "construtor-neutralizacao",
  trunfo: "comparacao-quimica",
};
const novasMissoes = [
  {
    id: "amostra-misteriosa",
    titulo: "Amostra misteriosa",
    resumo:
      "Identifique o caráter de uma amostra com evidências instrumentais.",
    solution: "nh4cl",
    objetivo:
      "Meça o pH e explique o comportamento ácido-base a partir dos íons.",
  },
  {
    id: "missao-titulacao",
    titulo: "O ponto de encontro",
    resumo: "Encontre a região de equivalência de uma titulação.",
    solution: "hcl",
    objetivo: "Adicione base até obter uma leitura de pH entre 6 e 8.",
    condition: (c) => c.tubos.some((x) => x.r.pH >= 6 && x.r.pH <= 8),
  },
  {
    id: "regua-ph",
    titulo: "Distâncias na escala de pH",
    resumo: "Compare a escala logarítmica usando medidas.",
    solution: "hcl",
    objetivo:
      "Dilua a solução e explique por que uma unidade de pH representa um fator 10.",
    titrant: "water",
    condition: (c) => c.tubos.some((x) => x.r.added >= 1),
  },
  {
    id: "construtor-neutralizacao",
    titulo: "Construir uma neutralização",
    resumo: "Use quantidades equivalentes de ácido e base.",
    solution: "hcl",
    objetivo:
      "Encontre a equivalência estequiométrica e justifique com n = C·V.",
    condition: (c) => c.tubos.some((x) => x.r.atEquivalence),
  },
  {
    id: "comparacao-quimica",
    titulo: "Mesma concentração, comportamentos diferentes",
    resumo: "Compare um ácido forte e um fraco sem ordenar por pontos.",
    solution: "acetic",
    objetivo: "Compare cor, pH medido e condutividade das duas soluções.",
    extra: { solution: "hcl", name: "Ácido forte" },
  },
];
novasMissoes.forEach((m) =>
  SIAB.missoes.push({
    id: m.id,
    titulo: m.titulo,
    resumo: m.resumo,
    bancada: {
      nivel: "medir",
      tubos: [
        {
          solution: m.solution,
          name: "Amostra",
          indicator: "universal",
          titrant: m.titrant || "naoh",
          concentration: 0.01,
          titrantConcentration: 0.01,
        },
        ...(m.extra ? [m.extra] : []),
      ],
      controles: ["gotas", "atalhos", "poe"],
      ver: ["ph", "equacao", "grafico"],
    },
    passos: [
      {
        tipo: "agir",
        texto: m.objetivo,
        concluido:
          m.condition || (() => Boolean(SIAB.current()?.observacao?.ph)),
      },
      {
        tipo: "interpretacao",
        id: "conclusao",
        pergunta: "Que evidências sustentam sua conclusão?",
        interpretacao:
          "Relacione as leituras instrumentais com a composição e o equilíbrio.",
      },
    ],
  }),
);
