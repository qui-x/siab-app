"use strict";
SIAB.activityUI = (() => {
  const $ = SIAB.$,
    A = SIAB.ActivityContext;
  const bindings = [
    [
      "#prepare-form",
      [
        "bench.changePreparation",
        "bench.changeConcentration",
        "bench.changeInitialVolume",
        "vessels.changeVolume",
      ],
    ],
    ["#add-tube-btn,#vazia-agua", "vessels.add"],
    ["#remove-btn,#selecao-remover-btn", "vessels.remove"],
    ["#rename-btn,#rename-form", "vessels.rename"],
    ["#menu-tubo", "bench.changeInitialSolution"],
    ["#menu-gotas", "bench.changeTitrant"],
    [
      "#vidraria-grupo,#capacidade-grupo",
      ["bench.changeGlassware", "vessels.changeGlassware"],
    ],
    ["#initial-volume", ["bench.changeInitialVolume", "vessels.changeVolume"]],
    [
      "#drop-volume-select,#drop-volume,#dilution-select,#titrant-dilution-select",
      "bench.changePreparation",
    ],
    ["#concentration,#titrant-concentration", "bench.changeConcentration"],
    [
      "#unlink-btn,#selecao-vincular-btn,#selecao-desvincular-btn",
      "bench.changePreparation",
    ],
    ["#indicator-chips,#indicator-only", "bench.changeIndicator"],
    ["#selecao-misturar-btn", "vessels.changeContent"],
    ["#compare-btn", "vessels.add"],
    ["#relatorio-registrar,#selecao-registrar-btn", "files.notebook"],
    ["#relatorio-print,#relatorio-blank", "report.print"],
  ];
  const previous = new WeakMap();
  function visibility(el, blocked) {
    if (!el) return;
    if (blocked) {
      if (!previous.has(el))
        previous.set(el, {
          hidden: el.hidden,
          inert: el.inert,
          disabled: el.disabled,
        });
      el.hidden = true;
      el.inert = true;
      if ("disabled" in el) el.disabled = true;
    } else if (previous.has(el)) {
      const old = previous.get(el);
      el.hidden = old.hidden;
      el.inert = old.inert;
      if ("disabled" in el) el.disabled = old.disabled;
      previous.delete(el);
    }
  }
  function render() {
    const ctx = A.current,
      closed = A.restricted();
    for (const [selector, path] of bindings)
      document
        .querySelectorAll(selector)
        .forEach((el) =>
          visibility(
            el.matches("input,select") ? el.closest(".field") || el : el,
            !A.allows(path),
          ),
        );
    for (const selector of [
      ".main-nav",
      ".bottom-nav",
      ".header-notebook",
      "#install-btn",
      ".mobile-shelf-tabs",
      "#missao-refazer",
    ])
      document
        .querySelectorAll(selector)
        .forEach((el) => visibility(el, closed));
    $("app-drawer")
      .querySelectorAll(".drawer-section")
      .forEach((el) => {
        if (el.id === "activity-menu") return;
        visibility(el, closed && !el.querySelector("#a11y-toggle"));
      });
    $("activity-menu").hidden = !closed;
    document.querySelectorAll("[data-unrestricted-menu]").forEach(el => visibility(el, closed));
    $("drawer-title").textContent = closed ? "Menu da atividade" : "Menu";
    $("activity-montagem").hidden = !ctx;
    if (closed) {
      document
        .querySelector(".header-brand")
        .setAttribute("href", `#/atividade/${SIAB.atividades.ativa.token}`);
    } else
      document.querySelector(".header-brand").setAttribute("href", "#/inicio");
    const editable =
      ctx &&
      (A.allows(["vessels.changeVolume", "vessels.changeGlassware"]) ||
        Object.entries(ctx.permissions.bench).some(
          ([key, value]) => value && key !== "changeTemperature",
        ));
    // Ações permitidas ficam acessíveis de forma específica. A montagem
    // fechada mostra informações, sem catálogo de frascos inativos.
    visibility($("painel-laboratorio"), closed && !editable);
    if (closed && editable) {
      visibility($("modulos").closest(".painel-secao"), true);
      visibility(
        $("secao-frascos"),
        !A.allows("bench.changeInitialSolution") &&
          !A.allows("bench.changeTitrant"),
      );
      visibility(
        $("vidraria-grupo").closest(".painel-secao"),
        !A.allows(["bench.changeGlassware", "vessels.changeGlassware"]),
      );
      visibility(
        $("ajustes"),
        !A.allows([
          "bench.changePreparation",
          "bench.changeConcentration",
          "bench.changeInitialVolume",
          "vessels.changeVolume",
        ]),
      );
      visibility(document.querySelector('[data-secao="acoes"]'), true);
    } else if (!closed) {
      [
        $("modulos").closest(".painel-secao"),
        $("secao-frascos"),
        $("vidraria-grupo").closest(".painel-secao"),
        $("ajustes"),
        document.querySelector('[data-secao="acoes"]'),
      ].forEach((el) => visibility(el, false));
    }
    const started = !ctx || ctx.stage !== "apresentacao";
    document
      .querySelectorAll("[data-activity-report],[data-activity-finish]")
      .forEach((el) => {
        el.hidden =
          !started ||
          (el.hasAttribute("data-activity-finish") &&
            ctx?.stage === "finalizada");
      });
    document
      .querySelectorAll("[data-ir-ver]")
      .forEach((el) => visibility(el, !SIAB.verDisponivel(el.dataset.irVer)));
    if (!ctx) return;
    const t = SIAB.current(),
      esc = SIAB.escape;
    const fields = t
      ? [
          [
            "Solução inicial",
            SIAB.solutionSummary(t.solution, t.concentration, t.dilution),
          ],
          [
            "Reagente",
            SIAB.solutionSummary(
              t.titrant,
              t.titrantConcentration,
              t.titrantDilution,
            ),
          ],
          ["Vidraria", SIAB.VIDRARIAS[t.vidraria || SIAB.state.vidraria].nome],
          ["Volume inicial", `${SIAB.format(t.initialVolume)} mL`],
          ["Módulo", SIAB.MODULOS[ctx.activity.module].nome],
          ["Temperatura", `${SIAB.format(t.temperature, 1)} °C`],
          ...(A.allows("measurements.indicator")
            ? [["Indicador", SIAB.nomeIndicador(t)]]
            : []),
        ]
      : [];
    $("activity-montagem").innerHTML =
      `<p class="eyebrow">ATIVIDADE</p><h2>Montagem preparada</h2><p>${esc(ctx.activity.title)}</p><dl class="activity-setup">${fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><button class="secondary-btn" data-activity-about>Sobre esta atividade</button>`;
    if (closed) {
      $("controls-title").textContent = "Montagem";
      $("prepare-btn").querySelector(".header-btn-texto").textContent =
        "Montagem";
      $("prepare-btn").setAttribute(
        "aria-label",
        "Abrir montagem da atividade",
      );
      $("prepare-btn").title = "Montagem da atividade";
    }
  }
  function dialog(about = false, topic = SIAB.state.verTab) {
    if (!about) return SIAB.ajuda.contextual(topic);
    if (!A.current) return;
    SIAB.gaveta.fechar();
    const c = SIAB.atividades.ativa?.config,
      r = c ? A.entry(c) : null,
      e = SIAB.escape;
    $("activity-help-title").textContent = about
      ? "Sobre esta atividade"
      : "Ajuda da investigação";
    $("activity-help-content").innerHTML = about
      ? `<h3>${e(c.titulo)}</h3><p>${e(r.problema || r.resumo || r.objetivo || "Investigue a montagem preparada.")}</p><h3>Objetivo</h3><p>${e(r.objetivo || r.professor?.objetivo || r.resumo)}</p>${r.tarefas ? `<ol>${r.tarefas.map((v) => `<li>${e(v)}</li>`).join("")}</ol>` : ""}<p>Registre as evidências, escreva suas conclusões no relatório e finalize a atividade. Encerrar atividade sai deste contexto.</p>`
      : "";
    $("activity-help-dialog").showModal();
  }
  function bind() {
    document.addEventListener(
      "click",
      (e) => {
        if (!A.current) return;
        const target = e.target.closest("button,a,input");
        if (!target) return;
        if (A.restricted()) {
          if (target.matches(".ajuda-link,[data-activity-help]")) {
            e.preventDefault();
            e.stopImmediatePropagation();
            SIAB.ajuda.contextual(SIAB.ajuda.topicFor(target), target);
            return;
          }
          for (const [selector, path] of bindings) {
            if (target.closest(selector) && !A.guard(path)) {
              e.preventDefault();
              e.stopImmediatePropagation();
              return;
            }
          }
          if (
            target.matches(
              "[data-startup-settings],#drawer-tour,#drawer-guia,#guide-btn,#missao-refazer",
            )
          ) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
        }
        if (target.hasAttribute("data-activity-about")) dialog(true);
        if (target.hasAttribute("data-activity-help")) dialog();
        if (target.hasAttribute("data-activity-report")) {
          SIAB.gaveta.fechar();
          SIAB.irPara("#/relatorio");
        }
        if (target.hasAttribute("data-activity-finish")) {
          SIAB.gaveta.fechar();
          SIAB.atividades.finalizar();
        }
        if (target.hasAttribute("data-activity-exit")) {
          SIAB.gaveta.fechar();
          $("activity-exit").click();
        }
      },
      true,
    );
  }
  return { render, bind, dialog };
})();
