"use strict";
/* Somente apresentação: cada grupo conserva os índices e os registros brutos.
   Gráficos, derivadas e CSV nunca consomem esta agregação. */
SIAB.medicoes = (() => {
  const resolution = Object.freeze({
    fita: {
      resolucao: 1,
      tolerancia: 0,
      casas: 0,
      nome: "Fita de pH",
      unidade: "pH",
    },
    phmetro: {
      resolucao: 0.01,
      tolerancia: 0.03,
      casas: 2,
      nome: "pHmetro",
      unidade: "pH",
    },
    temperatura: {
      resolucao: 0.1,
      tolerancia: 0.2,
      casas: 1,
      nome: "Termômetro",
      unidade: "°C",
    },
    condutividade: {
      resolucao: 0.01,
      tolerancia: 0.5,
      casas: 2,
      nome: "Condutivímetro",
      unidade: "µS/cm",
    },
    indicador: {
      resolucao: null,
      tolerancia: 0,
      casas: 0,
      nome: "Indicador",
      unidade: "cor",
    },
  });
  const contextKey = (m) =>
    JSON.stringify(m.context || { legacy: m.id || m.em });
  function critical(raw, equivalencias = []) {
    const indices = new Set();
    let previousSlope = 0;
    raw.forEach((m, i) => {
      if (!["fita", "phmetro"].includes(m.tecnica)) return;
      const prev = raw[i - 1];
      if (equivalencias.some((v) => Math.abs(m.adicionado - v) <= 0.1))
        indices.add(i);
      if (
        !prev ||
        prev.tecnica !== m.tecnica ||
        contextKey(prev) !== contextKey(m)
      ) {
        previousSlope = 0;
        return;
      }
      const dv = m.adicionado - prev.adicionado,
        dp = Math.abs(m.valor - prev.valor);
      const slope = dv > 0 ? dp / dv : 0;
      if (
        dv > 0 &&
        (dp >= (m.tecnica === "fita" ? 2 : 0.2) ||
          (m.tecnica !== "fita" &&
            dp > 0.02 &&
            slope > Math.max(0.5, 4 * previousSlope)))
      ) {
        indices.add(i);
        indices.add(i - 1);
      }
      previousSlope = slope;
    });
    return indices;
  }
  function compact(raw, { equivalencias = [] } = {}) {
    const groups = [],
      criticalIndices = critical(raw, equivalencias);
    raw.forEach((m, index) => {
      const policy = resolution[m.tecnica] || { tolerancia: 0 };
      const last = groups.at(-1),
        numeric = typeof m.valor === "number";
      const tolerance = policy.tolerancia;
      const compatible =
        last &&
        last.instrument === m.tecnica &&
        last.unit === (m.unidade || policy.unidade) &&
        JSON.stringify(last.context) === contextKey(m) &&
        Math.abs((m.temperatura ?? 25) - (last.start.temperatura ?? 25)) <=
          0.2 + 1e-9 &&
        m.adicionado >= last.end.adicionado &&
        m.adicionado - last.end.adicionado <=
          Math.max(0.2, (m.context?.volumeInicial || 1) * 0.2) + 1e-9 &&
        !criticalIndices.has(index) &&
        !criticalIndices.has(index - 1) &&
        (numeric
          ? Math.max(last.max, m.valor) - Math.min(last.min, m.valor) <=
            tolerance + 1e-9
          : last.representativeValue === m.valor);
      if (compatible) {
        last.end = m;
        last.count++;
        last.indices.push(index);
        last.records.push(m);
        if (numeric) {
          last.min = Math.min(last.min, m.valor);
          last.max = Math.max(last.max, m.valor);
          last.representativeValue +=
            (m.valor - last.representativeValue) / last.count;
        }
      } else
        groups.push({
          start: m,
          end: m,
          min: m.valor,
          max: m.valor,
          representativeValue: m.valor,
          count: 1,
          instrument: m.tecnica,
          unit: m.unidade || policy.unidade,
          context: m.context || { legacy: m.id || m.em },
          indices: [index],
          records: [m],
        });
    });
    return groups;
  }
  const value = (m) =>
    typeof m.valor === "number"
      ? `${m.tecnica === "fita" ? "≈ " : ""}${SIAB.format(m.valor, resolution[m.tecnica]?.casas ?? 2)}`
      : String(m.valor);
  const range = (a, b, casas = 2) =>
    a === b
      ? SIAB.format(a, casas)
      : `${SIAB.format(a, casas)}–${SIAB.format(b, casas)}`;
  const columns = [
    "Volume adicionado (mL)",
    "Leitura",
    "Unidade",
    "Temperatura (°C)",
    "Técnica",
    "Horário",
  ];
  const row = (m) => [
    SIAB.format(m.adicionado),
    value(m),
    m.unidade || resolution[m.tecnica]?.unidade || "",
    SIAB.format(m.temperatura, 1),
    resolution[m.tecnica]?.nome || m.tecnica,
    m.em,
  ];
  function table(raw) {
    return { colunas: [...columns], linhas: raw.map(row) };
  }
  const markup = (tb) =>
    `<div class="table-scroll" tabindex="0" role="region" aria-label="Dados da investigação"><table><thead><tr>${tb.colunas.map((c) => `<th scope="col">${SIAB.escape(c)}</th>`).join("")}</tr></thead><tbody>${tb.linhas.map((l) => `<tr>${l.map((v) => `<td>${SIAB.escape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const note =
    "Medições consecutivas compatíveis com a resolução e a tolerância de apresentação do instrumento foram agrupadas. Os dados brutos, os mínimos e os máximos permanecem preservados.";
  function compactHTML(raw, { equivalencias = [], expand = true } = {}) {
    const groups = compact(raw, { equivalencias });
    return `<p class="field-hint">${note}</p><div class="table-scroll" tabindex="0" role="region" aria-label="Dados da investigação"><table class="measurement-table"><thead><tr><th scope="col">Volume adicionado (mL)</th><th scope="col">Leitura / faixa</th><th scope="col">Técnica</th><th scope="col">n</th></tr></thead><tbody>${groups
      .map((g) => {
        const policy = resolution[g.instrument],
          val =
            typeof g.min === "number"
              ? `${g.instrument === "fita" ? "≈ " : ""}${range(g.min, g.max, policy?.casas ?? 2)}`
              : g.min;
        return `<tr><td>${range(g.start.adicionado, g.end.adicionado)}</td><td>${SIAB.escape(val)} ${SIAB.escape(g.unit)}</td><td>${SIAB.escape(policy?.nome || g.instrument)}</td><td>${g.count}</td></tr>${expand && g.count > 1 ? `<tr><td colspan="4"><details class="measurement-group"><summary>Ver ${g.count} medições</summary><ol>${g.records.map((m) => `<li>${SIAB.format(m.adicionado)} mL · ${SIAB.escape(value(m))} ${SIAB.escape(g.unit)} · ${SIAB.escape(new Date(m.em).toLocaleTimeString("pt-BR"))}</li>`).join("")}</ol></details></td></tr>` : ""}`;
      })
      .join("")}</tbody></table></div>`;
  }
  function html(t, { print = false } = {}) {
    const raw = SIAB.instrumentos.raw(t),
      complete =
        SIAB.state.measurementTable === "complete" ||
        (!SIAB.state.measurementTable && raw.length < 24);
    const actions = print
      ? ""
      : `<div class="ver-acoes" role="group" aria-label="Apresentação das medições"><button class="tab-btn" data-measurement-table="compact" aria-pressed="${!complete}">Compacta</button><button class="tab-btn" data-measurement-table="complete" aria-pressed="${complete}">Completa</button>${SIAB.ActivityContext.allows("files.csv") ? '<button class="secondary-btn" data-acao="csv">Baixar CSV bruto</button>' : ""}${SIAB.ActivityContext.allows("files.notebook") ? '<button class="secondary-btn" data-acao="registrar">Registrar no Caderno</button>' : ""}</div>`;
    if (!raw.length)
      return (
        actions +
        "<p>Nenhuma medição registrada. Use uma técnica disponível para iniciar a tabela.</p>"
      );
    return (
      actions +
      (complete && !print
        ? markup(table(raw))
        : compactHTML(raw, {
            equivalencias: SIAB.chem.solve(t).equivalencias,
            expand: !print,
          }))
    );
  }
  return {
    resolution,
    compact,
    critical,
    value,
    table,
    markup,
    compactHTML,
    html,
    note,
  };
})();
SIAB.historicoTabela = (t) => SIAB.medicoes.table(SIAB.instrumentos.raw(t));
SIAB.historyCSV = (t) =>
  SIAB.ActivityContext.allows("files.csv")
    ? SIAB.tabelaCSV(SIAB.historicoTabela(t))
    : "";
SIAB.historicoHTML = (t) => {
  const events = SIAB.instrumentos
    .dados(t)
    .eventos.filter(
      (e) => !e.leitura || SIAB.instrumentos.permitido(e.leitura.tecnica),
    );
  return `<h3>Histórico da sessão</h3><p class="field-hint">Eventos individuais, em ordem cronológica.</p>${events.length ? `<ol class="experiment-timeline">${events.map((e) => `<li><time datetime="${SIAB.escape(e.em)}">${SIAB.escape(new Date(e.em).toLocaleTimeString("pt-BR"))}</time><div><strong>${SIAB.escape(e.acao)}</strong><span>${SIAB.format(e.adicionado)} mL adicionados${e.leitura ? ` · ${SIAB.escape(SIAB.medicoes.value(e.leitura))} ${SIAB.escape(e.leitura.unidade || "pH")}` : ""}</span></div></li>`).join("")}</ol>` : "<p>Nenhum evento registrado nesta sessão.</p>"}`;
};
