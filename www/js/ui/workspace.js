"use strict";
/* Apresentação do workspace. Não possui dados químicos nem política própria:
   o ActivityContext filtra os conteúdos compartilhados antes de exibi-los. */
SIAB.workspace = (() => {
  const S = SIAB,
    $ = S.$,
    root = document.documentElement;
  const KEY = "siab_workspace_v1";
  const mobile = matchMedia("(max-width: 900px)");
  const presentations = Object.freeze({
    ph: "compact",
    temperatura: "compact",
    condutividade: "compact",
    particulas: "standard",
    especies: "standard",
    equacao: "standard",
    proton: "standard",
    grafico: "wide",
    derivada: "wide",
    distribuicao: "wide",
    historico: "wide",
    tabela: "wide",
  });
  const state = {
    left: "collapsed",
    right: "collapsed",
    leftGroup: "preparo",
    activeFamily: null,
    activeTool: null,
    presentation: "compact",
    level: "families",
    source: "ver",
    scope: null,
  };
  let ready = false,
    syncing = false,
    raf = 0,
    lastDock = "right",
    tourState = null;
  let lastReading = null;
  const origins = {},
    preferences = S.armazenamento.ler(KEY, {}) || {};
  const nodes = {},
    sections = {
      preparo: ["frascos", "indicador", "ajustes"],
      objetos: ["vidraria", "acoes"],
      modulo: ["nivel"],
      missao: ["missao"],
    };
  const icon = S.icons.svg;
  const create = (tag, id, cls, html = "") => {
    const el = document.createElement(tag);
    if (id) el.id = id;
    if (cls) el.className = cls;
    el.innerHTML = html;
    return el;
  };
  const button = (id, text, attrs = "") =>
    `<button type="button" id="${id}" class="secondary-btn dock-button" ${attrs}>${text}</button>`;
  const scope = () => {
    const token = S.atividades?.ativa?.token;
    if (!token) return `livre-${S.bancada.config.modo}`;
    let hash = 2166136261;
    for (const char of token)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return `atividade-${hash >>> 0}`;
  };
  function save() {
    if (!ready) return;
    Object.assign(preferences, {
      scope: state.scope,
      left: state.left,
      leftGroup: state.leftGroup,
      right: state.right,
      tool: state.activeTool,
      presentation:
        state.presentation === "fullscreen"
          ? presentations[state.activeTool]
          : state.presentation,
    });
    S.armazenamento.gravar(KEY, preferences);
  }
  function editable() {
    if (!S.ActivityContext.restricted()) return true;
    return S.ActivityContext.allows([
      "bench.changeInitialSolution",
      "bench.changeTitrant",
      "bench.changeGlassware",
      "bench.changeIndicator",
      "bench.changeConcentration",
      "bench.changePreparation",
      "bench.changeInitialVolume",
      "vessels.changeGlassware",
      "vessels.changeVolume",
    ]);
  }
  function groupAllowed(group) {
    if (group === "missao") return S.bancada.config.modo === "missao";
    if (S.bancada.config.modo === "missao") return false;
    if (!S.ActivityContext.restricted()) return true;
    return {
      preparo: S.ActivityContext.allows([
        "bench.changeInitialSolution",
        "bench.changeTitrant",
        "bench.changeIndicator",
        "bench.changePreparation",
        "bench.changeConcentration",
        "bench.changeInitialVolume",
        "vessels.changeVolume",
      ]),
      objetos: S.ActivityContext.allows([
        "bench.changeGlassware",
        "vessels.changeGlassware",
      ]),
      modulo: false,
    }[group];
  }
  function summary() {
    const t = S.current(),
      esc = S.escape;
    nodes.summary.hidden = Boolean(S.ActivityContext.current);
    if (!t) {
      nodes.summary.innerHTML =
        "<p>Escolha um frasco em Preparo para começar a experiência.</p>";
      return;
    }
    const fields = [
      [
        "Solução inicial",
        S.solutionSummary(t.solution, t.concentration, t.dilution),
      ],
      [
        "Conta-gotas",
        S.solutionSummary(t.titrant, t.titrantConcentration, t.titrantDilution),
      ],
      ["Vidraria", S.VIDRARIAS[t.vidraria || S.state.vidraria].nome],
      ["Volume inicial", `${S.format(t.initialVolume)} mL`],
      ["Módulo", S.MODULOS[S.state.level].nome],
    ];
    const html = `<h3>${esc(t.name)}</h3><dl class="activity-setup">${fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
    if (nodes.summary.innerHTML !== html) nodes.summary.innerHTML = html;
  }
  function applyLeft() {
    const canEdit = editable(),
      hasMission = groupAllowed("missao");
    if (!canEdit && !hasMission && state.left === "expanded")
      state.left = "compact";
    if (!groupAllowed(state.leftGroup))
      state.leftGroup = Object.keys(sections).find(groupAllowed) || "preparo";
    $("controls").dataset.dockState = state.left;
    nodes.leftTabs.querySelectorAll("[data-dock-group]").forEach((b) => {
      const name = b.dataset.dockGroup;
      b.hidden = name !== "resumo" && !groupAllowed(name);
      b.setAttribute(
        "aria-pressed",
        String(
          name === "resumo"
            ? state.left === "compact"
            : state.left === "expanded" && state.leftGroup === name,
        ),
      );
    });
    nodes.leftTabs.hidden = !canEdit && !hasMission;
    $("controls")
      .querySelectorAll(".painel-secao")
      .forEach((el) => {
        const visible =
          state.left === "compact"
            ? el.dataset.secao === "montagem"
            : (sections[state.leftGroup] || []).includes(el.dataset.secao);
        el.classList.toggle("dock-section-hidden", !visible);
      });
    nodes.summary.classList.toggle(
      "dock-section-hidden",
      state.left !== "compact",
    );
    const heading =
      state.left === "compact"
        ? "Montagem"
        : {
            preparo: "Preparo",
            objetos: "Recipientes",
            modulo: "Módulo",
            missao: "Missão",
          }[state.leftGroup];
    const symbol =
      state.left === "compact"
        ? "setup"
        : {
            preparo: "prepare",
            objetos: "lab",
            modulo: "explore",
            missao: "mission",
          }[state.leftGroup];
    $("controls-title").innerHTML = icon(symbol) + `<span>${heading}</span>`;
  }
  function sync() {
    if (!ready || syncing) return;
    syncing = true;
    const nextScope = scope(),
      groups = S.verFamiliasDisponiveis();
    if (state.scope !== nextScope) {
      state.scope = nextScope;
      const valid = preferences.scope === nextScope;
      state.left =
        valid && ["compact", "expanded"].includes(preferences.left)
          ? preferences.left
          : "collapsed";
      state.right =
        valid && preferences.right === "open" && groups.length
          ? "open"
          : "collapsed";
      state.leftGroup =
        valid && groupAllowed(preferences.leftGroup)
          ? preferences.leftGroup
          : "preparo";
      state.source = "ver";
      state.level =
        groups.length === 1 && groups[0].items.length === 1
          ? "tool"
          : groups.length === 1
            ? "tools"
            : "families";
      if (
        !S.state.initialView &&
        valid &&
        S.verDisponivel(preferences.tool) &&
        S.state.verTab !== preferences.tool
      ) {
        S.state.verTab = preferences.tool;
        S.renderVer();
      }
      if (document.body.classList.contains("projetor"))
        state.left = state.right = "collapsed";
    }
    delete S.state.initialView;
    const selected = groups
      .flatMap((g) => g.items)
      .find((x) => x.id === S.state.verTab);
    state.activeFamily =
      groups.find((g) => g.items.some((x) => x.id === selected?.id))?.id ||
      null;
    if (state.activeTool !== selected?.id) {
      state.activeTool = selected?.id || null;
      state.presentation = presentations[state.activeTool] || "standard";
    }
    if (!groups.length && state.source !== "dados") state.right = "collapsed";
    const dataAllowed =
      S.verDisponivel("historico") ||
      S.verDisponivel("tabela") ||
      S.ActivityContext.allows("report.view");
    $("workspace-ver").hidden = !groups.length || !S.current();
    $("workspace-dados").hidden = !dataAllowed || !S.current();
    nodes.data
      .querySelectorAll("[data-dock-tool]")
      .forEach((b) => (b.hidden = !S.verDisponivel(b.dataset.dockTool)));
    nodes.report.hidden =
      !S.ActivityContext.allows("report.view") || !S.current();
    $("workspace-quick-measure").hidden =
      !S.current() ||
      !["fita", "phmetro", "temperatura", "condutividade"].some(
        S.instrumentos.permitido,
      );
    const quick = $("workspace-quick-measure");
    quick.textContent = S.instrumentos.permitido("phmetro")
      ? "Medir pH"
      : S.instrumentos.permitido("fita")
        ? "Mergulhar fita"
        : S.instrumentos.permitido("temperatura")
          ? "Medir temperatura"
          : "Medir condução";
    $("dose-area").classList.toggle(
      "dock-content-hidden",
      S.state.view === "overview",
    );
    const current = S.current();
    const raw = current ? S.instrumentos.raw(current) : [];
    const latest = raw.at(-1);
    const readingKey = `${state.scope}:${current?.id}`;
    if (mobile.matches && lastReading?.key !== readingKey && $("toast").dataset.contexto === "bancada" && !$("toast").childElementCount)
      $("toast").hidden = true;
    if (
      latest &&
      lastReading?.key === readingKey &&
      raw.length > lastReading.count
    ) {
      const names = {
        fita: "fita de pH",
        phmetro: "pHmetro",
        temperatura: "temperatura",
        condutividade: "condutividade",
        indicador: "indicador",
      };
      S.announce(
        `${current.name}: ${names[latest.tecnica] || latest.tecnica}, ${typeof latest.valor === "number" ? S.format(latest.valor, latest.tecnica === "fita" ? 0 : 2) : latest.valor} ${latest.unidade || ""}.`,
      );
      // Só leituras novas, já registradas pelo instrumento. Trocar de tubo,
      // restaurar uma sessão ou recalcular a solução não produz uma medição.
      const ph = raw.slice(lastReading.count).filter((m) =>
        ["fita", "phmetro"].includes(m.tecnica),
      ).at(-1);
      if (mobile.matches && ph) {
        S.notice(
          `pH medido: ${ph.tecnica === "fita" ? "≈ " : ""}${S.format(ph.valor, ph.tecnica === "fita" ? 0 : 2)}${ph.tecnica === "fita" ? " (fita)" : ""}`,
          { contexto: "bancada" },
        );
      }
    }
    lastReading = { key: readingKey, count: raw.length };
    summary();
    applyLeft();
    apply();
    syncing = false;
  }
  function apply() {
    if (!ready) return;
    const workspaceVisible = !$("workspace").hidden;
    root.dataset.workspaceSize = mobile.matches
      ? "compact"
      : innerWidth < 1280
        ? "medium"
        : "expanded";
    $("workspace").dataset.rightPresentation = state.presentation;
    $("workspace").dataset.leftOpen = String(state.left !== "collapsed");
    $("workspace").dataset.rightOpen = String(state.right === "open");
    $("workspace").dataset.activeTool =
      state.right === "open" && state.level === "tool" ? state.activeTool : "";
    for (const side of ["left", "right"]) {
      const el = $(side === "left" ? "controls" : "ver-panel"),
        open = workspaceVisible && state[side] !== "collapsed";
      el.classList.toggle("dock-collapsed", !open);
      el.classList.toggle("bottom-sheet", mobile.matches);
      el.inert = !open;
      el.setAttribute("aria-hidden", String(!open));
      el.setAttribute("role", mobile.matches && open ? "dialog" : "region");
      if (mobile.matches && open) el.setAttribute("aria-modal", "true");
      else el.removeAttribute("aria-modal");
    }
    $("ver-panel").hidden =
      !S.verFamiliasDisponiveis().length && state.source !== "dados";
    $("ver-panel").dataset.presentation = state.presentation;
    $("ver-panel").dataset.level = state.level;
    $("ver-panel").dataset.source = state.source;
    nodes.data.hidden = state.level !== "data";
    $("ver-tabs").classList.toggle(
      "dock-content-hidden",
      state.level === "data",
    );
    $("ver-conteudo").classList.toggle(
      "dock-content-hidden",
      state.level === "data",
    );
    const family = S.VER_SECTIONS.find((g) => g.id === state.activeFamily);
    const tool = family?.items.find((t) => t.id === state.activeTool);
    $("ver-title").textContent =
      state.level === "data"
        ? "Dados da investigação"
        : mobile.matches && state.level === "tool"
          ? tool?.label || "Ver"
          : "Investigar";
    nodes.back.hidden = !(state.level === "data"
      ? false
      : state.source === "dados" ||
        (mobile.matches && state.level !== "families"));
    nodes.back.innerHTML =
      icon("back") +
      (state.source === "dados"
        ? "Dados"
        : state.level === "tool"
          ? `${family?.label || "Ver"}`
          : "Ver");
    const single =
      S.verFamiliasDisponiveis().flatMap((g) => g.items).length === 1;
    if (
      state.source !== "dados" &&
      (single ||
        (S.verFamiliasDisponiveis().length === 1 && state.level === "tools"))
    )
      nodes.back.hidden = true;
    nodes.expand.hidden = mobile.matches || state.level === "data";
    nodes.expand.innerHTML =
      state.presentation === "fullscreen"
        ? icon("collapse") + "Restaurar"
        : icon("expand") + "Expandir";
    nodes.expand.setAttribute(
      "aria-expanded",
      String(state.presentation === "fullscreen"),
    );
    for (const [id, open] of [
      ["workspace-montagem", state.left !== "collapsed"],
      ["workspace-ver", state.right === "open" && state.source === "ver"],
      ["workspace-dados", state.right === "open" && state.source === "dados"],
      ["prepare-btn", state.left !== "collapsed"],
    ])
      $(id).setAttribute("aria-expanded", String(open));
    const sheet =
      workspaceVisible &&
      mobile.matches &&
      (state.left !== "collapsed" || state.right === "open");
    $("sheet-backdrop").hidden = !sheet;
    document.body.classList.toggle("sheet-open", sheet);
    const full =
      workspaceVisible &&
      !mobile.matches &&
      state.right === "open" &&
      state.presentation === "fullscreen";
    $("experiment").inert = sheet || full;
    nodes.launchers.inert = sheet || full;
    document.querySelector(".app-header").inert = sheet;
    document.querySelector(".bottom-nav").inert = sheet;
    $("controls").inert ||= full;
    $("workspace").classList.toggle("dock-fullscreen", full);
    geometry();
  }
  function geometry() {
    if (!ready) return;
    const vv = window.visualViewport;
    const height = vv?.height || innerHeight,
      top = vv?.offsetTop || 0;
    root.style.setProperty("--workspace-visible-height", `${height}px`);
    root.style.setProperty(
      "--sheet-top",
      `${Math.round(top + Math.max(8, height * 0.1))}px`,
    );
    root.style.setProperty(
      "--sheet-height",
      `${Math.round(height - Math.max(8, height * 0.1) - 8)}px`,
    );
    const left =
      !mobile.matches && state.left !== "collapsed"
        ? $("controls").getBoundingClientRect().width + 20
        : 0;
    const right =
      !mobile.matches &&
      state.right === "open" &&
      state.presentation !== "fullscreen"
        ? $("ver-panel").getBoundingClientRect().width + 20
        : 0;
    $("workspace").style.setProperty("--dock-left-inset", `${left}px`);
    $("workspace").style.setProperty("--dock-right-inset", `${right}px`);
    S.layoutBancada?.atualizar();
  }
  function open(side, option = null, trigger = document.activeElement) {
    if (!ready || $("workspace").hidden) return;
    sync();
    if (
      side === "right" &&
      !S.verFamiliasDisponiveis().length &&
      option !== "dados"
    )
      return;
    origins[side] = trigger?.isConnected
      ? trigger
      : $(side === "left" ? "workspace-montagem" : "workspace-ver");
    lastDock = side;
    if (
      mobile.matches ||
      innerWidth < 1280 ||
      (side === "right" && ["wide", "fullscreen"].includes(state.presentation))
    )
      state[side === "left" ? "right" : "left"] = "collapsed";
    if (side === "left") {
      state.left = option === "resumo" || !editable() ? "compact" : "expanded";
      state.leftGroup =
        option && sections[option]
          ? option
          : groupAllowed("missao")
            ? "missao"
            : "preparo";
      applyLeft();
    } else {
      state.right = "open";
      state.source = option === "dados" ? "dados" : "ver";
      state.level =
        option === "dados"
          ? "data"
          : S.verFamiliasDisponiveis().flatMap((g) => g.items).length === 1
            ? "tool"
            : mobile.matches
              ? S.verFamiliasDisponiveis().length === 1
                ? "tools"
                : "families"
              : "tool";
      if (option && S.verDisponivel(option)) {
        S.selecionarVer(option);
        state.level = "tool";
      }
    }
    apply();
    save();
    $(side === "left" ? "close-controls" : "dock-close-right").focus({
      preventScroll: true,
    });
    S.announce(
      `${side === "left" ? "Montagem" : state.source === "dados" ? "Dados" : "Investigação"}: painel aberto.`,
    );
  }
  function close(side = lastDock, restore = true) {
    if (!ready) return;
    state[side] = "collapsed";
    apply();
    save();
    if (restore) {
      const target = origins[side];
      (target?.isConnected &&
      target.getClientRects().length &&
      !target.closest(".dock")
        ? target
        : $(side === "left" ? "workspace-montagem" : "workspace-ver")
      )?.focus({ preventScroll: true });
    }
  }
  function selected(kind) {
    if (!ready) return;
    sync();
    if (mobile.matches)
      state.level =
        kind === "family" &&
        S.verFamiliasDisponiveis().find((g) => g.id === state.activeFamily)
          ?.items.length > 1
          ? "tools"
          : "tool";
    if (state.presentation === "wide") state.left = "collapsed";
    apply();
    save();
    if (mobile.matches)
      (kind === "family" && state.level === "tools"
        ? $("ver-tabs").querySelector('[data-ver][aria-selected="true"]')
        : nodes.back.hidden
          ? $("dock-close-right")
          : nodes.back
      )?.focus({ preventScroll: true });
    S.announce(
      `Ferramenta selecionada: ${S.VER_SECTIONS.flatMap((g) => g.items).find((t) => t.id === state.activeTool)?.label || "investigação"}.`,
    );
  }
  function refresh() {
    if (!ready || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (mobile.matches || innerWidth < 1280) {
        if (state.left !== "collapsed" && state.right === "open")
          state[lastDock === "left" ? "right" : "left"] = "collapsed";
      }
      sync();
      if (
        mobile.matches &&
        document.activeElement?.matches("input,textarea,select") &&
        document.activeElement.closest(".dock")
      )
        document.activeElement.scrollIntoView({ block: "nearest" });
    });
  }
  function init() {
    if (ready) return;
    root.dataset.workspace = "rc3";
    $("experiment").classList.add("workspace-stage");
    for (const [id, side, titleSelector] of [
      ["controls", "left", ".controls-heading"],
      ["ver-panel", "right", ".ver-cabecalho"],
    ]) {
      const pane = $(id),
        inner = pane.querySelector(".painel-conteudo"),
        header = pane.querySelector(titleSelector);
      pane.classList.add("dock", `dock-${side}`);
      pane.querySelector(".trilho")?.remove();
      pane.querySelector(".sheet-handle")?.remove();
      header
        .querySelectorAll("[data-recolher],.fechar-flutuante")
        .forEach((el) => el.remove());
      header.classList.add("dock-header");
      pane.prepend(header);
      inner.classList.add("dock-scroll");
      inner.id = `dock-${side}-content`;
    }
    $("close-controls").className = "secondary-btn dock-close";
    $("close-controls").textContent = "Fechar";
    $("close-controls").setAttribute("aria-label", "Fechar Montagem");
    $("close-controls").setAttribute("aria-controls", "controls");
    const header = $("ver-panel").querySelector(".dock-header");
    nodes.back = create(
      "button",
      "dock-back",
      "quiet-btn dock-button",
      icon("back") + "Ver",
    );
    nodes.back.type = "button";
    header.prepend(nodes.back);
    header.insertAdjacentHTML(
      "beforeend",
      button(
        "dock-expand",
        "Expandir",
        'aria-controls="ver-panel" aria-expanded="false"',
      ) +
        button(
          "dock-close-right",
          "Fechar",
          'aria-label="Fechar investigação" aria-controls="ver-panel"',
        ),
    );
    nodes.expand = $("dock-expand");
    nodes.leftTabs = create("nav", "dock-left-tabs", "dock-tabs");
    nodes.leftTabs.setAttribute("aria-label", "Preparação da bancada");
    for (const [id, label] of [
      ["resumo", "Resumo"],
      ["preparo", "Preparo"],
      ["objetos", "Objetos"],
      ["modulo", "Módulo"],
      ["missao", "Missão"],
    ])
      nodes.leftTabs.insertAdjacentHTML(
        "beforeend",
        button(
          `dock-left-${id}`,
          label,
          `data-dock-group="${id}" aria-controls="dock-left-content"`,
        ),
      );
    $("controls").querySelector(".dock-header").after(nodes.leftTabs);
    nodes.summary = create(
      "section",
      "dock-setup-summary",
      "dock-setup-summary",
    );
    $("dock-left-content").prepend(nodes.summary);
    nodes.report = document.querySelector('[data-secao="relatorio"]');
    nodes.data = create("div", "dock-data-menu", "dock-data-menu");
    nodes.data.innerHTML =
      '<p class="field-hint">Consulte os registros e organize suas conclusões.</p>' +
      button(
        "dock-history",
        icon("history") + "Histórico",
        'data-dock-tool="historico"',
      ) +
      button("dock-table", icon("table") + "Tabela", 'data-dock-tool="tabela"');
    nodes.data.append(nodes.report);
    $("dock-right-content").prepend(nodes.data);
    nodes.launchers = create(
      "nav",
      "workspace-launchers",
      "workspace-launchers",
    );
    nodes.launchers.setAttribute("aria-label", "Ferramentas da bancada");
    for (const [id, label, panel] of [
      ["montagem", "Montagem", "controls"],
      ["ver", "Ver", "ver-panel"],
      ["dados", "Dados", "ver-panel"],
    ])
      nodes.launchers.insertAdjacentHTML(
        "beforeend",
        button(
          `workspace-${id}`,
          `${icon(id)}<span>${label}</span>`,
          `aria-label="${label}" aria-controls="${panel}" aria-expanded="false" title="${label}"`,
        ),
      );
    const toolbar = create("div", "workspace-toolbar", "workspace-toolbar");
    const tabs = document.querySelector(".view-tabs");
    tabs.querySelectorAll(".chip-ver,.chip-sep").forEach((el) => el.remove());
    tabs.before(toolbar);
    toolbar.append(tabs, nodes.launchers);
    const actions = create("div", "context-action-bar", "context-action-bar");
    actions.setAttribute("role", "group");
    actions.setAttribute("aria-label", "Ações experimentais");
    actions.append($("agitar-btn"));
    actions.insertAdjacentHTML(
      "beforeend",
      button("workspace-quick-measure", "Medir pH"),
    );
    $("dose-area").append(actions);
    document.querySelector(".tube-strip").before($("dose-area"));
    $("dose-area").classList.add("workspace-actions");
    ready = true;
    nodes.launchers.addEventListener("click", (e) => {
      const id = e.target.closest("button")?.id;
      if (!id) return;
      const side = id === "workspace-montagem" ? "left" : "right";
      const active = $(id).getAttribute("aria-expanded") === "true";
      if (active) close(side);
      else open(side, id === "workspace-dados" ? "dados" : null, $(id));
    });
    nodes.leftTabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-dock-group]");
      if (!b) return;
      state.left = b.dataset.dockGroup === "resumo" ? "compact" : "expanded";
      if (state.left === "expanded") state.leftGroup = b.dataset.dockGroup;
      applyLeft();
      apply();
      save();
    });
    $("dock-close-right").addEventListener("click", () => close("right"));
    nodes.expand.addEventListener("click", () => {
      state.presentation =
        state.presentation === "fullscreen"
          ? presentations[state.activeTool] || "standard"
          : "fullscreen";
      state.left = "collapsed";
      apply();
      save();
      nodes.expand.focus();
    });
    nodes.back.addEventListener("click", () => {
      state.level =
        state.source === "dados"
          ? "data"
          : state.level === "tool"
            ? "tools"
            : "families";
      apply();
      const target =
        state.level === "data"
          ? nodes.data.querySelector("button:not([hidden])")
          : state.level === "tools"
            ? $("ver-tabs").querySelector('[data-ver][aria-selected="true"]')
            : $("ver-tabs").querySelector(
                '[data-ver-family][aria-selected="true"]',
              );
      (target || $("dock-close-right")).focus();
    });
    nodes.data.addEventListener("click", (e) => {
      const id = e.target.closest("[data-dock-tool]")?.dataset.dockTool;
      if (id && S.selecionarVer(id)) {
        state.level = "tool";
        selected("tool");
      }
    });
    $("workspace-quick-measure").addEventListener("click", () => {
      const t = S.current(),
        technique = ["phmetro", "fita", "temperatura", "condutividade"].find(
          S.instrumentos.permitido,
        );
      if (t && technique) S.instrumentos.medir(t, technique, "pontual");
    });
    $("sheet-backdrop").addEventListener(
      "click",
      (e) => {
        e.stopImmediatePropagation();
        close(lastDock);
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if ($("workspace").hidden || document.querySelector("dialog[open]"))
        return;
      const side =
        state[lastDock] !== "collapsed"
          ? lastDock
          : lastDock === "left"
            ? "right"
            : "left";
      if (state[side] === "collapsed") return;
      if (e.key === "Escape") {
        e.preventDefault();
        close(side);
      }
      if (
        e.key === "Tab" &&
        (mobile.matches ||
          (state.presentation === "fullscreen" && side === "right"))
      ) {
        const panel = $(side === "left" ? "controls" : "ver-panel");
        const focusable = [
          ...panel.querySelectorAll(
            'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,summary,a[href],[tabindex="0"]',
          ),
        ].filter(
          (el) => el.getClientRects().length && !el.closest("[inert],[hidden]"),
        );
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    });
    const activityBanner = $("activity-banner");
    if (activityBanner && typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        $("workspace").style.setProperty(
          "--activity-height",
          `${activityBanner.getBoundingClientRect().height}px`,
        );
        refresh();
      }).observe(activityBanner);
    }
    window.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("scroll", refresh);
    new MutationObserver(refresh).observe($("workspace"), {
      attributes: true,
      attributeFilter: ["hidden"],
    });
    let wasProjector = document.body.classList.contains("projetor");
    new MutationObserver(() => {
      const projector = document.body.classList.contains("projetor");
      if (
        projector &&
        !wasProjector &&
        (state.left !== "collapsed" || state.right !== "collapsed")
      ) {
        state.left = state.right = "collapsed";
        apply();
      }
      wasProjector = projector;
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    S.loja.assinar(sync);
    sync();
  }
  return {
    init,
    sync,
    refresh,
    open,
    close,
    selected,
    state,
    presentations,
    get ready() {
      return ready;
    },
    show(panel, item) {
      if (panel === "ver-panel") open("right", item);
      else if (item === "relatorio") open("right", "dados");
      else
        open(
          "left",
          {
            montagem: "resumo",
            nivel: "modulo",
            vidraria: "objetos",
            acoes: "objetos",
            missao: "missao",
            relatorio: "dados",
          }[item] || "preparo",
        );
      if (item === "ajustes") $("ajustes").open = true;
    },
    suspend() {
      tourState = { ...state };
      state.left = state.right = "collapsed";
      apply();
    },
    resume() {
      if (tourState) Object.assign(state, tourState);
      tourState = null;
      sync();
      save();
    },
  };
})();
