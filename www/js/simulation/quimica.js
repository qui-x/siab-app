"use strict";
/* Motor químico do SIAB.
   Modelo ideal, aquoso e com equilíbrio imediato. O pH é a raiz do balanço de
   cargas (eletroneutralidade), com balanços de massa, diluição e autoionização
   da água. A temperatura padrão é 25 °C; alterações da temperatura
   da solução usam a tabela de pKw. Amostras do cotidiano usam equilíbrios representativos.
   Fontes: "Sobre o SIAB" → Referências. Limites: seção "Limites do modelo" do manual. */
SIAB.chem = (() => {
  const KW = 1e-14;

  // pKw da água líquida (Bandura e Lvov, 2006). A 25 °C o modelo usa 14,00.
  const PKW_TABLE = [
    [0, 14.95],
    [10, 14.53],
    [20, 14.17],
    [25, 14.0],
    [30, 13.83],
    [40, 13.54],
    [50, 13.26],
    [60, 13.02],
    [70, 12.8],
    [80, 12.6],
    [90, 12.42],
    [100, 12.25],
  ];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function pKw(temperature = 25) {
    const t = clamp(
      Number.isFinite(Number(temperature)) ? Number(temperature) : 25,
      0,
      100,
    );
    for (let i = 0; i < PKW_TABLE.length - 1; i++) {
      const [t0, p0] = PKW_TABLE[i];
      const [t1, p1] = PKW_TABLE[i + 1];
      if (t <= t1) return p0 + ((p1 - p0) * (t - t0)) / (t1 - t0);
    }
    return PKW_TABLE.at(-1)[1];
  }

  function added(tube) {
    return tube.additions.reduce((sum, v) => sum + v, 0);
  }

  // Frações de cada espécie de um sistema com n etapas de desprotonação.
  // w₀ = 1 e wᵢ = wᵢ₋₁ × 10^(pH − pKaᵢ).
  function fractions(pH, pKa) {
    const weights = [1];
    pKa.forEach((pk) => weights.push(weights.at(-1) * 10 ** (pH - pk)));
    const total = weights.reduce((sum, w) => sum + w, 0);
    return weights.map((w) => w / total);
  }

  // Carga negativa média gerada pelas desprotonações: Σ(i × wᵢ) / Σ(wᵢ).
  function meanCharge(pH, pKa) {
    let weight = 1,
      denominator = 1,
      numerator = 0;
    pKa.forEach((pk, index) => {
      weight *= 10 ** (pH - pk);
      denominator += weight;
      numerator += (index + 1) * weight;
    });
    return numerator / denominator;
  }

  // Carga de uma fórmula pelo sobrescrito: "NH₄⁺" → 1; "[Al(H₂O)₆]³⁺" → 3; "SO₄²⁻" → −2.
  const SOBRE = { "²": 2, "³": 3, "⁴": 4 };
  function cargaDe(formula = "") {
    const m = String(formula).match(/([²³⁴]?)([⁺⁻])/);
    return m ? (SOBRE[m[1]] || 1) * (m[2] === "⁺" ? 1 : -1) : 0;
  }

  // Amostras calibradas: a carga dos íons fixos satisfaz o balanço no pH alvo.
  function sampleStock(solution) {
    const model = solution.model;
    const systems = model.systems.map((x) => ({
      total: x.total,
      pKa: SIAB.acidFamilies[x.family],
      family: x.family,
    }));
    const h = 10 ** -(model.targetPH ?? 7);
    const fixedCharge =
      model.fixedCharge ??
      KW / h -
        h +
        systems.reduce(
          (sum, x) => sum + x.total * meanCharge(model.targetPH, x.pKa),
          0,
        );
    return { systems, fixedCharge };
  }

  // O que foi posto no recipiente antes das gotas: a solução inicial ou, depois
  // de misturar tubos, a lista de componentes { id, concentration, volume, dilution }.
  function base(tube) {
    return tube.componentes?.length
      ? tube.componentes
      : [
          {
            id: tube.solution,
            concentration: tube.concentration,
            volume: tube.initialVolume,
            dilution: tube.dilution,
          },
        ];
  }

  // Reúne o que há no tubo depois da mistura: a base e as gotas.
  // Cada componente entra no balanço de cargas diluído pelo volume total.
  function mixture(tube) {
    const va = added(tube);
    const inicio = base(tube);
    const volume = inicio.reduce((sum, x) => sum + x.volume, 0) + va;
    const sources = [
      ...inicio.map((x) => ({
        role: tube.componentes?.length ? "mistura" : "inicial",
        ...x,
      })),
      {
        role: "gotas",
        id: tube.titrant,
        concentration: tube.titrantConcentration,
        volume: va,
        dilution: tube.titrantDilution,
      },
    ];
    const terms = {
      positive: 0,
      negative: 0,
      acids: [],
      bases: [],
      systems: [],
      suspensions: [],
      spectators: [],
    };
    for (const source of sources) {
      const s = SIAB.solutions[source.id];
      const fraction = source.volume / volume;
      if (!s || !(fraction > 0)) continue;
      const c = source.concentration * fraction;
      const n = s.n || 1;
      if (s.kind === "strongAcid") {
        terms.negative += n * c;
        terms.spectators.push({ formula: s.anion, conc: c });
      }
      if (s.kind === "strongBase") {
        terms.positive += n * c;
        terms.spectators.push({ formula: s.cation, conc: c });
      }
      if (s.kind === "weakAcid") terms.acids.push({ c, ka: s.ka, solution: s });
      if (s.kind === "weakBase") terms.bases.push({ c, ka: s.ka, solution: s });
      if (s.kind === "suspension")
        terms.suspensions.push({ c, ksp: s.ksp, n, solution: s });
      // Sal, tampão ou "sistema" (ácido poliprótico, aminoácido, cátion metálico
      // hidratado): sistemas de pKa mais a carga fixa dos íons que não reagem.
      if (s.kind === "salt" || s.kind === "sistema") {
        terms.positive += s.chargePerUnit * c;
        s.systems.forEach((x) =>
          terms.systems.push({
            total: x.perUnit * c,
            pKa: SIAB.acidFamilies[x.family],
            family: x.family,
          }),
        );
        (s.spectators || []).forEach((x) =>
          terms.spectators.push({ formula: x.formula, conc: x.perUnit * c }),
        );
      }
      if (s.kind === "sample") {
        const stock = sampleStock(s);
        const scale = fraction / (source.dilution || 1);
        terms.positive += stock.fixedCharge * scale;
        stock.systems.forEach((x) =>
          terms.systems.push({
            total: x.total * scale,
            pKa: x.pKa,
            family: x.family,
          }),
        );
        // Íons fixos de verdade: a carga fixa menos a carga de referência dos
        // sistemas (o NH₄⁺ do amônio, o Al³⁺ hidratado…).
        const fixos =
          stock.fixedCharge -
          stock.systems.reduce(
            (sum, x) =>
              sum + x.total * cargaDe(SIAB.familySpecies?.[x.family]?.[0]),
            0,
          );
        if (Math.abs(fixos * scale) > 1e-12) {
          terms.spectators.push({
            formula:
              s.fixedIon || (fixos > 0 ? "cátions de sais" : "ânions de sais"),
            conc: Math.abs(fixos * scale),
          });
        }
        // Íons que não trocam H⁺ (Na⁺, Cl⁻… do soro, da água do mar): lupa e condução.
        (s.model.espectadores || []).forEach((x) =>
          terms.spectators.push({ formula: x.formula, conc: x.conc * scale }),
        );
      }
    }
    // Um mesmo sólido compartilha um único limite de saturação na mistura.
    const unicas = new Map();
    terms.suspensions.forEach((x) => {
      const k = x.solution.formula;
      if (unicas.has(k)) unicas.get(k).c += x.c;
      else unicas.set(k, { ...x });
    });
    terms.suspensions = [...unicas.values()];
    return { va, volume, terms };
  }

  // Base pouco solúvel M(OH)ₙ: dissolve até o limite de Kps = [Mⁿ⁺][OH⁻]ⁿ.
  function dissolved(suspension, oh) {
    return Math.min(suspension.c, suspension.ksp / oh ** suspension.n);
  }

  // Balanço de cargas: positivo quando o pH testado é baixo demais.
  function charge(terms, pH, kw) {
    const h = 10 ** -pH;
    const oh = kw / h;
    return (
      h +
      terms.positive +
      terms.bases.reduce((sum, x) => sum + (x.c * h) / (x.ka + h), 0) +
      terms.suspensions.reduce((sum, x) => sum + x.n * dissolved(x, oh), 0) -
      oh -
      terms.negative -
      terms.acids.reduce((sum, x) => sum + (x.c * x.ka) / (x.ka + h), 0) -
      terms.systems.reduce((sum, x) => sum + x.total * meanCharge(pH, x.pKa), 0)
    );
  }

  // O que cada solução faz numa titulação: quantos H⁺ doa (acido) ou recebe
  // (base) por fórmula, etapa por etapa. [1, 2] = duas equivalências: a 1ª
  // com 1 H⁺ por fórmula e a 2ª com 2 (H₃PO₄ com NaOH; Na₂CO₃ com HCl).
  // Sais e sistemas declaram isso em "titula" ({ acido, base, familia, forma });
  // forma é a posição, na lista de espécies da família, da forma dissolvida.
  function capacidade(s) {
    if (!s) return {};
    if (s.kind === "strongAcid") return { acido: [s.n || 1] };
    if (s.kind === "weakAcid") return { acido: [1] };
    if (
      s.kind === "strongBase" ||
      s.kind === "weakBase" ||
      s.kind === "suspension"
    )
      return { base: [s.n || 1] };
    return s.titula || {};
  }

  // pKa de cada etapa da titulação (na meia-etapa, pH ≈ pKa).
  function pKaDasEtapas(s, sentido, etapas) {
    if (s.kind === "weakAcid" || s.kind === "weakBase")
      return [-Math.log10(s.ka)];
    const familia = s.titula?.familia,
      lista = SIAB.acidFamilies?.[familia];
    if (!lista) return [];
    const f = s.titula.forma ?? 0;
    return etapas.map((_, k) => lista[sentido === "acido" ? f + k : f - k - 1]);
  }
  const SUB_NUM = ["₀", "₁", "₂", "₃", "₄"];

  function solve(tube) {
    const { va, volume, terms } = mixture(tube);
    const temperature = clamp(
      Number.isFinite(Number(tube.temperature)) ? Number(tube.temperature) : 25,
      0,
      100,
    );
    const pkw = pKw(temperature);
    const kw = 10 ** -pkw;
    let lo = -2,
      hi = 16;
    for (let i = 0; i < 90; i++) {
      const mid = (lo + hi) / 2;
      if (charge(terms, mid, kw) > 0) lo = mid;
      else hi = mid;
    }
    const pH = (lo + hi) / 2;
    const initial = SIAB.solutions[tube.solution];
    const drops = SIAB.solutions[tube.titrant];
    const A = capacidade(initial),
      B = capacidade(drops);
    // Numa mistura de vários tubos não há uma única "equivalência" prevista.
    let etapas = null,
      porGota = 0,
      sentido = null;
    if (!tube.componentes?.length && tube.titrantConcentration > 0) {
      if (A.acido && B.base) {
        etapas = A.acido;
        porGota = B.base.at(-1);
        sentido = "acido";
      } else if (A.base && B.acido) {
        etapas = A.base;
        porGota = B.acido.at(-1);
        sentido = "base";
      }
    }
    // V de cada equivalência = n(H⁺ trocados até ali) / (C do titulante × H⁺ ou OH⁻ por fórmula).
    const equivalencias = etapas
      ? etapas.map(
          (e) =>
            (tube.concentration * e * tube.initialVolume) /
            (tube.titrantConcentration * porGota),
        )
      : [];
    const equivalenceVolume = equivalencias.length
      ? equivalencias.at(-1)
      : null;
    // Meias-etapas: no meio de cada etapa, ácido e base conjugada estão em
    // quantidades iguais e pH ≈ pKa (Henderson–Hasselbalch).
    const pks = etapas ? pKaDasEtapas(initial, sentido, etapas) : [];
    const familiaPKa = SIAB.acidFamilies?.[initial?.titula?.familia] || [];
    const meias = equivalencias
      .map((v, k) => {
        const inicio = k ? equivalencias[k - 1] : 0,
          pKa = pks[k];
        if (!Number.isFinite(pKa)) return null;
        const indice = familiaPKa.length > 1 ? familiaPKa.indexOf(pKa) + 1 : 0;
        return {
          v: (inicio + v) / 2,
          inicio,
          fim: v,
          pKa,
          rotulo: `pKa${indice > 0 ? SUB_NUM[indice] || "" : ""}`,
        };
      })
      .filter(Boolean);
    const weak =
      initial && (initial.kind === "weakAcid" || initial.kind === "weakBase");
    const approximate =
      base(tube).some((x) => SIAB.solutions[x.id]?.kind === "sample") ||
      (va > 0 && drops?.kind === "sample");
    const neutralPH = pkw / 2;
    return {
      pH,
      pOH: pkw - pH,
      pKw: pkw,
      neutralPH,
      temperature,
      h: 10 ** -pH,
      oh: kw / 10 ** -pH,
      approximate,
      added: va,
      volume,
      drops: tube.additions.length,
      equivalenceVolume,
      equivalencias,
      meias,
      halfEquivalenceVolume:
        equivalenceVolume !== null &&
        (weak || (meias.length === 1 && equivalencias.length === 1))
          ? equivalenceVolume / 2
          : null,
      atEquivalence: equivalencias.some((v) => Math.abs(va - v) < 1e-8),
      phase:
        Math.abs(pH - neutralPH) < 0.005
          ? "Neutra"
          : pH < neutralPH
            ? "Ácida"
            : "Básica",
    };
  }

  // Espécies dissolvidas no pH calculado (para a lupa molecular).
  // A água não entra na lista: há cerca de 55,5 mol/L dela.
  function species(tube, result = solve(tube)) {
    const { terms } = mixture(tube);
    const h = result.h,
      oh = result.oh;
    const list = [];
    const add = (formula, conc, type, extra = {}) => {
      if (!(conc > 0)) return;
      const found = list.find((x) => x.formula === formula);
      if (found) found.conc += conc;
      else list.push({ formula, conc, type, ...extra });
    };
    add("H₃O⁺", h, "ion");
    add("OH⁻", oh, "ion");
    // Íons espectadores (Na⁺, Cl⁻…): estão na solução, mas não trocam prótons.
    terms.spectators.forEach((x) =>
      add(x.formula, x.conc, "ion", { espectador: true }),
    );
    terms.acids.forEach((x) => {
      add(x.solution.acidForm, (x.c * h) / (x.ka + h), "molecule");
      add(x.solution.baseForm, (x.c * x.ka) / (x.ka + h), "ion");
    });
    terms.bases.forEach((x) => {
      add(x.solution.acidForm, (x.c * h) / (x.ka + h), "ion");
      add(x.solution.baseForm, (x.c * x.ka) / (x.ka + h), "molecule");
    });
    terms.systems.forEach((x) => {
      const names = SIAB.familySpecies?.[x.family] || [];
      fractions(result.pH, x.pKa).forEach((f, i) => {
        const name = names[i] || `${x.family} (${i})`;
        add(name, x.total * f, /[⁺⁻]/.test(name) ? "ion" : "molecule");
      });
    });
    terms.suspensions.forEach((x) => {
      const d = dissolved(x, oh);
      add(x.solution.cation, d, "ion");
      add(`${x.solution.formula} sólido`, x.c - d, "solid");
    });
    return list.sort((p, q) => q.conc - p.conc);
  }

  // Zona onde uma gota acabou de cair, antes de se misturar: a gota e um
  // pouco (vZona) do líquido que já estava no recipiente. Tem as mesmas
  // proporções que o recipiente todo recebendo dv·V/vZona de gotas; por isso
  // basta "fingir" essa quantidade de gotas. É o que deixa a fenolftaleína
  // rosa onde a gota de NaOH cai, mesmo com o resto ainda ácido.
  function zona(tube, vZona) {
    const va = added(tube);
    const dv = tube.additions.at(-1) || 0;
    const antes = base(tube).reduce((sum, x) => sum + x.volume, 0) + va - dv;
    const local = {
      ...tube,
      additions:
        dv > 0 && vZona > 0
          ? [va - dv + (dv * antes) / Math.min(vZona, antes)]
          : tube.additions,
    };
    return { tubo: local, r: solve(local) };
  }

  // Sistemas ácido-base do recipiente, para o diagrama de distribuição:
  // nomes das espécies (da mais protonada à menos protonada), pKa e
  // concentração total. Sistemas iguais (ácido acético e acetato de sódio,
  // por exemplo) somam. Do mais concentrado ao menos concentrado.
  function sistemas(tube) {
    const { terms } = mixture(tube);
    const lista = [];
    const juntar = (nomes, pKa, total) => {
      const chave = nomes.join("|");
      const achado = lista.find((x) => x.chave === chave);
      if (achado) achado.total += total;
      else lista.push({ chave, nomes, pKa, total });
    };
    [...terms.acids, ...terms.bases].forEach((x) =>
      juntar(
        [x.solution.acidForm, x.solution.baseForm],
        [-Math.log10(x.ka)],
        x.c,
      ),
    );
    terms.systems.forEach((x) =>
      juntar(
        SIAB.familySpecies?.[x.family] ||
          [...x.pKa, 0].map((_, i) => `${x.family} (${i})`),
        x.pKa,
        x.total,
      ),
    );
    return lista.filter((x) => x.total > 0).sort((p, q) => q.total - p.total);
  }

  // CO₂ dissolvido (H₂CO₃*, a forma mais protonada do sistema carbonato), em
  // mol/L. Acima da solubilidade do CO₂ (cerca de 0,034 mol/L a 25 °C e
  // 1 atm, pela lei de Henry) o gás sairia em bolhas. O modelo é fechado: o
  // CO₂ continua no cálculo do pH; as bolhas são só uma ilustração.
  const SOLUBILIDADE_CO2 = 0.034;
  function co2(tube, result = solve(tube)) {
    const { terms } = mixture(tube);
    const conc = terms.systems
      .filter((x) => x.family === "carbonate")
      .reduce((sum, x) => sum + x.total * fractions(result.pH, x.pKa)[0], 0);
    return {
      conc,
      solubilidade: SOLUBILIDADE_CO2,
      excesso: Math.max(0, conc / SOLUBILIDADE_CO2 - 1),
    };
  }

  // Sólido que não dissolveu (suspensões como o Mg(OH)₂), em mol/L e g/L.
  function solidos(tube, result = solve(tube)) {
    const { terms } = mixture(tube);
    return terms.suspensions
      .map((x) => {
        const mol = Math.max(0, x.c - dissolved(x, result.oh));
        return {
          formula: x.solution.formula,
          mol,
          gL: mol * (x.solution.massaMolar || 60),
        };
      })
      .filter((x) => x.mol > 1e-7);
  }

  // Grau de ionização de um ácido fraco monoprótico: α = Ka / (Ka + [H₃O⁺]).
  function alpha(ka, pH) {
    const h = 10 ** -pH;
    return ka / (ka + h);
  }

  function mix(a, b, t) {
    return a.map((v, i) => Math.round(v + (b[i] - v) * t));
  }

  function color(indicator, pH) {
    if (!SIAB.indicators[indicator] || indicator === "none")
      return {
        rgb: [233, 237, 243],
        opacity: 0.14,
        name: "incolor",
        progress: null,
      };
    if (indicator === "universal" || indicator === "cabbage") {
      // Paleta didática representativa: o indicador universal é uma mistura
      // cuja carta de cores depende da formulação, não um medidor exato.
      const stops =
        indicator === "cabbage"
          ? [
              [1, [205, 40, 77], "vermelho"],
              [3, [219, 65, 130], "rosa"],
              [5, [156, 77, 172], "violeta"],
              [7, [99, 88, 180], "violeta azulado"],
              [8, [54, 119, 177], "azul"],
              [9, [44, 155, 126], "verde azulado"],
              [11, [123, 176, 68], "verde"],
              [13, [215, 198, 60], "amarelo"],
              [14, [223, 203, 75], "amarelo"],
            ]
          : [
              [1, [210, 43, 58], "vermelho"],
              [3, [239, 91, 41], "vermelho alaranjado"],
              [5, [246, 203, 39], "amarelo"],
              [7, [73, 167, 86], "verde"],
              [9, [32, 153, 177], "azul esverdeado"],
              [11, [65, 95, 210], "azul"],
              [14, [129, 62, 181], "roxo"],
            ];
      const p = clamp(pH, 1, 14);
      let i = 0;
      while (i < stops.length - 2 && p > stops[i + 1][0]) i++;
      const t = (p - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      return {
        rgb: mix(stops[i][1], stops[i + 1][1], t),
        opacity: 0.86,
        name: t < 0.5 ? stops[i][2] : stops[i + 1][2],
        progress: null,
      };
    }
    const ind = SIAB.indicators[indicator];
    // Fração da forma básica do indicador (In⁻): Henderson–Hasselbalch.
    const a = fracaoBasica(ind, pH);
    // Cor transmitida: soma das absorbâncias das duas formas (Beer–Lambert).
    // É isso que faz o bromotimol passar por verde e o tornassol por violeta.
    const A = absorbancia(ind.acid).map(
      (x, i) => (1 - a) * x + a * absorbancia(ind.base)[i],
    );
    const T = A.map((x) => 10 ** -x);
    const rgb = T.map((x) => Math.round(255 * x));
    // Nome pela faixa declarada (a mesma usada nas missões e no manual).
    const name =
      pH < ind.low
        ? ind.acidName
        : pH > ind.high
          ? ind.baseName
          : ind.middleName;
    return {
      rgb,
      opacity: clamp(1 - Math.min(...T), 0.14, 0.97),
      name,
      progress: a,
    };
  }

  // Absorbância de cada canal (R, G, B) de uma cor transmitida: A = −log₁₀ T.
  function absorbancia(rgb) {
    return rgb.map((v) => -Math.log10(Math.max(v, 8) / 255));
  }
  // α = [In⁻] / ([HIn] + [In⁻]) = 1 / (1 + 10^(pKIn − pH)).
  function fracaoBasica(ind, pH) {
    const pk = ind.pKIn ?? (ind.low + ind.high) / 2;
    return 1 / (1 + 10 ** (pk - pH));
  }

  // Vários indicadores no mesmo recipiente (depois de misturar tubos): cada um
  // contribui com a própria cor na proporção do volume que trouxe; tubo sem
  // indicador não contribui, e a fenolftaleína incolor (meio ácido) também não.
  // Aproximação didática da mistura de corantes.
  function colorMix(indicadores, pH) {
    const partes = indicadores
      .filter((x) => x.id !== "none" && x.fracao > 0)
      .map((x) => {
        const c = color(x.id, pH);
        return {
          c,
          peso: x.fracao * (x.id === "phenol" ? c.progress || 0 : 1),
        };
      });
    const forca = partes.reduce((sum, x) => sum + x.peso, 0);
    if (forca < 0.02) return { ...color("none", pH), forca: 0 };
    const rgb = [0, 1, 2].map((i) =>
      Math.round(
        partes.reduce((sum, x) => sum + x.c.rgb[i] * x.peso, 0) / forca,
      ),
    );
    const principal = partes.reduce((a, b) => (b.peso > a.peso ? b : a));
    return {
      rgb,
      opacity: 0.14 + 0.72 * Math.min(1, forca),
      name: principal.peso / forca > 0.8 ? principal.c.name : "cor composta",
      progress: null,
      forca,
    };
  }

  // Cor do indicador de um recipiente: um indicador, ou a mistura deles.
  function indicatorColor(tube, pH) {
    return tube.indicadores?.length > 1
      ? colorMix(tube.indicadores, pH)
      : color(tube.indicator, pH);
  }

  // Faixa de pH (entre 0 e 14) em que um indicador exibe uma cor com esse nome.
  // Usada pelo detetive: a pista é sempre coerente com a cor desenhada.
  function colorRange(indicator, name) {
    let min = null,
      max = null;
    for (let i = 0; i <= 1400; i++) {
      const pH = i / 100;
      if (color(indicator, pH).name === name) {
        if (min === null) min = pH;
        max = pH;
      }
    }
    return min === null ? null : [min, max];
  }

  // Nomes de cor que um indicador pode exibir, do meio ácido ao básico.
  function colorNames(indicator) {
    const names = [];
    for (let i = 0; i <= 140; i++) {
      const name = color(indicator, i / 10).name;
      if (!names.includes(name)) names.push(name);
    }
    return names;
  }

  function liquid(tube, indicatorOnly = false, result = solve(tube)) {
    const misto = tube.indicadores?.length > 1;
    const indicator = indicatorColor(tube, result.pH);
    const components = [
      ...base(tube).map((x) => [x.id, x.volume, x.dilution]),
      [tube.titrant, result.added, tube.titrantDilution],
    ]
      .map(([id, v, dilution]) => ({
        natural: SIAB.solutions[id].natural,
        fraction: v / result.volume / (dilution || 1),
      }))
      .filter((x) => x.natural && x.fraction > 0 && x.natural.opacity > 0.025);
    const weight = components.reduce(
      (sum, x) => sum + x.natural.opacity * x.fraction,
      0,
    );
    if (!weight || (indicatorOnly && tube.indicator !== "none"))
      return { ...indicator, indicatorName: indicator.name, masked: false };
    const rgb = [0, 1, 2].map((i) =>
      Math.round(
        components.reduce(
          (sum, x) => sum + x.natural.rgb[i] * x.natural.opacity * x.fraction,
          0,
        ) / weight,
      ),
    );
    const pigmentName =
      components.length === 1 ? components[0].natural.name : "cor das amostras";
    const dye = misto
      ? 0.75 * Math.min(1, indicator.forca)
      : tube.indicator === "none"
        ? 0
        : tube.indicator === "phenol"
          ? (indicator.progress || 0) * 0.8
          : 0.75;
    return {
      rgb: mix(rgb, indicator.rgb, dye / (dye + weight)),
      opacity: Math.max(0.14, Math.min(0.97, weight + dye * (1 - weight))),
      name: dye > 0.02 ? "cor composta" : pigmentName,
      indicatorName: indicator.name,
      masked: dye > 0.02,
      pigmentName,
    };
  }

  const cache = new WeakMap();
  function assinatura(t) {
    return JSON.stringify([
      t.solution,
      t.concentration,
      t.initialVolume,
      t.dilution,
      t.titrant,
      t.titrantConcentration,
      t.titrantDilution,
      t.additions,
      t.temperature,
      t.componentes,
      t.indicator,
      t.indicadores,
    ]);
  }
  function estado(tube) {
    const key = assinatura(tube),
      saved = cache.get(tube);
    if (saved?.key === key) return saved.value;
    const r = solve(tube);
    const all = species(tube, r);
    const systems = sistemas(tube).map((x) => ({
      ...x,
      fractions: fractions(r.pH, x.pKa),
    }));
    all.forEach((x) => {
      x.charge = cargaDe(x.formula);
    });
    const solid = solidos(tube, r);
    const components = base(tube)
      .filter((x) => x.volume > 0)
      .map((x) => SIAB.solutions[x.id]);
    if (r.added > 0) components.push(SIAB.solutions[tube.titrant]);
    const quality = components.some((x) => x?.kind === "sample")
      ? "amostra representativa"
      : components.some((x) => x?.kind === "suspension")
        ? "modelo aproximado"
        : "solução mecanística";
    Object.assign(r, {
      signature: key,
      kw: 10 ** -r.pKw,
      species: all,
      systems,
      solids: solid,
      precipitates: solid,
      gas: co2(tube, r),
      conjugatePairs: systems.flatMap((x) =>
        x.nomes
          .slice(0, -1)
          .map((acid, i) => ({ acid, base: x.nomes[i + 1], pKa: x.pKa[i] })),
      ),
      indicator: indicatorColor(tube, r.pH),
      color: liquid(tube, false, r),
      quality,
      modelNote:
        quality === "amostra representativa"
          ? "Composição parcial calibrada: não representa a composição molecular completa da amostra real."
          : "Equilíbrio ideal aquoso. Concentrações aproximam atividades.",
      constantsTemperature: 25,
      conductivityReferenceTemperature: 25,
    });
    r.conductivity = SIAB.condutividade
      ? SIAB.condutividade.medir(tube, r)
      : null;
    cache.set(tube, { key, value: r });
    return r;
  }

  return {
    assinatura,
    estado,
    capacidade,
    solve: estado,
    color,
    colorMix,
    indicatorColor,
    colorRange,
    colorNames,
    liquid,
    added,
    species,
    alpha,
    fractions,
    pKw,
    KW,
    meanCharge,
    base,
    zona,
    fracaoBasica,
    sistemas,
    co2,
    solidos,
  };
})();
