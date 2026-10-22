"use strict";
SIAB.instrumentos = (() => {
  const timers = new Map();
  const permitido = (id) => SIAB.ActivityContext.resource(id);
  function dados(t) {
    const d = (t.observacao ||= {
      modo: "pontual",
      calibracao: "Referência ideal de fábrica",
      eventos: [],
    });
    d.rawMeasurements ||= d.leituras || [];
    d.leituras = d.rawMeasurements; // compatibilidade, sem cópia agregada
    d.eventos ||= [];
    return d;
  }
  function contexto(t) {
    const ctx = SIAB.ActivityContext.current;
    return {
      recipiente: t.id,
      vidraria: t.vidraria || SIAB.state.vidraria,
      incremento: t.dropVolume,
      solucao: t.solution,
      reagente: t.titrant,
      concentracao: t.concentration,
      concentracaoReagente: t.titrantConcentration,
      volumeInicial: t.initialVolume,
      diluicao: t.dilution,
      diluicaoReagente: t.titrantDilution,
      componentes: t.componentes || null,
      indicador: t.indicator,
      modulo: SIAB.state.level,
      etapa: ctx?.stage || "bancada",
      atividade: ctx?.activity.item || "livre",
    };
  }
  function evento(t, acao, leitura) {
    const d = dados(t),
      r = SIAB.chem.solve(t);
    d.eventos.push({
      em: new Date().toISOString(),
      acao,
      volume: r.volume,
      adicionado: r.added,
      temperatura: r.temperature,
      leitura: leitura || null,
    });
  }
  function registrar(t, tecnica) {
    if (
      !t ||
      !permitido(tecnica) ||
      ![
        "fita",
        "phmetro",
        "temperatura",
        "condutividade",
        "indicador",
      ].includes(tecnica)
    )
      return false;
    const d = dados(t),
      r = SIAB.chem.solve(t);
    const values = {
      fita: [Math.max(0, Math.min(14, Math.round(r.pH))), "pH", 1],
      phmetro: [Number(r.pH.toFixed(2)), "pH", 0.01],
      temperatura: [Number(r.temperature.toFixed(1)), "°C", 0.1],
      condutividade: [Number(r.conductivity.kappa.toFixed(2)), "µS/cm", 0.01],
      indicador: [r.indicator.name, "cor", null],
    };
    const [valor, unidade, resolucao] = values[tecnica];
    const m = {
      id: `${t.id}-${d.rawMeasurements.length + 1}`,
      tecnica,
      valor,
      unidade,
      resolucao,
      signature: r.signature,
      em: new Date().toISOString(),
      temperatura: r.temperature,
      volume: r.volume,
      adicionado: r.added,
      context: contexto(t),
    };
    if (["fita", "phmetro"].includes(tecnica)) {
      d.ph = m;
      d.status = "estável";
    }
    if (tecnica === "condutividade") d.condutividade = m;
    if (tecnica === "temperatura") d.temperatura = m;
    d.rawMeasurements.push(m);
    evento(
      t,
      {
        fita: "Fita de pH utilizada",
        phmetro: "pHmetro estabilizado",
        temperatura: "Temperatura medida",
        condutividade: "Condutividade medida",
        indicador: "Cor do indicador observada",
      }[tecnica],
      m,
    );
    return m;
  }
  function medir(t, tecnica, modo = "pontual") {
    if (!t || !permitido(tecnica)) {
      SIAB.notice("Instrumento não disponível nesta atividade.");
      return false;
    }
    if (SIAB.chem.solve(t).volume <= 0) {
      SIAB.notice(
        "O recipiente está vazio. Adicione uma solução antes de medir.",
      );
      return false;
    }
    const d = dados(t);
    if (tecnica !== "phmetro") {
      if (tecnica === "fita") {
        d.modo = "pontual";
        clearTimeout(timers.get(t));
        timers.delete(t);
      }
      const m = registrar(t, tecnica);
      SIAB.loja.avisar();
      return m;
    }
    d.modo = modo === "continuo" ? "continuo" : "pontual";
    d.status = "estabilizando";
    agendar(t);
    SIAB.render();
    return true;
  }
  function agendar(t) {
    clearTimeout(timers.get(t));
    timers.set(
      t,
      setTimeout(() => {
        timers.delete(t);
        if (!SIAB.state.tubes.includes(t) || !permitido("phmetro")) return;
        registrar(t, "phmetro");
        SIAB.loja.avisar();
      }, 500),
    );
  }
  function atualizar() {
    for (const t of SIAB.state.tubes) {
      const d = dados(t),
        r = SIAB.chem.solve(t);
      if (d.ultimoEstado !== r.signature) {
        if (d.ultimoEstado && d.ultimoVolumeAdicionado === r.added)
          evento(t, "Condição experimental alterada");
        d.ultimoEstado = r.signature;
        d.ultimoVolumeAdicionado = r.added;
        if (permitido("indicador") && t.indicator !== "none")
          registrar(t, "indicador");
        if (d.modo === "continuo" && permitido("phmetro")) {
          d.status = "estabilizando";
          agendar(t);
        }
      }
    }
  }
  function leitura(t) {
    const vazia = {
      texto: "pH não medido",
      curto: "não medido",
      valida: false,
    };
    if (!t) return vazia;
    const m = dados(t).ph,
      r = SIAB.chem.solve(t);
    if (!m || !permitido(m.tecnica)) return vazia;
    const stale = m.signature !== r.signature;
    const str = SIAB.format(m.valor, m.tecnica === "fita" ? 0 : 2);
    return {
      ...m,
      texto: `${m.tecnica === "fita" ? "pH estimado ≈" : "pH medido ="} ${str}${stale ? " · leitura anterior" : ""}`,
      curto: `${m.tecnica === "fita" ? "≈ " : ""}${str}${stale ? " (anterior)" : ""}`,
      valida: !stale,
      anterior: stale,
    };
  }
  function indicador(t) {
    if (!permitido("indicador")) return "Indicador não autorizado.";
    const r = SIAB.chem.solve(t),
      ind = SIAB.indicators[t.indicator];
    if (t.indicator === "none") return "Solução sem indicador.";
    const range = SIAB.chem.colorRange(t.indicator, r.indicator.name);
    return `${ind.name}: ${r.indicator.name}${range ? ` · faixa de cor aproximada ${SIAB.format(range[0], 1)}–${SIAB.format(range[1], 1)}` : ""}. A cor não determina um pH exato.`;
  }
  function parar(t) {
    if (!t || !permitido("phmetro")) return false;
    dados(t).modo = "pontual";
    clearTimeout(timers.get(t));
    timers.delete(t);
    return true;
  }
  function calibrar(t) {
    if (!t || !permitido("phmetro")) return false;
    dados(t).calibracao = "Dois pontos simulados: pH 4,00 e 7,00 a 25 °C";
    evento(t, "Calibração de dois pontos");
    return true;
  }
  const raw = (t) =>
    dados(t).rawMeasurements.filter((m) => permitido(m.tecnica));
  return {
    dados,
    medir,
    registrar,
    atualizar,
    leitura,
    indicador,
    permitido,
    evento,
    parar,
    calibrar,
    raw,
  };
})();
SIAB.ambiente = { externa: null, bancada: 25, origem: "Referência 25 °C" };
SIAB.temperaturaLocal = async (cidade) => {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 6500);
  try {
    if (!cidade?.trim()) throw new Error("Informe a cidade, sem endereço.");
    const a = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade.trim())}&count=1&language=pt`,
      { signal: timeout.signal },
    );
    if (!a.ok) throw new Error("Consulta indisponível");
    const json = await a.json(),
      loc = json.results?.[0];
    if (!loc) throw new Error("Cidade não encontrada");
    // A coordenada da cidade existe somente nesta consulta; nunca é persistida.
    const b = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m`,
      { signal: timeout.signal },
    );
    if (!b.ok) throw new Error("Consulta indisponível");
    const w = await b.json(),
      v = Number(w.current?.temperature_2m);
    if (!Number.isFinite(v)) throw new Error("Temperatura indisponível");
    SIAB.ambiente = {
      externa: v,
      bancada: Math.max(0, Math.min(100, v)),
      origem: `Ambiente local: ${loc.name}`,
    };
    SIAB.notice(
      "Temperatura externa consultada. Aplique à solução quando desejar.",
    );
  } catch (e) {
    SIAB.ambiente = {
      externa: null,
      bancada: 25,
      origem: "Referência 25 °C (consulta indisponível)",
    };
    SIAB.notice(`${e.message}. Use 25 °C ou informe uma temperatura manual.`);
  } finally {
    clearTimeout(timer);
    SIAB.renderVer();
  }
};
