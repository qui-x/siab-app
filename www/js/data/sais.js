"use strict";
/* Sais e soluções-tampão de laboratório (M9 e M10).
   Cada sal é descrito pelo que libera em água: sistemas ácido-base (famílias
   de pKa) e a carga fixa dos íons que não reagem com a água.
   A carga de referência é a da espécie mais protonada de cada sistema:
   NH₄⁺ tem carga +1, por isso o NH₄Cl tem carga fixa 0 (+1 do NH₄⁺, −1 do Cl⁻).
   Constantes a 25 °C; fontes em "Sobre o SIAB" → Referências (OpenStax). */
SIAB.solutionGroups = {
  fruits: "Frutas e sucos",
  kitchen: "Alimentos e bebidas",
  home: "Soluções do cotidiano",
  lab: "Reagentes de laboratório",
  salts: "Sais e tampões",
  health: "Saúde e ambiente",
  reference: "Referência",
};
SIAB.acidFamilies.ammonium = [14 + Math.log10(1.8e-5)]; // pKa do NH₄⁺ = 9,26 (Kb do NH₃ = 1,8 × 10⁻⁵)
SIAB.acidFamilies.sulfate = [-3, -Math.log10(1.2e-2)]; // H₂SO₄: 1ª etapa forte; Ka₂ = 1,2 × 10⁻²
SIAB.familySpecies.ammonium = ["NH₄⁺", "NH₃"];
SIAB.familySpecies.sulfate = ["H₂SO₄", "HSO₄⁻", "SO₄²⁻"];

const salt = (
  name,
  formula,
  label,
  systems,
  chargePerUnit,
  spectators,
  extra,
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
Object.assign(SIAB.solutions, {
  nacl: salt(
    "Cloreto de sódio",
    "NaCl",
    "Sal de ácido forte e base forte",
    [],
    0,
    [
      { formula: "Na⁺", perUnit: 1 },
      { formula: "Cl⁻", perUnit: 1 },
    ],
    {
      ionization: "NaCl → Na⁺ + Cl⁻",
      hydrolysis: "Na⁺ e Cl⁻ não reagem com a água. A solução continua neutra.",
      origin: "HCl (ácido forte) + NaOH (base forte)",
      expected: "neutra",
    },
  ),
  nh4cl: salt(
    "Cloreto de amônio",
    "NH₄Cl",
    "Sal de ácido forte e base fraca",
    [{ family: "ammonium", perUnit: 1 }],
    0,
    [{ formula: "Cl⁻", perUnit: 1 }],
    {
      ionization: "NH₄Cl → NH₄⁺ + Cl⁻",
      hydrolysis: "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (o íon amônio doa H⁺ à água)",
      origin: "HCl (ácido forte) + NH₃ (base fraca)",
      expected: "ácida",
    },
  ),
  ch3coona: salt(
    "Acetato de sódio",
    "CH₃COONa",
    "Sal de ácido fraco e base forte",
    [{ family: "acetate", perUnit: 1 }],
    1,
    [{ formula: "Na⁺", perUnit: 1 }],
    {
      ionization: "CH₃COONa → CH₃COO⁻ + Na⁺",
      hydrolysis: "CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (o acetato recebe H⁺ da água)",
      origin: "CH₃COOH (ácido fraco) + NaOH (base forte)",
      expected: "básica",
    },
  ),
  na2co3: salt(
    "Carbonato de sódio",
    "Na₂CO₃",
    "Sal de ácido fraco e base forte",
    [{ family: "carbonate", perUnit: 1 }],
    2,
    [{ formula: "Na⁺", perUnit: 2 }],
    {
      ionization: "Na₂CO₃ → 2 Na⁺ + CO₃²⁻",
      hydrolysis: "CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻ (o carbonato recebe H⁺ da água)",
      origin: "H₂CO₃ (ácido fraco) + NaOH (base forte)",
      expected: "básica",
    },
  ),
  acetateBuffer: salt(
    "Tampão acetato",
    "CH₃COOH + CH₃COONa",
    "Solução-tampão",
    [{ family: "acetate", perUnit: 2 }],
    1,
    [{ formula: "Na⁺", perUnit: 1 }],
    {
      ionization: "CH₃COOH + H₂O ⇌ H₃O⁺ + CH₃COO⁻",
      hydrolysis:
        "Ácido e base conjugada juntos: H₃O⁺ adicionado reage com CH₃COO⁻; OH⁻ adicionado reage com CH₃COOH.",
      note: "A concentração informada vale para cada componente: ácido acético e acetato de sódio em quantidades iguais (pH ≈ pKa = 4,74).",
    },
  ),
  phosphateBuffer: salt(
    "Tampão fosfato",
    "NaH₂PO₄ + Na₂HPO₄",
    "Solução-tampão",
    [{ family: "phosphate", perUnit: 2 }],
    3,
    [{ formula: "Na⁺", perUnit: 3 }],
    {
      ionization: "H₂PO₄⁻ + H₂O ⇌ H₃O⁺ + HPO₄²⁻",
      hydrolysis:
        "Par conjugado H₂PO₄⁻/HPO₄²⁻: resiste a variações de pH perto de 7,2.",
      note: "A concentração informada vale para cada componente: NaH₂PO₄ e Na₂HPO₄ em quantidades iguais (pH ≈ pKa₂ = 7,20).",
    },
  ),
});
