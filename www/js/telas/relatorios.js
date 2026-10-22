"use strict";
SIAB.relatorios = (() => {
  const esc = SIAB.escape;
  let atual = null,
    arquivoAberto = false,
    rendering = false;
  const campos = [
    ["observacoes", "Observações"],
    ["analise", "Análise"],
    ["interpretacao", "Interpretação"],
    ["resposta", "Resposta à investigação"],
    ["conclusao", "Conclusão"],
  ];
  const lerTodos = () => SIAB.persistencia.ler("siab_relatorios_v1", {});
  const concentrationLabel = (id, concentration, dilution = 1) =>
    id === "water"
      ? "Solvente"
      : SIAB.isEveryday(id)
        ? `Composição representativa · diluição ${SIAB.format(dilution, 0)}×`
        : `${SIAB.format(concentration, 4)} mol/L`;
  function capturar() {
    const ctx = SIAB.ActivityContext.current;
    if (ctx && ctx.stage === "apresentacao") return null;
    const b = SIAB.state,
      exp = b.experiencia,
      r = SIAB.experimentos.find((x) => x.id === exp?.roteiro);
    b.reportId ||=
      exp?.id || globalThis.crypto?.randomUUID?.() || String(Date.now());
    const old = lerTodos()[b.reportId];
    const rows = b.tubes.map((t) => {
      const c = SIAB.chem.solve(t),
        m = SIAB.instrumentos.leitura(t);
      const raw = SIAB.instrumentos.raw(t),
        first = raw[0],
        initial = first?.context;
      const concentration = initial?.concentracao ?? t.concentration;
      const components =
        initial?.componentes || (!initial ? t.componentes : null);
      return {
        nome: t.name,
        inicial: {
          solucao: components?.length
            ? components
                .map((x) => SIAB.solutions[x.id]?.name || x.id)
                .join(" + ")
            : SIAB.solutions[initial?.solucao || t.solution]?.name,
          vidraria:
            SIAB.VIDRARIAS[initial?.vidraria || t.vidraria || b.vidraria]
              ?.nome || "Recipiente",
          concentracao: components?.length
            ? components
                .map(
                  (x) =>
                    `${SIAB.solutions[x.id].name}: ${concentrationLabel(x.id, x.concentration, x.dilution)} em ${SIAB.format(x.volume)} mL`,
                )
                .join("; ")
            : concentrationLabel(
                initial?.solucao || t.solution,
                concentration,
                initial?.diluicao || t.dilution,
              ),
          volume: components?.length
            ? components.reduce((v, x) => v + x.volume, 0)
            : (initial?.volumeInicial ?? t.initialVolume),
          temperatura: first?.temperatura ?? t.temperature,
          indicador: SIAB.ActivityContext.allows("measurements.indicator")
            ? SIAB.indicators[initial?.indicador || t.indicator]?.name ||
              "Sem indicador"
            : "Sem indicador",
          origem: first
            ? "Preparo associado ao primeiro registro"
            : "Preparo atual; sem registro anterior",
        },
        reagente: {
          nome: SIAB.solutions[t.titrant]?.name,
          concentracao: t.titrantConcentration,
          descricao: concentrationLabel(
            t.titrant,
            t.titrantConcentration,
            t.titrantDilution,
          ),
          incremento: t.dropVolume,
          tecnica: "Conta-gotas simulado",
        },
        estado: c.phase,
        conteudo: SIAB.resumoConteudo(t),
        vidraria: SIAB.VIDRARIAS[t.vidraria || b.vidraria].nome,
        volume: c.volume,
        temperatura: c.temperature,
        ph: m.texto,
        instrumento: m.tecnica || "Não utilizado",
        indicador: SIAB.ActivityContext.allows("measurements.indicator")
          ? SIAB.nomeIndicador(t)
          : "Sem indicador",
        cor: c.color.name,
        qualidade: c.quality,
        condutividade: SIAB.ActivityContext.allows("measurements.conductivity")
          ? t.observacao?.condutividade || null
          : null,
        rawMeasurements: JSON.parse(JSON.stringify(SIAB.instrumentos.raw(t))),
        usedInstruments: [
          ...new Set(SIAB.instrumentos.raw(t).map((m) => m.tecnica)),
        ],
        tabela: SIAB.ActivityContext.allows("analysis.table")
          ? SIAB.historicoTabela(t)
          : null,
        tabelaCompacta:
          SIAB.ActivityContext.allows("analysis.table") &&
          SIAB.instrumentos.raw(t).length >= 24
            ? SIAB.medicoes.compactHTML(SIAB.instrumentos.raw(t), {
                equivalencias: c.equivalencias,
                expand: false,
              })
            : null,
        grafico:
          SIAB.ActivityContext.allows("analysis.graph") &&
          SIAB.instrumentos
            .raw(t)
            .filter((m) => ["fita", "phmetro"].includes(m.tecnica)).length >= 2
            ? SIAB.graficoMedido(t)
            : "",
        derivada:
          b.reportViews?.includes("derivada") && SIAB.verDisponivel("derivada")
            ? SIAB.graficoMedido(t, true)
            : "",
        distribuicao:
          b.reportViews?.includes("distribuicao") &&
          SIAB.verDisponivel("distribuicao")
            ? SIAB.grafico.distribuicao(t, c) || ""
            : "",
        graficoCondutividade:
          b.reportViews?.includes("condutividade") &&
          SIAB.ActivityContext.allows("measurements.conductivity")
            ? conductivityChart(raw)
            : "",
        calculos:
          b.level === "calcular" &&
          (SIAB.ActivityContext.allows("representations.equations") ||
            SIAB.ActivityContext.allows("representations.species"))
            ? {
                preparos: SIAB.chem.base(t).map((x) => ({
                  nome: SIAB.solutions[x.id].name,
                  amostra: SIAB.isEveryday(x.id),
                  agua: x.id === "water",
                  concentracao: x.concentration,
                  volume: x.volume,
                  mmol: x.concentration * x.volume,
                })),
                equivalencias: c.equivalencias,
                pKw: c.pKw,
              }
            : null,
      };
    });
    atual = {
      id: b.reportId,
      activity: ctx ? { ...ctx.activity } : null,
      permissions: ctx ? JSON.parse(JSON.stringify(ctx.permissions)) : null,
      activityRequirements: ctx?.requirements.requiredCapabilities || [],
      allowedInstruments: Object.entries(
        SIAB.ActivityContext.resources.measurements,
      )
        .filter(([k]) => SIAB.ActivityContext.allows("measurements." + k))
        .map(([, v]) => v.id),
      origem: r ? "roteiro" : "livre",
      montagem: b.montagem || null,
      missao:
        SIAB.activeBench === "mission" && SIAB.motor.ativa
          ? {
              titulo: SIAB.motor.ativa.def.titulo,
              objetivo: SIAB.motor.ativa.def.resumo,
            }
          : null,
      roteiro: r
        ? {
            id: r.id,
            titulo: r.titulo,
            subtitulo: r.subtitulo,
            problema: r.problema,
            pergunta: r.pergunta,
            objetivo: r.objetivo,
          }
        : null,
      modulo: b.level,
      identificacao:
        old?.identificacao ||
        exp?.identificacao ||
        SIAB.atividades?.ativa?.identificacao ||
        {},
      aluno: {
        ...(SIAB.activeBench === "mission" &&
        SIAB.motor.ativa?.respostas.conclusao
          ? { conclusao: SIAB.motor.ativa.respostas.conclusao }
          : {}),
        ...old?.aluno,
      },
      respostasMissao:
        SIAB.activeBench === "mission"
          ? JSON.parse(JSON.stringify(SIAB.motor.ativa?.respostas || {}))
          : {},
      sessaoId: SIAB.atividades?.ativa?.sessionId || b.reportId,
      configuracao: old?.configuracao || defaults(),
      recipientes: rows,
      atualizado: new Date().toISOString(),
    };
    salvar();
    return atual;
  }
  function salvar() {
    if (!atual) return;
    const all = lerTodos();
    all[atual.id] = atual;
    SIAB.persistencia.salvar("siab_relatorios_v1", all);
  }
  function tabela(rows) {
    return `<div class="table-scroll" tabindex="0" role="region" aria-label="Dados da investigação"><table><thead><tr><th>Recipiente</th><th>Volume</th><th>T</th><th>pH</th><th>Técnica</th><th>Cor</th></tr></thead><tbody>${rows.map((t) => `<tr><td>${esc(t.nome)}</td><td>${SIAB.format(t.volume)} mL</td><td>${SIAB.format(t.temperatura, 1)} °C</td><td>${esc(t.ph)}</td><td>${esc(t.instrumento)}</td><td>${esc(t.cor)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function calculosHTML(c) {
    const partes = c.preparos || [
      {
        nome: "Solução inicial",
        concentracao: c.concentracao,
        volume: c.volumeInicial,
        mmol: c.mmol,
      },
    ];
    return `<h4>Cálculos do modelo</h4><p>Preparo inicial, antes das adições registradas nesta etapa:</p>${partes.map((x) => `<p>${esc(x.nome)}: ${x.agua ? "solvente" : x.amostra ? "composição representativa parcial; não se atribui um único número de mols à amostra" : `n = C·V = ${SIAB.format(x.concentracao, 4)} mol/L × ${SIAB.format(x.volume / 1000, 5)} L = ${SIAB.cientifico(x.mmol / 1000)} mol`}.</p>`).join("")}<p>pKw(T) = ${SIAB.format(c.pKw)}. Volumes de equivalência previstos: ${c.equivalencias.length ? c.equivalencias.map((v) => SIAB.format(v) + " mL").join(", ") : "não se aplica"}.</p>`;
  }
  const inclusoes = {
    iniciais: "Condições iniciais",
    dados: "Dados experimentais",
    tabela: "Tabela",
    grafico: "Gráficos",
    finais: "Estado final",
    calculos: "Cálculos",
  };
  function defaults() {
    return {
      modo: "completo",
      linhas: 10,
      porCampo: {},
      incluir: Object.fromEntries(Object.keys(inclusoes).map((k) => [k, true])),
      vazios: Object.fromEntries(campos.map(([k]) => [k, true])),
      fonte: "bancada",
      hipoteticos: [],
      proposta: "",
      pergunta: "",
    };
  }
  function config() {
    atual.configuracao = { ...defaults(), ...atual.configuracao };
    return atual.configuracao;
  }
  const limitLines = (v) =>
    Math.max(5, Math.min(60, Math.round(Number(v) || 10)));
  const teacher = () => !SIAB.ActivityContext.current;
  function configure(patch) {
    if (!atual || !SIAB.ActivityContext.allows("report.edit")) return false;
    if (
      !teacher() &&
      (patch.modo === "analise" || patch.fonte === "hipoteticos")
    )
      return false;
    const c = config();
    if (patch.linhas !== undefined) patch.linhas = limitLines(patch.linhas);
    if (patch.porCampo)
      patch.porCampo = Object.fromEntries(
        Object.entries(patch.porCampo).map(([k, v]) => [k, limitLines(v)]),
      );
    Object.assign(c, patch);
    salvar();
    return c;
  }
  function conductivityChart(raw) {
    const points = raw.filter((m) => m.tecnica === "condutividade");
    if (points.length < 2) return "";
    // Pontos independentes: preparos e técnicas diferentes nunca são ligados.
    const maxX = Math.max(0.05, ...points.map((m) => m.adicionado)),
      maxY = Math.max(1, ...points.map((m) => m.valor));
    return `<figure><figcaption>Condutividade registrada × volume adicionado (pontos independentes)</figcaption><svg class="grafico-medido" viewBox="0 0 360 215" role="img" aria-label="Condutividade registrada em µS/cm por volume adicionado em mL"><path d="M55 20v150h280" fill="none" stroke="currentColor"/>${points.map((m) => `<circle cx="${55 + (m.adicionado / maxX) * 270}" cy="${170 - (m.valor / maxY) * 140}" r="3" fill="currentColor"><title>${SIAB.format(m.adicionado)} mL · ${SIAB.format(m.valor)} µS/cm</title></circle>`).join("")}<text x="55" y="190">0</text><text x="280" y="190">${SIAB.format(maxX)} mL</text><text x="8" y="20">${SIAB.format(maxY)}</text><text x="8" y="205">µS/cm · dados instrumentais simulados</text></svg></figure>`;
  }
  function table(headers, rows, label) {
    return `<div class="table-scroll report-table" tabindex="0" role="region" aria-label="${esc(label)}"><table><caption>${esc(label)}</caption><thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function dadosHTML(id) {
    const r = lerTodos()[id];
    if (!r)
      return "<p>Os dados desta prática não estão disponíveis neste navegador.</p>";
    return r.recipientes
      .map(
        (t) =>
          `<section class="practice-vessel"><h3>${esc(t.nome)}</h3>${table(["Solução inicial", "Vidraria", "Concentração", "Volume", "Indicador", "Temperatura"], [[t.inicial?.solucao || t.conteudo, t.inicial?.vidraria || t.vidraria, t.inicial?.concentracao || "Não registrada", `${SIAB.format(t.inicial?.volume ?? t.volume)} mL`, t.inicial?.indicador || t.indicador, `${SIAB.format(t.inicial?.temperatura ?? t.temperatura, 1)} °C`]], "Condições iniciais")}${t.reagente ? `<p>Reagente: ${esc(t.reagente.nome)} · ${esc(t.reagente.descricao || "")} · incremento ${SIAB.format(t.reagente.incremento)} mL.</p>` : ""}${table(
            [
              "Volume adicionado (mL)",
              "Leitura",
              "Unidade",
              "Temperatura (°C)",
              "Instrumento",
            ],
            (t.rawMeasurements || []).map((m) => [
              SIAB.format(m.adicionado),
              typeof m.valor === "number" ? SIAB.format(m.valor) : m.valor,
              m.unidade,
              SIAB.format(m.temperatura, 1),
              SIAB.medicoes.resolution[m.tecnica]?.nome || m.tecnica,
            ]),
            "Medições registradas — dados completos",
          )}${table(["Volume final", "pH (leitura)", "Temperatura", "Cor", "Estado"], [[`${SIAB.format(t.volume)} mL`, t.ph, `${SIAB.format(t.temperatura, 1)} °C`, t.cor, t.estado]], "Condições finais")}</section>`,
      )
      .join("");
  }
  function hypotheses(text) {
    if (!teacher()) throw new Error("Disponível na preparação do professor.");
    const lines = String(text).trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length || lines.length > 200)
      throw new Error("Informe entre 1 e 200 linhas de dados.");
    return lines.map((line, i) => {
      const values = line.split(";").map((v) => v.trim().replace(",", "."));
      if (
        values.length !== 4 ||
        values.some((v) => !v.length || !Number.isFinite(Number(v)))
      )
        throw new Error(
          `Linha ${i + 1}: informe quatro números separados por ponto e vírgula.`,
        );
      const [adicionado, ph, temperatura, condutividade] = values.map(Number);
      if (
        adicionado < 0 ||
        adicionado > 10000 ||
        ph < 0 ||
        ph > 14 ||
        temperatura < 0 ||
        temperatura > 100 ||
        condutividade < 0 ||
        condutividade > 1e7
      )
        throw new Error(`Linha ${i + 1}: valor fora dos limites indicados.`);
      return { adicionado, ph, temperatura, condutividade };
    });
  }
  function rowsFor(mode) {
    const c = config();
    if (mode !== "analise" || c.fonte !== "hipoteticos" || !teacher())
      return atual.recipientes;
    const initial = atual.recipientes[0]?.inicial || {
      solucao: "Situação definida pelo professor",
      vidraria: "Recipiente",
      concentracao: "Não informada",
      volume: 0,
      temperatura: 25,
      indicador: "Não informado",
      origem: "Condições da situação hipotética",
    };
    const data = c.hipoteticos,
      last = data.at(-1);
    const raw = data.flatMap((m, i) => [
      {
        tecnica: "phmetro",
        valor: m.ph,
        unidade: "pH",
        adicionado: m.adicionado,
        temperatura: m.temperatura,
        volume: initial.volume + m.adicionado,
        context: { hipotetico: true },
        id: `h-${i}`,
      },
      {
        tecnica: "condutividade",
        valor: m.condutividade,
        unidade: "µS/cm",
        adicionado: m.adicionado,
        temperatura: m.temperatura,
        volume: initial.volume + m.adicionado,
        context: { hipotetico: true },
        id: `c-${i}`,
      },
    ]);
    return [
      {
        nome: "Situação hipotética",
        inicial: initial,
        reagente: atual.recipientes[0]?.reagente,
        volume: last ? initial.volume + last.adicionado : initial.volume,
        temperatura: last?.temperatura ?? initial.temperatura,
        ph: last?.ph ?? "—",
        instrumento: "Dados hipotéticos fornecidos pelo professor",
        cor: "Não informada",
        estado: "Hipótese didática",
        usedInstruments: [],
        rawMeasurements: raw,
        hipoteticos: data,
        graficoCondutividade: conductivityChart(raw),
      },
    ];
  }
  function hypotheticalGraph(rows) {
    if (rows.length < 2) return "";
    const max = Math.max(0.05, ...rows.map((r) => r.adicionado));
    return `<figure><figcaption>pH × volume · dados hipotéticos</figcaption><svg class="grafico-medido" viewBox="0 0 360 215" role="img" aria-label="pH por volume adicionado, dados hipotéticos"><path d="M40 20v150h285" fill="none" stroke="currentColor"/><text x="5" y="22">pH 14</text><text x="15" y="175">0</text><text x="40" y="195">0</text><text x="265" y="195">${SIAB.format(max)} mL</text>${rows.map((r) => `<circle cx="${40 + (r.adicionado / max) * 280}" cy="${170 - (r.ph / 14) * 145}" r="3" fill="currentColor"><title>${SIAB.format(r.adicionado)} mL · pH ${SIAB.format(r.ph)}</title></circle>`).join("")}</svg></figure>`;
  }
  function writing(k, label) {
    const n = limitLines(config().porCampo[k] ?? config().linhas);
    return `<div class="writing-space" data-writing-field="${k}" data-lines="${n}" aria-label="${esc(label)}: ${n} linhas">${Array.from({ length: n }, (_, i) => `<div class="response-line" data-line="${i + 1}"><span class="sr-only">Linha ${i + 1}</span></div>`).join("")}</div>`;
  }
  function html({ editar = false, branco = false, modo } = {}) {
    if (!atual) return "<p>Nenhum relatório disponível.</p>";
    const r = atual,
      c = config(),
      mode = branco ? "mao" : modo || c.modo;
    const effectiveMode = mode === "analise" && !teacher() ? "completo" : mode;
    const included = (key) =>
      effectiveMode !== "analise" || c.incluir[key] !== false;
    const blank = (key) =>
      effectiveMode === "mao" ||
      (effectiveMode === "analise" && c.vazios[key] !== false);
    const rows = rowsFor(effectiveMode),
      source = r.roteiro || r.montagem || r.missao;
    const ident =
      editar && effectiveMode === "completo"
        ? SIAB.identificacaoHTML(r.identificacao)
        : `<dl class="report-ident">${[
            ["nome", "Nome"],
            ["turma", "Turma"],
            ["data", "Data"],
            ["professor", "Professor"],
            ["grupo", "Grupo"],
          ]
            .map(
              ([k, l]) =>
                `<div><dt>${l}</dt><dd>${esc(r.identificacao[k] || "________________________________")}</dd></div>`,
            )
            .join("")}</dl>`;
    let content = `<article class="digital-report" data-report-mode="${effectiveMode}"><header><div class="report-brand"><img src="assets/siab-icone.svg" width="40" height="40" alt=""><strong>SIAB</strong></div><p class="eyebrow">${{ completo: "Relatório completo", mao: "Para preencher à mão", analise: "Atividade de análise" }[effectiveMode]}</p><h1 data-foco tabindex="-1">${r.roteiro ? "Relatório da Experiência" : "Relatório da Bancada"}</h1>${source ? `<p class="lead">${esc(source.titulo)}</p>` : ""}<p>Módulo ${SIAB.MODULOS[r.modulo].nome} · ${SIAB.version}</p><h2>1. Identificação</h2>${ident}</header>`;
    content += `<section data-report-section="proposta"><h2>2. Proposta experimental</h2>${effectiveMode === "analise" && c.proposta ? `<p>${esc(c.proposta)}</p>` : source ? `<p>${esc(source.objetivo || source.problema || "")}</p>${r.roteiro?.modulo === "explorar" || (r.modulo === "explorar" && r.roteiro) ? `<h3>Pergunta central</h3><p>${esc(r.roteiro.pergunta)}</p>` : ""}` : "<p>Investigação livre: descreva a questão investigada na resposta à investigação.</p>"}${effectiveMode === "analise" && c.pergunta ? `<h3>Questão para investigar</h3><p>${esc(c.pergunta)}</p>` : ""}${effectiveMode === "analise" && c.fonte === "hipoteticos" ? '<p class="report-source">Dados hipotéticos fornecidos pelo professor; não são medições da bancada. Condições de referência: primeiro recipiente preparado.</p>' : '<p class="report-source">Dados da bancada virtual. Leituras instrumentais simuladas e previsões do modelo são identificadas separadamente.</p>'}</section>`;
    if (included("iniciais"))
      content += `<section data-report-section="iniciais"><h2>3. Condições iniciais</h2>${table(
        [
          "Recipiente",
          "Vidraria",
          "Solução",
          "Concentração",
          "Volume inicial",
          "Indicador",
          "Temperatura",
        ],
        rows.map((t) => {
          const i = t.inicial || {};
          return [
            t.nome,
            i.vidraria || t.vidraria,
            i.solucao || t.conteudo,
            i.concentracao || "Não registrada",
            `${SIAB.format(i.volume ?? t.volume)} mL`,
            i.indicador || t.indicador,
            `${SIAB.format(i.temperatura ?? t.temperatura, 1)} °C`,
          ];
        }),
        "Preparo inicial",
      )}${rows.map((t) => `<p class="field-hint">${esc(t.nome)}: ${esc(t.inicial?.origem || "Condições preservadas em relatório anterior")}</p>`).join("")}${table(
        [
          "Recipiente",
          "Substância adicionada",
          "Concentração",
          "Incremento",
          "Técnica",
        ],
        rows
          .filter((t) => t.reagente)
          .map((t) => [
            t.nome,
            t.reagente.nome,
            t.reagente.descricao ||
              `${SIAB.format(t.reagente.concentracao, 4)} mol/L`,
            `${SIAB.format(t.reagente.incremento)} mL`,
            t.reagente.tecnica,
          ]),
        "Reagente e adição",
      )}</section>`;
    if (included("dados") || included("tabela")) {
      content +=
        '<section data-report-section="dados"><h2>4. Dados experimentais</h2>';
      if (included("dados")) content += tabela(rows);
      if (included("tabela"))
        content += rows
          .map(
            (t) =>
              `<section class="report-result"><h3>${esc(t.nome)} · Tabela experimental</h3><p>Técnicas efetivamente registradas: ${t.hipoteticos ? "não se aplica aos dados hipotéticos" : t.usedInstruments?.length ? t.usedInstruments.map((id) => esc(SIAB.medicoes.resolution[id]?.nome || id)).join(", ") : "Nenhuma medição registrada"}.</p>${
                t.hipoteticos
                  ? table(
                      [
                        "V adicionado (mL)",
                        "pH",
                        "T (°C)",
                        "Condutividade (µS/cm)",
                      ],
                      t.hipoteticos.map((m) => [
                        SIAB.format(m.adicionado),
                        SIAB.format(m.ph),
                        SIAB.format(m.temperatura, 1),
                        SIAB.format(m.condutividade),
                      ]),
                      "Dados hipotéticos",
                    )
                  : t.tabelaCompacta ||
                    (t.tabela
                      ? SIAB.medicoes.markup(t.tabela)
                      : "<p>Nenhuma tabela disponível neste contexto.</p>")
              }${t.condutividade ? `<p>Condutividade registrada: ${SIAB.format(t.condutividade.valor)} µS/cm.</p>` : ""}</section>`,
          )
          .join("");
      content += "</section>";
    }
    if (included("grafico") || included("calculos")) {
      content +=
        '<section data-report-section="representacoes"><h2>5. Representações</h2>';
      rows.forEach((t) => {
        const chart = (label, content) =>
          content
            ? `<figure class="report-chart"><figcaption>${esc(label)}</figcaption>${content}</figure>`
            : "";
        const graphs = included("grafico")
          ? [
              t.hipoteticos
                ? hypotheticalGraph(t.hipoteticos)
                : chart(
                    "pH × volume adicionado · leituras instrumentais",
                    t.grafico,
                  ),
              chart(
                "ΔpH/ΔV × volume adicionado · análise das leituras",
                t.derivada?.replace(/<details>[\s\S]*?<\/details>/g, ""),
              ),
              chart(
                "Distribuição de espécies · previsão do modelo",
                t.distribuicao?.replace(/<button[^>]*>(.*?)<\/button>/g, "$1"),
              ),
              t.graficoCondutividade,
            ]
              .filter(Boolean)
              .join("")
          : "";
        content += `<section class="report-result"><h3>${esc(t.nome)}</h3>${graphs || (included("grafico") ? "<p>Nenhum gráfico produzido com os recursos disponíveis.</p>" : "")}${included("calculos") && t.calculos ? calculosHTML(t.calculos) : ""}</section>`;
      });
      content += "</section>";
    }
    if (included("finais"))
      content += `<section data-report-section="finais"><h2>6. Condições finais</h2>${table(
        [
          "Recipiente",
          "Volume final",
          "pH (leitura)",
          "Temperatura",
          "Cor",
          "Estado",
        ],
        rows.map((t) => [
          t.nome,
          `${SIAB.format(t.volume)} mL`,
          t.ph,
          `${SIAB.format(t.temperatura, 1)} °C`,
          t.cor,
          `${t.estado || "Estado registrado"}${t.qualidade ? " · " + t.qualidade : ""}`,
        ]),
        "Estado final",
      )}</section>`;
    function field(k, label) {
      return `<div class="report-author-field" data-author-field="${k}"><h3>${esc(label)}</h3>${blank(k) ? writing(k, label) : editar && effectiveMode === "completo" ? `<label class="sr-only" for="rel-${k}">${esc(label)}</label><textarea id="rel-${k}" data-report-field="${k}" rows="5" maxlength="16000">${esc(r.aluno[k] || "")}</textarea>` : `<p class="student-text">${esc(r.aluno[k] || "Não preenchido.")}</p>`}</div>`;
    }
    content += `<p class="report-student-label">As seções seguintes são autorais.</p><section><h2>7. Observações</h2>${field("observacoes", "Observações")}</section><section><h2>8. Análise / interpretação</h2>${field("analise", "Análise")}${field("interpretacao", "Interpretação")}</section><section><h2>9. Resposta à investigação</h2>${field("resposta", "Resposta")}</section><section><h2>10. Conclusão</h2>${field("conclusao", "Conclusão")}</section><footer class="report-model-note"><h2>Nota sobre o modelo</h2><p>Equilíbrio aquoso ideal. pKw varia com a temperatura; demais constantes e mobilidades usam referências a 25 °C. Amostras representativas têm composição parcial. CO₂ usa sistema fechado simplificado; bolhas são ilustrativas. Solubilidade modelada apenas quando há dados. Leituras instrumentais e cálculos estão identificados separadamente.</p></footer></article>`;
    return content;
  }
  function settingsHTML() {
    const c = config(),
      manual = c.modo !== "completo",
      custom = ![5, 10, 15, 20, 25].includes(c.linhas);
    return `<section class="report-settings" aria-labelledby="report-settings-title"><h2 id="report-settings-title">Preparar relatório</h2><div class="report-setting-grid"><label class="field">Modo<select id="report-mode"><option value="completo" ${c.modo === "completo" ? "selected" : ""}>Relatório completo</option><option value="mao" ${c.modo === "mao" ? "selected" : ""}>Para preencher à mão</option>${teacher() ? `<option value="analise" ${c.modo === "analise" ? "selected" : ""}>Atividade de análise · Professor</option>` : ""}</select></label>${manual ? `<label class="field">Linhas por campo<select id="report-lines">${[5, 10, 15, 20, 25].map((n) => `<option value="${n}" ${c.linhas === n ? "selected" : ""}>${n}</option>`).join("")}<option value="custom" ${custom ? "selected" : ""}>Personalizado</option></select></label><label class="field" id="report-custom-label" ${custom ? "" : "hidden"}>Quantidade (5 a 60)<input id="report-custom-lines" type="number" min="5" max="60" step="1" value="${c.linhas}"></label>` : ""}</div>${manual ? `<details><summary>Linhas por campo (opcional)</summary><div class="report-setting-grid">${campos.map(([k, l]) => `<label class="field">${l}<input type="number" min="5" max="60" step="1" data-lines-field="${k}" placeholder="${c.linhas}" value="${c.porCampo[k] || ""}"></label>`).join("")}</div></details>` : ""}${
      c.modo === "analise" && teacher()
        ? `<p>Prepare a bancada e selecione os dados que a turma deverá interpretar.</p><div class="report-setting-grid"><fieldset><legend>Incluir dados</legend>${Object.entries(
            inclusoes,
          )
            .map(
              ([k, l]) =>
                `<label class="check-row"><input type="checkbox" data-report-include="${k}" ${c.incluir[k] !== false ? "checked" : ""}>${l}</label>`,
            )
            .join(
              "",
            )}</fieldset><fieldset><legend>Deixar em branco</legend>${campos.map(([k, l]) => `<label class="check-row"><input type="checkbox" data-report-blank="${k}" ${c.vazios[k] !== false ? "checked" : ""}>${l}</label>`).join("")}</fieldset></div><label class="field">Proposta para a turma<textarea data-report-setting="proposta" rows="2" maxlength="2000">${esc(c.proposta)}</textarea></label><label class="field">Questão para investigar<textarea data-report-setting="pergunta" rows="2" maxlength="2000">${esc(c.pergunta)}</textarea></label><label class="field">Origem dos dados<select id="report-source"><option value="bancada" ${c.fonte === "bancada" ? "selected" : ""}>Bancada virtual</option><option value="hipoteticos" ${c.fonte === "hipoteticos" ? "selected" : ""}>Dados hipotéticos do professor</option></select></label>${c.fonte === "hipoteticos" ? `<label class="field">Uma linha por situação: volume adicionado; pH; temperatura; condutividade<textarea id="report-hypotheses" rows="5" placeholder="0;2;25;1200&#10;0,5;3;25;900">${esc(c.hipoteticos.map((m) => [m.adicionado, m.ph, m.temperatura, m.condutividade].join(";")).join("\n"))}</textarea></label><p class="field-hint">Unidades: mL (0–10.000); pH (0–14); °C (0–100); µS/cm (0–10.000.000). Até 200 linhas. O preparo do primeiro recipiente fornece as condições iniciais. Estes valores serão identificados como hipotéticos.</p><button class="secondary-btn" id="report-use-hypotheses">Aplicar dados hipotéticos</button><p id="report-hypotheses-error" role="alert"></p>` : ""}`
        : ""
    }<p class="field-hint">${c.modo === "completo" ? "Os dados da bancada são automáticos. Identificação e textos são salvos enquanto você escreve." : "Os dados científicos permanecem na folha. As linhas são distribuídas entre páginas quando necessário."}</p></section>`;
  }
  function render() {
    if (rendering) return;
    rendering = true;
    try {
      if (!atual) {
        SIAB.$("relatorio-conteudo").innerHTML = html();
        return;
      }
      if (!teacher() && config().modo === "analise") config().modo = "completo";
      SIAB.$("relatorio-config").innerHTML = settingsHTML();
      SIAB.$("relatorio-conteudo").innerHTML = html({ editar: true });
      SIAB.$("relatorio-encerrar").hidden = !SIAB.atividades?.ativa;
      SIAB.$("relatorio-voltar").textContent =
        SIAB.atividades?.ativa?.etapa === "finalizada"
          ? "Ver atividade"
          : arquivoAberto
            ? "Voltar ao Caderno"
            : "Voltar à bancada";
      SIAB.refreshSelects?.();
      SIAB.activityUI?.render?.();
    } finally {
      rendering = false;
    }
  }
  function abrir(id) {
    if (!SIAB.ActivityContext.guard("report.view")) return false;
    if (
      SIAB.ActivityContext.current &&
      (SIAB.ActivityContext.current.stage === "apresentacao" ||
        (id && id !== SIAB.state.reportId))
    ) {
      SIAB.notice("Relatório indisponível neste contexto.");
      return false;
    }
    if (!id && SIAB.atividades?.ativa?.etapa === "finalizada")
      id = SIAB.state.reportId;
    arquivoAberto = !!id && id !== SIAB.state.reportId;
    if (id) {
      atual = lerTodos()[id] || null;
      if (!atual) SIAB.notice("Relatório não encontrado neste navegador.");
    } else capturar();
    SIAB.$("relatorio-atualizar").hidden = Boolean(
      id && id !== SIAB.state.reportId,
    );
    render();
  }
  function preparar() {
    if (!atual) capturar();
    SIAB.$("folha-impressao").innerHTML = html();
    document.body.classList.add("imprimindo", "imprimindo-folha");
  }
  function imprimir(branco = false) {
    if (!SIAB.ActivityContext.guard("report.print")) return false;
    if (branco) {
      configure({ modo: "mao" });
      render();
    }
    preparar();
    window.print();
  }
  function ligar() {
    const box = SIAB.$("relatorio-conteudo"),
      settings = SIAB.$("relatorio-config");
    box.addEventListener("input", (e) => {
      if (!atual || !SIAB.ActivityContext.allows("report.edit")) return;
      if (e.target.dataset.reportField)
        atual.aluno[e.target.dataset.reportField] = e.target.value;
      else if (e.target.name)
        atual.identificacao[e.target.name] = e.target.value;
      salvar();
    });
    settings.addEventListener("change", (e) => {
      if (rendering) return;
      const el = e.target,
        c = config();
      if (el.id === "report-mode") configure({ modo: el.value });
      else if (el.id === "report-lines") {
        if (el.value === "custom") {
          SIAB.$("report-custom-label").hidden = false;
          SIAB.$("report-custom-lines").focus();
          return;
        }
        configure({ linhas: el.value });
      } else if (el.id === "report-custom-lines")
        configure({ linhas: el.value });
      else if (el.dataset.linesField) {
        const fields = { ...c.porCampo };
        if (el.value) fields[el.dataset.linesField] = limitLines(el.value);
        else delete fields[el.dataset.linesField];
        configure({ porCampo: fields });
      } else if (el.dataset.reportInclude)
        configure({
          incluir: { ...c.incluir, [el.dataset.reportInclude]: el.checked },
        });
      else if (el.dataset.reportBlank)
        configure({
          vazios: { ...c.vazios, [el.dataset.reportBlank]: el.checked },
        });
      else if (el.dataset.reportSetting)
        configure({ [el.dataset.reportSetting]: el.value });
      else if (el.id === "report-source") configure({ fonte: el.value });
      else return;
      const focusId = el.id;
      render();
      if (focusId) SIAB.$(focusId)?.focus();
    });
    settings.addEventListener("click", (e) => {
      if (!e.target.closest("#report-use-hypotheses")) return;
      try {
        configure({
          hipoteticos: hypotheses(SIAB.$("report-hypotheses").value),
        });
        render();
      } catch (error) {
        SIAB.$("report-hypotheses-error").textContent = error.message;
      }
    });
    SIAB.$("relatorio-print").onclick = () => imprimir();
    SIAB.$("relatorio-blank").onclick = () => imprimir(true);
    SIAB.$("relatorio-atualizar").onclick = () => {
      capturar();
      render();
      SIAB.notice("Dados experimentais atualizados.");
    };
    SIAB.$("relatorio-registrar").onclick = () => {
      if (!SIAB.ActivityContext.guard("files.notebook") || !atual) return;
      salvar();
      if (SIAB.atividades?.ativa) {
        const id = SIAB.atividades.registrarPratica();
        SIAB.notice(
          id
            ? "Prática registrada no Caderno."
            : "A prática ainda não tem dados experimentais ou respostas.",
        );
        return;
      }
      if (!SIAB.progresso.dados.caderno.some((n) => n.relatorioId === atual.id))
        SIAB.progresso.anotar({
          tipo: "experiencia",
          titulo:
            atual.roteiro?.titulo ||
            atual.montagem?.titulo ||
            "Experiência na bancada",
          relatorioId: atual.id,
          linhas: [["Relatório", "Disponível para reabrir"]],
        });
      SIAB.notice("Referência ao relatório registrada no Caderno.");
    };
    SIAB.$("relatorio-voltar").onclick = () => {
      if (SIAB.atividades?.ativa) SIAB.atividades.retomar();
      else SIAB.irPara(arquivoAberto ? "#/caderno" : "#/laboratorio");
    };
  }

  return {
    capturar,
    salvar,
    abrir,
    render,
    html,
    imprimir,
    preparar,
    ligar,
    configure,
    hypotheses,
    dadosHTML,
    obter: (id) => lerTodos()[id] || null,
    get atual() {
      return atual;
    },
  };
})();
SIAB.telas.relatorio = {
  secao: "relatorio",
  titulo: () => "Relatório",
  entrar: (id) => SIAB.relatorios.abrir(id),
};
