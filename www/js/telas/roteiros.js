"use strict";
SIAB.identificacaoHTML = (valores = {}) =>
  `<fieldset class="identificacao"><legend>Identificação</legend>${[
    ["nome", "Nome"],
    ["turma", "Turma"],
    ["data", "Data"],
    ["professor", "Professor"],
    ["grupo", "Grupo"],
  ]
    .map(
      ([k, label]) =>
        `<label class="field">${label}<input name="${k}" type="${k === "data" ? "date" : "text"}" maxlength="160" value="${SIAB.escape(valores[k] || (k === "data" ? new Date().toLocaleDateString("en-CA") : ""))}"></label>`,
    )
    .join("")}</fieldset>`;
SIAB.montarExperimento = (r, identificacao = {}) => {
  if (SIAB.ActivityContext?.restricted()) {
    SIAB.notice("Montagem definida pela atividade.");
    return false;
  }
  if (!r || r.tubos.length > SIAB.MAX_TUBES)
    throw new Error("Montagem inválida.");
  const bench = SIAB.criarBancada(),
    groups = {};
  bench.level = r.modulo;
  bench.verTab = r.ver || "ph";
  bench.initialView = bench.verTab;
  r.tubos.forEach((spec) => {
    const { grupo, ...x } = spec;
    if (grupo && !groups[grupo]) groups[grupo] = bench.nextGroup++;
    SIAB.newTube(
      {
        ...x,
        temperature:
          x.temperature ?? SIAB.atividades?.ativa?.config.temperatura ?? 25,
        group: grupo ? groups[grupo] : null,
        groupMode: "drops",
        groupShare: { contaGotas: true, substancia: false },
      },
      bench,
    );
  });
  bench.activeId = bench.tubes[0]?.id;
  bench.experiencia = {
    id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    roteiro: r.id,
    identificacao,
    criada: new Date().toISOString(),
  };
  SIAB.benches.lab = bench;
  SIAB.usarBancada("lab");
  SIAB.instrumentos.atualizar();
  SIAB.atividades?.salvarSessao();
  SIAB.irPara("#/laboratorio");
};
SIAB.telas.roteiros = {
  secao: "roteiros",
  titulo: () => "Roteiros Experimentais",
  entrar() {
    SIAB.$("roteiros-lista").innerHTML = SIAB.experimentos
      .map(
        (r) =>
          `<a class="content-row" href="#/roteiro/${r.id}"><span><strong>${SIAB.escape(r.titulo)}</strong><small>${SIAB.escape(r.subtitulo)}</small></span><span>${SIAB.MODULOS[r.modulo].nome} ${SIAB.icons.svg("next")}</span></a>`,
      )
      .join("");
  },
};
SIAB.telas.roteiro = {
  secao: "roteiro",
  menu: "roteiros",
  titulo: (id) =>
    SIAB.experimentos.find((r) => r.id === id)?.titulo || "Roteiro",
  entrar(id) {
    const r = SIAB.experimentos.find((r) => r.id === id);
    if (!r) {
      SIAB.notice("Roteiro não encontrado.");
      SIAB.irPara("#/roteiros");
      return;
    }
    const esc = SIAB.escape;
    SIAB.$("roteiro-conteudo").innerHTML =
      `<h1 data-foco tabindex="-1">${esc(r.titulo)}</h1><p class="lead">${esc(r.subtitulo)}</p><p class="eyebrow">${SIAB.MODULOS[r.modulo].nome}</p><section><h2>O problema</h2><p>${esc(r.problema)}</p></section>${r.modulo === "explorar" ? `<section><h2>Pergunta central</h2><p>${esc(r.pergunta)}</p></section>` : ""}<section><h2>Objetivo</h2><p>${esc(r.objetivo)}</p></section><section><h2>O que você vai fazer</h2><ol>${r.tarefas.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></section><section><h2>Na bancada</h2><ul>${r.tubos.map((t) => `<li>${esc(SIAB.solutions[t.solution].name)} · ${SIAB.format(t.initialVolume || 1)} mL · ${esc(SIAB.indicators[t.indicator || "btb"].name)}</li>`).join("")}</ul></section><section><h2>O que observar</h2><p>${esc(r.observar)}</p></section><form data-start-experiment="${r.id}">${SIAB.identificacaoHTML()}<button class="primary-btn">Montar na bancada</button></form>`;
  },
};
SIAB.telas.montagens = {
  secao: "montagens",
  titulo: () => "Montagens prontas",
  entrar() {
    SIAB.$("montagens-lista").innerHTML = SIAB.montagens
      .map(
        (r) =>
          `<article class="setup-card"><h2>${SIAB.escape(r.titulo)}</h2><p>${SIAB.escape(r.objetivo)}</p><p class="eyebrow">${SIAB.MODULOS[r.nivel].nome} · ${r.tubos.length} recipientes</p><p>${r.tubos.map((t) => SIAB.escape(SIAB.solutions[t.solution].name)).join(" · ")}</p><p><strong>Instrumentos:</strong> ${r.instrumentos.map(SIAB.escape).join(" · ")}</p><p><strong>Visualização inicial:</strong> ${SIAB.escape(SIAB.VER_SECTIONS.flatMap((g) => g.items).find((x) => x.id === r.ver)?.label || r.ver)}</p><h3>Investigue</h3><ol>${r.passos.map((x) => `<li>${SIAB.escape(x)}</li>`).join("")}</ol><p><strong>Recursos recomendados:</strong> ${r.recursos.map(SIAB.escape).join(" · ")}</p><button class="secondary-btn" data-montagem="${r.id}">Montar na bancada</button></article>`,
      )
      .join("");
  },
};
SIAB.montarMontagem = (id) => {
  if (SIAB.ActivityContext?.restricted()) return false;
  const m = SIAB.montagens.find((x) => x.id === id);
  if (!m) return;
  SIAB.montarExperimento({ ...m, modulo: m.nivel });
  delete SIAB.state.experiencia;
  SIAB.state.montagem = { id: m.id, titulo: m.titulo, objetivo: m.objetivo };
  SIAB.state.reportViews = [m.ver];
  if (m.visao) SIAB.state.view = m.visao;
  SIAB.render(true);
  SIAB.atividades?.salvarSessao();
  SIAB.notice(
    "Montagem pronta. Escolha um instrumento para iniciar as medidas.",
  );
};
