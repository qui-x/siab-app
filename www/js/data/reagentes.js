"use strict";
/* Reagentes de laboratório (expansão da versão 0.7): ácidos e bases fortes e
   fracos, ácidos polipróticos, sais, sais de metais (cátions ácidos),
   tampões e aminoácidos. Também reorganiza os grupos da prateleira.

   Constantes a 25 °C, arredondadas, de tabelas usuais:
   - ácidos e bases: D. C. Harris, "Análise Química Quantitativa", apêndice
     de constantes de dissociação; CRC Handbook of Chemistry and Physics;
   - aminoácidos: Lehninger, "Princípios de Bioquímica";
   - cátions metálicos hidratados (1ª hidrólise, [M(H₂O)ₙ]ᶻ⁺ ⇌ H⁺ + …):
     Baes e Mesmer, "The Hydrolysis of Cations".
   Bases fracas guardam o Ka do ácido conjugado (BH⁺), como a amônia.

   Tipos de modelo (ver js/simulation/quimica.js):
   - strongAcid / strongBase: ionização completa (n = H⁺ ou OH⁻ por fórmula);
   - weakAcid / weakBase: um equilíbrio (Ka);
   - salt e sistema: famílias de pKa (SIAB.acidFamilies) e a carga fixa dos
     íons, contada a partir da forma mais protonada de cada família.
     "sistema" é o nome para o que não é sal: ácidos polipróticos,
     aminoácidos. Ex.: glicina pura tem carga de referência +1 (⁺H₃N–CH₂–COOH),
     e a solução fica perto do ponto isoelétrico, pI = (pKa₁ + pKa₂)/2.
   - titula: quantos H⁺ a fórmula doa (acido) ou recebe (base) em cada
     equivalência; familia e forma dizem de onde parte (forma = posição da
     espécie dissolvida na lista da família). */

Object.assign(SIAB.acidFamilies, {
  oxalate: [1.25, 4.27],
  tartrate: [3.04, 4.37],
  ascorbate: [4.1, 11.79],
  sulfite: [1.86, 7.17],
  fluoride: [3.17],
  formate: [3.75],
  benzoate: [4.2],
  nitrite: [3.15],
  hypochlorite: [7.53],
  borate: [9.24],
  glycine: [2.34, 9.6],
  alanine: [2.34, 9.69],
  glutamate: [2.19, 4.25, 9.67],
  lysine: [2.18, 8.95, 10.53],
  tris: [8.07],
  aluminio: [4.97],
  ferro3: [2.19],
  cobre: [7.5],
  zinco: [8.96],
});
Object.assign(SIAB.familySpecies, {
  oxalate: ["H₂C₂O₄", "HC₂O₄⁻", "C₂O₄²⁻"],
  tartrate: ["H₂Tar (ácido tartárico)", "HTar⁻", "Tar²⁻"],
  ascorbate: ["H₂Asc (vitamina C)", "HAsc⁻", "Asc²⁻"],
  sulfite: ["H₂SO₃", "HSO₃⁻", "SO₃²⁻"],
  fluoride: ["HF", "F⁻"],
  formate: ["HCOOH", "HCOO⁻"],
  benzoate: ["C₆H₅COOH", "C₆H₅COO⁻"],
  nitrite: ["HNO₂", "NO₂⁻"],
  hypochlorite: ["HClO", "ClO⁻"],
  borate: ["B(OH)₃", "B(OH)₄⁻"],
  glycine: ["H₂Gly⁺", "HGly (zwitteríon)", "Gly⁻"],
  alanine: ["H₂Ala⁺", "HAla (zwitteríon)", "Ala⁻"],
  glutamate: ["H₃Glu⁺", "H₂Glu (zwitteríon)", "HGlu⁻", "Glu²⁻"],
  lysine: ["H₃Lys²⁺", "H₂Lys⁺", "HLys (zwitteríon)", "Lys⁻"],
  tris: ["TrisH⁺", "Tris"],
  aluminio: ["[Al(H₂O)₆]³⁺", "[Al(H₂O)₅OH]²⁺"],
  ferro3: ["[Fe(H₂O)₆]³⁺", "[Fe(H₂O)₅OH]²⁺"],
  cobre: ["[Cu(H₂O)₆]²⁺", "[Cu(H₂O)₅OH]⁺"],
  zinco: ["[Zn(H₂O)₆]²⁺", "[Zn(H₂O)₅OH]⁺"],
});

// Grupos da prateleira, na ordem em que aparecem.
SIAB.solutionGroups = {
  fruits: "Frutas e sucos",
  kitchen: "Alimentos e bebidas",
  home: "Casa, limpeza e higiene",
  saude: "Saúde e farmácia",
  corpo: "Corpo humano",
  ambiente: "Água e ambiente",
  acidosFortes: "Ácidos fortes",
  acidosFracos: "Ácidos fracos",
  acidosPoli: "Ácidos polipróticos",
  basesFortes: "Bases fortes",
  basesFracas: "Bases fracas",
  salts: "Sais",
  metais: "Sais de metais (cátions ácidos)",
  tampoes: "Tampões",
  aminoacidos: "Aminoácidos",
  reference: "Referência",
};

(() => {
  const pk = (pKa) => 10 ** -pKa;

  const acidoForte = (name, formula, anion, funcao, extra = {}) => ({
    name,
    formula,
    kind: "strongAcid",
    label: "Ácido forte",
    group: "acidosFortes",
    anion,
    funcao,
    ionization: `${formula} + H₂O → H₃O⁺ + ${anion}`,
    explain: `Ácido forte: praticamente todas as moléculas de ${formula} se ionizam na água.`,
    ...extra,
  });
  const acidoFraco = (name, formula, pKa, baseForm, extra = {}) => ({
    name,
    formula,
    kind: "weakAcid",
    ka: pk(pKa),
    label: "Ácido fraco",
    group: "acidosFracos",
    acidForm: extra.acidForm || formula,
    baseForm,
    ionization: `${extra.acidForm || formula} + H₂O ⇌ H₃O⁺ + ${baseForm}`,
    explain: `Ácido fraco (pKa ${String(pKa).replace(".", ",")}): só uma fração das moléculas se ioniza.`,
    ...extra,
  });
  const baseForte = (name, formula, cation, n, funcao, extra = {}) => ({
    name,
    formula,
    kind: "strongBase",
    label: "Base forte",
    group: "basesFortes",
    cation,
    n,
    funcao,
    ionization: `${formula} → ${cation} + ${n > 1 ? `${n} ` : ""}OH⁻`,
    explain: `Base forte: dissocia-se totalmente${n > 1 ? `; cada fórmula libera ${n} OH⁻` : ""}.`,
    ...extra,
  });
  // pKa: do ácido conjugado (BH⁺). Kb = Kw / Ka.
  const baseFraca = (name, formula, pKa, acidForm, extra = {}) => ({
    name,
    formula,
    kind: "weakBase",
    ka: pk(pKa),
    kb: 1e-14 / pk(pKa),
    label: "Base fraca",
    group: "basesFracas",
    acidForm,
    baseForm: formula,
    ionization: `${formula} + H₂O ⇌ ${acidForm} + OH⁻`,
    explain: `Base fraca (pKb ${(14 - pKa).toFixed(2).replace(".", ",")}): só uma parte das moléculas recebe H⁺ da água.`,
    ...extra,
  });
  const sal = (
    name,
    formula,
    label,
    systems,
    chargePerUnit,
    spectators,
    extra = {},
  ) => ({
    name,
    formula,
    kind: "salt",
    label,
    group: "salts",
    systems,
    chargePerUnit,
    spectators,
    ...extra,
  });
  const sistema = (
    name,
    formula,
    label,
    group,
    systems,
    chargePerUnit,
    extra = {},
  ) => ({
    name,
    formula,
    kind: "sistema",
    label,
    group,
    systems,
    chargePerUnit,
    spectators: [],
    ...extra,
  });
  const na = (n) => [{ formula: "Na⁺", perUnit: n }];

  Object.assign(SIAB.solutions, {
    /* ---------- Ácidos fortes ---------- */
    hno3: acidoForte("Ácido nítrico", "HNO₃", "NO₃⁻", "hno3", {
      note: "Oxidante e corrosivo. Formado na atmosfera a partir de óxidos de nitrogênio; contribui para a chuva ácida.",
    }),
    hbr: acidoForte("Ácido bromídrico", "HBr", "Br⁻", "hbr"),
    hi: acidoForte("Ácido iodídrico", "HI", "I⁻", "hi"),
    hclo4: acidoForte("Ácido perclórico", "HClO₄", "ClO₄⁻", "hclo4", {
      note: "Um dos ácidos mais fortes. Oxidante perigoso quando concentrado.",
    }),
    h2so4: sistema(
      "Ácido sulfúrico",
      "H₂SO₄",
      "Ácido forte (diprótico)",
      "acidosFortes",
      [{ family: "sulfate", perUnit: 1 }],
      0,
      {
        funcao: "h2so4",
        titula: { acido: [2], familia: "sulfate", forma: 0 },
        ionization: [
          "H₂SO₄ + H₂O → H₃O⁺ + HSO₄⁻",
          "HSO₄⁻ + H₂O ⇌ H₃O⁺ + SO₄²⁻",
        ],
        explain:
          "A 1ª ionização é completa; a 2ª é parcial (pKa₂ = 1,92). Na titulação, os dois H⁺ reagem: 1 H₂SO₄ gasta 2 NaOH.",
        note: "Bateria de carro e indústria. Corrosivo e desidratante: no laboratório, sempre o ácido na água, nunca o contrário.",
      },
    ),

    /* ---------- Ácidos fracos ---------- */
    formic: acidoFraco("Ácido fórmico (metanoico)", "HCOOH", 3.75, "HCOO⁻", {
      note: "Presente na picada de formigas e em urtigas.",
    }),
    benzoic: acidoFraco("Ácido benzoico", "C₆H₅COOH", 4.2, "C₆H₅COO⁻", {
      note: "Conservante de alimentos (e o benzoato de sódio, seu sal). Pouco solúvel: cerca de 0,03 mol/L a 25 °C.",
    }),
    propanoic: acidoFraco(
      "Ácido propanoico",
      "CH₃CH₂COOH",
      4.87,
      "CH₃CH₂COO⁻",
      { note: "Seus sais (propionatos) conservam pães." },
    ),
    lactic: acidoFraco("Ácido láctico", "HLac", 3.86, "Lac⁻", {
      acidForm: "HLac (ácido láctico)",
      note: "Formado na fermentação do leite (iogurte) e nos músculos em esforço intenso. HLac = CH₃CH(OH)COOH.",
    }),
    chloroacetic: acidoFraco(
      "Ácido cloroacético",
      "ClCH₂COOH",
      2.87,
      "ClCH₂COO⁻",
      {
        note: "O cloro puxa elétrons e deixa o H⁺ sair mais fácil: é 100 vezes mais forte que o ácido acético (pKa 2,87 × 4,74).",
      },
    ),
    hf: acidoFraco("Ácido fluorídrico", "HF", 3.17, "F⁻", {
      funcao: "hf",
      note: "Ácido fraco, mas muito perigoso: ataca o vidro e atravessa a pele. Aqui, só no simulador.",
    }),
    hno2: acidoFraco("Ácido nitroso", "HNO₂", 3.15, "NO₂⁻", {
      funcao: "hno2",
      note: "Instável; existe só em solução diluída. Os nitritos conservam embutidos.",
    }),
    hclo: acidoFraco("Ácido hipocloroso", "HClO", 7.53, "ClO⁻", {
      funcao: "hclo",
      note: "O desinfetante da água clorada. Em pH abaixo de 7,5 predomina o HClO, que desinfeta melhor que o ClO⁻: por isso o pH da piscina fica perto de 7,4.",
    }),
    hcn: acidoFraco("Ácido cianídrico", "HCN", 9.21, "CN⁻", {
      funcao: "hcn",
      note: "Extremamente tóxico. Muito fraco: em água quase não se ioniza.",
    }),
    boric: acidoFraco("Ácido bórico", "B(OH)₃", 9.24, "B(OH)₄⁻", {
      ionization: "B(OH)₃ + 2 H₂O ⇌ H₃O⁺ + B(OH)₄⁻",
      explain:
        "Ácido de Lewis: não doa um H⁺ próprio; recebe um OH⁻ da água, que libera H₃O⁺ (pKa 9,24).",
      note: "Usado em água boricada (antisséptico fraco) e inseticidas.",
    }),
    phenol: acidoFraco("Fenol", "C₆H₅OH", 9.99, "C₆H₅O⁻", {
      note: "Muito fraco (pKa 9,99), mas tóxico e corrosivo. Base de desinfetantes antigos.",
    }),

    /* ---------- Ácidos polipróticos ---------- */
    h3po4: sistema(
      "Ácido fosfórico",
      "H₃PO₄",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "phosphate", perUnit: 1 }],
      0,
      {
        funcao: "h3po4",
        titula: { acido: [1, 2], familia: "phosphate", forma: 0 },
        ionization: [
          "H₃PO₄ + H₂O ⇌ H₃O⁺ + H₂PO₄⁻",
          "H₂PO₄⁻ + H₂O ⇌ H₃O⁺ + HPO₄²⁻",
          "HPO₄²⁻ + H₂O ⇌ H₃O⁺ + PO₄³⁻",
        ],
        explain:
          "Três H⁺, cada um mais difícil de sair (pKa 2,15; 7,20; 12,35). Com NaOH aparecem dois saltos de pH: o terceiro H⁺ é fraco demais.",
        note: "Acidulante de refrigerantes tipo cola e base de fertilizantes.",
      },
    ),
    h2co3: sistema(
      "Ácido carbônico (água com CO₂)",
      "H₂CO₃",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "carbonate", perUnit: 1 }],
      0,
      {
        funcao: "h2co3",
        titula: { acido: [1], familia: "carbonate", forma: 0 },
        ionization: [
          "CO₂ + H₂O ⇌ H₂CO₃",
          "H₂CO₃ + H₂O ⇌ H₃O⁺ + HCO₃⁻",
          "HCO₃⁻ + H₂O ⇌ H₃O⁺ + CO₃²⁻",
        ],
        explain:
          "H₂CO₃ aqui representa todo o CO₂ dissolvido (pKa₁ 6,35; pKa₂ 10,33). Acima de cerca de 0,034 mol/L o CO₂ sairia em bolhas.",
      },
    ),
    h2so3: sistema(
      "Ácido sulfuroso",
      "H₂SO₃",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "sulfite", perUnit: 1 }],
      0,
      {
        funcao: "h2so3",
        titula: { acido: [1, 2], familia: "sulfite", forma: 0 },
        ionization: [
          "H₂SO₃ + H₂O ⇌ H₃O⁺ + HSO₃⁻",
          "HSO₃⁻ + H₂O ⇌ H₃O⁺ + SO₃²⁻",
        ],
        explain:
          "Forma-se do SO₂ dissolvido (pKa 1,86 e 7,17). O SO₂ da queima de combustíveis gera chuva ácida.",
      },
    ),
    oxalic: sistema(
      "Ácido oxálico",
      "H₂C₂O₄",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "oxalate", perUnit: 1 }],
      0,
      {
        titula: { acido: [2], familia: "oxalate", forma: 0 },
        ionization: [
          "H₂C₂O₄ + H₂O ⇌ H₃O⁺ + HC₂O₄⁻",
          "HC₂O₄⁻ + H₂O ⇌ H₃O⁺ + C₂O₄²⁻",
        ],
        explain:
          "Diprótico (pKa 1,25 e 4,27). Os dois H⁺ saem perto um do outro: com NaOH aparece um só salto, depois do 2º H⁺.",
        note: "Presente no espinafre e na azedinha; usado para tirar manchas de ferrugem. Tóxico se ingerido em quantidade.",
      },
    ),
    citric: sistema(
      "Ácido cítrico",
      "H₃Cit",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "citrate", perUnit: 1 }],
      0,
      {
        titula: { acido: [3], familia: "citrate", forma: 0 },
        ionization: [
          "H₃Cit + H₂O ⇌ H₃O⁺ + H₂Cit⁻",
          "H₂Cit⁻ + H₂O ⇌ H₃O⁺ + HCit²⁻",
          "HCit²⁻ + H₂O ⇌ H₃O⁺ + Cit³⁻",
        ],
        explain:
          "Triprótico, com pKa próximos (3,13; 4,76; 6,40): os três H⁺ reagem quase juntos e aparece um só salto, com 3 NaOH por fórmula.",
        note: "O ácido das frutas cítricas; acidulante de sucos e balas. H₃Cit = C₆H₈O₇.",
      },
    ),
    tartaric: sistema(
      "Ácido tartárico",
      "H₂Tar",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "tartrate", perUnit: 1 }],
      0,
      {
        titula: { acido: [2], familia: "tartrate", forma: 0 },
        ionization: [
          "H₂Tar + H₂O ⇌ H₃O⁺ + HTar⁻",
          "HTar⁻ + H₂O ⇌ H₃O⁺ + Tar²⁻",
        ],
        explain:
          "Diprótico (pKa 3,04 e 4,37): um só salto, com 2 NaOH por fórmula.",
        note: "O ácido da uva e do vinho; o cremor tártaro é seu sal ácido de potássio.",
      },
    ),
    ascorbic: sistema(
      "Ácido ascórbico (vitamina C)",
      "H₂Asc",
      "Ácido poliprótico",
      "acidosPoli",
      [{ family: "ascorbate", perUnit: 1 }],
      0,
      {
        titula: { acido: [1], familia: "ascorbate", forma: 0 },
        ionization: [
          "H₂Asc + H₂O ⇌ H₃O⁺ + HAsc⁻",
          "HAsc⁻ + H₂O ⇌ H₃O⁺ + Asc²⁻",
        ],
        explain:
          "Diprótico, mas só o 1º H⁺ (pKa 4,10) é titulável com NaOH; o 2º (pKa 11,79) é fraco demais.",
        note: "Vitamina C. Também é antioxidante: oxida-se com o ar, o que não é simulado. H₂Asc = C₆H₈O₆.",
      },
    ),

    /* ---------- Bases fortes ---------- */
    koh: baseForte("Hidróxido de potássio", "KOH", "K⁺", 1, "koh", {
      note: "Potassa cáustica: sabões moles e pilhas alcalinas. Corrosivo.",
    }),
    lioh: baseForte("Hidróxido de lítio", "LiOH", "Li⁺", 1, "lioh", {
      note: "Absorve CO₂ do ar em naves e submarinos.",
    }),
    baoh2: baseForte("Hidróxido de bário", "Ba(OH)₂", "Ba²⁺", 2, "baoh2", {
      note: "Solúvel o bastante para soluções de laboratório (cerca de 0,2 mol/L). Tóxico.",
    }),

    /* ---------- Bases fracas ---------- */
    methylamine: baseFraca("Metilamina", "CH₃NH₂", 10.64, "CH₃NH₃⁺", {
      note: "Cheiro de peixe: aminas se formam na decomposição de proteínas. Por isso limão (ácido) tira o cheiro de peixe: a amina vira um sal sem cheiro.",
    }),
    ethylamine: baseFraca("Etilamina", "C₂H₅NH₂", 10.64, "C₂H₅NH₃⁺"),
    dimethylamine: baseFraca("Dimetilamina", "(CH₃)₂NH", 10.77, "(CH₃)₂NH₂⁺"),
    trimethylamine: baseFraca("Trimetilamina", "(CH₃)₃N", 9.8, "(CH₃)₃NH⁺", {
      note: "A principal responsável pelo cheiro de peixe.",
    }),
    pyridine: baseFraca("Piridina", "C₅H₅N", 5.2, "C₅H₅NH⁺", {
      note: "Base muito fraca (pKb 8,80): o par de elétrons do nitrogênio está menos disponível.",
    }),
    aniline: baseFraca("Anilina", "C₆H₅NH₂", 4.6, "C₆H₅NH₃⁺", {
      note: 'Ainda mais fraca que a piridina: o anel benzênico "puxa" o par de elétrons do nitrogênio. Base dos corantes azo.',
    }),
    hydroxylamine: baseFraca("Hidroxilamina", "NH₂OH", 5.96, "NH₃OH⁺"),
    hydrazine: baseFraca("Hidrazina", "N₂H₄", 8.07, "N₂H₅⁺", {
      note: "Combustível de foguetes. Tóxica.",
    }),
    ethanolamine: baseFraca("Etanolamina", "HOCH₂CH₂NH₂", 9.5, "HOCH₂CH₂NH₃⁺", {
      note: "Usada para capturar CO₂ de gases industriais.",
    }),
    imidazole: baseFraca("Imidazol", "C₃H₄N₂", 6.99, "C₃H₅N₂⁺", {
      note: "O anel da histidina: nas proteínas, troca H⁺ perto de pH 7.",
    }),
    tris: baseFraca("Tris (tampão biológico)", "Tris", 8.07, "TrisH⁺", {
      note: "Tris-hidroximetilaminometano, (HOCH₂)₃CNH₂: a base dos tampões de biologia molecular.",
    }),

    /* ---------- Sais ---------- */
    kcl: sal(
      "Cloreto de potássio",
      "KCl",
      "Sal neutro",
      [],
      0,
      [
        { formula: "K⁺", perUnit: 1 },
        { formula: "Cl⁻", perUnit: 1 },
      ],
      {
        ionization: "KCl → K⁺ + Cl⁻",
        hydrolysis: "K⁺ e Cl⁻ não reagem com a água.",
        origin: "HCl + KOH (ácido e base fortes)",
        expected: "neutra",
        note: 'O "sal light" de cozinha tem KCl.',
      },
    ),
    kno3: sal(
      "Nitrato de potássio",
      "KNO₃",
      "Sal neutro",
      [],
      0,
      [
        { formula: "K⁺", perUnit: 1 },
        { formula: "NO₃⁻", perUnit: 1 },
      ],
      {
        ionization: "KNO₃ → K⁺ + NO₃⁻",
        hydrolysis: "K⁺ e NO₃⁻ não reagem com a água.",
        origin: "HNO₃ + KOH (ácido e base fortes)",
        expected: "neutra",
        note: "Salitre: fertilizante e componente da pólvora.",
      },
    ),
    nano3: sal(
      "Nitrato de sódio",
      "NaNO₃",
      "Sal neutro",
      [],
      0,
      [
        { formula: "Na⁺", perUnit: 1 },
        { formula: "NO₃⁻", perUnit: 1 },
      ],
      {
        ionization: "NaNO₃ → Na⁺ + NO₃⁻",
        hydrolysis: "Na⁺ e NO₃⁻ não reagem com a água.",
        origin: "HNO₃ + NaOH (ácido e base fortes)",
        expected: "neutra",
      },
    ),
    na2so4: sal(
      "Sulfato de sódio",
      "Na₂SO₄",
      "Sal quase neutro",
      [{ family: "sulfate", perUnit: 1 }],
      2,
      na(2),
      {
        ionization: "Na₂SO₄ → 2 Na⁺ + SO₄²⁻",
        hydrolysis:
          "SO₄²⁻ + H₂O ⇌ HSO₄⁻ + OH⁻ (base extremamente fraca: o pH fica muito perto de 7)",
        origin: "H₂SO₄ + NaOH (ácido e base fortes)",
        expected: "neutra",
      },
    ),
    nahso4: sal(
      "Hidrogenossulfato de sódio",
      "NaHSO₄",
      "Sal ácido",
      [{ family: "sulfate", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { acido: [1], familia: "sulfate", forma: 1 },
        ionization: "NaHSO₄ → Na⁺ + HSO₄⁻",
        hydrolysis:
          "HSO₄⁻ + H₂O ⇌ SO₄²⁻ + H₃O⁺ (o H⁺ que sobrou do H₂SO₄ ainda sai: pKa 1,92)",
        origin: "H₂SO₄ + NaOH, só 1 H⁺ neutralizado",
        expected: "ácida",
        note: 'Usado para baixar o pH de piscinas ("redutor de pH").',
      },
    ),
    nahco3: sal(
      "Bicarbonato de sódio (reagente)",
      "NaHCO₃",
      "Sal anfótero",
      [{ family: "carbonate", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { acido: [1], base: [1], familia: "carbonate", forma: 1 },
        ionization: "NaHCO₃ → Na⁺ + HCO₃⁻",
        hydrolysis:
          "HCO₃⁻ pode doar H⁺ (vira CO₃²⁻) ou receber H⁺ (vira H₂CO₃): é anfótero. Recebe um pouco mais do que doa, e o pH fica perto de 8,3 = (pKa₁ + pKa₂)/2.",
        origin: "H₂CO₃ + NaOH, só 1 H⁺ neutralizado",
        expected: "básica",
      },
    ),
    k2co3: sal(
      "Carbonato de potássio",
      "K₂CO₃",
      "Sal básico",
      [{ family: "carbonate", perUnit: 1 }],
      2,
      [{ formula: "K⁺", perUnit: 2 }],
      {
        titula: { base: [1, 2], familia: "carbonate", forma: 2 },
        ionization: "K₂CO₃ → 2 K⁺ + CO₃²⁻",
        hydrolysis: "CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻",
        origin: "H₂CO₃ + KOH",
        expected: "básica",
        note: 'A "potassa" das cinzas de madeira, usada em sabões antigos.',
      },
    ),
    na3po4: sal(
      "Fosfato de sódio",
      "Na₃PO₄",
      "Sal básico",
      [{ family: "phosphate", perUnit: 1 }],
      3,
      na(3),
      {
        titula: { base: [1, 2], familia: "phosphate", forma: 3 },
        ionization: "Na₃PO₄ → 3 Na⁺ + PO₄³⁻",
        hydrolysis: "PO₄³⁻ + H₂O ⇌ HPO₄²⁻ + OH⁻ (base bem forte: pKa₃ 12,35)",
        origin: "H₃PO₄ + NaOH, os 3 H⁺ neutralizados",
        expected: "básica",
        note: "Fosfato trissódico: desengordurante forte.",
      },
    ),
    na2hpo4: sal(
      "Hidrogenofosfato de sódio",
      "Na₂HPO₄",
      "Sal anfótero",
      [{ family: "phosphate", perUnit: 1 }],
      2,
      na(2),
      {
        titula: { base: [1], familia: "phosphate", forma: 2 },
        ionization: "Na₂HPO₄ → 2 Na⁺ + HPO₄²⁻",
        hydrolysis:
          "HPO₄²⁻ recebe H⁺ mais do que doa: pH perto de (pKa₂ + pKa₃)/2 ≈ 9,8.",
        origin: "H₃PO₄ + NaOH, 2 H⁺ neutralizados",
        expected: "básica",
      },
    ),
    nah2po4: sal(
      "Di-hidrogenofosfato de sódio",
      "NaH₂PO₄",
      "Sal anfótero",
      [{ family: "phosphate", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { acido: [1], familia: "phosphate", forma: 1 },
        ionization: "NaH₂PO₄ → Na⁺ + H₂PO₄⁻",
        hydrolysis:
          "H₂PO₄⁻ doa H⁺ mais do que recebe: pH perto de (pKa₁ + pKa₂)/2 ≈ 4,7.",
        origin: "H₃PO₄ + NaOH, só 1 H⁺ neutralizado",
        expected: "ácida",
      },
    ),
    naf: sal(
      "Fluoreto de sódio",
      "NaF",
      "Sal básico",
      [{ family: "fluoride", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { base: [1], familia: "fluoride", forma: 1 },
        ionization: "NaF → Na⁺ + F⁻",
        hydrolysis: "F⁻ + H₂O ⇌ HF + OH⁻",
        origin: "HF (ácido fraco) + NaOH",
        expected: "básica",
        note: "O flúor dos cremes dentais e da água tratada, em quantidade bem pequena.",
      },
    ),
    hcoona: sal(
      "Formiato de sódio",
      "HCOONa",
      "Sal básico",
      [{ family: "formate", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { base: [1], familia: "formate", forma: 1 },
        ionization: "HCOONa → Na⁺ + HCOO⁻",
        hydrolysis: "HCOO⁻ + H₂O ⇌ HCOOH + OH⁻",
        origin: "HCOOH (ácido fraco) + NaOH",
        expected: "básica",
      },
    ),
    benzoatoNa: sal(
      "Benzoato de sódio",
      "C₆H₅COONa",
      "Sal básico",
      [{ family: "benzoate", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { base: [1], familia: "benzoate", forma: 1 },
        ionization: "C₆H₅COONa → Na⁺ + C₆H₅COO⁻",
        hydrolysis: "C₆H₅COO⁻ + H₂O ⇌ C₆H₅COOH + OH⁻",
        origin: "C₆H₅COOH (ácido fraco) + NaOH",
        expected: "básica",
        note: "Conservante de refrigerantes e sucos (E211). Age como ácido benzoico, em meio ácido.",
      },
    ),
    nano2: sal(
      "Nitrito de sódio",
      "NaNO₂",
      "Sal básico",
      [{ family: "nitrite", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { base: [1], familia: "nitrite", forma: 1 },
        ionization: "NaNO₂ → Na⁺ + NO₂⁻",
        hydrolysis: "NO₂⁻ + H₂O ⇌ HNO₂ + OH⁻",
        origin: "HNO₂ (ácido fraco) + NaOH",
        expected: "básica",
        note: "Conservante de embutidos (E250).",
      },
    ),
    naclo: sal(
      "Hipoclorito de sódio",
      "NaClO",
      "Sal básico",
      [{ family: "hypochlorite", perUnit: 1 }],
      1,
      na(1),
      {
        titula: { base: [1], familia: "hypochlorite", forma: 1 },
        ionization: "NaClO → Na⁺ + ClO⁻",
        hydrolysis: "ClO⁻ + H₂O ⇌ HClO + OH⁻",
        origin: "HClO (ácido fraco) + NaOH",
        expected: "básica",
        note: "O ativo da água sanitária. Nunca misture com ácidos (libera cloro, Cl₂) nem com amoníaco (libera cloraminas).",
      },
    ),
    nh4no3: sal(
      "Nitrato de amônio",
      "NH₄NO₃",
      "Sal ácido",
      [{ family: "ammonium", perUnit: 1 }],
      0,
      [{ formula: "NO₃⁻", perUnit: 1 }],
      {
        titula: { acido: [1], familia: "ammonium", forma: 0 },
        ionization: "NH₄NO₃ → NH₄⁺ + NO₃⁻",
        hydrolysis: "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺",
        origin: "HNO₃ (forte) + NH₃ (fraca)",
        expected: "ácida",
        note: "Fertilizante nitrogenado; dissolver esfria a água (compressas frias).",
      },
    ),
    nh42so4: sal(
      "Sulfato de amônio",
      "(NH₄)₂SO₄",
      "Sal ácido",
      [
        { family: "ammonium", perUnit: 2 },
        { family: "sulfate", perUnit: 1 },
      ],
      2,
      [],
      {
        titula: { acido: [2], familia: "ammonium", forma: 0 },
        ionization: "(NH₄)₂SO₄ → 2 NH₄⁺ + SO₄²⁻",
        hydrolysis:
          "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺. O SO₄²⁻ capta parte desse H₃O⁺ (vira HSO₄⁻): a 0,05 mol/L, o pH fica perto de 5,5, e não 5,1 como só com o amônio.",
        origin: "H₂SO₄ (forte) + NH₃ (fraca)",
        expected: "ácida",
        note: "Fertilizante que acidifica o solo com o uso.",
      },
    ),
    ch3coonh4: sal(
      "Acetato de amônio",
      "CH₃COONH₄",
      "Sal de ácido fraco e base fraca",
      [
        { family: "ammonium", perUnit: 1 },
        { family: "acetate", perUnit: 1 },
      ],
      1,
      [],
      {
        ionization: "CH₃COONH₄ → NH₄⁺ + CH₃COO⁻",
        hydrolysis:
          "NH₄⁺ doa H⁺ e CH₃COO⁻ recebe H⁺ quase na mesma medida (Ka do NH₄⁺ ≈ Kb do CH₃COO⁻): pH ≈ 7, sem ser um sal de ácido e base fortes.",
        origin: "CH₃COOH (fraco) + NH₃ (fraca)",
        expected: "neutra",
      },
    ),
    citratoNa: sal(
      "Citrato de sódio",
      "Na₃Cit",
      "Sal básico",
      [{ family: "citrate", perUnit: 1 }],
      3,
      na(3),
      {
        ionization: "Na₃Cit → 3 Na⁺ + Cit³⁻",
        hydrolysis: "Cit³⁻ + H₂O ⇌ HCit²⁻ + OH⁻",
        origin: "Ácido cítrico + NaOH",
        expected: "básica",
        note: "Regulador de acidez de alimentos e anticoagulante em bolsas de sangue.",
      },
    ),

    /* ---------- Sais de metais: cátions ácidos ---------- */
    alcl3: sal(
      "Cloreto de alumínio",
      "AlCl₃",
      "Sal de cátion ácido",
      [{ family: "aluminio", perUnit: 1 }],
      0,
      [{ formula: "Cl⁻", perUnit: 3 }],
      {
        group: "metais",
        ionization: "AlCl₃ + 6 H₂O → [Al(H₂O)₆]³⁺ + 3 Cl⁻",
        hydrolysis:
          "[Al(H₂O)₆]³⁺ + H₂O ⇌ [Al(H₂O)₅OH]²⁺ + H₃O⁺ (o Al³⁺, pequeno e com carga alta, enfraquece a ligação O–H da água presa a ele)",
        origin: "HCl (forte) + Al(OH)₃ (fraca)",
        expected: "ácida",
        note: "Só a 1ª hidrólise é modelada. Com base, o Al(OH)₃ precipitaria (não simulado). Antitranspirantes usam sais de alumínio.",
      },
    ),
    alumen: sal(
      "Alúmen de potássio (pedra-ume)",
      "KAl(SO₄)₂",
      "Sal de cátion ácido",
      [
        { family: "aluminio", perUnit: 1 },
        { family: "sulfate", perUnit: 2 },
      ],
      4,
      [{ formula: "K⁺", perUnit: 1 }],
      {
        group: "metais",
        ionization: "KAl(SO₄)₂ → K⁺ + [Al(H₂O)₆]³⁺ + 2 SO₄²⁻",
        hydrolysis: "[Al(H₂O)₆]³⁺ + H₂O ⇌ [Al(H₂O)₅OH]²⁺ + H₃O⁺",
        origin: "H₂SO₄ + KOH + Al(OH)₃",
        expected: "ácida",
        note: "Usado no tratamento de água (o Al(OH)₃ formado arrasta a sujeira) e como adstringente. Precipitação não simulada.",
      },
    ),
    fecl3: sal(
      "Cloreto de ferro(III)",
      "FeCl₃",
      "Sal de cátion ácido",
      [{ family: "ferro3", perUnit: 1 }],
      0,
      [{ formula: "Cl⁻", perUnit: 3 }],
      {
        group: "metais",
        natural: {
          rgb: [212, 150, 40],
          opacity: 0.5,
          name: "amarelo acastanhado",
        },
        ionization: "FeCl₃ + 6 H₂O → [Fe(H₂O)₆]³⁺ + 3 Cl⁻",
        hydrolysis:
          "[Fe(H₂O)₆]³⁺ + H₂O ⇌ [Fe(H₂O)₅OH]²⁺ + H₃O⁺ (pKa 2,19: tão ácido quanto o ácido fosfórico)",
        origin: "HCl (forte) + Fe(OH)₃ (fraca)",
        expected: "ácida",
        note: "Corrói cobre (placas de circuito) e trata água. A cor amarela vem das formas hidrolisadas; cor fixa no modelo. Precipitação do Fe(OH)₃ não simulada.",
      },
    ),
    cuso4: sal(
      "Sulfato de cobre(II)",
      "CuSO₄",
      "Sal de cátion ácido",
      [
        { family: "cobre", perUnit: 1 },
        { family: "sulfate", perUnit: 1 },
      ],
      2,
      [],
      {
        group: "metais",
        natural: { rgb: [70, 145, 215], opacity: 0.42, name: "azul" },
        ionization: "CuSO₄ + 6 H₂O → [Cu(H₂O)₆]²⁺ + SO₄²⁻",
        hydrolysis: "[Cu(H₂O)₆]²⁺ + H₂O ⇌ [Cu(H₂O)₅OH]⁺ + H₃O⁺ (pKa 7,5)",
        origin: "H₂SO₄ (forte) + Cu(OH)₂ (fraca)",
        expected: "ácida",
        note: "O azul é do íon [Cu(H₂O)₆]²⁺ (cor fixa no modelo, para cerca de 0,1 mol/L). Fungicida (calda bordalesa). Tóxico.",
      },
    ),
    zncl2: sal(
      "Cloreto de zinco",
      "ZnCl₂",
      "Sal de cátion ácido",
      [{ family: "zinco", perUnit: 1 }],
      0,
      [{ formula: "Cl⁻", perUnit: 2 }],
      {
        group: "metais",
        ionization: "ZnCl₂ + 6 H₂O → [Zn(H₂O)₆]²⁺ + 2 Cl⁻",
        hydrolysis:
          "[Zn(H₂O)₆]²⁺ + H₂O ⇌ [Zn(H₂O)₅OH]⁺ + H₃O⁺ (pKa 8,96: bem menos ácido que Al³⁺ e Fe³⁺)",
        origin: "HCl (forte) + Zn(OH)₂ (fraca)",
        expected: "ácida",
        note: "Compare com AlCl₃ e FeCl₃: quanto maior a carga e menor o íon, mais ácido. Precipitação não simulada.",
      },
    ),

    /* ---------- Tampões ---------- */
    ammoniaBuffer: sal(
      "Tampão amônia/amônio",
      "NH₃ + NH₄Cl",
      "Solução-tampão",
      [{ family: "ammonium", perUnit: 2 }],
      1,
      [{ formula: "Cl⁻", perUnit: 1 }],
      {
        group: "tampoes",
        ionization: "NH₃ + H₂O ⇌ NH₄⁺ + OH⁻",
        hydrolysis:
          "Par conjugado NH₄⁺/NH₃: H₃O⁺ adicionado reage com NH₃; OH⁻ adicionado reage com NH₄⁺.",
        note: "A concentração vale para cada componente: NH₃ e NH₄Cl em quantidades iguais (pH ≈ pKa = 9,25).",
      },
    ),
    carbonateBuffer: sal(
      "Tampão carbonato",
      "NaHCO₃ + Na₂CO₃",
      "Solução-tampão",
      [{ family: "carbonate", perUnit: 2 }],
      3,
      na(3),
      {
        group: "tampoes",
        ionization: "HCO₃⁻ + H₂O ⇌ H₃O⁺ + CO₃²⁻",
        hydrolysis:
          "Par conjugado HCO₃⁻/CO₃²⁻: resiste a variações de pH perto de 10,3.",
        note: "A concentração vale para cada componente: NaHCO₃ e Na₂CO₃ em quantidades iguais (pH ≈ pKa₂ = 10,33).",
      },
    ),
    citrateBuffer: sal(
      "Tampão citrato",
      "NaH₂Cit + Na₂HCit",
      "Solução-tampão",
      [{ family: "citrate", perUnit: 2 }],
      3,
      na(3),
      {
        group: "tampoes",
        ionization: "H₂Cit⁻ + H₂O ⇌ H₃O⁺ + HCit²⁻",
        hydrolysis:
          "Par conjugado H₂Cit⁻/HCit²⁻, perto de pH 4,8. Os pKa vizinhos do citrato (3,13 e 6,40) alargam a faixa em que ele tampona.",
        note: "A concentração vale para cada componente, em quantidades iguais. Usado em alimentos e medicamentos.",
      },
    ),
    boraxBuffer: sal(
      "Bórax (tampão borato)",
      "Na₂B₄O₇",
      "Solução-tampão",
      [{ family: "borate", perUnit: 4 }],
      2,
      na(2),
      {
        group: "tampoes",
        ionization: "Na₂B₄O₇ + 7 H₂O → 2 Na⁺ + 2 B(OH)₃ + 2 B(OH)₄⁻",
        hydrolysis:
          "Um só sal já dá o par B(OH)₃/B(OH)₄⁻ em quantidades iguais: pH ≈ pKa = 9,24. É um padrão de calibração de pHmetros (9,18 a 25 °C).",
        note: "Bórax: tetraborato de sódio (decaidratado no frasco). A concentração é de Na₂B₄O₇.",
      },
    ),
    trisBuffer: sal(
      "Tampão Tris",
      "Tris + Tris·HCl",
      "Solução-tampão",
      [{ family: "tris", perUnit: 2 }],
      1,
      [{ formula: "Cl⁻", perUnit: 1 }],
      {
        group: "tampoes",
        ionization: "Tris + H₂O ⇌ TrisH⁺ + OH⁻",
        hydrolysis:
          "Par conjugado TrisH⁺/Tris, perto de pH 8,1: o tampão mais usado em biologia molecular.",
        note: "A concentração vale para cada componente, em quantidades iguais (pH ≈ pKa = 8,07).",
      },
    ),

    /* ---------- Aminoácidos ---------- */
    glycine: sistema(
      "Glicina",
      "HGly",
      "Aminoácido (anfótero)",
      "aminoacidos",
      [{ family: "glycine", perUnit: 1 }],
      1,
      {
        titula: { acido: [1], familia: "glycine", forma: 1 },
        ionization: ["H₂Gly⁺ + H₂O ⇌ H₃O⁺ + HGly", "HGly + H₂O ⇌ H₃O⁺ + Gly⁻"],
        explain:
          "Em água, a glicina é um zwitteríon (⁺H₃N–CH₂–COO⁻): carga total zero, mas com um grupo ácido e um básico. O pH fica perto do ponto isoelétrico, pI = (2,34 + 9,60)/2 ≈ 6,0.",
        note: "O aminoácido mais simples. HGly = ⁺H₃NCH₂COO⁻.",
      },
    ),
    alanine: sistema(
      "Alanina",
      "HAla",
      "Aminoácido (anfótero)",
      "aminoacidos",
      [{ family: "alanine", perUnit: 1 }],
      1,
      {
        titula: { acido: [1], familia: "alanine", forma: 1 },
        ionization: ["H₂Ala⁺ + H₂O ⇌ H₃O⁺ + HAla", "HAla + H₂O ⇌ H₃O⁺ + Ala⁻"],
        explain: "Zwitteríon em água, como a glicina (pI ≈ 6,0).",
      },
    ),
    glutamic: sistema(
      "Ácido glutâmico",
      "H₂Glu",
      "Aminoácido ácido",
      "aminoacidos",
      [{ family: "glutamate", perUnit: 1 }],
      1,
      {
        titula: { acido: [1, 2], familia: "glutamate", forma: 1 },
        ionization: [
          "H₃Glu⁺ + H₂O ⇌ H₃O⁺ + H₂Glu",
          "H₂Glu + H₂O ⇌ H₃O⁺ + HGlu⁻",
          "HGlu⁻ + H₂O ⇌ H₃O⁺ + Glu²⁻",
        ],
        explain:
          "A cadeia lateral tem um segundo –COOH (pKa 4,25): o ponto isoelétrico cai para pI = (2,19 + 4,25)/2 ≈ 3,2. O glutamato monossódico é o realçador de sabor.",
        note: "Pouco solúvel (cerca de 0,06 mol/L).",
      },
    ),
    lysine: sistema(
      "Lisina",
      "HLys",
      "Aminoácido básico",
      "aminoacidos",
      [{ family: "lysine", perUnit: 1 }],
      2,
      {
        titula: { base: [1], familia: "lysine", forma: 2 },
        ionization: [
          "H₃Lys²⁺ + H₂O ⇌ H₃O⁺ + H₂Lys⁺",
          "H₂Lys⁺ + H₂O ⇌ H₃O⁺ + HLys",
          "HLys + H₂O ⇌ H₃O⁺ + Lys⁻",
        ],
        explain:
          "A cadeia lateral tem um segundo –NH₂ (pKa 10,53): o ponto isoelétrico sobe para pI = (8,95 + 10,53)/2 ≈ 9,7.",
      },
    ),
  });

  // Titulação dos sais que já existiam (equivalências no gráfico).
  SIAB.solutions.nh4cl.titula = { acido: [1], familia: "ammonium", forma: 0 };
  SIAB.solutions.ch3coona.titula = { base: [1], familia: "acetate", forma: 1 };
  SIAB.solutions.na2co3.titula = {
    base: [1, 2],
    familia: "carbonate",
    forma: 2,
  };
  SIAB.solutions.hcl.funcao = "hcl";
  SIAB.solutions.naoh.funcao = "naoh";

  // Grupos dos frascos que já existiam.
  const grupos = {
    hcl: "acidosFortes",
    acetic: "acidosFracos",
    naoh: "basesFortes",
    ammonia: "basesFracas",
    limewater: "basesFortes",
    acetateBuffer: "tampoes",
    phosphateBuffer: "tampoes",
    mgoh2: "saude",
    aloh3: "saude",
    cleanRain: "ambiente",
    acidRain: "ambiente",
  };
  Object.entries(grupos).forEach(([id, grupo]) => {
    if (SIAB.solutions[id]) SIAB.solutions[id].group = grupo;
  });
})();

// Indicadores a mais (ficam em "Mais indicadores" na prateleira).
// Faixas de viragem e pKIn: tabelas de indicadores ácido-base (Harris; CRC).
// A cúrcuma (açafrão-da-terra) é um indicador caseiro: curcumina, amarela em
// meio ácido e neutro, marrom avermelhada em meio básico.
Object.assign(SIAB.indicators, {
  methylRed: {
    name: "Vermelho de metila",
    short: "Vermelho de metila",
    extra: true,
    low: 4.4,
    high: 6.2,
    pKIn: 5.0,
    acid: [214, 40, 60],
    middle: [240, 130, 50],
    base: [245, 205, 45],
    acidName: "vermelho",
    middleName: "laranja",
    baseName: "amarelo",
  },
  bromocresolGreen: {
    name: "Verde de bromocresol",
    short: "Verde de bromocresol",
    extra: true,
    low: 3.8,
    high: 5.4,
    pKIn: 4.7,
    acid: [242, 212, 45],
    middle: [90, 170, 110],
    base: [40, 95, 200],
    acidName: "amarelo",
    middleName: "verde",
    baseName: "azul",
  },
  phenolRed: {
    name: "Vermelho de fenol",
    short: "Vermelho de fenol",
    extra: true,
    low: 6.8,
    high: 8.4,
    pKIn: 7.9,
    acid: [245, 200, 45],
    middle: [240, 120, 60],
    base: [215, 40, 95],
    acidName: "amarelo",
    middleName: "laranja",
    baseName: "vermelho",
  },
  thymolphthalein: {
    name: "Timolftaleína",
    short: "Timolftaleína",
    extra: true,
    low: 9.3,
    high: 10.5,
    pKIn: 9.9,
    acid: [233, 237, 243],
    middle: [140, 165, 225],
    base: [40, 70, 190],
    acidName: "incolor",
    middleName: "azul claro",
    baseName: "azul",
  },
  curcuma: {
    name: "Cúrcuma (açafrão-da-terra)",
    short: "Cúrcuma",
    extra: true,
    low: 7.4,
    high: 8.6,
    pKIn: 8.0,
    acid: [240, 190, 25],
    middle: [225, 120, 30],
    base: [170, 50, 30],
    acidName: "amarelo",
    middleName: "laranja",
    baseName: "marrom avermelhado",
  },
});
