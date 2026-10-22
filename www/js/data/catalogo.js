"use strict";
/* Reagentes de laboratório e indicadores.
   Campos químicos: kind (tipo de modelo), ka, n (H⁺ ou OH⁻ por fórmula).
   Campos didáticos: formas ácida/básica para a lupa e equações para o painel. */
SIAB.solutions = {
  hcl: {
    name: "Ácido clorídrico",
    formula: "HCl",
    kind: "strongAcid",
    label: "Ácido forte",
    anion: "Cl⁻",
    ionization: "HCl + H₂O → H₃O⁺ + Cl⁻",
    explain:
      "Ácido forte: praticamente todas as moléculas de HCl se ionizam na água.",
  },
  acetic: {
    name: "Ácido acético",
    formula: "CH₃COOH",
    kind: "weakAcid",
    ka: 1.8e-5,
    label: "Ácido fraco",
    acidForm: "CH₃COOH",
    baseForm: "CH₃COO⁻",
    ionization: "CH₃COOH + H₂O ⇌ H₃O⁺ + CH₃COO⁻",
    explain:
      "Ácido fraco: só uma pequena fração das moléculas se ioniza; o restante permanece inteiro.",
  },
  naoh: {
    name: "Hidróxido de sódio",
    formula: "NaOH",
    kind: "strongBase",
    label: "Base forte",
    cation: "Na⁺",
    ionization: "NaOH → Na⁺ + OH⁻",
    explain: "Base forte: dissocia-se totalmente, liberando íons OH⁻.",
  },
  ammonia: {
    name: "Amônia em água",
    formula: "NH₃",
    kind: "weakBase",
    ka: 1e-14 / 1.8e-5,
    kb: 1.8e-5,
    label: "Base fraca",
    acidForm: "NH₄⁺",
    baseForm: "NH₃",
    ionization: "NH₃ + H₂O ⇌ NH₄⁺ + OH⁻",
    explain: "Base fraca: só uma pequena parte da amônia recebe H⁺ da água.",
  },
  water: {
    name: "Água pura",
    formula: "H₂O",
    kind: "water",
    label: "Referência neutra",
    ionization: "2 H₂O ⇌ H₃O⁺ + OH⁻",
    explain: "Na água pura, [H₃O⁺] = [OH⁻]: a solução é neutra.",
  },
};
// Indicadores. low/high: faixa de viragem declarada (onde o nome da cor muda).
// pKIn: constante de equilíbrio do indicador (HIn ⇌ H⁺ + In⁻), de tabelas de
// química geral (OpenStax; LibreTexts, "Acid-Base Indicators"). A cor vem da
// fração da forma básica, α = 1 / (1 + 10^(pKIn − pH)) (Henderson–Hasselbalch),
// e da soma das absorções das duas formas (lei de Beer–Lambert). acid e base
// são as cores das formas puras; middle fica só como referência de nome.
SIAB.indicators = {
  btb: {
    name: "Azul de bromotimol",
    short: "Bromotimol",
    low: 6,
    high: 7.6,
    pKIn: 7.1,
    acid: [246, 205, 35],
    middle: [69, 171, 79],
    base: [38, 103, 210],
    acidName: "amarelo",
    middleName: "verde",
    baseName: "azul",
  },
  phenol: {
    name: "Fenolftaleína",
    short: "Fenolftaleína",
    low: 8.2,
    high: 10,
    pKIn: 9.4,
    acid: [233, 237, 243],
    middle: [244, 159, 207],
    base: [219, 37, 146],
    acidName: "incolor",
    middleName: "rosa claro",
    baseName: "rosa",
  },
  methyl: {
    name: "Alaranjado de metila",
    short: "Alaranjado de metila",
    low: 3.1,
    high: 4.4,
    pKIn: 3.7,
    acid: [220, 48, 48],
    middle: [244, 134, 38],
    base: [246, 211, 43],
    acidName: "vermelho",
    middleName: "laranja",
    baseName: "amarelo",
  },
  litmus: {
    name: "Tornassol",
    short: "Tornassol",
    low: 4.5,
    high: 8.3,
    pKIn: 6.5,
    acid: [217, 55, 76],
    middle: [153, 83, 182],
    base: [53, 98, 200],
    acidName: "vermelho",
    middleName: "violeta",
    baseName: "azul",
  },
  universal: {
    name: "Indicador universal",
    short: "Universal",
    low: 1,
    high: 14,
  },
  none: { name: "Sem indicador", short: "Sem indicador" },
};
