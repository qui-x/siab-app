"use strict";
/* Contrato único da atividade. UI, ações, restauração e documentos consultam
   este contexto; a configuração decodificada do link é a autoridade. */
SIAB.ActivityContext = (() => {
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const freeze = (v) => {
    if (v && typeof v === "object") {
      Object.values(v).forEach(freeze);
      Object.freeze(v);
    }
    return v;
  };
  const resources = {
    measurements: {
      indicator: { id: "indicador", label: "Indicador" },
      phStrip: { id: "fita", label: "Fita de pH" },
      phMeter: { id: "phmetro", label: "pHmetro" },
      conductivity: { id: "condutividade", label: "Condutivímetro" },
      temperature: { id: "temperatura", label: "Termômetro" },
    },
    representations: {
      particles: { id: "particulas", label: "Partículas" },
      species: { id: "especies", label: "Espécies" },
      equations: { id: "equacoes", label: "Equações" },
      protonTransfer: { id: "proton", label: "Transferência de próton" },
    },
    analysis: {
      graph: { id: "grafico", label: "Gráfico" },
      derivative: { id: "derivada", label: "ΔpH/ΔV" },
      distribution: { id: "distribuicao", label: "Distribuição de espécies" },
      history: { id: "historico", label: "Histórico" },
      table: { id: "tabela", label: "Tabela" },
    },
  };
  const resourcePaths = Object.fromEntries(
    Object.entries(resources).flatMap(([group, items]) =>
      Object.entries(items).map(([key, value]) => [
        value.id,
        `${group}.${key}`,
      ]),
    ),
  );
  const entry = (c) =>
    (c.tipo === "roteiro"
      ? SIAB.experimentos
      : c.tipo === "missao"
        ? SIAB.missoes
        : SIAB.montagens
    ).find((x) => x.id === c.item);
  const level = (r) => r.modulo || r.bancada?.nivel || r.nivel || "explorar";
  const current = () => SIAB.atividades?.ativa?.context || null;
  const restricted = () =>
    current()?.permissions.navigation.mode === "restricted";
  function requirements(c) {
    const r = entry(c);
    if (!r) return { requiredCapabilities: [], recommendedInstruments: [] };
    // Requisitos declarativos do catálogo; alternativas instrumentais atendem
    // capacidades, não uma marca/aparelho fixo.
    const special = {
      "missao:ionizacao": ["representation.particles"],
      "missao:hidrolise": [
        "representation.particles",
        "representation.equations",
      ],
      "missao:temperatura": [
        "temperature.measurement",
        "temperature.change",
        "representation.equations",
      ],
      "missao:grau-ionizacao": ["representation.equations"],
      "missao:repolho-roxo": ["color.observation"],
      "missao:cor-que-engana": ["color.observation"],
      "missao:tres-indicadores": ["color.observation"],
      "roteiro:tres-indicadores": ["color.observation"],
      "montagem:tres-indicadores": ["color.observation"],
      "roteiro:cotidiano": ["color.observation"],
      "montagem:cotidiano": ["color.observation"],
    };
    return {
      requiredCapabilities: r.requiredCapabilities ||
        special[`${c.tipo}:${c.item}`] || [
          level(r) === "explorar" ? "observation" : "ph.measurement",
        ],
      recommendedInstruments:
        level(r) === "explorar" ? ["indicador"] : ["fita", "phmetro"],
    };
  }
  function permissions(c) {
    const closed = c.navegacao === "restrita";
    const selected = c.instrumentos || [];
    const p = {
      navigation: { mode: closed ? "restricted" : "open" },
      bench: Object.fromEntries(
        [
          "changeInitialSolution",
          "changeTitrant",
          "changeGlassware",
          "changeInitialVolume",
          "changeConcentration",
          "changeIndicator",
          "changeTemperature",
          "changePreparation",
        ].map((k) => [k, !closed]),
      ),
      vessels: Object.fromEntries(
        [
          "add",
          "remove",
          "rename",
          "changeContent",
          "changeGlassware",
          "changeVolume",
        ].map((k) => [k, !closed]),
      ),
      views: {
        allowed: c.verAccess
          ? Object.values(c.verAccess)
              .flat()
              .filter((v) => typeof v === "string")
          : null,
      },
      modules: {
        allowed: closed ? [c.modulo] : ["explorar", "medir", "calcular"],
      },
      report: { view: true, edit: true, print: true, record: true },
      files: { csv: true, html: true, notebook: true },
    };
    for (const [group, items] of Object.entries(resources)) {
      const explicit = c.permissions?.[group];
      p[group] = Object.fromEntries(
        Object.entries(items).map(([key, value]) => [
          key,
          explicit
            ? explicit[key] === true
            : selected.includes(value.id) ||
              (c.schema === 1 &&
                ((group === "representations" &&
                  ["species", "protonTransfer"].includes(key) &&
                  selected.includes("particulas")) ||
                  (group === "analysis" &&
                    (selected.includes("graficos") ||
                      ["history", "table"].includes(key))))),
        ]),
      );
    }
    // A missão de temperatura requer esta intervenção. Nos demais roteiros,
    // permissões adicionais precisam ser explicitamente liberadas pelo professor.
    if (c.tipo === "missao" && c.item === "temperatura")
      p.bench.changeTemperature = true;
    for (const group of ["bench", "vessels", "report", "files"]) {
      for (const key of Object.keys(p[group])) {
        if (typeof c.permissions?.[group]?.[key] === "boolean")
          p[group][key] = c.permissions[group][key];
      }
    }
    p.bench.changeIndicator &&= p.measurements.indicator;
    return p;
  }
  const capabilityRules = {
    "ph.measurement": {
      any: ["measurements.phStrip", "measurements.phMeter"],
      message:
        "Esta atividade exige uma técnica de medição de pH. Ative Fita de pH ou pHmetro.",
    },
    observation: {
      any: [
        "measurements.indicator",
        "measurements.phStrip",
        "measurements.phMeter",
        "representations.particles",
        "representations.species",
      ],
      message:
        "Ative ao menos uma técnica de observação: indicador, fita, pHmetro, partículas ou espécies.",
    },
    "color.observation": {
      any: ["measurements.indicator"],
      message: "Esta atividade compara cores. Ative o indicador.",
    },
    "representation.particles": {
      any: ["representations.particles"],
      message: "Esta atividade exige a representação de Partículas.",
    },
    "representation.equations": {
      any: ["representations.equations"],
      message: "Esta atividade exige a representação de Equações.",
    },
    "temperature.measurement": {
      any: ["measurements.temperature"],
      message: "Esta atividade exige o termômetro.",
    },
    "temperature.change": {
      any: ["bench.changeTemperature"],
      message: "Esta investigação exige alterar a temperatura da solução.",
    },
  };
  const get = (p, path) => path.split(".").reduce((v, key) => v?.[key], p);
  function validate(c) {
    const p = permissions(c),
      req = requirements(c);
    for (const id of req.requiredCapabilities) {
      const rule = capabilityRules[id];
      if (!rule || !rule.any.some((path) => get(p, path)))
        throw new Error(
          rule?.message || "Capacidade da atividade não reconhecida.",
        );
    }
    return { permissions: p, requirements: req };
  }
  function create(c, identity = {}, stage = "apresentacao") {
    const { permissions: p, requirements: req } = validate(c);
    return {
      activity: freeze({
        type: c.tipo,
        item: c.item,
        title: c.titulo,
        module: c.modulo,
        temperature: c.temperatura,
      }),
      identity: clone(identity),
      stage,
      permissions: freeze(p),
      requirements: freeze(req),
      state: { initialView: c.initialView || null, baseline: null },
      metadata: freeze({ schema: 2, version: SIAB.version }),
    };
  }
  function allows(path, value) {
    if (Array.isArray(path)) return path.some((p) => allows(p, value));
    const ctx = current();
    if (!ctx) return true;
    const allowed = get(ctx.permissions, path);
    return Array.isArray(allowed) ? allowed.includes(value) : allowed === true;
  }
  function guard(path, value) {
    if (allows(path, value)) return true;
    SIAB.notice?.("Ação não disponível nesta atividade.");
    return false;
  }
  function resource(id) {
    const path = resourcePaths[id];
    return path ? allows(path) : false;
  }
  function buildBench(c, identity) {
    const r = entry(c),
      b = SIAB.criarBancada(),
      groups = {};
    const p = permissions(c);
    b.level = c.modulo;
    b.verTab = c.initialView || "ph";
    b.verFamily = "medir";
    b.tubes = (r.tubos || r.bancada.tubos).map((spec, n) => {
      const { grupo, ...x } = spec;
      if (grupo && !groups[grupo]) groups[grupo] = b.nextGroup++;
      return {
        id: n + 1,
        name: `Tubo ${n + 1}`,
        ...SIAB.TUBE_DEFAULTS,
        ...clone(x),
        additions: [],
        temperature: c.temperatura,
        indicator: p.measurements.indicator
          ? x.indicator || SIAB.TUBE_DEFAULTS.indicator
          : "none",
        group: grupo ? groups[grupo] : null,
        groupMode: "drops",
        groupShare: { contaGotas: true, substancia: false },
      };
    });
    b.nextId = b.tubes.length + 1;
    b.activeId = b.tubes[0]?.id;
    if (c.tipo === "roteiro")
      b.experiencia = {
        id: crypto.randomUUID?.() || String(Date.now()),
        roteiro: c.item,
        identificacao: clone(identity),
        criada: new Date().toISOString(),
      };
    return b;
  }
  const tubeFields = {
    solution: "bench.changeInitialSolution",
    titrant: "bench.changeTitrant",
    concentration: "bench.changeConcentration",
    titrantConcentration: "bench.changeConcentration",
    initialVolume: ["bench.changeInitialVolume", "vessels.changeVolume"],
    dilution: "bench.changePreparation",
    titrantDilution: "bench.changePreparation",
    dropVolume: "bench.changePreparation",
    temperature: "bench.changeTemperature",
    indicator: "bench.changeIndicator",
    indicadores: "bench.changeIndicator",
    vidraria: "vessels.changeGlassware",
    capacidade: "vessels.changeGlassware",
    componentes: "vessels.changeContent",
    name: "vessels.rename",
    group: "bench.changePreparation",
    groupMode: "bench.changePreparation",
    groupShare: "bench.changePreparation",
  };
  function sanitize(bench, c, ctx) {
    const expected = buildBench(c, ctx.identity);
    const saved = bench && Array.isArray(bench.tubes) ? clone(bench) : expected;
    ctx.state.baseline = freeze(clone(expected));
    // A restauração jamais aceita IDs/preparo incompatíveis com uma montagem fechada.
    enforce(saved, ctx);
    saved.history = [];
    saved.tubes.forEach((t) => {
      t.additions = (t.additions || []).filter(
        (n) => Number.isFinite(n) && n > 0,
      );
      if (!ctx.permissions.measurements.indicator) {
        t.indicator = "none";
        delete t.indicadores;
      }
      const d = t.observacao;
      if (d) {
        const accepted = (m) =>
          resourcePaths[m.tecnica] &&
          get(ctx.permissions, resourcePaths[m.tecnica]);
        d.leituras = (d.rawMeasurements || d.leituras || []).filter(accepted);
        d.rawMeasurements = d.leituras;
        d.eventos = (d.eventos || []).filter(
          (e) => !e.leitura || accepted(e.leitura),
        );
        if (d.ph && !accepted(d.ph)) delete d.ph;
        if (!ctx.permissions.measurements.conductivity) delete d.condutividade;
        if (!ctx.permissions.measurements.phMeter) {
          d.modo = "pontual";
          d.status = "";
        }
      }
    });
    return saved;
  }
  function enforce(b = SIAB.state, ctx = current()) {
    if (!ctx?.state.baseline || !b) return;
    const p = ctx.permissions,
      base = ctx.state.baseline;
    if (!p.modules.allowed.includes(b.level)) b.level = base.level;
    if (!p.bench.changeGlassware) {
      b.vidraria = base.vidraria;
      b.capacidades = clone(base.capacidades);
    }
    const byId = new Map(b.tubes.map((t) => [t.id, t]));
    if (!p.vessels.remove)
      base.tubes.forEach((t) => {
        if (!byId.has(t.id)) b.tubes.push(clone(t));
      });
    if (!p.vessels.add)
      b.tubes = b.tubes.filter((t) => base.tubes.some((x) => x.id === t.id));
    for (const t of b.tubes) {
      const initial = base.tubes.find((x) => x.id === t.id);
      if (!initial) continue;
      for (const [field, path] of Object.entries(tubeFields)) {
        if (
          Array.isArray(path) ? path.some((key) => get(p, key)) : get(p, path)
        )
          continue;
        if (initial[field] === undefined) delete t[field];
        else if (JSON.stringify(t[field]) !== JSON.stringify(initial[field]))
          t[field] = clone(initial[field]);
      }
    }
    if (!b.tubes.some((t) => t.id === b.activeId)) b.activeId = b.tubes[0]?.id;
    if (!p.measurements.indicator)
      b.tubes.forEach((t) => {
        t.indicator = "none";
        delete t.indicadores;
      });
  }
  return {
    resources: freeze(resources),
    resourcePaths: freeze(resourcePaths),
    requirements,
    permissions,
    validate,
    create,
    entry,
    allows,
    guard,
    resource,
    buildBench,
    sanitize,
    enforce,
    restricted,
    get current() {
      return current();
    },
  };
})();
