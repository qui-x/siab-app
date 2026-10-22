"use strict";
/* Painel "Equação": nível simbólico. Mostra ionização, reação ao misturar e,
   conforme o módulo, os números do equilíbrio (pH, pOH, concentrações, α, Ka). */
SIAB.equacao = (() => {
  // Equação iônica da reação entre o que está no tubo e o que cai do conta-gotas.
  function reacaoIonica(a, b) {
    const par = [a, b];
    const tem = (kind) => par.find((s) => s.kind === kind);
    const acidoForte = tem("strongAcid"),
      acidoFraco = tem("weakAcid");
    const baseForte = tem("strongBase"),
      baseFraca = tem("weakBase"),
      suspensao = tem("suspension");
    if (acidoForte && baseForte) return "H₃O⁺ + OH⁻ → 2 H₂O";
    if (acidoFraco && baseForte)
      return `${acidoFraco.acidForm} + OH⁻ → ${acidoFraco.baseForm} + H₂O`;
    if (acidoForte && baseFraca)
      return `${baseFraca.baseForm} + H₃O⁺ → ${baseFraca.acidForm} + H₂O`;
    if (acidoFraco && baseFraca)
      return `${acidoFraco.acidForm} + ${baseFraca.baseForm} ⇌ ${acidoFraco.baseForm} + ${baseFraca.acidForm}`;
    if ((acidoForte || acidoFraco) && suspensao) {
      const n = suspensao.n;
      return `${suspensao.formula}(s) + ${n} H₃O⁺ → ${suspensao.cation} + ${2 * n} H₂O`;
    }
    const etapas = reacaoPorEtapas(a, b);
    if (etapas) return etapas;
    const ids = par.map((s) => s.id);
    if (ids.includes("bicarbonate") && (acidoForte || acidoFraco))
      return "HCO₃⁻ + H₃O⁺ → H₂CO₃ + H₂O  (H₂CO₃ ⇌ CO₂ + H₂O)";
    if (ids.includes("bicarbonate") && ids.includes("vinegar"))
      return "CH₃COOH + HCO₃⁻ → CH₃COO⁻ + H₂CO₃  (H₂CO₃ ⇌ CO₂ + H₂O)";
    if (
      ids.includes("bicarbonate") &&
      par.some(
        (s) =>
          s.kind === "sample" &&
          s.id !== "bicarbonate" &&
          s.model?.targetPH < 7,
      )
    ) {
      return "Ácidos da amostra + HCO₃⁻ → ânions da amostra + H₂CO₃  (H₂CO₃ ⇌ CO₂ + H₂O)";
    }
    if (ids.includes("acetateBuffer") && (acidoForte || acidoFraco))
      return "CH₃COO⁻ + H₃O⁺ → CH₃COOH + H₂O  (o tampão consome o ácido)";
    if (ids.includes("acetateBuffer") && (baseForte || suspensao))
      return "CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O  (o tampão consome a base)";
    if (ids.includes("phosphateBuffer") && (acidoForte || acidoFraco))
      return "HPO₄²⁻ + H₃O⁺ → H₂PO₄⁻ + H₂O  (o tampão consome o ácido)";
    if (ids.includes("phosphateBuffer") && (baseForte || suspensao))
      return "H₂PO₄⁻ + OH⁻ → HPO₄²⁻ + H₂O  (o tampão consome a base)";
    if (par.some((s) => s.kind === "sample") && (baseForte || acidoForte)) {
      return baseForte
        ? "Ácidos da amostra + OH⁻ → ânions da amostra + H₂O"
        : "Bases da amostra + H₃O⁺ → formas protonadas + H₂O";
    }
    return null;
  }

  // Nome curto de uma espécie para a equação: "H₃Cit (ácido cítrico)" → "H₃Cit".
  const curto = (nome) => String(nome).replace(/\s*\(.*\)$/, "");

  /* Reação etapa por etapa (sais e sistemas com "titula", ver reagentes.js)
     com um ácido ou uma base forte: a espécie dissolvida recebe ou doa um H⁺
     por etapa. Ex.: CO₃²⁻ + H₃O⁺ → HCO₃⁻ + H₂O e HCO₃⁻ + H₃O⁺ → H₂CO₃ + H₂O.
     Etapa com pKa negativo (1ª do H₂SO₄) já está ionizada: H₃O⁺ + OH⁻. */
  function reacaoPorEtapas(a, b) {
    for (const [s, o] of [
      [a, b],
      [b, a],
    ]) {
      const t = s.titula,
        nomes = SIAB.familySpecies?.[t?.familia],
        pks = SIAB.acidFamilies?.[t?.familia];
      if (!t || !nomes || !pks) continue;
      const f = t.forma ?? 0;
      const passos = (lista) => (pks.length === 1 ? 1 : lista.at(-1));
      if (t.acido && o.kind === "strongBase") {
        return Array.from({ length: passos(t.acido) }, (_, k) =>
          pks[f + k] < 0
            ? "H₃O⁺ + OH⁻ → 2 H₂O"
            : `${curto(nomes[f + k])} + OH⁻ → ${curto(nomes[f + k + 1])} + H₂O`,
        );
      }
      if (t.base && o.kind === "strongAcid") {
        return Array.from(
          { length: passos(t.base) },
          (_, k) =>
            `${curto(nomes[f - k])} + H₃O⁺ → ${curto(nomes[f - k - 1])} + H₂O`,
        );
      }
    }
    return null;
  }

  // Equação completa ("molecular") quando as duas substâncias estão na tabela de funções.
  const PARA_FUNCOES = {
    hcl: "hcl",
    naoh: "naoh",
    mgoh2: "mgoh2",
    aloh3: "aloh3",
    limewater: "caoh2",
    ammonia: "nh4oh",
  };
  function reacaoCompleta(a, b) {
    const ida = a.funcao || PARA_FUNCOES[a.id],
      idb = b.funcao || PARA_FUNCOES[b.id];
    const acido = SIAB.acidos.find((x) => x.id === ida || x.id === idb);
    const base = SIAB.bases.find((x) => x.id === ida || x.id === idb);
    if (acido && base) return SIAB.funcoes.total(acido, base);
    const nomes = [a.id, b.id].sort().join("+");
    if (nomes === "acetic+naoh")
      return {
        equacao: "CH₃COOH + NaOH → CH₃COONa + H₂O",
        nomeSal: "acetato de sódio",
      };
    if (nomes === "acetic+ammonia")
      return {
        equacao: "CH₃COOH + NH₃ → CH₃COONH₄",
        nomeSal: "acetato de amônio",
      };
    if (nomes === "bicarbonate+hcl")
      return {
        equacao: "NaHCO₃ + HCl → NaCl + H₂O + CO₂",
        nomeSal: "cloreto de sódio",
      };
    return null;
  }

  /* Equação com as partículas "clicáveis" e a seta de transferência de próton.
     - Cada espécie que também está na lupa vira um botão: tocar leva à aba
       Partículas com aquela espécie em destaque (ponte entre o simbólico e o
       submicroscópico).
     - Doador e receptor de H⁺ são achados comparando reagentes e produtos: o
       doador perde um H e o receptor ganha um, com o resto da fórmula igual
       (CH₃COOH → CH₃COO⁻; H₂O → H₃O⁺). Uma seta curva vai do doador ao
       receptor, com "H⁺" (desenhada por setas(), depois de a tela montar). */
  const SUB = {
    "₀": 0,
    "₁": 1,
    "₂": 2,
    "₃": 3,
    "₄": 4,
    "₅": 5,
    "₆": 6,
    "₇": 7,
    "₈": 8,
    "₉": 9,
  };
  const hidrogenios = (f) =>
    [...f.matchAll(/H([₀-₉]*)/g)].reduce(
      (sum, m) =>
        sum + (m[1] ? Number([...m[1]].map((d) => SUB[d]).join("")) : 1),
      0,
    );
  const esqueleto = (f) =>
    f.replace(/H[₀-₉]*/g, "").replace(/[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "");
  function partes(token) {
    const m = token.trim().match(/^(\d+\s)?(.+?)(\((?:s|aq|l|g)\))?$/);
    return { coef: m[1] || "", formula: m[2], estado: m[3] || "" };
  }
  function formulaHTML(texto, presentes = new Set()) {
    const principal = texto.split(/\s+\((?=[^)]*\s)/)[0];
    const resto = texto.slice(principal.length);
    const m = principal.match(/^(.*?)\s(→|⇌)\s(.*)$/);
    if (!m) return { html: SIAB.escape(texto), seta: false };
    const esquerda = m[1].split(" + ").map(partes),
      direita = m[3].split(" + ").map(partes);
    let doador = -1,
      receptor = -1;
    esquerda.forEach((r, i) => {
      direita.forEach((p) => {
        if (esqueleto(r.formula) !== esqueleto(p.formula)) return;
        const d = hidrogenios(p.formula) - hidrogenios(r.formula);
        if (d === -1 && doador < 0) doador = i;
        if (d === 1 && receptor < 0) receptor = i;
      });
    });
    const seta = doador >= 0 && receptor >= 0 && doador !== receptor;
    const token = (x, papel) => {
      const f = SIAB.escape(x.formula);
      // Na lupa, a espécie pode ter nome longo ("H₃Cit (ácido cítrico)").
      const alvo = presentes.has(x.formula)
        ? x.formula
        : [...presentes].find((p) => p.startsWith(`${x.formula} (`));
      const nucleo = alvo
        ? `<button type="button" class="eq-especie" data-acao="destacar" data-especie="${SIAB.escape(alvo)}" title="Ver ${SIAB.escape(alvo)} na lupa">${f}</button>`
        : f;
      return `<span class="eq-token"${papel ? ` data-papel="${papel}"` : ""}>${SIAB.escape(x.coef)}${nucleo}${SIAB.escape(x.estado)}</span>`;
    };
    const lado = (lista, eEsquerda) =>
      lista
        .map((x, i) =>
          token(
            x,
            eEsquerda && seta
              ? i === doador
                ? "doador"
                : i === receptor
                  ? "receptor"
                  : ""
              : "",
          ),
        )
        .join(" + ");
    const leitura = seta
      ? `<span class="sr-only"> (${SIAB.escape(esquerda[doador].formula)} doa H⁺ para ${SIAB.escape(esquerda[receptor].formula)})</span>`
      : "";
    return {
      html: `${lado(esquerda, true)} ${m[2]} ${lado(direita, false)}${SIAB.escape(resto)}${leitura}`,
      seta,
    };
  }
  // Uma equação (ou várias, uma por etapa) em parágrafos próprios.
  const formula = (texto, presentes) =>
    []
      .concat(texto || [])
      .filter(Boolean)
      .map((t) => {
        const f = formulaHTML(t, presentes);
        return `<p class="eq-formula${f.seta ? " com-seta" : ""}">${f.html}</p>`;
      })
      .join("");

  // Desenha as setas curvas de transferência de próton (depois de a tela montar).
  function setas(caixa) {
    caixa.querySelectorAll(".eq-formula.com-seta").forEach((p) => {
      p.querySelector(".eq-seta")?.remove();
      const de = p.querySelector('[data-papel="doador"]'),
        para = p.querySelector('[data-papel="receptor"]');
      if (!de || !para) return;
      const base = p.getBoundingClientRect();
      const a = de.getBoundingClientRect(),
        b = para.getBoundingClientRect();
      if (!base.width || !a.width) return;
      const x1 = a.left + a.width / 2 - base.left,
        x2 = b.left + b.width / 2 - base.left;
      const y1 = a.top - base.top + 1,
        y2 = b.top - base.top + 1;
      const topo = Math.min(y1, y2) - 14;
      const svg = `<svg class="eq-seta" width="${base.width}" height="${base.height}" viewBox="0 0 ${base.width} ${base.height}" aria-hidden="true">
        <defs><marker id="eq-ponta-${Math.round(x1)}-${Math.round(y1)}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 8 4 0 8Z"/></marker></defs>
        <path d="M${x1.toFixed(1)} ${y1.toFixed(1)}C${x1.toFixed(1)} ${topo.toFixed(1)} ${x2.toFixed(1)} ${topo.toFixed(1)} ${x2.toFixed(1)} ${(y2 - 1).toFixed(1)}" marker-end="url(#eq-ponta-${Math.round(x1)}-${Math.round(y1)})"/>
        <text x="${((x1 + x2) / 2).toFixed(1)}" y="${(topo + 4).toFixed(1)}" text-anchor="middle">H⁺</text>
      </svg>`;
      p.insertAdjacentHTML("afterbegin", svg);
    });
  }

  function linha(rotulo, valor) {
    return `<div class="eq-linha"><dt>${rotulo}</dt><dd>${valor}</dd></div>`;
  }

  function html(
    tube,
    { nivel = "explorar", result = SIAB.chem.solve(tube) } = {},
  ) {
    // Espécies que a lupa mostra agora (só com a aba Partículas disponível).
    const presentes = SIAB.lupa.disponivel()
      ? new Set(SIAB.chem.species(tube, result).map((e) => e.formula))
      : new Set();
    const a = { id: tube.solution, ...SIAB.solutions[tube.solution] };
    const b = { id: tube.titrant, ...SIAB.solutions[tube.titrant] };
    const blocos = [];
    const ionizacao = (s) =>
      s.ionization ||
      (s.kind === "sample"
        ? "Mistura com equilíbrios representativos (ver nota da amostra)."
        : "");
    const componentes = tube.componentes || [];
    if (componentes.length) {
      // Mistura geral: o que foi despejado e a neutralização entre ácidos e bases.
      const papel = (s) =>
        ["strongAcid", "weakAcid"].includes(s.kind)
          ? "ácido"
          : ["strongBase", "weakBase", "suspension"].includes(s.kind)
            ? "base"
            : "";
      const itens = componentes
        .map((x) => {
          const s = SIAB.solutions[x.id];
          return `<li><strong>${SIAB.escape(SIAB.solutionSummary(x.id, x.concentration, x.dilution))}</strong> · ${SIAB.format(x.volume)} mL${papel(s) ? ` · ${papel(s)}` : ""}${ionizacao(s) ? formula(ionizacao(s), presentes) : ""}</li>`;
        })
        .join("");
      blocos.push(
        `<section class="eq-bloco"><h3>Na mistura · ${componentes.length} componentes</h3><ul class="eq-lista">${itens}</ul></section>`,
      );
      const temAcido = componentes.some(
        (x) => papel(SIAB.solutions[x.id]) === "ácido",
      );
      const temBase = componentes.some(
        (x) => papel(SIAB.solutions[x.id]) === "base",
      );
      if (temAcido && temBase) {
        blocos.push(
          `<section class="eq-bloco eq-reacao"><h3>Reação ao misturar</h3>${formula("H₃O⁺ + OH⁻ → 2 H₂O", presentes)}<p class="small">Ácidos e bases se neutralizam na proporção das quantidades em mol, não do número de tubos. O pH final mostra o que sobrou em excesso.</p></section>`,
        );
      }
    } else {
      blocos.push(
        `<section class="eq-bloco"><h3>No tubo · ${SIAB.escape(a.name)}</h3>${formula(ionizacao(a), presentes)}${a.hydrolysis ? formula(a.hydrolysis, presentes) : ""}${a.explain ? `<p class="small">${SIAB.escape(a.explain)}</p>` : ""}</section>`,
      );
    }
    if (result.added > 0 || tube.titrant !== "water") {
      const fonte =
        (tube.vidraria || SIAB.state.vidraria) === "erlenmeyer"
          ? "Na bureta"
          : "No conta-gotas";
      blocos.push(
        `<section class="eq-bloco"><h3>${fonte} · ${SIAB.escape(b.name)}</h3>${formula(ionizacao(b), presentes)}</section>`,
      );
    }
    const ionica = componentes.length ? null : reacaoIonica(a, b);
    const completa = componentes.length ? null : reacaoCompleta(a, b);
    if (ionica || completa) {
      // Neutralização total × etapas que a titulação mostra (H₃PO₄: 3 H⁺, 2 saltos).
      const acidoDaTabela = SIAB.acidos?.find((x) => x.id === a.funcao);
      const visiveis = a.titula?.acido?.at(-1);
      const parcial =
        acidoDaTabela && visiveis && acidoDaTabela.h > visiveis
          ? ` Esta é a neutralização total (${acidoDaTabela.h} H⁺); na titulação, só ${visiveis === 1 ? "o 1º H⁺ dá" : `os ${visiveis} primeiros dão`} salto de pH: o último é fraco demais.`
          : "";
      blocos.push(
        `<section class="eq-bloco eq-reacao"><h3>Reação ao misturar</h3>${completa ? `<p class="eq-formula">${SIAB.escape(completa.equacao)}</p><p class="small">Sal formado: ${SIAB.escape(completa.nomeSal)}.${parcial}</p>` : ""}${ionica ? `${formula(ionica, presentes)}<p class="small">Equação iônica: só as partículas que reagem${Array.isArray(ionica) && ionica.length > 1 ? ", uma etapa (um H⁺) por vez" : ""}. A seta curva mostra o H⁺ passando do ácido para a base.</p>` : ""}</section>`,
      );
    }

    const numeros = [];
    const phTexto = SIAB.state.showPH ? SIAB.phFormat(result) : "oculto";
    numeros.push(linha("pH", phTexto));
    if (nivel !== "explorar" && SIAB.state.showPH) {
      numeros.push(
        linha("pOH", SIAB.format(result.pOH, result.approximate ? 1 : 2)),
      );
      numeros.push(
        linha(
          "pH + pOH",
          `${SIAB.format(result.pKw, 2)} (a ${SIAB.format(result.temperature, 0)} °C)`,
        ),
      );
    }
    if (nivel === "calcular" && SIAB.state.showPH) {
      numeros.push(linha("[H₃O⁺]", `${SIAB.cientifico(result.h)} mol/L`));
      numeros.push(linha("[OH⁻]", `${SIAB.cientifico(result.oh)} mol/L`));
      if (a.kind === "weakAcid") {
        numeros.push(linha("Ka", SIAB.cientifico(a.ka)));
        numeros.push(
          linha(
            "α (ionização)",
            `${SIAB.format(SIAB.chem.alpha(a.ka, result.pH) * 100, 1)} %`,
          ),
        );
      }
      if (a.kind === "weakBase")
        numeros.push(linha("Kb", SIAB.cientifico(a.kb)));
      // Sais e sistemas: os pKa de cada família, da forma mais protonada à menos.
      if (a.kind === "salt" || a.kind === "sistema") {
        (a.systems || []).forEach((x) => {
          const pks = SIAB.acidFamilies[x.family] || [];
          const visiveis = pks.filter((pk) => pk > 0);
          if (visiveis.length)
            numeros.push(
              linha(
                `pKa · ${SIAB.escape(curto(SIAB.familySpecies[x.family]?.[0] || x.family))}`,
                visiveis.map((pk) => SIAB.format(pk, 2)).join(" · "),
              ),
            );
        });
      }
      if (a.kind === "suspension")
        numeros.push(linha("Kps", SIAB.cientifico(a.ksp)));
      if (b.kind === "suspension")
        numeros.push(linha("Kps do conta-gotas", SIAB.cientifico(b.ksp)));
      const nA = tube.concentration * tube.initialVolume;
      if (a.kind !== "sample" && a.kind !== "water")
        numeros.push(
          linha(
            "Quantidade no tubo",
            `n = C · V = ${SIAB.format(tube.concentration, 4)} × ${SIAB.format(tube.initialVolume)} = ${SIAB.format(nA, 5)} mmol`,
          ),
        );
      if (result.equivalencias.length > 1) {
        numeros.push(
          linha(
            "Volumes de equivalência",
            result.equivalencias
              .map((v, i) => `V${"₁₂₃₄"[i] || ""} = ${SIAB.format(v, 3)} mL`)
              .join(" · "),
          ),
        );
      } else if (result.equivalenceVolume !== null) {
        numeros.push(
          linha(
            "Volume de equivalência",
            `V = ${SIAB.format(result.equivalenceVolume, 3)} mL`,
          ),
        );
      }
    }
    blocos.push(
      `<section class="eq-bloco"><h3>Números</h3><dl class="eq-numeros">${numeros.join("")}</dl>${nivel === "explorar" ? '<p class="field-hint">Mais números nos módulos Medir e Calcular.</p>' : ""}${result.temperature !== 25 ? `<p class="field-hint">A ${SIAB.format(result.temperature, 0)} °C, o neutro é pH ${SIAB.format(result.neutralPH)}.</p>` : ""}</section>`,
    );
    const dica = presentes.size
      ? '<p class="field-hint">Toque numa fórmula para vê-la na lupa de partículas.</p>'
      : "";
    return `<div class="equacao">${blocos.join("")}${dica}</div>`;
  }

  return { html, reacaoIonica, reacaoCompleta, formulaHTML, setas };
})();
