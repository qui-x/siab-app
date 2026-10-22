"use strict";
SIAB.montagens = [
  {
    id: "titulacao-forte",
    titulo: "Ácido forte × base forte",
    nivel: "medir",
    ver: "grafico",
    objetivo: "Encontrar o ponto de equivalência de HCl com NaOH.",
    tubos: [
      {
        name: "HCl + NaOH",
        solution: "hcl",
        concentration: 0.01,
        initialVolume: 1,
        titrant: "naoh",
        titrantConcentration: 0.01,
        dropVolume: 0.05,
        indicator: "btb",
      },
    ],
    passos: [
      "Goteje até o bromotimol ficar verde.",
      "Veja no gráfico o salto de pH perto da equivalência.",
    ],
  },
  {
    id: "titulacao-fraco",
    titulo: "Ácido fraco × base forte",
    nivel: "medir",
    ver: "grafico",
    objetivo: "Comparar com o ácido forte: a equivalência fica acima de pH 7.",
    tubos: [
      {
        name: "CH₃COOH + NaOH",
        solution: "acetic",
        concentration: 0.01,
        initialVolume: 1,
        titrant: "naoh",
        titrantConcentration: 0.01,
        dropVolume: 0.05,
        indicator: "phenol",
      },
    ],
    passos: [
      "Goteje até passar da equivalência.",
      "No gráfico, encontre o ponto “pH = pKa” (meia-equivalência).",
    ],
  },
  {
    id: "titulacao-base-fraca",
    titulo: "Base fraca × ácido forte",
    nivel: "medir",
    ver: "grafico",
    objetivo: "A equivalência de amônia com HCl fica abaixo de pH 7.",
    tubos: [
      {
        name: "NH₃ + HCl",
        solution: "ammonia",
        concentration: 0.01,
        initialVolume: 1,
        titrant: "hcl",
        titrantConcentration: 0.01,
        dropVolume: 0.05,
        indicator: "methyl",
      },
    ],
    passos: [
      "Goteje HCl e observe o pH cair.",
      "Compare o pH da equivalência com o da titulação de ácido fraco.",
    ],
  },
  {
    id: "tres-indicadores",
    titulo: "Mesma titulação, três indicadores",
    nivel: "medir",
    ver: "grafico",
    objetivo: "Ver cada indicador mudar de cor em um momento diferente.",
    tubos: ["methyl", "btb", "phenol"].map((indicator) => ({
      name: SIAB.indicators[indicator].short,
      solution: "hcl",
      concentration: 0.01,
      initialVolume: 1,
      titrant: "naoh",
      titrantConcentration: 0.01,
      dropVolume: 0.05,
      indicator,
      grupo: "A",
    })),
    passos: [
      "Os três tubos estão vinculados: cada gota cai nos três.",
      "Goteje devagar e anote em que gota cada cor muda.",
    ],
  },
  {
    id: "tampao",
    titulo: "Tampão × água",
    nivel: "medir",
    ver: "grafico",
    objetivo:
      "As mesmas gotas de HCl mudam muito o pH da água e pouco o do tampão.",
    tubos: [
      {
        name: "Água",
        solution: "water",
        initialVolume: 1,
        titrant: "hcl",
        titrantConcentration: 0.01,
        dropVolume: 0.05,
        indicator: "universal",
        grupo: "A",
      },
      {
        name: "Tampão acetato",
        solution: "acetateBuffer",
        concentration: 0.01,
        initialVolume: 1,
        titrant: "hcl",
        titrantConcentration: 0.01,
        dropVolume: 0.05,
        indicator: "universal",
        grupo: "A",
      },
    ],
    passos: [
      "Adicione 2 gotas e compare os dois tubos.",
      "Continue até o tampão “quebrar” (pH abaixo de 4).",
    ],
    extra: (medir) => [
      [
        "Depois de 2 gotas",
        `água ${medir("Água", 2)} · tampão ${medir("Tampão acetato", 2)}`,
      ],
      [
        "Depois de 20 gotas",
        `água ${medir("Água", 20)} · tampão ${medir("Tampão acetato", 20)}`,
      ],
    ],
  },
  {
    id: "sais",
    titulo: "Todo sal é neutro?",
    nivel: "explorar",
    ver: "equacao",
    objetivo: "Comparar soluções de quatro sais com repolho roxo.",
    tubos: [
      {
        name: "NaCl",
        solution: "nacl",
        concentration: 0.1,
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "NH₄Cl",
        solution: "nh4cl",
        concentration: 0.1,
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "CH₃COONa",
        solution: "ch3coona",
        concentration: 0.1,
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "Na₂CO₃",
        solution: "na2co3",
        concentration: 0.1,
        titrant: "water",
        indicator: "cabbage",
      },
    ],
    passos: [
      "Toque em cada tubo e compare as cores.",
      "No painel Equação, veja qual íon reage com a água.",
    ],
  },
  {
    id: "antiacidos",
    titulo: "Antiácidos",
    nivel: "medir",
    ver: "grafico",
    objetivo: "Comparar Al(OH)₃ e Mg(OH)₂ neutralizando HCl 0,1 mol/L.",
    tubos: [
      {
        name: "HCl + Al(OH)₃",
        solution: "hcl",
        concentration: 0.1,
        initialVolume: 1,
        titrant: "aloh3",
        titrantConcentration: 0.1,
        dropVolume: 0.02,
        indicator: "universal",
      },
      {
        name: "HCl + Mg(OH)₂",
        solution: "hcl",
        concentration: 0.1,
        initialVolume: 1,
        titrant: "mgoh2",
        titrantConcentration: 0.1,
        dropVolume: 0.02,
        indicator: "universal",
      },
    ],
    passos: [
      "Goteje 1 mL em cada tubo (+1 mL).",
      "Compare: o Al(OH)₃ para perto de pH 4; o Mg(OH)₂ passa de 9.",
    ],
    extra: (medir) => [
      [
        "Depois de 1 mL",
        `Al(OH)₃ ${medir("HCl + Al(OH)₃", 50)} · Mg(OH)₂ ${medir("HCl + Mg(OH)₂", 50)}`,
      ],
    ],
  },
  {
    id: "diluicao",
    titulo: "Diluição de um ácido",
    nivel: "medir",
    ver: "grafico",
    objetivo: "Acrescentar água aproxima o pH de 7 sem passar dele.",
    tubos: [
      {
        name: "HCl + água",
        solution: "hcl",
        concentration: 0.01,
        initialVolume: 1,
        titrant: "water",
        dropVolume: 0.1,
        indicator: "universal",
      },
    ],
    passos: [
      "Goteje água até 5 mL.",
      "Veja no gráfico o pH subir cada vez mais devagar.",
    ],
    extra: (medir) => [
      ["Com 4 mL de água (5 mL no tubo)", medir("HCl + água", 40)],
    ],
  },
  {
    id: "cotidiano",
    titulo: "Cotidiano com repolho roxo",
    nivel: "explorar",
    ver: "particulas",
    objetivo:
      "Classificar amostras do dia a dia pela cor do indicador natural.",
    tubos: [
      {
        name: "Limão",
        solution: "lemon",
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "Vinagre",
        solution: "vinegar",
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "Água",
        solution: "water",
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "Bicarbonato",
        solution: "bicarbonate",
        titrant: "water",
        indicator: "cabbage",
      },
      {
        name: "Sabão",
        solution: "soap",
        titrant: "water",
        indicator: "cabbage",
      },
    ],
    passos: [
      "Oculte o pH e classifique cada amostra pela cor.",
      "Depois mostre o pH e confira.",
    ],
  },
  {
    id: "chuva",
    titulo: "Chuva ácida e correção",
    nivel: "medir",
    ver: "grafico",
    objetivo:
      "Comparar chuva limpa e ácida e corrigir um lago com água de cal.",
    tubos: [
      {
        name: "Chuva limpa",
        solution: "cleanRain",
        initialVolume: 2,
        titrant: "water",
        indicator: "universal",
      },
      {
        name: "Chuva ácida",
        solution: "acidRain",
        initialVolume: 2,
        titrant: "water",
        indicator: "universal",
      },
      {
        name: "Lago",
        solution: "acidRain",
        initialVolume: 2,
        titrant: "limewater",
        titrantConcentration: 0.0005,
        dropVolume: 0.01,
        indicator: "universal",
      },
    ],
    passos: [
      "Compare o pH das duas chuvas.",
      "No tubo Lago, goteje água de cal até o pH ficar entre 6 e 8.",
    ],
    extra: (medir) => [["Lago depois de 11 gotas", medir("Lago", 11)]],
  },
];

// Catálogo operacional: inclusive a investigação antes escondida no cabeçalho.
SIAB.montagens.push({
  id: "arco-iris-ph",
  titulo: "Arco-íris do pH",
  nivel: "explorar",
  ver: "ph",
  visao: "overview",
  objetivo:
    "Investigar como o indicador universal muda entre meios ácidos, neutro e básicos.",
  tubos: [
    { solution: "hcl", concentration: 0.1 },
    { solution: "hcl", concentration: 0.001 },
    { solution: "nh4cl", concentration: 0.1 },
    { solution: "water" },
    { solution: "ch3coona", concentration: 0.1 },
    { solution: "ammonia", concentration: 0.1 },
    { solution: "naoh", concentration: 0.1 },
  ].map((t, i) => ({
    ...t,
    name: `Cor ${i + 1}`,
    indicator: "universal",
    titrant: "water",
  })),
  instrumentos: ["Indicador universal", "Fita de pH", "pHmetro"],
  recursos: ["Visão geral", "Tabela de medições", "Relatório"],
  passos: [
    "Compare as cores na visão geral.",
    "Meça o pH e relacione a leitura com a faixa do indicador.",
    "Registre no Caderno as descobertas que desejar guardar.",
  ],
});
SIAB.montagens.forEach((m) => {
  m.instrumentos ||=
    m.nivel === "explorar"
      ? ["Indicador", "Fita de pH"]
      : ["Indicador", "pHmetro", "Termômetro"];
  m.recursos ||=
    m.nivel === "calcular"
      ? ["Equação", "Distribuição", "Tabela", "Relatório"]
      : ["Tabela de medições", "Gráfico pH × volume", "Relatório"];
});
