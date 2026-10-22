"use strict";
SIAB.graficoMedido = (t, derivada = false) => {
  const raw = SIAB.instrumentos
    .raw(t)
    .filter((m) => ["fita", "phmetro"].includes(m.tecnica));
  // Não conectar preparos diferentes nem atravessar troca de técnica/reinício.
  const segments = [];
  for (const m of raw) {
    const context = JSON.stringify(m.context || {}),
      last = segments.at(-1);
    const point = { x: m.adicionado, y: m.valor };
    if (
      !last ||
      last.tecnica !== m.tecnica ||
      last.context !== context ||
      point.x < last.pts.at(-1).x
    )
      segments.push({ tecnica: m.tecnica, context, pts: [point] });
    else last.pts.push(point);
  }
  const series = segments
    .map((s) => ({
      ...s,
      pts: derivada
        ? s.pts
            .slice(1)
            .flatMap((p, i) =>
              p.x > s.pts[i].x
                ? [{ x: p.x, y: (p.y - s.pts[i].y) / (p.x - s.pts[i].x) }]
                : [],
            )
        : s.pts,
    }))
    .filter((s) => s.pts.length >= (derivada ? 1 : 2));
  if (!series.length)
    return `<p class="field-hint">${derivada ? "São necessárias leituras de pH em volumes distintos para calcular ΔpH/ΔV." : "Ainda não há leituras suficientes para um gráfico. Registre ao menos duas medidas com uma técnica de pH disponível."}</p>`;
  const pts = series.flatMap((s) => s.pts),
    xmax = Math.max(0.05, ...pts.map((p) => p.x)),
    ymin = derivada ? Math.min(0, ...pts.map((p) => p.y)) : 0,
    ymax = derivada ? Math.max(1, ...pts.map((p) => p.y)) : 14,
    x = (v) => 42 + (v / xmax) * 280,
    y = (v) => 170 - ((v - ymin) / (ymax - ymin)) * 145;
  return `<svg class="grafico-medido" viewBox="0 0 340 210" role="img" aria-label="${derivada ? "Derivada das leituras de pH por volume" : "Leituras medidas de pH por volume adicionado"}"><path d="M42 20V170H325" fill="none" stroke="currentColor"/>${series.map((s) => `<g class="measured-series ${s.tecnica}"><polyline fill="none" stroke="currentColor" stroke-width="2.5" ${s.tecnica === "fita" ? 'stroke-dasharray="5 3"' : ""} points="${s.pts.map((p) => `${x(p.x)},${y(p.y)}`).join(" ")}"/>${s.pts.map((p) => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="3" fill="currentColor"/>`).join("")}</g>`).join("")}<text x="45" y="195">0</text><text x="260" y="195">${SIAB.format(xmax)} mL</text><text x="2" y="30">${SIAB.format(ymax, 1)}</text><text x="2" y="173">${SIAB.format(ymin, 1)}</text></svg><p class="field-hint">${[...new Set(series.map((s) => s.tecnica))].map((tecnica) => (tecnica === "fita" ? "Fita: linha tracejada, resolução de 1 unidade" : "pHmetro: linha contínua, resolução de 0,01")).join(". ")}. ${derivada ? "ΔpH/ΔV usa dados brutos sucessivos; picos indicam variação rápida e dependem da resolução da técnica." : "A linha apenas conecta os registros; não é uma curva prevista pelo modelo."}</p>${derivada ? `<details><summary>Dados de origem da derivada</summary>${SIAB.medicoes.markup(SIAB.medicoes.table(raw))}</details>` : ""}`;
};
SIAB.verRenderers = {
  ph({ t, s, r, d, m, esc, permitido }) {
    let html = `<p class="instrument-reading" aria-live="polite">${esc(m.texto)}</p>`;
    if (permitido("indicador"))
      html += `<section class="instrument-section"><h3>Indicador</h3><p>${esc(SIAB.instrumentos.indicador(t))}</p></section>`;
    if (permitido("fita"))
      html += `<section class="instrument-section"><h3>Fita de pH</h3><p>Toque para mergulhar a fita no recipiente em foco. Compare a cor com a escala.</p><button class="secondary-btn" data-instrumento="fita">Mergulhar fita em ${esc(t.name)}</button>${d.ph?.tecnica === "fita" ? `<div class="ph-strip" style="--strip-color:rgb(${SIAB.chem.color("universal", d.ph.valor).rgb.join(",")})"><span></span><strong>≈ ${d.ph.valor}</strong></div><div class="strip-scale">${Array.from({ length: 15 }, (_, p) => `<span style="background:rgb(${SIAB.chem.color("universal", p).rgb.join(",")})">${p}</span>`).join("")}</div><p class="field-hint">Resolução didática: 1 unidade; escala 0–14. ${d.ph.valor === 0 || d.ph.valor === 14 ? "Leitura no extremo da escala." : ""}</p>` : ""}</section>`;
    if (permitido("phmetro"))
      html += `<section class="instrument-section"><h3>pHmetro</h3><svg class="ph-meter" viewBox="0 0 260 105" role="img" aria-label="pHmetro com display, cabo e eletrodo"><rect x="6" y="8" width="142" height="90" rx="13"/><rect x="17" y="20" width="120" height="42" class="display"/><text x="30" y="46">${d.status === "estabilizando" ? "···" : d.ph?.tecnica === "phmetro" ? SIAB.format(d.ph.valor) : "—"}</text><path d="M147 30Q220 0 220 60"/><rect x="212" y="60" width="16" height="35" rx="5"/><text x="20" y="85">${SIAB.format(r.temperature, 1)} °C</text></svg><p aria-live="polite">${d.status === "estabilizando" ? "Estabilizando…" : d.ph?.tecnica === "phmetro" ? (m.anterior ? "Leitura anterior · medir novamente" : "Leitura estável") : "Eletrodo disponível"} · resolução 0,01</p><div class="ver-acoes"><button class="secondary-btn" data-instrumento="phmetro" data-modo="pontual">Medir uma vez</button><button class="secondary-btn" data-instrumento="phmetro" data-modo="continuo">Medição contínua</button>${d.modo === "continuo" ? '<button class="quiet-btn" data-instrumento="parar">Retirar eletrodo</button>' : ""}</div><p class="field-hint">Calibração: ${esc(d.calibracao)}. Sem ruído aleatório.</p><button class="quiet-btn" data-instrumento="calibrar">Calibrar com padrões 4,00 e 7,00</button></section>`;
    return html;
  },
  temperatura({ t, r }) {
    const edit = SIAB.ActivityContext.allows("bench.changeTemperature");
    return `<h3>${edit ? "Temperatura" : "Temperatura da atividade"}</h3><p class="instrument-reading">${SIAB.format(r.temperature, 1)} °C</p><button class="secondary-btn" data-instrumento="temperatura">Registrar temperatura</button>${edit ? `<form id="temperatura-form"><label class="field">Temperatura da solução (°C)<input name="temperatura" type="number" min="0" max="100" step="0.1" value="${r.temperature}" required></label><button class="secondary-btn">Aplicar à solução</button></form><div class="ver-acoes"><button class="quiet-btn" data-temp-ref="25">Referência 25 °C</button><button class="quiet-btn" data-temp-ref="${SIAB.ambiente.bancada}">Usar ambiente da bancada</button></div>${!SIAB.ActivityContext.current ? '<form id="temperatura-local"><label class="field">Cidade para referência meteorológica<input name="cidade" maxlength="80" autocomplete="off" required></label><button class="secondary-btn">Consultar temperatura local</button></form>' : ""}` : "<p>Condição definida pelo professor.</p>"}<p class="field-hint">Neutralidade: pH = pKw(T)/2 = ${SIAB.format(r.neutralPH)}. Demais constantes e mobilidades usam referências a 25 °C.</p>`;
  },
  condutividade({ t, s, r, d }) {
    return `<h3>Condutivímetro</h3><button class="secondary-btn" data-instrumento="condutividade">Medir condutividade</button>${d.condutividade ? `<p class="instrument-reading">${SIAB.format(d.condutividade.valor)} µS/cm</p><p>${d.condutividade.signature === r.signature ? "Estável" : "Leitura anterior"} · ${SIAB.format(d.condutividade.temperatura, 1)} °C</p>` : ""}<p class="field-hint">Estimativa ideal, com mobilidades a 25 °C, sem correção térmica.</p>${s.level === "calcular" ? `<details><summary>Contribuições do modelo</summary>${SIAB.condutimetro.html(t, { nivel: s.level, result: r })}</details>` : ""}`;
  },
  particulas({ t, s, r }) {
    return (
      '<p class="field-hint">Modelo proporcional simplificado; espécies pouco abundantes podem usar escala ampliada.</p>' +
      SIAB.lupa.html(t, { nivel: s.level, result: r })
    );
  },
  especies({ s, r, esc }) {
    const max = Math.max(...r.species.map((e) => e.conc));
    return `<h3>Espécies em solução</h3><p class="field-hint">Concentrações calculadas pelo modelo. ${esc(r.quality)}.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Dados da investigação"><table><thead><tr><th>Espécie</th><th>Carga</th><th>Concentração</th><th>Predominância</th></tr></thead><tbody>${r.species.map((e) => `<tr><td><button class="chemical-token-btn" data-species="${esc(e.formula)}" aria-pressed="${s.destaque === e.formula}">${esc(e.formula)}</button></td><td>${e.charge}</td><td>${SIAB.cientifico(e.conc)} mol/L</td><td>${e.conc === max ? "Maior concentração" : ""}</td></tr>`).join("")}</tbody></table></div>`;
  },
  equacao({ t, s, r }) {
    return (
      '<p class="field-hint">Representação simbólica do equilíbrio; não é uma leitura instrumental.</p>' +
      SIAB.equacao.html(t, { nivel: s.level, result: r })
    );
  },
  proton({ t, r, esc, s }) {
    return `<h3>Transferência de próton</h3><p>O ácido doa H⁺; a base recebe H⁺. Compare os pares conjugados:</p>${r.conjugatePairs.length ? r.conjugatePairs.map((p) => `<div class="proton-pair"><button class="chemical-token-btn" data-species="${esc(p.acid)}" aria-pressed="${s.destaque === p.acid}">${esc(p.acid)} · doador</button><span>⇌ H⁺ +</span><button class="chemical-token-btn" data-species="${esc(p.base)}" aria-pressed="${s.destaque === p.base}">${esc(p.base)} · receptor (sentido inverso)</button></div><p class="field-hint">${esc(p.acid)} e ${esc(p.base)} diferem por um próton. Em água, H₂O pode receber o próton e formar H₃O⁺.</p>`).join("") : `<p>${esc(SIAB.solutions[t.solution].ionization || "H₃O⁺ + OH⁻ → 2 H₂O")}</p><p>Na neutralização, H₃O⁺ doa o próton e OH⁻ o recebe, formando água.</p>`}`;
  },
  grafico({ t }) {
    return SIAB.graficoMedido(t);
  },
  derivada({ t }) {
    return "<h3>Variação de pH por volume</h3>" + SIAB.graficoMedido(t, true);
  },
  distribuicao({ t, r, s, esc }) {
    return `<h3>Distribuição de espécies</h3><p class="field-hint">Frações calculadas pelo mesmo equilíbrio das partículas.</p>${SIAB.grafico.distribuicao(t, r) || "<p>Nenhuma família fraca no sistema atual.</p>"}${r.systems.map((x) => `<div class="species-fractions">${x.nomes.map((n, i) => `<button class="chemical-token-btn" data-species="${esc(n)}" aria-pressed="${s.destaque === n}">${esc(n)}: ${SIAB.format(x.fractions[i] * 100, 1)}%${x.fractions[i] === Math.max(...x.fractions) ? " · predominante" : ""}</button>`).join("")}</div>`).join("")}`;
  },
  historico({ t }) {
    return SIAB.historicoHTML(t);
  },
  tabela({ t }) {
    return SIAB.medicoes.html(t);
  },
};
// Declaração única: cada item informa permissão, capacidade e renderização.
SIAB.VER_SECTIONS = [
  {
    id: "observar",
    label: "Observar",
    items: [
      ["particulas", "Partículas", "representations.particles"],
      ["especies", "Espécies", "representations.species"],
      ["equacao", "Equações", "representations.equations"],
      ["proton", "Transferência de próton", "representations.protonTransfer"],
    ],
  },
  {
    id: "medir",
    label: "Medir",
    items: [
      ["ph", "pH", null, "ph"],
      ["temperatura", "Temperatura", "measurements.temperature"],
      ["condutividade", "Condutividade", "measurements.conductivity"],
    ],
  },
  {
    id: "analisar",
    label: "Analisar",
    items: [
      ["grafico", "Gráfico", "analysis.graph", "ph"],
      ["derivada", "ΔpH/ΔV", "analysis.derivative", "ph"],
      ["distribuicao", "Distribuição de espécies", "analysis.distribution"],
      ["historico", "Histórico", "analysis.history"],
      ["tabela", "Tabela", "analysis.table"],
    ],
  },
].map((family) => ({
  ...family,
  items: family.items.map(([id, label, permission, capability]) => ({
    id,
    label,
    permission,
    capability,
    modules: ["explorar", "medir", "calcular"],
    render: SIAB.verRenderers[id],
  })),
}));
SIAB.verGrupos = Object.fromEntries(
  SIAB.VER_SECTIONS.map((g) => [g.id, g.items.map((t) => [t.id, t.label])]),
);
SIAB.verDisponivel = (id) => {
  const item = SIAB.VER_SECTIONS.flatMap((g) => g.items).find(
    (x) => x.id === id,
  );
  if (!item || !item.modules.includes(SIAB.state.level)) return false;
  const views = SIAB.ActivityContext.current?.permissions.views.allowed;
  if (views && !views.includes(id)) return false;
  if (item.permission && !SIAB.ActivityContext.allows(item.permission))
    return false;
  if (
    item.capability === "ph" &&
    !["fita", "phmetro", ...(id === "ph" ? ["indicador"] : [])].some(
      SIAB.instrumentos.permitido,
    )
  )
    return false;
  return true;
};
SIAB.verFamiliasDisponiveis = () =>
  SIAB.VER_SECTIONS.map((g) => ({
    ...g,
    items: g.items.filter((x) => SIAB.verDisponivel(x.id)),
  })).filter((g) => g.items.length);
SIAB.selecionarVer = (id) => {
  if (!SIAB.verDisponivel(id)) return false;
  const family = SIAB.VER_SECTIONS.find((g) =>
    g.items.some((t) => t.id === id),
  );
  SIAB.state.verFamily = family.id;
  SIAB.state.verTab = id;
  SIAB.state.reportViews = [
    ...new Set([...(SIAB.state.reportViews || []), id]),
  ];
  (SIAB.state.verLastTabs ||= {})[family.id] = id;
  SIAB.renderVer();
  SIAB.workspace?.sync();
  return true;
};
SIAB.renderRegua = () => {
  SIAB.$("ver-regua").hidden = true;
};
SIAB.renderVer = () => {
  const $ = SIAB.$,
    s = SIAB.state,
    t = SIAB.current(),
    groups = SIAB.verFamiliasDisponiveis();
  $("ver-panel").hidden = !groups.length;
  $("workspace").classList.toggle("sem-ver", !groups.length);
  $("ver-regua").hidden = true;
  if (!groups.length) {
    $("ver-tabs").replaceChildren();
    $("ver-conteudo").replaceChildren();
    s.verFamily = null;
    s.verTab = null;
    return;
  }
  let family =
    groups.find((g) => g.items.some((x) => x.id === s.verTab)) ||
    groups.find((g) => g.id === s.verFamily) ||
    groups[0];
  const selected =
    family.items.find((x) => x.id === s.verTab) || family.items[0];
  s.verFamily = family.id;
  s.verTab = selected.id;
  const active = document.activeElement,
    focusId = active?.closest("#ver-panel") ? active.id : null,
    focusData =
      active?.closest("#ver-panel") && active.tagName === "BUTTON"
        ? { ...active.dataset }
        : null;
  const single = groups.length === 1 && family.items.length === 1;
  $("ver-tabs").innerHTML = single
    ? `<p class="ver-single" id="tab-${selected.id}">${family.label.toUpperCase()} · ${selected.label}</p>`
    : `${groups.length > 1 ? `<div class="ver-family-tabs" role="tablist" aria-label="Famílias do painel">${groups.map((g) => `<button class="tab-btn" id="family-${g.id}" role="tab" data-ver-family="${g.id}" aria-selected="${g.id === family.id}" tabindex="${g.id === family.id ? 0 : -1}" aria-controls="ver-subpanel">${SIAB.icons.svg(g.id)}${g.label.toUpperCase()}</button>`).join("")}</div>` : `<p class="eyebrow">${family.label.toUpperCase()}</p>`}<div id="ver-subpanel" ${groups.length > 1 ? `role="tabpanel" aria-labelledby="family-${family.id}"` : ""}><div class="ver-item-tabs" role="tablist" aria-label="${family.label}">${family.items.map((item) => `<button class="tab-btn view-tab-btn" id="tab-${item.id}" role="tab" data-ver="${item.id}" aria-selected="${item.id === selected.id}" tabindex="${item.id === selected.id ? 0 : -1}" aria-controls="ver-conteudo">${item.label}</button>`).join("")}</div></div>`;
  $("ver-conteudo").setAttribute("aria-labelledby", `tab-${selected.id}`);
  $("ver-conteudo").innerHTML = t
    ? selected.render({
        t,
        s,
        r: SIAB.chem.solve(t),
        d: SIAB.instrumentos.dados(t),
        m: SIAB.instrumentos.leitura(t),
        esc: SIAB.escape,
        permitido: SIAB.instrumentos.permitido,
      })
    : "<p>Prepare um recipiente para iniciar a investigação.</p>";
  if (
    t &&
    s.destaque &&
    ["particulas", "especies", "equacao", "proton", "distribuicao"].includes(
      selected.id,
    )
  ) {
    $("ver-conteudo").insertAdjacentHTML(
      "afterbegin",
      `<p class="species-bridge">Espécie em destaque: <strong>${SIAB.escape(s.destaque)}</strong>.</p>`,
    );
  }
  if (t && selected.id === "particulas")
    SIAB.lupa.equilibrio($("ver-conteudo"));
  if (t && selected.id === "equacao") SIAB.equacao.setas($("ver-conteudo"));
  SIAB.workspace?.sync();
  if (focusId) $(focusId)?.focus({ preventScroll: true });
  else if (focusData)
    [...$("ver-panel").querySelectorAll("button")]
      .find(
        (button) =>
          Object.keys(focusData).length &&
          Object.entries(focusData).every(
            ([key, value]) => button.dataset[key] === value,
          ),
      )
      ?.focus({ preventScroll: true });
};
SIAB.ligarVer = () => {
  const pane = SIAB.$("ver-panel");
  pane.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const t = SIAB.current();
    if (b.dataset.verFamily) {
      const family = SIAB.verFamiliasDisponiveis().find(
        (g) => g.id === b.dataset.verFamily,
      );
      if (!family) return;
      const previous = SIAB.state.verLastTabs?.[family.id];
      SIAB.selecionarVer(
        family.items.find((x) => x.id === previous)?.id || family.items[0].id,
      );
      SIAB.$(`family-${family.id}`)?.focus();
      SIAB.workspace?.selected("family");
    }
    if (b.dataset.ver) {
      e.stopPropagation();
      if (SIAB.selecionarVer(b.dataset.ver)) {
        SIAB.$(`tab-${b.dataset.ver}`)?.focus();
        SIAB.workspace?.selected("tool");
      }
    }
    if (b.dataset.species && SIAB.verDisponivel(SIAB.state.verTab)) {
      SIAB.state.destaque = b.dataset.species;
      SIAB.renderVer();
    }
    if (b.dataset.measurementTable && SIAB.verDisponivel("tabela")) {
      SIAB.state.measurementTable = b.dataset.measurementTable;
      SIAB.renderVer();
    }
    if (!t) return;
    if (b.dataset.instrumento) {
      const action = b.dataset.instrumento;
      if (action === "parar") SIAB.instrumentos.parar(t);
      else if (action === "calibrar") SIAB.instrumentos.calibrar(t);
      else SIAB.instrumentos.medir(t, action, b.dataset.modo);
      SIAB.renderVer();
    }
    if (
      b.dataset.tempRef &&
      SIAB.ActivityContext.guard("bench.changeTemperature")
    )
      SIAB.alterar("temperatura", () => {
        t.temperature = Number(b.dataset.tempRef);
      });
  });
  pane.addEventListener("keydown", (e) => {
    const tab = e.target.closest('[role="tab"]'),
      list = tab?.closest('[role="tablist"]');
    if (
      !list ||
      ![
        "ArrowRight",
        "ArrowLeft",
        "ArrowDown",
        "ArrowUp",
        "Home",
        "End",
      ].includes(e.key)
    )
      return;
    e.preventDefault();
    const tabs = [...list.querySelectorAll('[role="tab"]')],
      i = tabs.indexOf(tab);
    const n =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? tabs.length - 1
          : (i +
              (["ArrowRight", "ArrowDown"].includes(e.key)
                ? 1
                : tabs.length - 1)) %
            tabs.length;
    tabs[n].click();
  });
  pane.addEventListener("submit", (e) => {
    if (e.target.id === "temperatura-form") {
      e.preventDefault();
      const v = Number(new FormData(e.target).get("temperatura"));
      if (
        SIAB.ActivityContext.guard("bench.changeTemperature") &&
        Number.isFinite(v) &&
        v >= 0 &&
        v <= 100
      )
        SIAB.alterar("temperatura", () => {
          SIAB.current().temperature = v;
        });
    }
    if (e.target.id === "temperatura-local") {
      e.preventDefault();
      if (SIAB.ActivityContext.guard("bench.changeTemperature"))
        SIAB.temperaturaLocal(new FormData(e.target).get("cidade"));
    }
  });
};
SIAB.tabelaCSV = (tabela) =>
  [tabela.colunas, ...tabela.linhas]
    .map((l) => l.map(SIAB.csvCampo).join(";"))
    .join("\n");
