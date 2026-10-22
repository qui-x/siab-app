"use strict";
/* Condutividade elétrica da solução: lei de Kohlrausch da migração
   independente dos íons.
     κ = Σ λ°ᵢ · cᵢ
   λ° é a condutividade molar iônica limite (diluição infinita) a 25 °C, em
   S·cm²/mol, por mol do íon (já inclui a carga). Com c em mol/L:
     κ (µS/cm) = 1000 · Σ λ°ᵢ · cᵢ
   Valores: CRC Handbook of Chemistry and Physics, "Ionic conductivity and
   diffusion at infinite dilution". Acima de cerca de 0,01 mol/L a
   condutividade real fica menor (os íons se atrapalham): o simulador mostra o
   limite ideal, como faz com o pH.
   H₃O⁺ e OH⁻ conduzem muito mais que os outros íons porque o próton salta de
   uma molécula de água para a vizinha (mecanismo de Grotthuss), sem que o íon
   inteiro precise atravessar a solução. É isso que desenha o "V" da
   titulação condutométrica. */
SIAB.condutividade = (() => {
  const LAMBDA = {
    "H₃O⁺": 349.6,
    "OH⁻": 198.0,
    "Na⁺": 50.1,
    "K⁺": 73.5,
    "NH₄⁺": 73.5,
    "Ca²⁺": 119.0,
    "Mg²⁺": 106.0,
    "Al³⁺": 183.0,
    "Cl⁻": 76.3,
    "NO₃⁻": 71.4,
    "CH₃COO⁻": 40.9,
    "HCO₃⁻": 44.5,
    "CO₃²⁻": 138.6,
    "HSO₄⁻": 52.0,
    "SO₄²⁻": 160.0,
    "H₂PO₄⁻": 36.0,
    "HPO₄²⁻": 114.0,
    "PO₄³⁻": 207.0,
    "Cit³⁻": 210.6,
    "Lac⁻": 38.8,
    "Li⁺": 38.7,
    "Ba²⁺": 127.2,
    "Br⁻": 78.1,
    "I⁻": 76.8,
    "ClO₄⁻": 67.3,
    "F⁻": 55.4,
    "HCOO⁻": 54.6,
    "CN⁻": 78.0,
    "NO₂⁻": 71.8,
    "HC₂O₄⁻": 40.2,
    "C₂O₄²⁻": 148.2,
    "C₆H₅COO⁻": 32.4,
    "CH₃CH₂COO⁻": 35.8,
    "ClCH₂COO⁻": 39.8,
    "HSO₃⁻": 58.0,
    "SO₃²⁻": 144.0,
    "CH₃NH₃⁺": 58.7,
    "(CH₃)₂NH₂⁺": 51.8,
    "(CH₃)₃NH⁺": 47.2,
    "C₂H₅NH₃⁺": 47.2,
    "N₂H₅⁺": 59.0,
    "[Al(H₂O)₆]³⁺": 183.0,
    "[Fe(H₂O)₆]³⁺": 204.0,
    "[Cu(H₂O)₆]²⁺": 107.2,
    "[Zn(H₂O)₆]²⁺": 105.6,
  };
  // Íons sem valor na tabela (ânions orgânicos dos alimentos, "cátions de
  // sais" das amostras): estimativa pela carga, marcada com ≈ na tela.
  const ESTIMADO = { 1: 40, 2: 115, 3: 210 };
  const SOBRESCRITO = { "²": 2, "³": 3, "⁴": 4 };

  function carga(formula) {
    const m = formula.match(/([²³⁴]?)[⁺⁻]/);
    return m ? SOBRESCRITO[m[1]] || 1 : 1;
  }

  function lambda(formula) {
    if (LAMBDA[formula]) return { valor: LAMBDA[formula], estimado: false };
    const z = carga(formula);
    return { valor: ESTIMADO[z] || 70 * z, estimado: true };
  }

  // Contribuição de cada íon e o total, em µS/cm (do íon que mais conduz ao que menos conduz).
  function medir(tube, result = SIAB.chem.solve(tube)) {
    const ions = SIAB.chem
      .species(tube, result)
      .filter((e) => e.type === "ion")
      .map((e) => {
        const l = lambda(e.formula);
        return {
          formula: e.formula,
          conc: e.conc,
          lambda: l.valor,
          estimado: l.estimado,
          contrib: 1000 * l.valor * e.conc,
          espectador: Boolean(e.espectador),
        };
      })
      .sort((a, b) => b.contrib - a.contrib);
    return { kappa: ions.reduce((sum, x) => sum + x.contrib, 0), ions };
  }

  // Brilho da lâmpada do teste de condução, de 0 a 1, em escala logarítmica
  // (a corrente varia em muitas potências de 10): 10 µS/cm, apagada;
  // 100 mS/cm, brilho máximo.
  const brilho = (kappa) =>
    Math.max(0, Math.min(1, (Math.log10(Math.max(kappa, 1e-3)) - 1) / 4));
  const lampada = (kappa) => {
    const b = brilho(kappa);
    return b >= 0.6 ? "forte" : b >= 0.25 ? "fraca" : "apagada";
  };

  // Condutividade a cada gota (no máximo cerca de 240 pontos).
  function serie(tube, maximo = 240) {
    const n = tube.additions.length;
    const passo = Math.max(1, Math.ceil(n / maximo));
    const pontos = [];
    let soma = 0;
    for (let i = 0; i <= n; i++) {
      if (i > 0) soma += tube.additions[i - 1];
      if (i % passo && i !== n) continue;
      pontos.push({
        v: soma,
        k: medir({ ...tube, additions: soma > 0 ? [soma] : [] }).kappa,
      });
    }
    return pontos;
  }

  return { LAMBDA, lambda, carga, medir, brilho, lampada, serie };
})();
