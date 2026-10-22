"use strict";
/* Funções inorgânicas: ácidos e bases para o construtor de neutralização (M7)
   e para o Super Trunfo (M8).
   Classificações seguem as regras usuais do ensino médio:
   - força de oxiácidos: (nº de O) − (nº de H ionizáveis) ≥ 2 forte; = 1 moderado; = 0 fraco;
     o H₂CO₃ é exceção (fraco);
   - hidrácidos: HCl, HBr e HI fortes; HF moderado; os demais fracos;
   - bases de metais alcalinos e alcalinoterrosos (exceto Be e Mg) são fortes.
   H₃PO₃ tem 2 H ionizáveis e H₃PO₂ tem 1: os demais H estão ligados ao fósforo.
   Massas atômicas: IUPAC, valores abreviados. */
SIAB.massasAtomicas = {
  H: 1.008,
  Li: 6.94,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Br: 79.904,
  I: 126.904,
  Ba: 137.327,
};
SIAB.massaMolar = (atomos) =>
  Object.entries(atomos).reduce(
    (soma, [elemento, quantidade]) =>
      soma + SIAB.massasAtomicas[elemento] * quantidade,
    0,
  );
SIAB.contarAtomos = (atomos) =>
  Object.values(atomos).reduce((soma, n) => soma + n, 0);

// anion: grupo que sobra do ácido. poliatomico = precisa de parênteses com índice.
// parciais: ânions que sobram quando só parte dos H⁺ reage (hidrogenossais).
SIAB.acidos = [
  {
    id: "hf",
    formula: "HF",
    nome: "ácido fluorídrico",
    atomos: { H: 1, F: 1 },
    h: 1,
    tipo: "hidrácido",
    forca: "moderado",
    volatil: true,
    anion: { formula: "F", nome: "fluoreto", poliatomico: false },
    uso: "gravação em vidro",
  },
  {
    id: "hcl",
    formula: "HCl",
    nome: "ácido clorídrico",
    atomos: { H: 1, Cl: 1 },
    h: 1,
    tipo: "hidrácido",
    forca: "forte",
    volatil: true,
    anion: { formula: "Cl", nome: "cloreto", poliatomico: false },
    uso: "suco gástrico; ácido muriático",
  },
  {
    id: "hbr",
    formula: "HBr",
    nome: "ácido bromídrico",
    atomos: { H: 1, Br: 1 },
    h: 1,
    tipo: "hidrácido",
    forca: "forte",
    volatil: true,
    anion: { formula: "Br", nome: "brometo", poliatomico: false },
    uso: "síntese de brometos",
  },
  {
    id: "hi",
    formula: "HI",
    nome: "ácido iodídrico",
    atomos: { H: 1, I: 1 },
    h: 1,
    tipo: "hidrácido",
    forca: "forte",
    volatil: true,
    anion: { formula: "I", nome: "iodeto", poliatomico: false },
    uso: "síntese de iodetos",
  },
  {
    id: "h2s",
    formula: "H₂S",
    nome: "ácido sulfídrico",
    atomos: { H: 2, S: 1 },
    h: 2,
    tipo: "hidrácido",
    forca: "fraco",
    volatil: true,
    anion: { formula: "S", nome: "sulfeto", poliatomico: false },
    parciais: [
      { h: 1, formula: "HS", nome: "hidrogenossulfeto", poliatomico: true },
    ],
    uso: "cheiro de ovo podre",
  },
  {
    id: "hcn",
    formula: "HCN",
    nome: "ácido cianídrico",
    atomos: { H: 1, C: 1, N: 1 },
    h: 1,
    tipo: "hidrácido",
    forca: "fraco",
    volatil: true,
    anion: { formula: "CN", nome: "cianeto", poliatomico: true },
    uso: "muito tóxico; indústria de plásticos",
  },
  {
    id: "hno3",
    formula: "HNO₃",
    nome: "ácido nítrico",
    atomos: { H: 1, N: 1, O: 3 },
    h: 1,
    tipo: "oxiácido",
    forca: "forte",
    volatil: true,
    anion: { formula: "NO₃", nome: "nitrato", poliatomico: true },
    uso: "fertilizantes e explosivos; chuva ácida",
  },
  {
    id: "hno2",
    formula: "HNO₂",
    nome: "ácido nitroso",
    atomos: { H: 1, N: 1, O: 2 },
    h: 1,
    tipo: "oxiácido",
    forca: "moderado",
    volatil: true,
    anion: { formula: "NO₂", nome: "nitrito", poliatomico: true },
    uso: "origem dos nitritos usados em conservas",
  },
  {
    id: "h2so4",
    formula: "H₂SO₄",
    nome: "ácido sulfúrico",
    atomos: { H: 2, S: 1, O: 4 },
    h: 2,
    tipo: "oxiácido",
    forca: "forte",
    volatil: false,
    anion: { formula: "SO₄", nome: "sulfato", poliatomico: true },
    parciais: [
      { h: 1, formula: "HSO₄", nome: "hidrogenossulfato", poliatomico: true },
    ],
    uso: "baterias de carro; o mais produzido pela indústria",
  },
  {
    id: "h2so3",
    formula: "H₂SO₃",
    nome: "ácido sulfuroso",
    atomos: { H: 2, S: 1, O: 3 },
    h: 2,
    tipo: "oxiácido",
    forca: "moderado",
    volatil: false,
    anion: { formula: "SO₃", nome: "sulfito", poliatomico: true },
    parciais: [
      { h: 1, formula: "HSO₃", nome: "hidrogenossulfito", poliatomico: true },
    ],
    uso: "formado do SO₂ na chuva ácida",
  },
  {
    id: "h2co3",
    formula: "H₂CO₃",
    nome: "ácido carbônico",
    atomos: { H: 2, C: 1, O: 3 },
    h: 2,
    tipo: "oxiácido",
    forca: "fraco",
    volatil: false,
    anion: { formula: "CO₃", nome: "carbonato", poliatomico: true },
    parciais: [
      {
        h: 1,
        formula: "HCO₃",
        nome: "hidrogenocarbonato (bicarbonato)",
        poliatomico: true,
      },
    ],
    uso: "refrigerantes; exceção à regra do oxigênio",
  },
  {
    id: "h3po4",
    formula: "H₃PO₄",
    nome: "ácido fosfórico",
    atomos: { H: 3, P: 1, O: 4 },
    h: 3,
    tipo: "oxiácido",
    forca: "moderado",
    volatil: false,
    anion: { formula: "PO₄", nome: "fosfato", poliatomico: true },
    parciais: [
      {
        h: 1,
        formula: "H₂PO₄",
        nome: "di-hidrogenofosfato",
        poliatomico: true,
      },
      { h: 2, formula: "HPO₄", nome: "hidrogenofosfato", poliatomico: true },
    ],
    uso: "refrigerantes tipo cola; fertilizantes",
  },
  {
    id: "h3po3",
    formula: "H₃PO₃",
    nome: "ácido fosforoso",
    atomos: { H: 3, P: 1, O: 3 },
    h: 2,
    tipo: "oxiácido",
    forca: "moderado",
    volatil: false,
    anion: { formula: "HPO₃", nome: "fosfito", poliatomico: true },
    parciais: [
      { h: 1, formula: "H₂PO₃", nome: "hidrogenofosfito", poliatomico: true },
    ],
    uso: "só 2 dos 3 H são ionizáveis",
  },
  {
    id: "h3po2",
    formula: "H₃PO₂",
    nome: "ácido hipofosforoso",
    atomos: { H: 3, P: 1, O: 2 },
    h: 1,
    tipo: "oxiácido",
    forca: "moderado",
    volatil: false,
    anion: { formula: "H₂PO₂", nome: "hipofosfito", poliatomico: true },
    uso: "só 1 dos 3 H é ionizável",
  },
  {
    id: "hclo",
    formula: "HClO",
    nome: "ácido hipocloroso",
    atomos: { H: 1, Cl: 1, O: 1 },
    h: 1,
    tipo: "oxiácido",
    forca: "fraco",
    volatil: false,
    anion: { formula: "ClO", nome: "hipoclorito", poliatomico: true },
    uso: "desinfecção da água; água sanitária",
  },
  {
    id: "hclo4",
    formula: "HClO₄",
    nome: "ácido perclórico",
    atomos: { H: 1, Cl: 1, O: 4 },
    h: 1,
    tipo: "oxiácido",
    forca: "forte",
    volatil: false,
    anion: { formula: "ClO₄", nome: "perclorato", poliatomico: true },
    uso: "um dos ácidos mais fortes",
  },
];

// cation: grupo que sobra da base. parciais: cátions de hidroxissais.
SIAB.bases = [
  {
    id: "lioh",
    formula: "LiOH",
    nome: "hidróxido de lítio",
    atomos: { Li: 1, O: 1, H: 1 },
    oh: 1,
    forca: "forte",
    solubilidade: "solúvel",
    cation: { formula: "Li", nome: "lítio", poliatomico: false },
    uso: "purificação do ar em naves",
  },
  {
    id: "naoh",
    formula: "NaOH",
    nome: "hidróxido de sódio",
    atomos: { Na: 1, O: 1, H: 1 },
    oh: 1,
    forca: "forte",
    solubilidade: "solúvel",
    cation: { formula: "Na", nome: "sódio", poliatomico: false },
    uso: "soda cáustica; fabricação de sabão",
  },
  {
    id: "koh",
    formula: "KOH",
    nome: "hidróxido de potássio",
    atomos: { K: 1, O: 1, H: 1 },
    oh: 1,
    forca: "forte",
    solubilidade: "solúvel",
    cation: { formula: "K", nome: "potássio", poliatomico: false },
    uso: "sabões moles e pilhas alcalinas",
  },
  {
    id: "nh4oh",
    formula: "NH₄OH",
    nome: "hidróxido de amônio",
    atomos: { N: 1, H: 5, O: 1 },
    oh: 1,
    forca: "fraca",
    solubilidade: "solúvel",
    cation: { formula: "NH₄", nome: "amônio", poliatomico: true },
    uso: "amônia em água (NH₃ + H₂O); limpeza",
  },
  {
    id: "caoh2",
    formula: "Ca(OH)₂",
    nome: "hidróxido de cálcio",
    atomos: { Ca: 1, O: 2, H: 2 },
    oh: 2,
    forca: "forte",
    solubilidade: "pouco solúvel",
    cation: { formula: "Ca", nome: "cálcio", poliatomico: false },
    parciais: [{ oh: 1, formula: "Ca(OH)", nome: "hidroxi" }],
    uso: "cal hidratada; construção e calagem",
  },
  {
    id: "baoh2",
    formula: "Ba(OH)₂",
    nome: "hidróxido de bário",
    atomos: { Ba: 1, O: 2, H: 2 },
    oh: 2,
    forca: "forte",
    solubilidade: "pouco solúvel",
    cation: { formula: "Ba", nome: "bário", poliatomico: false },
    parciais: [{ oh: 1, formula: "Ba(OH)", nome: "hidroxi" }],
    uso: "análises químicas",
  },
  {
    id: "mgoh2",
    formula: "Mg(OH)₂",
    nome: "hidróxido de magnésio",
    atomos: { Mg: 1, O: 2, H: 2 },
    oh: 2,
    forca: "fraca",
    solubilidade: "praticamente insolúvel",
    cation: { formula: "Mg", nome: "magnésio", poliatomico: false },
    parciais: [{ oh: 1, formula: "Mg(OH)", nome: "hidroxi" }],
    uso: "leite de magnésia (antiácido)",
  },
  {
    id: "aloh3",
    formula: "Al(OH)₃",
    nome: "hidróxido de alumínio",
    atomos: { Al: 1, O: 3, H: 3 },
    oh: 3,
    forca: "fraca",
    solubilidade: "praticamente insolúvel",
    cation: { formula: "Al", nome: "alumínio", poliatomico: false },
    parciais: [
      { oh: 1, formula: "Al(OH)₂", nome: "di-hidroxi" },
      { oh: 2, formula: "Al(OH)", nome: "hidroxi" },
    ],
    uso: "antiácidos; tratamento de água",
  },
  {
    id: "feoh3",
    formula: "Fe(OH)₃",
    nome: "hidróxido de ferro(III)",
    atomos: { Fe: 1, O: 3, H: 3 },
    oh: 3,
    forca: "fraca",
    solubilidade: "praticamente insolúvel",
    cation: { formula: "Fe", nome: "ferro(III)", poliatomico: false },
    parciais: [
      { oh: 1, formula: "Fe(OH)₂", nome: "di-hidroxi" },
      { oh: 2, formula: "Fe(OH)", nome: "hidroxi" },
    ],
    uso: "cor da ferrugem",
  },
  {
    id: "cuoh2",
    formula: "Cu(OH)₂",
    nome: "hidróxido de cobre(II)",
    atomos: { Cu: 1, O: 2, H: 2 },
    oh: 2,
    forca: "fraca",
    solubilidade: "praticamente insolúvel",
    cation: { formula: "Cu", nome: "cobre(II)", poliatomico: false },
    parciais: [{ oh: 1, formula: "Cu(OH)", nome: "hidroxi" }],
    uso: "sólido azul; pigmentos",
  },
  {
    id: "znoh2",
    formula: "Zn(OH)₂",
    nome: "hidróxido de zinco",
    atomos: { Zn: 1, O: 2, H: 2 },
    oh: 2,
    forca: "fraca",
    solubilidade: "praticamente insolúvel",
    cation: { formula: "Zn", nome: "zinco", poliatomico: false },
    parciais: [{ oh: 1, formula: "Zn(OH)", nome: "hidroxi" }],
    uso: "anfótero: reage com ácidos e com bases fortes",
  },
];

/* Construção de sais e equações de neutralização. */
SIAB.funcoes = (() => {
  const SUB = {
    0: "₀",
    1: "₁",
    2: "₂",
    3: "₃",
    4: "₄",
    5: "₅",
    6: "₆",
    7: "₇",
    8: "₈",
    9: "₉",
  };
  const indice = (n) =>
    n === 1 ? "" : String(n).replace(/\d/g, (d) => SUB[d]);
  const mdc = (a, b) => (b === 0 ? a : mdc(b, a % b));
  const mmc = (a, b) => (a * b) / mdc(a, b);
  const coef = (n) => (n === 1 ? "" : `${n} `);

  // Um grupo com índice maior que 1 recebe parênteses se for poliatômico.
  function parte(grupo, n) {
    if (n === 1) return grupo.formula;
    const precisa = grupo.poliatomico || /[()]/.test(grupo.formula);
    return precisa
      ? `(${grupo.formula})${indice(n)}`
      : `${grupo.formula}${indice(n)}`;
  }

  // Ortografia: prefixo terminado em vogal + palavra com "s" ou "r" dobra a consoante.
  function juntar(prefixo, palavra) {
    if (!prefixo) return palavra;
    if (/^[sr]/.test(palavra) && /[aeiou]$/.test(prefixo))
      return prefixo + palavra[0] + palavra;
    return prefixo + palavra;
  }

  // Neutralização total: todos os H⁺ ionizáveis e todos os OH⁻ reagem.
  function total(acido, base) {
    const m = mmc(acido.h, base.oh);
    const nAcido = m / acido.h,
      nBase = m / base.oh;
    const nCation = acido.h / mdc(acido.h, base.oh);
    const nAnion = base.oh / mdc(acido.h, base.oh);
    const sal = parte(base.cation, nCation) + parte(acido.anion, nAnion);
    return {
      tipo: "total",
      coefAcido: nAcido,
      coefBase: nBase,
      coefSal: 1,
      agua: m,
      sal,
      nomeSal: `${acido.anion.nome} de ${base.cation.nome}`,
      equacao: `${coef(nAcido)}${acido.formula} + ${coef(nBase)}${base.formula} → ${sal} + ${coef(m)}H₂O`,
    };
  }

  // Neutralização parcial com um só ácido e bases monovalentes (hidrogenossal),
  // ou com uma base e ácidos monopróticos (hidroxissal).
  function parciais(acido, base) {
    const lista = [];
    if (base.oh === 1) {
      (acido.parciais || []).forEach((p) => {
        const carga = p.h; // H⁺ que reagiram = carga do ânion restante
        const sal = parte(base.cation, carga) + p.formula;
        lista.push({
          tipo: "parcial",
          coefAcido: 1,
          coefBase: carga,
          coefSal: 1,
          agua: carga,
          sal,
          nomeSal: `${p.nome} de ${base.cation.nome}`,
          equacao: `${acido.formula} + ${coef(carga)}${base.formula} → ${sal} + ${coef(carga)}H₂O`,
        });
      });
    }
    if (acido.h === 1) {
      (base.parciais || []).forEach((p) => {
        const carga = p.oh; // OH⁻ que reagiram = carga do cátion restante
        const sal = p.formula + parte(acido.anion, carga);
        lista.push({
          tipo: "parcial",
          coefAcido: carga,
          coefBase: 1,
          coefSal: 1,
          agua: carga,
          sal,
          nomeSal: `${juntar(p.nome, acido.anion.nome)} de ${base.cation.nome}`,
          equacao: `${coef(carga)}${acido.formula} + ${base.formula} → ${sal} + ${coef(carga)}H₂O`,
        });
      });
    }
    return lista;
  }

  return { total, parciais, indice, mdc, mmc, juntar, parte };
})();
