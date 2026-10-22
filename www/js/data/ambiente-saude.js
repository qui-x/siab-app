"use strict";
/* Bases pouco solúveis (antiácidos), água de cal e água da chuva (M11 e M12).
   Kps a 25 °C: OpenStax, Chemistry 2e, Apêndice J.
   A chuva é modelada como sistema fechado, em equilíbrio com o CO₂ do ar. */
Object.assign(SIAB.solutions, {
  mgoh2: {
    name: "Hidróxido de magnésio",
    formula: "Mg(OH)₂",
    kind: "suspension",
    label: "Base pouco solúvel (suspensão)",
    group: "health",
    ksp: 8.9e-12,
    n: 2,
    cation: "Mg²⁺",
    massaMolar: 58.32,
    ionization: "Mg(OH)₂(s) ⇌ Mg²⁺ + 2 OH⁻",
    note: "Suspensão didática, como no leite de magnésia. A concentração indica o total de Mg(OH)₂ por litro, dissolvido ou não. Dissolve à medida que o ácido consome OH⁻ (Kps = 8,9 × 10⁻¹²).",
  },
  aloh3: {
    name: "Hidróxido de alumínio",
    formula: "Al(OH)₃",
    kind: "suspension",
    label: "Base pouco solúvel (suspensão)",
    group: "health",
    ksp: 2e-32,
    n: 3,
    cation: "Al³⁺",
    massaMolar: 78.0,
    ionization: "Al(OH)₃(s) ⇌ Al³⁺ + 3 OH⁻",
    note: "Suspensão didática usada em antiácidos. Kps = 2 × 10⁻³². Hidrólise do Al³⁺, complexos e a forma do sólido não são modelados.",
  },
  limewater: {
    name: "Água de cal",
    formula: "Ca(OH)₂",
    kind: "strongBase",
    label: "Base forte pouco solúvel (solução límpida)",
    group: "health",
    n: 2,
    cation: "Ca²⁺",
    ionization: "Ca(OH)₂ → Ca²⁺ + 2 OH⁻",
    explain:
      "O que dissolve se dissocia totalmente. Cada fórmula libera 2 OH⁻.",
    note: "Solução límpida, sem sólido. A cal hidratada é usada para corrigir a acidez de águas e solos; o calcário (CaCO₃) age de forma semelhante, mais devagar, e não é modelado.",
  },
  cleanRain: {
    name: "Chuva sem poluição",
    group: "health",
    kind: "sample",
    label: "Amostra ambiental",
    model: {
      systems: [{ family: "carbonate", total: 1.39e-5 }],
      fixedCharge: 0,
    },
    natural: { rgb: [233, 237, 243], opacity: 0.02, name: "incolor" },
    preparation:
      "Água pura em equilíbrio com o CO₂ do ar (≈ 420 ppm): [CO₂] = 3,3 × 10⁻² × 4,2 × 10⁻⁴ ≈ 1,4 × 10⁻⁵ mol/L.",
    note: "Mesmo limpa, a chuva é levemente ácida (pH ≈ 5,6) por causa do CO₂ dissolvido: CO₂ + H₂O ⇌ H₂CO₃.",
  },
  acidRain: {
    name: "Chuva ácida",
    group: "health",
    kind: "sample",
    label: "Amostra ambiental",
    model: {
      systems: [
        { family: "carbonate", total: 1.39e-5 },
        { family: "sulfate", total: 2.5e-5 },
      ],
      fixedCharge: 0,
    },
    natural: { rgb: [233, 237, 243], opacity: 0.02, name: "incolor" },
    preparation:
      "Chuva com CO₂ do ar e ácido sulfúrico formado a partir do SO₂ poluente: SO₂ + ½ O₂ → SO₃; SO₃ + H₂O → H₂SO₄.",
    note: "Amostra representativa (H₂SO₄ 2,5 × 10⁻⁵ mol/L). Na atmosfera também se formam HNO₃ e H₂SO₃, não incluídos.",
  },
});
