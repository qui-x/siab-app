"use strict";
/* Lupa molecular (M4): nível submicroscópico.
   Desenha as espécies dissolvidas em proporção às concentrações calculadas.
   Limite declarado na tela: as moléculas de água não aparecem (≈ 55,5 mol/L). */
SIAB.lupa = (() => {
  const MAX = 36; // partículas da espécie mais abundante
  const COLUNAS = 18,
    LINHAS = 10;
  // Cores bem diferentes entre si; H₃O⁺ (vermelho) e OH⁻ (azul) têm cores fixas.
  const CORES = [
    "#e879f9",
    "#34d399",
    "#fbbf24",
    "#22d3ee",
    "#fb923c",
    "#a78bfa",
    "#a3e635",
    "#f9a8d4",
    "#94a3b8",
  ];

  // Sorteio com semente fixa: as partículas não "pulam" a cada gota.
  function celulas() {
    let semente = 7;
    const aleatorio = () =>
      (semente = (semente * 16807) % 2147483647) / 2147483647;
    const lista = [];
    for (let l = 0; l < LINHAS; l++)
      for (let c = 0; c < COLUNAS; c++) lista.push([c, l]);
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(aleatorio() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista.map(([c, l]) => [c, l, aleatorio(), aleatorio()]);
  }
  const POSICOES = celulas();

  function corDa(formula, indice) {
    if (formula === "H₃O⁺") return "#f87171";
    if (formula === "OH⁻") return "#60a5fa";
    return CORES[indice % CORES.length];
  }

  // Número de partículas de cada espécie. Escala linear: proporcional à
  // concentração (a mais abundante tem MAX). Escala logarítmica: proporcional
  // ao expoente, cobrindo 12 potências de 10 (cada 3 partículas = 10×), para
  // enxergar os íons raros (OH⁻ em meio ácido, por exemplo).
  const DECADAS = 12;
  function dados(tube, result = SIAB.chem.solve(tube), log = false) {
    const especies = SIAB.chem.species(tube, result);
    const maior = Math.max(...especies.map((e) => e.conc));
    return especies.map((e, i) => {
      let quantidade = maior > 0 ? Math.round((MAX * e.conc) / maior) : 0;
      if (log && maior > 0) {
        const relativo = Math.log10(e.conc / maior) + DECADAS; // 0 a 12
        quantidade =
          relativo > 0
            ? Math.max(1, Math.round((MAX * relativo) / DECADAS))
            : 0;
      }
      return { ...e, cor: corDa(e.formula, i), quantidade };
    });
  }

  // Pares conjugados que trocam próton no equilíbrio (ácido e base fracos, sistemas).
  function paresConjugados(tube) {
    const ids = [...SIAB.chem.base(tube).map((x) => x.id), tube.titrant];
    const pares = [];
    for (const id of new Set(ids)) {
      const s = SIAB.solutions[id];
      if (!s) continue;
      if (
        (s.kind === "weakAcid" || s.kind === "weakBase") &&
        s.acidForm &&
        s.baseForm
      )
        pares.push([s.acidForm, s.baseForm]);
      const familias = [...(s.systems || []), ...(s.model?.systems || [])].map(
        (x) => x.family,
      );
      for (const f of familias) {
        const nomes = SIAB.familySpecies?.[f] || [];
        for (let i = 0; i < nomes.length - 1; i++)
          pares.push([nomes[i], nomes[i + 1]]);
      }
    }
    return pares;
  }

  function html(
    tube,
    { nivel = "explorar", result = SIAB.chem.solve(tube) } = {},
  ) {
    const log = Boolean(SIAB.state.lupaLog);
    const lista = dados(tube, result, log);
    // Espécie em destaque (tocada na legenda, na Equação ou na Condução): as
    // outras partículas ficam apagadas. O seletor usa data-f, que acompanha a
    // partícula quando um próton pula no equilíbrio.
    const destacada = lista.some(
      (e) => e.formula === SIAB.state.destaque && e.quantidade > 0,
    )
      ? SIAB.state.destaque
      : null;
    const desenho = [];
    let posicao = 0;
    for (const especie of lista) {
      for (
        let k = 0;
        k < especie.quantidade && posicao < POSICOES.length;
        k++, posicao++
      ) {
        const [c, l, dx, dy] = POSICOES[posicao];
        const cx = 12 + c * 17.6 + dx * 6,
          cy = 12 + l * 17.6 + dy * 6;
        const f = SIAB.escape(especie.formula);
        if (especie.type === "solid") {
          desenho.push(
            `<rect class="particula solido" data-f="${f}" x="${cx - 6}" y="${cy - 6}" width="12" height="12" rx="2" fill="${especie.cor}"/>`,
          );
        } else {
          // Difusão: cada partícula passeia devagar por um caminho próprio.
          const passeio = `--dx1:${((dx - 0.5) * 8).toFixed(1)}px;--dy1:${((dy - 0.5) * 8).toFixed(1)}px;--dx2:${((0.5 - dy) * 7).toFixed(1)}px;--dy2:${((dx - 0.5) * 7).toFixed(1)}px;animation-duration:${(5.5 + 4 * dx).toFixed(1)}s;animation-delay:-${(9 * dy).toFixed(1)}s`;
          const carga = /⁺/.test(especie.formula)
            ? "+"
            : /⁻/.test(especie.formula)
              ? "−"
              : "";
          const r = especie.type === "molecule" ? 7 : 6;
          // Espectador: contorno vazado (está na solução, mas não troca prótons).
          const circulo = especie.espectador
            ? `<circle class="particula-corpo" cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="${especie.cor}" stroke-width="2.2"/>`
            : `<circle class="particula-corpo" cx="${cx}" cy="${cy}" r="${r}" fill="${especie.cor}" ${especie.type === "molecule" ? 'stroke="currentColor" stroke-width="1.5"' : ""}/>`;
          desenho.push(
            `<g class="particula${especie.espectador ? " espectador" : ""}" data-f="${f}" style="${passeio}">${circulo}${carga ? `<text class="${especie.espectador ? "carga-vazada" : ""}" x="${cx}" y="${cy + 3.5}" text-anchor="middle">${carga}</text>` : ""}</g>`,
          );
        }
      }
    }
    const legenda = lista
      .map((e) => {
        const numero =
          e.quantidade > 0
            ? `${e.quantidade} ${e.quantidade === 1 ? "partícula" : "partículas"}`
            : `traço (menos de 1 nesta escala${log ? "" : "; veja a escala logarítmica"})`;
        const conc =
          nivel === "calcular" ? ` · ${SIAB.cientifico(e.conc)} mol/L` : "";
        const tipo =
          e.type === "solid"
            ? "sólido"
            : e.type === "molecule"
              ? "molécula"
              : e.espectador
                ? "íon espectador"
                : "íon";
        const f = SIAB.escape(e.formula);
        return `<li><span class="legenda-cor ${e.type}${e.espectador ? " espectador" : ""}" style="${e.espectador ? `border-color:${e.cor}` : `background:${e.cor}`}" aria-hidden="true"></span><button type="button" class="especie-btn" data-acao="destacar" data-especie="${f}" aria-pressed="${destacada === e.formula}">${f}</button> <span class="small">${tipo} · ${numero}${conc}</span></li>`;
      })
      .join("");

    const inicial = SIAB.solutions[tube.solution];
    let destaque = "";
    if (inicial.kind === "weakAcid") {
      const alfa = SIAB.chem.alpha(inicial.ka, result.pH);
      const inteiras = Math.round((1 - alfa) / alfa);
      const proporcao =
        inteiras >= 2
          ? `para cada ${inteiras} moléculas de ${inicial.acidForm} inteiras, cerca de 1 se ionizou`
          : `cerca de ${SIAB.format(alfa * 100, 0)} de cada 100 moléculas de ${inicial.acidForm} estão ionizadas`;
      destaque = `<p class="lupa-destaque">Grau de ionização α ≈ ${SIAB.format(alfa * 100, 1)} %: ${proporcao}. O equilíbrio é dinâmico: prótons passam de ${inicial.acidForm} para ${inicial.baseForm} e voltam o tempo todo, e as quantidades não mudam.</p>`;
    } else if (inicial.kind === "strongAcid" && !tube.additions.length) {
      destaque = `<p class="lupa-destaque">Ácido forte: praticamente não sobra ${inicial.formula} inteiro. As moléculas se ionizaram em H₃O⁺ e ${inicial.anion}.</p>`;
    } else if (inicial.kind === "suspension") {
      destaque =
        '<p class="lupa-destaque">Quadrados: sólido não dissolvido. Ele dissolve à medida que o ácido consome OH⁻.</p>';
    }
    const presentes = new Set(
      lista.filter((e) => e.quantidade > 0).map((e) => e.formula),
    );
    const par = paresConjugados(tube).find(
      ([a, b]) => presentes.has(a) && presentes.has(b),
    );
    const descricao = lista
      .filter((e) => e.quantidade > 0)
      .map((e) => `${e.quantidade} ${e.formula}`)
      .join(", ");
    const escala = log
      ? `Escala logarítmica: cada ${MAX / DECADAS} partículas a menos = 10 vezes menos concentrada. Assim aparecem os íons raros.`
      : `Escala linear: a espécie mais abundante tem ${MAX} partículas.`;
    return `<div class="lupa">
      <div class="lupa-barra"><button type="button" class="lupa-escala" data-acao="lupa-escala" aria-pressed="${log}">Escala logarítmica</button></div>
      ${destacada ? `<style>.lupa-svg.com-destaque .particula[data-f="${SIAB.escape(destacada)}"] { opacity: 1; }</style>` : ""}
      <svg class="lupa-svg${destacada ? " com-destaque" : ""}" viewBox="0 0 320 180" role="img" aria-label="Partículas dissolvidas nesta escala: ${SIAB.escape(descricao)}.${destacada ? ` Em destaque: ${SIAB.escape(destacada)}.` : ""}"${par ? ` data-par="${SIAB.escape(JSON.stringify(par))}"` : ""}>${desenho.join("")}<g class="lupa-eventos"></g></svg>
      ${destacada ? `<p class="lupa-destacando">Em destaque: <strong>${SIAB.escape(destacada)}</strong>. Toque de novo no nome para ver todas.</p>` : ""}
      <p class="lupa-evento" aria-hidden="true"></p>
      ${destaque}
      <ul class="lupa-legenda">${legenda}</ul>
      <p class="field-hint">${escala} Contorno vazado: íon espectador. Toque num nome para destacar suas partículas. Moléculas de água não aparecem: há cerca de 55,5 mol/L delas, muito mais que o soluto.</p>
    </div>`;
  }

  /* Acontecimentos na lupa (com "Reduzir animações", nada se move).
     reagir: depois de gotas, partículas do conta-gotas entram e reagem com as
     do recipiente (H₃O⁺ + OH⁻ → 2 H₂O, ou a transferência de próton para uma
     base fraca). equilibrio: num par conjugado (HA / A⁻), de tempos em tempos
     um próton passa de uma partícula para a outra, e as quantidades ficam
     iguais: o equilíbrio é dinâmico. */
  const NS = "http://www.w3.org/2000/svg";
  const semMovimento = () => {
    const e = window.A11Y?.estado || {};
    return (
      e.motion ||
      e.reading === "on" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  };
  const centro = (el) => {
    const c = el.querySelector("circle, rect") || el;
    return el.tagName === "rect"
      ? [Number(el.getAttribute("x")) + 6, Number(el.getAttribute("y")) + 6]
      : [Number(c.getAttribute("cx")), Number(c.getAttribute("cy"))];
  };
  function particulaSolta(pai, x, y, cor, rotulo, classe = "") {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", `evento ${classe}`);
    g.innerHTML = `<circle r="6.5" fill="${cor}"/><text y="-9" text-anchor="middle" class="evento-rotulo">${rotulo}</text>`;
    g.style.transform = `translate(${x}px, ${y}px)`;
    pai.append(g);
    return g;
  }

  // Reação das gotas que acabaram de cair: até 3 encontros visíveis.
  function reagir(caixa, tube) {
    const svg = caixa?.querySelector(".lupa-svg");
    if (!svg || semMovimento() || !svg.animate) return;
    const gota = SIAB.solutions[tube.titrant];
    if (!gota) return;
    let entra, corEntra, alvos, produto, texto;
    const acha = (f) => [
      ...svg.querySelectorAll(`.particula[data-f="${CSS.escape(f)}"]`),
    ];
    // Com ácido (ou base) fraco no recipiente, a reação principal é com a
    // molécula (há muito mais HA que H₃O⁺); com ácido forte, com o H₃O⁺.
    const fraco = SIAB.solutions[tube.solution];
    if (gota.kind === "strongBase" || gota.kind === "suspension") {
      entra = "OH⁻";
      corEntra = "#60a5fa";
      alvos = fraco?.kind === "weakAcid" ? acha(fraco.acidForm) : [];
      if (alvos.length) {
        produto = [fraco.baseForm, "H₂O"];
        texto = `${fraco.acidForm} + OH⁻ → ${fraco.baseForm} + H₂O`;
      } else {
        alvos = acha("H₃O⁺");
        produto = ["H₂O", "H₂O"];
        texto = "H₃O⁺ + OH⁻ → 2 H₂O";
      }
    } else if (gota.kind === "strongAcid") {
      entra = "H₃O⁺";
      corEntra = "#f87171";
      alvos = fraco?.kind === "weakBase" ? acha(fraco.baseForm) : [];
      if (alvos.length) {
        produto = [fraco.acidForm, "H₂O"];
        texto = `H₃O⁺ + ${fraco.baseForm} → ${fraco.acidForm} + H₂O`;
      } else {
        alvos = acha("OH⁻");
        produto = ["H₂O", "H₂O"];
        texto = "H₃O⁺ + OH⁻ → 2 H₂O";
      }
    } else return;
    if (!alvos.length) return;
    const camada = svg.querySelector(".lupa-eventos");
    const legenda = caixa.querySelector(".lupa-evento");
    if (legenda) {
      legenda.textContent = texto;
      legenda.animate(
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { opacity: 1, offset: 0.8 },
          { opacity: 0 },
        ],
        { duration: 2600, fill: "forwards" },
      );
    }
    alvos.slice(0, 3).forEach((alvo, i) => {
      const [x, y] = centro(alvo);
      const atraso = i * 260;
      const p = particulaSolta(camada, x + (i - 1) * 14, -10, corEntra, entra);
      p.animate(
        [
          { transform: `translate(${x + (i - 1) * 14}px, -10px)` },
          { transform: `translate(${x}px, ${y}px)` },
        ],
        {
          duration: 700,
          delay: atraso,
          easing: "cubic-bezier(.4, 0, .6, 1)",
          fill: "forwards",
        },
      ).onfinish = () => {
        p.remove();
        alvo.animate(
          [{ opacity: 1 }, { opacity: 0 }, { opacity: 0 }, { opacity: 1 }],
          { duration: 1500 },
        );
        // O produto aparece no lugar do encontro e se afasta.
        produto.forEach((f, k) => {
          const h = particulaSolta(
            camada,
            x,
            y,
            f === "H₂O" ? "#cbd5e1" : "#e879f9",
            f,
            "produto",
          );
          h.animate(
            [
              { transform: `translate(${x}px, ${y}px) scale(.4)`, opacity: 1 },
              {
                transform: `translate(${x + (k ? 18 : -18)}px, ${y - 12}px) scale(1)`,
                opacity: 1,
                offset: 0.5,
              },
              {
                transform: `translate(${x + (k ? 26 : -26)}px, ${y - 18}px) scale(1)`,
                opacity: 0,
              },
            ],
            { duration: 1300, easing: "ease-out", fill: "forwards" },
          ).onfinish = () => h.remove();
        });
      };
    });
  }

  // Equilíbrio dinâmico: um próton pula de HA para A⁻ (e as duas trocam de papel).
  let relogio = null;
  function equilibrio(caixa) {
    clearInterval(relogio);
    const svg = caixa?.querySelector(".lupa-svg[data-par]");
    if (!svg || semMovimento() || !svg.animate) return;
    const [acido, base] = JSON.parse(svg.dataset.par);
    relogio = setInterval(() => {
      if (!svg.isConnected || document.hidden) {
        if (!svg.isConnected) clearInterval(relogio);
        return;
      }
      const as = [
        ...svg.querySelectorAll(`.particula[data-f="${CSS.escape(acido)}"]`),
      ];
      const bs = [
        ...svg.querySelectorAll(`.particula[data-f="${CSS.escape(base)}"]`),
      ];
      if (!as.length || !bs.length) return;
      const a = as[Math.floor(Math.random() * as.length)],
        b = bs[Math.floor(Math.random() * bs.length)];
      const [x1, y1] = centro(a),
        [x2, y2] = centro(b);
      const proton = document.createElementNS(NS, "circle");
      proton.setAttribute("r", "2.6");
      proton.setAttribute("class", "proton");
      svg.querySelector(".lupa-eventos").append(proton);
      proton.animate(
        [
          { transform: `translate(${x1}px, ${y1}px)` },
          {
            transform: `translate(${(x1 + x2) / 2}px, ${Math.min(y1, y2) - 16}px)`,
            offset: 0.5,
          },
          { transform: `translate(${x2}px, ${y2}px)` },
        ],
        { duration: 900, easing: "ease-in-out", fill: "forwards" },
      ).onfinish = () => {
        proton.remove();
        // HA perdeu o próton (virou A⁻) e A⁻ ganhou (virou HA): troca de aparência e de papel.
        const tmp = a.innerHTML;
        a.innerHTML = b.innerHTML
          .replace(/cx="[^"]*" cy="[^"]*"/, `cx="${x1}" cy="${y1}"`)
          .replace(/x="[^"]*" y="[^"]*"/, `x="${x1}" y="${y1 + 3.5}"`);
        b.innerHTML = tmp
          .replace(/cx="[^"]*" cy="[^"]*"/, `cx="${x2}" cy="${y2}"`)
          .replace(/x="[^"]*" y="[^"]*"/, `x="${x2}" y="${y2 + 3.5}"`);
        a.dataset.f = base;
        b.dataset.f = acido;
      };
    }, 2400);
  }

  // A lupa está à vista? (aba Partículas liberada e pH revelado, ou missão)
  const disponivel = () =>
    SIAB.bancada.config.ver.includes("particulas") &&
    (SIAB.state.showPH || SIAB.bancada.config.modo === "missao");

  return { html, dados, reagir, equilibrio, disponivel };
})();
