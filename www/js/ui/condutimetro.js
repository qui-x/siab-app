"use strict";
/* Painel VER → Condução: teste de condução elétrica e condutímetro.
   - Lâmpada: acende mais quanto mais a solução conduz (escala logarítmica,
     como a corrente), o teste clássico de eletrólitos da escola.
   - Leitura do condutímetro (µS/cm ou mS/cm) e "quem carrega a corrente":
     a parte de cada íon, com as mesmas cores da lupa de partículas.
   - Curva de titulação condutométrica: κ × volume, com a equivalência.
   - Módulo Calcular: a conta da lei de Kohlrausch, íon por íon.
   Os valores vêm de SIAB.condutividade (js/simulation/condutividade.js). */
SIAB.condutimetro = (() => {
  const W = 340,
    H = 200,
    M = { left: 44, right: 12, top: 14, bottom: 34 };
  const largura = W - M.left - M.right,
    altura = H - M.top - M.bottom;
  const FRASES = {
    forte: "Lâmpada acesa forte: muitos íons carregam a corrente.",
    fraca: "Lâmpada acesa fraca: há poucos íons (ou íons lentos).",
    apagada: "Lâmpada quase apagada: quase não há íons livres.",
  };

  // Leitura como num condutímetro de verdade: troca de µS/cm para mS/cm sozinho.
  function formatar(k) {
    if (k >= 1000) return `${SIAB.format(k / 1000, 2)} mS/cm`;
    return `${SIAB.format(k, k >= 10 ? 0 : 2)} µS/cm`;
  }

  function lampada(kappa) {
    const b = SIAB.condutividade.brilho(kappa);
    const estado = SIAB.condutividade.lampada(kappa);
    return `<svg class="cond-lampada" viewBox="0 0 64 84" role="img" aria-label="${FRASES[estado]}">
      <defs><radialGradient id="cond-halo"><stop offset="0" stop-color="#fde68a" stop-opacity=".95"/><stop offset=".55" stop-color="#fbbf24" stop-opacity=".35"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient></defs>
      <circle cx="32" cy="27" r="31" fill="url(#cond-halo)" style="opacity:${b.toFixed(2)}"/>
      <path class="cond-bulbo" d="M32 5a20 20 0 0 0-12 36c3 2.5 4.5 5.2 4.5 8.5h15c0-3.3 1.5-6 4.5-8.5A20 20 0 0 0 32 5Z" style="fill:rgba(253,230,138,${(0.08 + 0.82 * b).toFixed(2)})"/>
      <path class="cond-filamento${b > 0.05 ? " aceso" : ""}" d="M27 49V38l2.5-6 2.5 5 2.5-5 2.5 6v11"/>
      <rect class="cond-rosca" x="24.5" y="50" width="15" height="11" rx="2"/>
      <path class="cond-rosca-linha" d="M24.5 54h15M24.5 57.5h15"/>
      <path class="cond-fio" d="M29 61v8h-10v12M35 61v8h10v12"/>
    </svg>`;
  }

  // Barra "quem carrega a corrente": fração de κ de cada íon.
  function barra(medida, cores, ligar = false) {
    if (!(medida.kappa > 0)) return "";
    const grandes = medida.ions.filter((x) => x.contrib / medida.kappa >= 0.01);
    const resto = medida.kappa - grandes.reduce((sum, x) => sum + x.contrib, 0);
    const partes = [
      ...grandes.map((x) => ({
        nome: x.formula,
        fracao: x.contrib / medida.kappa,
        cor: cores.get(x.formula) || "var(--muted)",
        vazado: x.espectador,
      })),
      ...(resto / medida.kappa >= 0.005
        ? [
            {
              nome: "outros",
              fracao: resto / medida.kappa,
              cor: "var(--muted)",
            },
          ]
        : []),
    ];
    const pct = (f) => `${SIAB.format(100 * f, f < 0.1 ? 1 : 0)} %`;
    return `<div class="cond-quem">
      <p class="cond-subtitulo">Quem carrega a corrente</p>
      <div class="cond-barra" role="img" aria-label="Parte da condutividade de cada íon: ${partes.map((p) => `${p.nome} ${pct(p.fracao)}`).join(", ")}.">
        ${partes.map((p) => `<span style="flex-grow:${p.fracao.toFixed(4)};background:${p.cor}"${p.vazado ? ' class="vazado"' : ""}></span>`).join("")}
      </div>
      <ul class="cond-legenda">${partes.map((p) => `<li><span class="legenda-cor${p.vazado ? " espectador" : ""}" style="${p.vazado ? `border-color:${p.cor}` : `background:${p.cor}`}" aria-hidden="true"></span>${ligar && p.nome !== "outros" ? `<button type="button" class="especie-btn" data-acao="destacar" data-especie="${SIAB.escape(p.nome)}" title="Ver ${SIAB.escape(p.nome)} na lupa">${SIAB.escape(p.nome)}</button>` : SIAB.escape(p.nome)} <b>${pct(p.fracao)}</b></li>`).join("")}</ul>
    </div>`;
  }

  // Curva de titulação condutométrica.
  function curva(tube, r) {
    const pontos = SIAB.condutividade.serie(tube);
    const eq = r.equivalenceVolume;
    const ultimo = pontos.at(-1).v;
    const xMax =
      Math.max(
        ultimo * 1.1,
        eq ? Math.min(SIAB.capacidade(tube) - tube.initialVolume, eq * 1.6) : 0,
      ) || 1;
    const kMax = Math.max(...pontos.map((p) => p.k)) * 1.1 || 1;
    const mili = kMax >= 1000,
      fator = mili ? 1000 : 1,
      unidade = mili ? "mS/cm" : "µS/cm";
    const topo = kMax / fator;
    const passoY =
      [
        0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
      ].find((p) => topo / p <= 5) || 1000;
    const x = (v) => M.left + (v / xMax) * largura;
    const y = (k) => M.top + (1 - Math.min(1, k / kMax)) * altura;
    const partes = [];
    for (let k = 0; k <= topo + 1e-9; k += passoY) {
      partes.push(
        `<path class="grafico-grade" d="M${M.left} ${y(k * fator).toFixed(1)}H${W - M.right}"/><text class="grafico-rotulo" x="${M.left - 6}" y="${(y(k * fator) + 4).toFixed(1)}" text-anchor="end">${SIAB.format(k, passoY < 0.1 ? 2 : passoY < 1 ? 1 : 0)}</text>`,
      );
    }
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
    partes.push(
      `<text class="grafico-eixo" x="11" y="${M.top + altura / 2}" transform="rotate(-90 11 ${M.top + altura / 2})" text-anchor="middle">κ (${unidade})</text>`,
    );
    const eqs = r.equivalencias.filter((v) => v <= xMax);
    eqs.forEach((v, i) =>
      partes.push(
        `<path class="grafico-equivalencia" d="M${x(v).toFixed(1)} ${M.top}V${M.top + altura}"/><text class="grafico-legenda" x="${(x(v) + 4).toFixed(1)}" y="${M.top + 10 + (i % 2) * 11}">${eqs.length > 1 ? `${i + 1}ª equivalência` : "equivalência"}</text>`,
      ),
    );
    partes.push(
      `<polyline class="grafico-linha cond-linha" points="${pontos.map((p) => `${x(p.v).toFixed(1)},${y(p.k).toFixed(1)}`).join(" ")}"/>`,
    );
    const final = pontos.at(-1);
    partes.push(
      `<circle class="grafico-ponto" cx="${x(final.v).toFixed(1)}" cy="${y(final.k).toFixed(1)}" r="4"/>`,
    );
    const menor = pontos.reduce((a, b) => (b.k < a.k ? b : a));
    const temVale = menor !== pontos[0] && menor !== final;
    const descricao = `Curva de condutividade: de ${formatar(pontos[0].k)} até ${formatar(final.k)} depois de ${SIAB.format(final.v)} mL adicionados.${temVale ? ` Menor valor com ${SIAB.format(menor.v)} mL.` : ""}${eq !== null ? ` Equivalência em ${SIAB.format(eq)} mL.` : ""}`;
    return `<svg class="grafico-svg cond-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${descricao}"><title>${descricao}</title>${partes.join("")}</svg>`;
  }

  // Conta da lei de Kohlrausch, íon por íon (módulo Calcular).
  function tabela(medida) {
    const linhas = medida.ions
      .filter((x) => x.contrib >= medida.kappa * 1e-4)
      .slice(0, 8);
    const cient = (v) => SIAB.cientifico(v);
    return `<table class="cond-tabela"><caption>κ = Σ λ° · c (lei de Kohlrausch, 25 °C)</caption>
      <thead><tr><th scope="col">Íon</th><th scope="col">c (mol/L)</th><th scope="col">λ° (S·cm²/mol)</th><th scope="col">λ° · c (µS/cm)</th></tr></thead>
      <tbody>${linhas.map((x) => `<tr><th scope="row">${SIAB.escape(x.formula)}</th><td>${cient(x.conc)}</td><td>${x.estimado ? "≈ " : ""}${SIAB.format(x.lambda, 1)}</td><td>${SIAB.format(x.contrib, x.contrib >= 10 ? 0 : 2)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><th scope="row" colspan="3">κ total</th><td>${SIAB.format(medida.kappa, medida.kappa >= 10 ? 0 : 2)}</td></tr></tfoot>
    </table>`;
  }

  function html(
    tube,
    { nivel = "explorar", result = SIAB.chem.solve(tube) } = {},
  ) {
    const medida = SIAB.condutividade.medir(tube, result);
    const estado = SIAB.condutividade.lampada(medida.kappa);
    const cores = new Map(
      SIAB.lupa.dados(tube, result).map((e) => [e.formula, e.cor]),
    );
    const estimado = medida.ions.some(
      (x) => x.estimado && x.contrib / medida.kappa >= 0.01,
    );
    return `<div class="cond-topo">
        ${lampada(medida.kappa)}
        <div class="cond-leitura">
          <span class="eyebrow">Condutividade</span>
          <strong>${estimado ? "≈ " : ""}${formatar(medida.kappa)}</strong>
          <span>${FRASES[estado]}</span>
        </div>
      </div>
      ${barra(medida, cores, SIAB.lupa.disponivel())}
      ${tube.additions.length ? curva(tube, result) : '<p class="field-hint">Adicione gotas para desenhar a curva de condutividade.</p>'}
      <p class="field-hint">H₃O⁺ e OH⁻ conduzem muito mais que os outros íons (o próton salta entre moléculas de água): por isso a curva muda de rumo na equivalência, sem precisar de indicador.</p>
      ${nivel === "calcular" ? tabela(medida) : ""}
      ${nivel !== "explorar" ? '<p class="field-hint">Valores ideais (diluição infinita): acima de 0,01 mol/L, o medido no laboratório é um pouco menor.</p>' : ""}`;
  }

  return { html, formatar, curva };
})();
