"use strict";
SIAB.atividades = (() => {
  let ativa = null,
    loading = 0,
    escolhaSessao = false,
    restoringToken = null,
    restoringRoute = null;
  const instrumentos = [
    "indicador",
    "fita",
    "phmetro",
    "condutividade",
    "temperatura",
    "particulas",
    "equacoes",
    "graficos",
  ];
  const base64 = (a) =>
    btoa(String.fromCharCode(...a))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const bytes = (s) =>
    Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0),
    );
  function validar(c) {
    if (
      !c ||
      ![1, 2].includes(c.schema) ||
      !["roteiro", "missao", "montagem"].includes(c.tipo) ||
      !["livre", "restrita"].includes(c.navegacao) ||
      (c.relatorio != null && !["digital", "impresso"].includes(c.relatorio))
    )
      throw new Error("Configuração de atividade inválida.");
    const entry =
      c.tipo === "roteiro"
        ? SIAB.experimentos.find((x) => x.id === c.item)
        : c.tipo === "missao"
          ? SIAB.missoes.find((x) => x.id === c.item)
          : SIAB.montagens.find((x) => x.id === c.item);
    if (
      !entry ||
      c.modulo !==
        (entry.modulo || entry.bancada?.nivel || entry.nivel || "explorar")
    )
      throw new Error("Atividade incompatível com este catálogo.");
    if (
      !Number.isFinite(c.temperatura) ||
      c.temperatura < 0 ||
      c.temperatura > 100 ||
      !Array.isArray(c.instrumentos) ||
      c.instrumentos.some(
        (x) =>
          !instrumentos.includes(x) && !SIAB.ActivityContext.resourcePaths[x],
      )
    )
      throw new Error("Instrumentos ou temperatura inválidos.");
    SIAB.ActivityContext.validate(c);
    return {
      ...c,
      titulo: String(c.titulo || entry.titulo).slice(0, 200),
      identificacao: Object.fromEntries(
        ["nome", "turma", "data", "professor", "grupo"].map((k) => [
          k,
          String(c.identificacao?.[k] || "").slice(0, 160),
        ]),
      ),
    };
  }
  async function codificar(config) {
    if (!crypto?.subtle)
      throw new Error(
        "Geração de links requer contexto seguro (HTTPS, localhost ou arquivo local compatível).",
      );
    const c = validar(config),
      raw = crypto.getRandomValues(new Uint8Array(32)),
      iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
      "encrypt",
    ]);
    const body = new TextEncoder().encode(JSON.stringify(c));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      body,
    );
    return `v1.${base64(raw)}.${base64(iv)}.${base64(new Uint8Array(cipher))}`;
  }
  async function decodificar(token) {
    if (typeof token !== "string" || token.length > 18000)
      throw new Error("Link inválido.");
    const [v, k, i, c, ...extra] = token.split(".");
    if (v !== "v1" || extra.length || !k || !i || !c)
      throw new Error("Link incompleto.");
    const raw = bytes(k),
      iv = bytes(i);
    if (raw.length !== 32 || iv.length !== 12)
      throw new Error("Link inválido.");
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
      "decrypt",
    ]);
    const json = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      bytes(c),
    );
    return validar(JSON.parse(new TextDecoder().decode(json)));
  }
  const chave = (token) => "siab_atividade_" + token.split(".")[1];
  const rotaAtividade = () => `#/atividade/${ativa.token}`;
  const uuid = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const nova = (token, config) => ({
    token,
    config,
    sessionId: uuid(),
    etapa: "apresentacao",
    criada: new Date().toISOString(),
    identificacao: { ...config.identificacao },
  });
  const preparo = (b) =>
    JSON.stringify(
      (b?.tubes || []).map((t) => [
        t.solution,
        t.concentration,
        t.initialVolume,
        t.temperature,
        t.titrant,
        t.titrantConcentration,
        t.dilution,
        t.indicator,
        t.componentes || null,
      ]),
    );
  function temDados() {
    if (!ativa || ativa.etapa === "apresentacao") return false;
    const b = ativa.bench || SIAB.state,
      r = SIAB.relatorios.obter(b.reportId);
    return (
      b.tubes.some(
        (t) =>
          t.additions?.length ||
          (t.observacao?.rawMeasurements || t.observacao?.leituras || []).some(
            (m) => m.tecnica !== "indicador",
          ) ||
          (t.observacao?.eventos || []).some((e) => !e.leitura),
      ) ||
      Object.values(r?.aluno || {}).some((v) => String(v).trim()) ||
      Object.values(ativa.missao?.respostas || {}).some((v) =>
        String(v).trim(),
      ) ||
      (ativa.preparoInicial != null && preparo(b) !== ativa.preparoInicial)
    );
  }
  function consolidar() {
    if (!ativa || ativa.etapa === "apresentacao") return null;
    SIAB.state.tubes.forEach((t) => SIAB.instrumentos.parar(t));
    const r = SIAB.relatorios.capturar();
    salvarSessao();
    return r;
  }
  function registrarPratica() {
    if (!temDados()) return null;
    const r = consolidar();
    if (!r) return null;
    const campos = {
      tipo: "pratica",
      sessaoId: ativa.sessionId,
      relatorioId: r.id,
      titulo: ativa.config.titulo,
      estadoPratica:
        ativa.etapa === "finalizada" ? "Finalizada" : "Sessão encerrada",
      atividade: { tipo: ativa.config.tipo, item: ativa.config.item },
      atualizado: new Date().toISOString(),
      linhas: [
        [
          "Dados disponíveis",
          "Condições iniciais, medições, tabela, condições finais e relatório",
        ],
      ],
    };
    const existente = SIAB.progresso.dados.caderno.find(
      (n) => n.sessaoId === ativa.sessionId || n.relatorioId === r.id,
    );
    if (existente) {
      SIAB.progresso.atualizarNota(existente.id, campos);
      return existente.id;
    }
    return SIAB.progresso.anotar(campos);
  }
  function guardarRota(nome, parametro) {
    if (restoringToken) return { nome: "atividade", parametro: restoringToken };
    if (!SIAB.ActivityContext.restricted()) return { nome, parametro };
    const go = () => ({ nome: "atividade", parametro: ativa.token });
    if (nome === "atividade")
      return parametro === ativa.token ? { nome, parametro } : go();
    if (escolhaSessao) return go();
    if (
      ativa.etapa === "finalizada" &&
      ["laboratorio", "missao"].includes(nome)
    )
      return { nome: "relatorio", parametro: ativa.bench.reportId };
    if (["bancada", "relatorio", "finalizada"].includes(ativa.etapa)) {
      if (
        nome === "relatorio" &&
        (!parametro || parametro === SIAB.state?.reportId)
      )
        return { nome, parametro };
      if (
        ativa.config.tipo === "missao" &&
        (nome === "laboratorio" ||
          (nome === "missao" && parametro === ativa.config.item))
      )
        return { nome: "missao", parametro: ativa.config.item };
      if (ativa.config.tipo !== "missao" && nome === "laboratorio")
        return { nome, parametro: "" };
    }
    SIAB.notice("Navegação limitada à atividade em andamento.");
    return go();
  }
  function salvarSessao() {
    if (!ativa || escolhaSessao) return;
    const a = SIAB.motor.ativa;
    if (ativa.etapa !== "apresentacao") ativa.bench = SIAB.state;
    ativa.missao =
      a && ativa.etapa !== "apresentacao" && ativa.config.tipo === "missao"
        ? {
            id: a.def.id,
            respostas: a.respostas,
            evidencias: a.evidencias,
            visitados: a.visitados,
            concluida: a.concluida,
          }
        : null;
    ativa.context.stage = ativa.etapa;
    ativa.context.identity = { ...ativa.identificacao };
    SIAB.persistencia.salvar(chave(ativa.token), {
      ...ativa,
      context: undefined,
    });
    try {
      sessionStorage.setItem("siab_atividade_ativa", ativa.token);
    } catch (_) {}
  }
  function restaurar() {
    try {
      restoringToken = sessionStorage.getItem("siab_atividade_ativa");
      restoringRoute = restoringToken ? location.hash : null;
    } catch (_) {
      restoringToken = null;
    }
  }
  function restaurarBancada() {
    if (!ativa?.bench) return;
    const type = ativa.config.tipo === "missao" ? "mission" : "lab";
    ativa.bench = SIAB.ActivityContext.sanitize(
      ativa.bench,
      ativa.config,
      ativa.context,
    );
    SIAB.benches[type] = ativa.bench;
    SIAB.usarBancada(type);
    if (ativa.missao) SIAB.motor.restaurar(ativa.missao);
  }
  async function abrir(token) {
    if (SIAB.ActivityContext.restricted() && ativa.token !== token) {
      SIAB.notice("Encerre a atividade antes de abrir outra.");
      return false;
    }
    if (!ativa) SIAB.persistencia.salvar("siab_bancada_v2", SIAB.benches.lab);
    const turn = ++loading;
    SIAB.$("atividade-conteudo").innerHTML =
      '<p role="status">Abrindo atividade…</p>';
    try {
      const config = await decodificar(token);
      if (turn !== loading) return;
      const stored = SIAB.persistencia.ler(chave(token), null);
      const saved = stored?.token === token ? stored : null;
      if (ativa?.token !== token) {
        ativa = saved?.config
          ? { ...saved, config, token }
          : nova(token, config);
        ativa.sessionId ||=
          ativa.bench?.reportId || ativa.bench?.experiencia?.id || uuid();
        if (ativa.bench) ativa.bench.reportId = ativa.sessionId;
        escolhaSessao =
          !!saved?.bench &&
          !/^#\/(laboratorio|missao|relatorio)(?:\/|$)/.test(
            restoringRoute || "",
          );
      }
      ativa.context = SIAB.ActivityContext.create(
        config,
        ativa.identificacao,
        ativa.etapa,
      );
      const returnRoute = restoringRoute;
      restoringToken = null;
      restoringRoute = null;
      restaurarBancada();
      if (ativa.bench) ativa.preparoInicial ||= preparo(ativa.bench);
      salvarSessao();
      render();
      atualizarCabecalho();
      if (
        !escolhaSessao &&
        ativa.etapa === "bancada" &&
        /^#\/(laboratorio|missao)(?:\/|$)/.test(returnRoute || "")
      )
        retomar();
      if (
        !escolhaSessao &&
        returnRoute?.startsWith("#/relatorio") &&
        ativa.etapa !== "apresentacao"
      )
        SIAB.irPara(returnRoute);
    } catch (_) {
      restoringToken = null;
      SIAB.$("atividade-conteudo").innerHTML =
        '<h1 data-foco tabindex="-1">Não foi possível abrir a atividade</h1><p>O link está incompleto, foi alterado ou usa uma versão incompatível. Solicite o link completo ao professor.</p>';
    }
  }
  function render() {
    if (!ativa) return;
    const a = ativa,
      c = a.config,
      e = SIAB.escape;
    const escolha = escolhaSessao || a.etapa === "finalizada";
    SIAB.$("atividade-conteudo").innerHTML =
      `<h1 data-foco tabindex="-1">${e(c.titulo)}</h1><p>${{ roteiro: "Roteiro Experimental", missao: "Missão", montagem: "Montagem pronta" }[c.tipo]} · ${SIAB.MODULOS[c.modulo].nome}</p><p>${SIAB.format(c.temperatura, 1)} °C · Navegação ${c.navegacao}</p>${escolha ? `<section class="session-choice"><h2>${a.etapa === "finalizada" ? "Atividade finalizada" : "Uma sessão já foi iniciada"}</h2><p>Os dados desta sessão permanecem salvos neste navegador.</p><div class="actions"><button class="primary-btn" data-session-continue>${a.etapa === "finalizada" ? "Ver relatório anterior" : "Continuar sessão"}</button><button class="secondary-btn" data-session-new>${a.etapa === "finalizada" ? "Iniciar nova tentativa" : "Iniciar nova sessão"}</button></div></section>` : ["bancada", "relatorio"].includes(a.etapa) ? '<button class="primary-btn" data-activity-resume>Continuar na bancada</button><button class="secondary-btn" data-open-report>Abrir relatório</button>' : `<p>Prepare sua identificação para começar a investigação.</p><form id="atividade-iniciar">${SIAB.identificacaoHTML(a.identificacao)}<button class="primary-btn">Iniciar atividade</button></form>`}`;
  }

  function iniciar(ident) {
    if (!ativa || ativa.etapa !== "apresentacao") return false;
    const c = ativa.config;
    ativa.identificacao = ident;
    ativa.context.identity = { ...ident };
    const b = SIAB.ActivityContext.buildBench(c, ident);
    ativa.bench = SIAB.ActivityContext.sanitize(b, c, ativa.context);
    ativa.bench.reportId = ativa.sessionId;
    ativa.preparoInicial = preparo(ativa.bench);
    const type = c.tipo === "missao" ? "mission" : "lab";
    SIAB.benches[type] = ativa.bench;
    SIAB.usarBancada(type);
    if (c.tipo === "missao") SIAB.motor.restaurar({ id: c.item });
    ativa.etapa = "bancada";
    ativa.context.stage = "bancada";
    SIAB.loja.avisar();
    salvarSessao();
    atualizarCabecalho();
    retomar();
    return true;
  }
  function retomar() {
    if (!ativa) return;
    if (ativa.etapa === "finalizada") {
      SIAB.irPara(rotaAtividade());
      return;
    }
    escolhaSessao = false;
    salvarSessao();
    SIAB.irPara(
      ativa.config.tipo === "missao"
        ? `#/missao/${ativa.config.item}`
        : "#/laboratorio",
    );
  }
  function finalizar() {
    if (!ativa || escolhaSessao || ativa.etapa === "apresentacao") return;
    if (ativa.etapa !== "finalizada") {
      consolidar();
      ativa.etapa = "finalizada";
      ativa.finalizadaEm = new Date().toISOString();
      salvarSessao();
      atualizarCabecalho();
      SIAB.notice("Atividade finalizada. Seu relatório está disponível.");
    }
    SIAB.irPara(`#/relatorio/${ativa.bench.reportId}`);
  }
  function continuarSessao() {
    escolhaSessao = false;
    salvarSessao();
    atualizarCabecalho();
    if (ativa.etapa === "finalizada")
      SIAB.irPara(`#/relatorio/${ativa.bench.reportId}`);
    else retomar();
  }
  function novaSessao() {
    SIAB.confirmar(
      "Iniciar nova sessão?",
      "Os dados da sessão anterior serão preservados. A nova tentativa começa com a montagem original e uma nova identificação de sessão.",
      () => {
        escolhaSessao = false;
        registrarPratica();
        const { token, config } = ativa;
        ativa = nova(token, config);
        ativa.context = SIAB.ActivityContext.create(
          config,
          ativa.identificacao,
          ativa.etapa,
        );
        salvarSessao();
        render();
        atualizarCabecalho();
        SIAB.irPara(rotaAtividade());
      },
      "Iniciar nova sessão",
    );
  }
  function pedirEncerramento() {
    if (!ativa) return;
    const dados = temDados();
    SIAB.confirmar(
      "Encerrar atividade?",
      dados
        ? "Há dados registrados nesta prática. Os resultados serão registrados no Caderno para consulta posterior."
        : "Nenhum dado experimental foi registrado. Deseja sair da atividade?",
      encerrar,
      "Encerrar atividade",
      "default",
      dados
        ? {
            cancelar: "Continuar atividade",
            extra: {
              rotulo: "Abrir relatório antes de sair",
              acao: () => {
                escolhaSessao = false;
                consolidar();
                SIAB.irPara(`#/relatorio/${ativa.bench.reportId}`);
              },
            },
          }
        : {},
    );
  }
  function encerrar() {
    if (!ativa) return;
    escolhaSessao = false;
    registrarPratica();
    salvarSessao();
    ativa = null;
    restoringToken = null;
    try {
      sessionStorage.removeItem("siab_atividade_ativa");
    } catch (_) {}
    document.body.removeAttribute("data-restrita");
    SIAB.$("activity-banner").hidden = true;
    SIAB.benches.lab =
      SIAB.persistencia.ler("siab_bancada_v2", null) || SIAB.criarBancada();
    SIAB.usarBancada("lab");
    SIAB.activityUI?.render();
    SIAB.irPara("#/inicio");
  }
  function atualizarCabecalho() {
    const b = SIAB.$("activity-banner");
    if (!b) return;
    b.hidden = !ativa;
    document.body.dataset.restrita =
      ativa?.config.navegacao === "restrita" ? "true" : "false";
    SIAB.activityUI?.render();
    if (ativa) {
      SIAB.$("activity-caption").textContent =
        `ATIVIDADE EXPERIMENTAL${ativa.config.navegacao === "restrita" ? " · MODO RESTRITO" : ""} · ${ativa.config.titulo}`;
      SIAB.$("activity-finish").hidden =
        escolhaSessao ||
        ativa.etapa === "apresentacao" ||
        ativa.etapa === "finalizada";
    }
  }
  function ligar() {
    SIAB.$("atividade-conteudo").addEventListener("submit", (e) => {
      if (e.target.id !== "atividade-iniciar") return;
      e.preventDefault();
      iniciar(Object.fromEntries(new FormData(e.target)));
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-session-continue]")) continuarSessao();
      if (e.target.closest("[data-session-new]")) novaSessao();
      if (e.target.closest("[data-activity-resume]")) retomar();
      if (e.target.closest("[data-activity-close]"))
        SIAB.$("activity-exit").click();
    });
    SIAB.$("activity-finish").onclick = finalizar;
    SIAB.$("activity-exit").onclick = pedirEncerramento;
    SIAB.loja.assinar(salvarSessao);
    window.addEventListener("pagehide", salvarSessao);
  }
  return {
    instrumentos,
    validar,
    codificar,
    decodificar,
    guardarRota,
    salvarSessao,
    restaurar,
    abrir,
    iniciar,
    retomar,
    finalizar,
    encerrar,
    temDados,
    registrarPratica,
    novaSessao,
    pedirEncerramento,
    atualizarCabecalho,
    ligar,
    link: (token) => `${location.href.split("#")[0]}#/atividade/${token}`,
    get ativa() {
      return ativa;
    },
  };
})();
SIAB.telas.atividade = {
  secao: "atividade",
  titulo: () => "Atividade",
  entrar: (token) => SIAB.atividades.abrir(token),
};
