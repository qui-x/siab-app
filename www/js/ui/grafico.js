"use strict";
/* Gráfico de titulação ao vivo (M5): pH × volume adicionado, em SVG.
   Camadas: região tampão, faixa de viragem do indicador, equivalência,
   meia-equivalência e o ponto final observado (onde a cor mudou).
   No módulo Calcular há mais duas vistas: a derivada ΔpH/ΔV (o pico marca a
   equivalência) e o diagrama de distribuição das espécies (α × pH). */
SIAB.grafico = (() => {
  const W = 340,
    H = 230,
    M = { left: 38, right: 12, top: 14, bottom: 34 };
  const largura = W - M.left - M.right,
    altura = H - M.top - M.bottom;

  // Pontos (volume, pH) a cada gota já adicionada. O pH só depende do volume
  // total gotejado, então cada ponto usa uma "gota" com a soma (rápido mesmo
  // com centenas de gotas num erlenmeyer grande).
  function serie(tube) {
    const pontos = [];
    let soma = 0;
    for (let i = 0; i <= tube.additions.length; i++) {
      if (i > 0) soma += tube.additions[i - 1];
      pontos.push({
        v: soma,
        pH: SIAB.chem.solve({ ...tube, additions: soma > 0 ? [soma] : [] }).pH,
      });
    }
    return pontos;
  }

  // Curva teórica completa até um volume máximo (usada ao fim do desafio).
  function curvaTeorica(tube, maxVolume, passo) {
    const pontos = [];
    for (let v = 0; v <= maxVolume + 1e-9; v += passo) {
      pontos.push({
        v,
        pH: SIAB.chem.solve({ ...tube, additions: v > 0 ? [v] : [] }).pH,
      });
    }
    return pontos;
  }

  function svg(
    tube,
    {
      pontos = serie(tube),
      teorica = null,
      maxVolume = null,
      mostrarMarcas = true,
      paradaVolume = null,
      pontoFinal = null,
      nivel = "medir",
    } = {},
  ) {
    const r = SIAB.chem.solve(tube);
    const eq = r.equivalenceVolume;
    const ultimo = pontos.at(-1)?.v || 0;
    const xMax =
      maxVolume ||
      Math.max(
        1,
        ultimo * 1.1,
        eq ? Math.min(SIAB.capacidade(tube) - tube.initialVolume, eq * 1.6) : 0,
      );
    const x = (v) => M.left + (v / xMax) * largura;
    const y = (pH) => M.top + (1 - Math.max(0, Math.min(14, pH)) / 14) * altura;
    const partes = [];

    // Grade e eixos.
    for (let pH = 0; pH <= 14; pH += 2) {
      partes.push(
        `<path class="grafico-grade" d="M${M.left} ${y(pH)}H${W - M.right}"/><text class="grafico-rotulo" x="${M.left - 6}" y="${y(pH) + 4}" text-anchor="end">${pH}</text>`,
      );
    }
    const passoX =
      [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].find((p) => xMax / p <= 7) || 100;
    for (let v = 0; v <= xMax + 1e-9; v += passoX) {
      partes.push(
        `<text class="grafico-rotulo" x="${x(v)}" y="${H - M.bottom + 16}" text-anchor="middle">${SIAB.format(v, passoX < 1 ? 1 : 0)}</text>`,
      );
    }
    partes.push(
      `<text class="grafico-eixo" x="${M.left + largura / 2}" y="${H - 4}" text-anchor="middle">volume adicionado (mL)</text>`,
    );
    partes.push(
      `<text class="grafico-eixo" x="10" y="${M.top + altura / 2}" transform="rotate(-90 10 ${M.top + altura / 2})" text-anchor="middle">pH</text>`,
    );

    // Meias-etapas (ácido ou base fraca; cada etapa de um poliprótico): no meio
    // de cada etapa, pH ≈ pKa. Só as que valem de verdade: com um ácido quase
    // forte ou muito diluído, o pH ali se afasta do pKa, e a marca não aparece.
    const meias = mostrarMarcas
      ? (r.meias || [])
          .map((m) => ({
            ...m,
            pH: SIAB.chem.solve({ ...tube, additions: [m.v] }).pH,
          }))
          .filter((m) => Math.abs(m.pH - m.pKa) < 0.2 && m.inicio < xMax)
      : [];
    // Região tampão: entre 1/11 e 10/11 de cada etapa, a razão base/ácido
    // conjugado vai de 0,1 a 10, isto é, pH = pKa ± 1.
    meias.forEach((m) => {
      const d = m.fim - m.inicio,
        v1 = m.inicio + d / 11,
        v2 = Math.min(m.inicio + (d * 10) / 11, xMax);
      const rotulo =
        meias.length > 1
          ? "tampão"
          : `região tampão${nivel === "explorar" ? "" : " (pH = pKa ± 1)"}`;
      partes.push(
        `<rect class="grafico-tampao" x="${x(v1).toFixed(1)}" y="${M.top}" width="${(x(v2) - x(v1)).toFixed(1)}" height="${altura}"/><text class="grafico-legenda" x="${((x(v1) + x(v2)) / 2).toFixed(1)}" y="${M.top + altura - 6}" text-anchor="middle">${rotulo}</text>`,
      );
    });
    // Faixa de viragem do indicador escolhido.
    const ind = SIAB.indicators[tube.indicator];
    if (mostrarMarcas && ind && ind.acid && ind.base) {
      const cor = `rgb(${ind.middle.join(",")})`;
      partes.push(
        `<rect class="grafico-faixa" x="${M.left}" y="${y(ind.high)}" width="${largura}" height="${y(ind.low) - y(ind.high)}" fill="${cor}"/>`,
      );
      partes.push(
        `<text class="grafico-legenda" x="${W - M.right - 4}" y="${y(ind.high) - 3}" text-anchor="end">viragem: ${SIAB.escape(ind.short)}</text>`,
      );
    }
    // Neutro na temperatura do tubo.
    partes.push(
      `<path class="grafico-neutro" d="M${M.left} ${y(r.neutralPH)}H${W - M.right}"/>`,
    );

    // Equivalências: uma linha por etapa (H₃PO₄ e Na₂CO₃ têm duas).
    const eqs = mostrarMarcas ? r.equivalencias.filter((v) => v <= xMax) : [];
    eqs.forEach((v, i) => {
      partes.push(
        `<path class="grafico-equivalencia" d="M${x(v).toFixed(1)} ${M.top}V${M.top + altura}"/><text class="grafico-legenda" x="${(x(v) + 4).toFixed(1)}" y="${M.top + 10 + (i % 2) * 11}">${eqs.length > 1 ? `${i + 1}ª equivalência` : "equivalência"}</text>`,
      );
    });
    meias.forEach((m) => {
      partes.push(
        `<circle class="grafico-meia" cx="${x(m.v).toFixed(1)}" cy="${y(m.pH).toFixed(1)}" r="4"/><text class="grafico-legenda" x="${(x(m.v) + 6).toFixed(1)}" y="${(y(m.pH) + 14).toFixed(1)}">pH = ${m.rotulo}</text>`,
      );
    });
    if (paradaVolume !== null) {
      partes.push(
        `<path class="grafico-parada" d="M${x(paradaVolume)} ${M.top}V${M.top + altura}"/><text class="grafico-legenda" x="${x(paradaVolume) - 4}" y="${M.top + 24}" text-anchor="end">você parou</text>`,
      );
    }
    // Ponto final observado: a gota em que a cor do indicador mudou.
    if (pontoFinal && pontoFinal.volume <= xMax) {
      const pHpf = SIAB.chem.solve({
        ...tube,
        additions: [pontoFinal.volume],
      }).pH;
      const px = x(pontoFinal.volume),
        py = y(pHpf);
      partes.push(
        `<path class="grafico-pf" d="M${px.toFixed(1)} ${(py - 6).toFixed(1)}l5 6-5 6-5-6Z"/><text class="grafico-legenda" x="${(px - 8).toFixed(1)}" y="${(py + 3).toFixed(1)}" text-anchor="end">ponto final (cor)</text>`,
      );
    }
    if (teorica) {
      partes.push(
        `<polyline class="grafico-teorica" points="${teorica.map((p) => `${x(p.v)},${y(p.pH)}`).join(" ")}"/>`,
      );
    }
    partes.push(
      `<polyline class="grafico-linha" points="${pontos.map((p) => `${x(p.v)},${y(p.pH)}`).join(" ")}"/>`,
    );
    const final = pontos.at(-1);
    if (final)
      partes.push(
        `<circle class="grafico-ponto" cx="${x(final.v)}" cy="${y(final.pH)}" r="4"/>`,
      );

    const descricao =
      pontos.length > 1
        ? `Curva de titulação: pH de ${SIAB.format(pontos[0].pH)} até ${SIAB.format(final.pH)} depois de ${SIAB.format(final.v)} mL adicionados.${r.equivalencias.length > 1 ? ` Equivalências em ${r.equivalencias.map((v) => SIAB.format(v)).join(" e ")} mL.` : eq !== null ? ` Equivalência em ${SIAB.format(eq)} mL.` : ""}${pontoFinal ? ` Ponto final observado (a cor mudou) em ${SIAB.format(pontoFinal.volume)} mL.` : ""}`
        : `Curva de titulação ainda sem gotas. pH inicial ${SIAB.format(pontos[0]?.pH ?? r.pH)}.`;
    return `<svg class="grafico-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${descricao}"><title>${descricao}</title>${partes.join("")}</svg>`;
  }

  // Eixo vertical com números redondos (até 5 divisões).
  function passoRedondo(maximo) {
    return (
      [
        0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
        1000,
      ].find((p) => maximo / p <= 5) || 2000
    );
  }
  function eixoVolume(xMax, x, partes) {
    const passoX =
      [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].find((p) => xMax / p <= 7) || 100;
    for (let v = 0; v <= xMax + 1e-9; v += passoX) {
      partes.push(
        `<text class="grafico-rotulo" x="${x(v).toFixed(1)}" y="${H - M.bottom + 16}" text-anchor="middle">${SIAB.format(v, passoX < 1 ? 1 : 0)}</text>`,
      );
    }
    partes.push(
      `<text class="grafico-eixo" x="${M.left + largura / 2}" y="${H - 4}" text-anchor="middle">volume adicionado (mL)</text>`,
    );
  }

  // Derivada: |ΔpH/ΔV| entre gotas seguidas, como o aluno calcula com a
  // tabela do histórico. O pico fica na equivalência (onde a curva é mais
  // íngreme). Com muitas gotas, os intervalos são somados em até 240 barras.
  function derivada(tube) {
    const pontos = serie(tube);
    if (pontos.length < 3) return null;
    const r = SIAB.chem.solve(tube),
      eq = r.equivalenceVolume;
    const grupo = Math.max(1, Math.ceil((pontos.length - 1) / 240));
    const barras = [];
    for (let i = 0; i < pontos.length - 1; i += grupo) {
      const a = pontos[i],
        b = pontos[Math.min(i + grupo, pontos.length - 1)];
      if (b.v > a.v)
        barras.push({
          v0: a.v,
          v1: b.v,
          d: Math.abs(b.pH - a.pH) / (b.v - a.v),
        });
    }
    const ultimo = pontos.at(-1).v;
    const xMax =
      Math.max(
        ultimo * 1.1,
        eq ? Math.min(SIAB.capacidade(tube) - tube.initialVolume, eq * 1.6) : 0,
      ) || 1;
    const dMax = Math.max(...barras.map((b) => b.d)) * 1.1 || 1;
    const x = (v) => M.left + (v / xMax) * largura;
    const y = (d) => M.top + (1 - Math.min(1, d / dMax)) * altura;
    const partes = [];
    const passoY = passoRedondo(dMax);
    for (let d = 0; d <= dMax + 1e-9; d += passoY) {
      partes.push(
        `<path class="grafico-grade" d="M${M.left} ${y(d).toFixed(1)}H${W - M.right}"/><text class="grafico-rotulo" x="${M.left - 6}" y="${(y(d) + 4).toFixed(1)}" text-anchor="end">${SIAB.format(d, passoY < 0.1 ? 2 : passoY < 1 ? 1 : 0)}</text>`,
      );
    }
    eixoVolume(xMax, x, partes);
    partes.push(
      `<text class="grafico-eixo" x="10" y="${M.top + altura / 2}" transform="rotate(-90 10 ${M.top + altura / 2})" text-anchor="middle">|ΔpH/ΔV| (por mL)</text>`,
    );
    const eqs = r.equivalencias.filter((v) => v <= xMax);
    eqs.forEach((v, i) =>
      partes.push(
        `<path class="grafico-equivalencia" d="M${x(v).toFixed(1)} ${M.top}V${M.top + altura}"/><text class="grafico-legenda" x="${(x(v) + 4).toFixed(1)}" y="${M.top + 10 + (i % 2) * 11}">${eqs.length > 1 ? `${i + 1}ª equivalência` : "equivalência"}</text>`,
      ),
    );
    partes.push(
      ...barras.map(
        (b) =>
          `<rect class="grafico-barra" x="${x(b.v0).toFixed(2)}" y="${y(b.d).toFixed(1)}" width="${Math.max(0.6, x(b.v1) - x(b.v0) - 0.3).toFixed(2)}" height="${(M.top + altura - y(b.d)).toFixed(1)}"/>`,
      ),
    );
    const pico = barras.reduce((p, q) => (q.d > p.d ? q : p));
    const vPico = (pico.v0 + pico.v1) / 2;
    const descricao = `Derivada da curva de titulação: maior variação de pH, ${SIAB.format(pico.d, 1)} por mL, perto de ${SIAB.format(vPico)} mL.${eq !== null ? ` Equivalência calculada em ${SIAB.format(eq)} mL.` : ""}`;
    return {
      svg: `<svg class="grafico-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${descricao}"><title>${descricao}</title>${partes.join("")}</svg>`,
      pico: vPico,
    };
  }

  // Diagrama de distribuição: fração α de cada espécie do sistema ácido-base
  // principal do recipiente em função do pH, com o pH de agora marcado.
  // As espécies se cruzam em α = 0,5 quando pH = pKa.
  function distribuicao(tube, r = SIAB.chem.solve(tube)) {
    const sis = SIAB.chem.sistemas(tube)[0];
    if (!sis) return null;
    const dadosLupa = SIAB.lupa.dados(tube, r);
    const cores = new Map(dadosLupa.map((e) => [e.formula, e.cor]));
    const presentes = new Set(
      SIAB.lupa.disponivel()
        ? dadosLupa.filter((e) => e.quantidade > 0).map((e) => e.formula)
        : [],
    );
    const PALETA = ["#e879f9", "#34d399", "#fbbf24", "#22d3ee"];
    const cor = (nome, i) => cores.get(nome) || PALETA[i % PALETA.length];
    const x = (pH) => M.left + (pH / 14) * largura;
    const y = (a) => M.top + (1 - a) * altura;
    const partes = [];
    for (let a = 0; a <= 1.0001; a += 0.25)
      partes.push(
        `<path class="grafico-grade" d="M${M.left} ${y(a).toFixed(1)}H${W - M.right}"/><text class="grafico-rotulo" x="${M.left - 6}" y="${(y(a) + 4).toFixed(1)}" text-anchor="end">${SIAB.format(a, 2)}</text>`,
      );
    for (let pH = 0; pH <= 14; pH += 2)
      partes.push(
        `<text class="grafico-rotulo" x="${x(pH).toFixed(1)}" y="${H - M.bottom + 16}" text-anchor="middle">${pH}</text>`,
      );
    partes.push(
      `<text class="grafico-eixo" x="${M.left + largura / 2}" y="${H - 4}" text-anchor="middle">pH</text>`,
    );
    partes.push(
      `<text class="grafico-eixo" x="10" y="${M.top + altura / 2}" transform="rotate(-90 10 ${M.top + altura / 2})" text-anchor="middle">fração α</text>`,
    );
    sis.pKa
      .filter((pk) => pk > 0 && pk < 14)
      .forEach((pk) =>
        partes.push(
          `<path class="grafico-pka" d="M${x(pk).toFixed(1)} ${M.top}V${M.top + altura}"/><text class="grafico-legenda" x="${(x(pk) + 3).toFixed(1)}" y="${M.top + altura - 4}">pKa ${SIAB.format(pk, 2)}</text>`,
        ),
      );
    sis.nomes.forEach((nome, i) => {
      const pts = [];
      for (let k = 0; k <= 140; k++)
        pts.push(
          `${x(k / 10).toFixed(1)},${y(SIAB.chem.fractions(k / 10, sis.pKa)[i]).toFixed(1)}`,
        );
      partes.push(
        `<polyline class="grafico-especie" points="${pts.join(" ")}" style="stroke:${cor(nome, i)}"/>`,
      );
    });
    const agora = Math.max(0, Math.min(14, r.pH));
    const fr = SIAB.chem.fractions(agora, sis.pKa);
    partes.push(
      `<path class="grafico-agora" d="M${x(agora).toFixed(1)} ${M.top}V${M.top + altura}"/><text class="grafico-legenda" x="${(x(agora) + 3).toFixed(1)}" y="${M.top + 10}">pH agora</text>`,
    );
    fr.forEach((a, i) =>
      partes.push(
        `<circle class="grafico-ponto-especie" cx="${x(agora).toFixed(1)}" cy="${y(a).toFixed(1)}" r="3.5" style="fill:${cor(sis.nomes[i], i)}"/>`,
      ),
    );
    const lista = sis.nomes.map((nome, i) => ({
      nome,
      a: fr[i],
      cor: cor(nome, i),
    }));
    const pct = (a) => `${SIAB.format(100 * a, a < 0.1 ? 1 : 0)} %`;
    const descricao = `Diagrama de distribuição: fração de cada espécie em função do pH. No pH ${SIAB.format(agora)}: ${lista.map((e) => `${e.nome} ${pct(e.a)}`).join(", ")}.`;
    return `<svg class="grafico-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${descricao}"><title>${descricao}</title>${partes.join("")}</svg>
      <ul class="cond-legenda grafico-especies">${lista
        .map((e) => {
          const f = SIAB.escape(e.nome),
            naLupa = presentes.has(e.nome);
          return `<li><span class="legenda-cor" style="background:${e.cor}" aria-hidden="true"></span>${naLupa ? `<button type="button" class="especie-btn" data-acao="destacar" data-especie="${f}" title="Ver ${f} na lupa">${f}</button>` : f} <b>${pct(e.a)}</b></li>`;
        })
        .join("")}</ul>`;
  }

  return { svg, serie, curvaTeorica, derivada, distribuicao };
})();
