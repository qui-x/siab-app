"use strict";
/* Desenho da bancada: tubo em foco, régua, conta-gotas, tira de tubos,
   visão geral, painel do laboratório e painel VER. */
SIAB.solutionSummary = (id, concentration, dilution = 1) => {
  const solution = SIAB.solutions[id];
  if (solution.kind === "sample")
    return `${solution.name} · ${dilution === 1 ? "como preparada" : "1 parte + " + (dilution - 1) + " de água"}`;
  if (solution.kind === "water") return "Água pura";
  return `${solution.formula} · ${SIAB.format(concentration, 4)} mol/L`;
};

// Nome do indicador de um recipiente (ou da mistura de indicadores).
SIAB.nomeIndicador = (t, curto = false) => {
  const lista = (t.indicadores || []).filter((x) => x.id !== "none");
  if (lista.length > 1)
    return curto
      ? "Mistura"
      : `Mistura de indicadores (${lista.map((x) => SIAB.indicators[x.id].name).join(", ")})`;
  return SIAB.indicators[t.indicator][curto ? "short" : "name"];
};

// Resumo do que há no recipiente (uma solução ou a mistura de vários tubos).
// O volume usa as casas da escala do recipiente; amostra como preparada mostra
// só o nome (a diluição aparece quando existe).
SIAB.resumoConteudo = (t) => {
  const cap = SIAB.capacidade(t);
  if (t.componentes?.length) {
    return `Mistura de ${t.componentes.length} ${t.componentes.length === 1 ? "componente" : "componentes"} · ${SIAB.volumeTexto(
      SIAB.chem.base(t).reduce((s, x) => s + x.volume, 0),
      cap,
    )} mL`;
  }
  const x = SIAB.solutions[t.solution];
  const conteudo =
    x.kind === "sample" && (t.dilution || 1) === 1
      ? x.name
      : SIAB.solutionSummary(t.solution, t.concentration, t.dilution);
  return `${conteudo} · ${SIAB.volumeTexto(t.initialVolume, cap)} mL iniciais`;
};

SIAB.render = (syncForm = false) => {
  const $ = SIAB.$,
    s = SIAB.state,
    t = SIAB.current();
  if ($("workspace").hidden) return;
  if (!t) {
    SIAB.renderVazia();
    return;
  }
  $("workspace").classList.remove("vazia");
  $("bancada-vazia").hidden = true;
  $("overview-tab").disabled = false;
  const cfg = SIAB.bancada.config;
  const pode = (controle) => cfg.controles.has(controle);
  const i = s.tubes.indexOf(t);
  const r = SIAB.chem.solve(t);
  const c = SIAB.chem.liquid(t, s.indicatorOnly, r);
  const targets = SIAB.targets(t);
  const ind = SIAB.indicators[t.indicator];
  const rgb = `rgb(${c.rgb.join(",")})`;

  $("workspace").dataset.modo = cfg.modo;
  $("workspace").classList.toggle("overview", s.view === "overview");
  $("focus-view").hidden = s.view !== "focus";
  $("overview-view").hidden = s.view !== "overview";
  $("focus-tab").setAttribute("aria-pressed", String(s.view === "focus"));
  $("overview-tab").setAttribute("aria-pressed", String(s.view === "overview"));
  $("overview-count").textContent = s.tubes.length;
  $("bench-mode").textContent =
    cfg.modo === "missao" ? "MISSÃO" : `MÓDULO · ${s.level.toUpperCase()}`;
  $("tube-count").textContent = `${s.tubes.length}`;
  // Botão do cabeçalho que abre o painel no celular (texto visível dentro do nome acessível).
  $("prepare-btn").querySelector(".header-btn-texto").textContent =
    cfg.modo === "missao" ? "Missão" : "Prateleira";
  $("prepare-btn").setAttribute(
    "aria-label",
    cfg.modo === "missao"
      ? "Abrir painel da missão"
      : "Abrir prateleira e ajustes",
  );

  // Cabeçalho do tubo.
  const vidro = SIAB.VIDRARIAS[t.vidraria || s.vidraria] || SIAB.VIDRARIAS.tubo;
  const capacidade = SIAB.capacidade(t);
  const escala = SIAB.escala(capacidade);
  // A capacidade aparece uma vez só, junto do volume ("10,3 mL de 50 mL").
  $("tube-index").textContent =
    `${vidro.curto.toUpperCase()} · ${i + 1} DE ${s.tubes.length}`;
  $("tube-name").textContent = t.name;
  $("sample-summary").textContent =
    `${t.componentes?.length ? `Mistura de ${t.componentes.length} componentes` : SIAB.solutionSummary(t.solution, t.concentration, t.dilution)} · ${SIAB.format(r.temperature, 1)} °C`;
  $("sample-model-note").hidden = !r.approximate;
  $("rename-btn").hidden = !pode("renomear");

  // Leitura.
  $("ph-value").textContent = SIAB.instrumentos.leitura(t).curto;
  const leitura = SIAB.instrumentos.leitura(t);
  $("ph-phase").textContent =
    leitura.valor == null
      ? ""
      : leitura.anterior
        ? "Leitura anterior"
        : "Leitura registrada";
  // Olho: botão de alternar "Mostrar pH" (pressionado = pH à vista); a dica diz a ação.
  $("ph-toggle").setAttribute("aria-pressed", String(s.showPH));
  $("ph-toggle").title = s.showPH ? "Ocultar pH" : "Mostrar pH";
  $("ph-toggle").hidden = true;
  $("volume-value").textContent = SIAB.format(r.volume, escala.casas);
  $("temperature-value").hidden = r.temperature === 25;
  $("temperature-value").textContent = `${SIAB.format(r.temperature, 0)} °C`;
  // Atualiza (não recria) o desenho: o nível e a cor mudam com movimento.
  SIAB.vidro.desenhar($("large-tube"), t, s.vidraria);
  $("color-name").textContent = c.name;
  $("color-swatch").style.background = rgb;
  $("color-swatch").style.opacity = c.opacity;
  const nomeInd = SIAB.nomeIndicador(t);
  $("indicator-name").textContent = c.masked
    ? `${nomeInd}: ${c.indicatorName} + amostra ${c.pigmentName}`
    : nomeInd;
  $("capacity-value").textContent = SIAB.format(capacidade, 0);

  // Conta-gotas.
  const cheio = targets.some(
    (x) => SIAB.chem.solve(x).volume + x.dropVolume > SIAB.capacidade(x) + 1e-9,
  );
  $("dose-area").hidden = !pode("gotas");
  // No erlenmeyer, o titulante vem de uma bureta (com meia gota); nos outros, do conta-gotas.
  const bureta = vidro === SIAB.VIDRARIAS.erlenmeyer;
  $("titrant-label").textContent =
    `${bureta ? "Bureta" : "Conta-gotas"}: ${SIAB.solutionSummary(t.titrant, t.titrantConcentration, t.titrantDilution)}`;
  // Uma linha só: quantas gotas, quanto volume e o tamanho da gota.
  // O tamanho da gota só aparece nos módulos em que ele pode ser ajustado (Medir e Calcular).
  const nivelDose = cfg.modo === "missao" ? cfg.nivel : s.level;
  $("dose-summary").textContent =
    `${r.drops} ${r.drops === 1 ? "gota" : "gotas"} · ${SIAB.format(r.added)} mL${nivelDose !== "explorar" ? ` · gota de ${SIAB.format(t.dropVolume)} mL` : ""}${t.group ? ` · em cada um dos ${targets.length} tubos vinculados` : ""}`;
  $("drop-btn").textContent = t.group
    ? "+ Segure: gotas em cada tubo"
    : "+ Segure para gotejar";
  $("drop-btn").disabled = cheio;
  $("drop5-btn").disabled = cheio;
  $("drop1ml-btn").disabled = cheio;
  // Atalhos em mL conforme a capacidade (ver SIAB.ESCALAS em estado.js).
  const [atalho1, atalho2] = escala.atalhos;
  const rotuloMl = (ml) => `+${SIAB.format(ml, 0)} mL`;
  $("drop1ml-btn").dataset.ml = atalho1;
  $("drop1ml-btn").textContent = rotuloMl(atalho1);
  $("poe-btn").disabled = cheio;
  $("dose-shortcuts").hidden = !pode("atalhos") && !pode("poe");
  $("drop5-btn").hidden = !pode("atalhos");
  $("meia-gota-btn").hidden = !pode("atalhos") || !bureta;
  $("meia-gota-btn").disabled = targets.some(
    (x) =>
      SIAB.chem.solve(x).volume + x.dropVolume / 2 > SIAB.capacidade(x) + 1e-9,
  );
  $("drop1ml-btn").hidden = !pode("atalhos");
  // Segundo atalho: só nos recipientes maiores (encher 25 mL de gota em gota levaria minutos).
  $("drop5ml-btn").hidden = !pode("atalhos") || !atalho2;
  $("drop5ml-btn").disabled = cheio;
  if (atalho2) {
    $("drop5ml-btn").dataset.ml = atalho2;
    $("drop5ml-btn").textContent = rotuloMl(atalho2);
  }
  $("poe-btn").hidden = !pode("poe");
  const ultima = s.history.at(-1);
  $("undo-btn").disabled = !ultima;
  $("undo-btn").title = ultima
    ? `Desfazer: ${ultima.descricao}`
    : "Nada para desfazer";
  // Ponto final observado (onde a cor do indicador mudou e ficou) e, nos
  // módulos Medir e Calcular, a equivalência calculada: nem sempre coincidem.
  const pf = SIAB.pontoFinal(t);
  const eqCalc =
    nivelDose === "explorar" || r.equivalenceVolume === null
      ? ""
      : r.equivalencias.length > 1
        ? ` · equivalências calculadas: ${r.equivalencias.map((v) => SIAB.format(v)).join(" e ")} mL`
        : ` · equivalência calculada: ${SIAB.format(r.equivalenceVolume)} mL`;
  $("equivalence-note").textContent =
    r.atEquivalence && s.showPH
      ? "Ponto de equivalência · quantidades estequiométricas"
      : cheio
        ? `${vidro.curto} cheio: ${SIAB.format(capacidade, 0)} mL.`
        : pf
          ? `Ponto final observado: ${pf.de} → ${pf.para} com ${SIAB.format(pf.volume)} mL${eqCalc}`
          : "";
  // Sólido sem dissolver (turvação) e CO₂ acima da solubilidade (bolhas).
  const solidos = SIAB.chem.solidos(t, r);
  const notas = [];
  if (solidos.length)
    notas.push(
      `Turvo: ${solidos.map((x) => x.formula).join(" e ")} sem dissolver${
        nivelDose !== "explorar"
          ? ` (${SIAB.format(
              solidos.reduce((sum, x) => sum + x.gL, 0),
              2,
            )} g/L)`
          : ""
      }. Parado, assenta; Agitar mistura de novo.`,
    );
  if (SIAB.chem.co2(t, r).excesso > 0)
    notas.push(
      "Bolhas de CO₂ (ilustração: o cálculo do pH mantém o gás dissolvido).",
    );
  $("vidro-nota").textContent = notas.join(" ");
  $("group-notice").hidden = !t.group;
  $("group-notice").textContent = t.group
    ? `${SIAB.nomeGrupo(t)} · ${targets.length} tubos recebem gotas de ${SIAB.format(t.dropVolume)} mL juntos.${
        t.groupMode !== "drops"
          ? " Preparo compartilhado para comparar indicadores."
          : SIAB.textoCompartilhado(t)
            ? ` Compartilham ${SIAB.textoCompartilhado(t)}; cada tubo mantém o indicador.`
            : " Cada tubo usa seu próprio conta-gotas e mantém preparo e indicador individuais."
      }`
    : "";

  // Tira de tubos e visão geral.
  $("add-tube-btn").hidden = !pode("tubos");
  $("add-tube-btn").disabled = s.tubes.length >= SIAB.MAX_TUBES;
  $("tube-list").innerHTML = s.tubes
    .map((x, n) => {
      const v = SIAB.chem.solve(x),
        cor = SIAB.chem.liquid(x, s.indicatorOnly, v);
      return `<button type="button" class="tube-item-btn" data-tube="${x.id}" aria-current="${x.id === s.activeId}" aria-label="${SIAB.escape(x.name)}: ${cor.name}${", " + SIAB.instrumentos.leitura(x).texto}">
      <span class="mini-tube mini-${x.vidraria || s.vidraria}" style="--cor:rgb(${cor.rgb.join(",")});--nivel:${Math.min(1, v.volume / SIAB.capacidade(x))}" aria-hidden="true"></span>
      <span><strong>${SIAB.escape(x.name)}</strong><small>${n + 1} · ${SIAB.escape(SIAB.nomeIndicador(x, true))}${x.group ? " · " + SIAB.nomeGrupo(x) : ""}</small></span>
    </button>`;
    })
    .join("");
  if (s.view === "overview") {
    // Ordenar por pH: os recipientes do mais ácido ao mais básico, com uma
    // régua de pH que marca cada um (só com o pH à vista).
    const ordenar = Boolean(
      s.ordemPH && s.tubes.every((x) => SIAB.instrumentos.leitura(x).valida),
    );
    $("ordenar-ph-btn").setAttribute("aria-pressed", String(ordenar));
    $("ordenar-ph-btn").disabled = !s.tubes.every(
      (x) => SIAB.instrumentos.leitura(x).valida,
    );
    $("ordenar-ph-btn").title = "Ordenar pelas leituras instrumentais válidas";
    const lista = s.tubes.map((x, n) => ({ x, n, v: SIAB.chem.solve(x) }));
    if (ordenar)
      lista.sort(
        (p, q) =>
          SIAB.instrumentos.leitura(p.x).valor -
          SIAB.instrumentos.leitura(q.x).valor,
      );
    let groupSummary = $("overview-group-summary");
    if (!groupSummary) {
      groupSummary = document.createElement("div");
      groupSummary.id = "overview-group-summary";
      groupSummary.className = "overview-group-summary";
      $("overview-grid").before(groupSummary);
    }
    groupSummary.innerHTML = [
      ...new Set(s.tubes.map((x) => x.group).filter(Boolean)),
    ]
      .map((group) => {
        const tube = s.tubes.find((x) => x.group === group);
        return `<p>${SIAB.escape(SIAB.nomeGrupo(tube))} · ${SIAB.targets(tube).length} tubos · gotas compartilhadas${SIAB.textoCompartilhado(tube) ? ` · ${SIAB.escape(SIAB.textoCompartilhado(tube))}` : ""}</p>`;
      })
      .join("");
    $("overview-grid").innerHTML = lista
      .map(({ x, n, v }) => {
        const cor = SIAB.chem.liquid(x, s.indicatorOnly, v);
        return `<button type="button" class="overview-tube" data-tube="${x.id}" aria-current="${x.id === s.activeId}" aria-label="Abrir ${SIAB.escape(x.name)}"><span class="overview-num" aria-hidden="true">${n + 1}</span><span class="overview-visual">${SIAB.tubeSVG(x, "overview", true, s.vidraria)}</span><span class="overview-details"><strong>${SIAB.escape(x.name)}</strong><span class="small overview-sample">${SIAB.escape(x.componentes?.length ? `Mistura de ${x.componentes.length} componentes` : SIAB.solutions[x.solution].name)}</span><span class="small">${SIAB.escape(SIAB.nomeIndicador(x))}</span><span class="overview-color"><span class="mini-dot" style="background:rgb(${cor.rgb.join(",")})"></span>${cor.name}</span><span class="overview-readout"><span>${SIAB.volumeTexto(v.volume, SIAB.capacidade(x))} mL</span><span>${SIAB.instrumentos.leitura(x).texto}</span></span>${x.group ? `<span class="small overview-group">↔ ${SIAB.nomeGrupo(x)} · vinculado</span>` : ""}</span></button>`;
      })
      .join("");
  }

  SIAB.selecaoTubos.atualizar();

  // Painel do laboratório.
  if (cfg.modo === "laboratorio") {
    SIAB.modulos.render();
    SIAB.renderVidraria();
    SIAB.prateleira.render();
    SIAB.prateleira.renderIndicadores();
    $("indicator-range").textContent =
      ind.description ||
      (t.indicator === "universal"
        ? "Carta de cores aproximada de pH 1 a 14."
        : t.indicator === "none"
          ? "A solução é observada sem indicador."
          : `Faixa de viragem: pH ${SIAB.format(ind.low, 1)}–${SIAB.format(ind.high, 1)} · ${ind.acidName} → ${ind.baseName}.`);
    $("indicator-only").checked = s.indicatorOnly;
    // Recipiente de mistura: os números do preparo não se aplicam.
    $("ajustes").hidden =
      s.level === "explorar" || Boolean(t.componentes?.length);
    const amostraTubo = SIAB.isEveryday(t.solution),
      amostraGotas = SIAB.isEveryday(t.titrant);
    $("concentration-field").hidden =
      s.level !== "calcular" || amostraTubo || t.solution === "water";
    $("titrant-concentration-field").hidden =
      s.level !== "calcular" || amostraGotas || t.titrant === "water";
    $("dilution-field").hidden = !amostraTubo;
    $("titrant-dilution-field").hidden = !amostraGotas;
    $("compare-btn").disabled = SIAB.ActivityContext.restricted();
    $("unlink-btn").hidden = !t.group;
    $("restart-btn").disabled = !t.additions.length;
    if (syncForm) SIAB.syncForm();
  }

  SIAB.renderVer();
  SIAB.refreshSelects?.();
  SIAB.layoutBancada?.atualizar();
  SIAB.activityUI?.render();
  SIAB.workspace?.sync();
};

// Bancada sem tubos (é assim que o laboratório começa): orienta o primeiro
// passo e deixa a prateleira pronta. Tocar num frasco cria o Tubo 1.
SIAB.renderVazia = () => {
  const $ = SIAB.$,
    s = SIAB.state;
  s.view = "focus";
  SIAB.selecaoTubos.atualizar();
  $("workspace").dataset.modo = SIAB.bancada.config.modo;
  $("workspace").classList.add("vazia");
  $("workspace").classList.remove("overview");
  $("bancada-vazia").hidden = false;
  $("focus-view").hidden = false;
  $("overview-view").hidden = true;
  $("focus-tab").setAttribute("aria-pressed", "true");
  $("overview-tab").setAttribute("aria-pressed", "false");
  $("overview-tab").disabled = true;
  $("overview-count").textContent = "0";
  $("bench-mode").textContent = `MÓDULO · ${s.level.toUpperCase()}`;
  $("tube-count").textContent = "0";
  $("tube-list").innerHTML = "";
  $("add-tube-btn").hidden = false;
  $("add-tube-btn").disabled = false;
  $("prepare-btn").querySelector(".header-btn-texto").textContent =
    "Prateleira";
  $("prepare-btn").setAttribute("aria-label", "Abrir prateleira e ajustes");
  const ultima = s.history.at(-1);
  $("vazia-desfazer").hidden = !ultima;
  $("vazia-desfazer").title = ultima ? `Desfazer: ${ultima.descricao}` : "";
  SIAB.modulos.render();
  SIAB.renderVidraria();
  SIAB.prateleira.render();
  SIAB.renderVer();
  SIAB.activityUI?.render();
  SIAB.workspace?.sync();
};

// Escolha da vidraria e da capacidade na prateleira.
SIAB.renderVidraria = () => {
  const $ = SIAB.$,
    s = SIAB.state,
    v = s.vidraria;
  document.querySelectorAll('input[name="vidraria"]').forEach((x) => {
    x.checked = x.value === v;
  });
  const opcoes = SIAB.VIDRARIAS[v].capacidades;
  const capacidade = SIAB.capacidadeDaBancada(s);
  $("capacidade-grupo").hidden = opcoes.length < 2;
  const atual = [...document.querySelectorAll('input[name="capacidade"]')]
    .map((x) => x.value)
    .join();
  if (atual !== opcoes.join()) {
    $("capacidade-opcoes").innerHTML = opcoes
      .map(
        (ml) =>
          `<label><input type="radio" name="capacidade" value="${ml}"><span>${ml}</span></label>`,
      )
      .join("");
  }
  document.querySelectorAll('input[name="capacidade"]').forEach((x) => {
    x.checked = Number(x.value) === capacidade;
  });
  // Uma frase curta; o resto (volume inicial, atalhos, precisão) está no manual.
  $("vidraria-dica").textContent = SIAB.VIDRARIAS[v].dica;
  // O volume inicial pode ir até 80 % da capacidade.
  $("initial-volume").max = String(Math.round(capacidade * 0.8 * 100) / 100);
};

SIAB.syncForm = () => {
  const $ = SIAB.$,
    t = SIAB.current();
  if (!t) return;
  $("concentration").value = t.concentration;
  $("initial-volume").value = t.initialVolume;
  $("titrant-concentration").value = t.titrantConcentration;
  $("drop-volume").value = String(t.dropVolume);
  $("dilution-select").value = String(t.dilution || 1);
  $("titrant-dilution-select").value = String(t.titrantDilution || 1);
  SIAB.refreshSelects?.();
};

// Ponto final observado: a primeira gota em que o nome da cor do indicador
// mudou (para indicadores de duas cores). Calculado das gotas, sem guardar
// nada; com cache, porque a tela redesenha a cada gota.
const cachePontoFinal = new Map();
SIAB.pontoFinal = (t) => {
  const ind = SIAB.indicators[t.indicator];
  if (
    !t.additions.length ||
    !ind?.acid ||
    (t.indicadores || []).filter((x) => x.id !== "none").length > 1
  )
    return null;
  const chave = [
    t.id,
    t.solution,
    t.concentration,
    t.initialVolume,
    t.dilution,
    t.titrant,
    t.titrantConcentration,
    t.titrantDilution,
    t.indicator,
    t.temperature,
    t.additions.length,
    SIAB.chem.added(t),
    JSON.stringify(t.componentes || 0),
  ].join("|");
  if (cachePontoFinal.has(chave)) return cachePontoFinal.get(chave);
  let soma = 0,
    resposta = null;
  const nome = (v) =>
    SIAB.chem.indicatorColor(
      t,
      SIAB.chem.solve({ ...t, additions: v > 0 ? [v] : [] }).pH,
    ).name;
  const inicio = nome(0);
  for (let i = 0; i < t.additions.length; i++) {
    soma += t.additions[i];
    const agora = nome(soma);
    if (agora !== inicio) {
      resposta = { gotas: i + 1, volume: soma, de: inicio, para: agora };
      break;
    }
  }
  if (cachePontoFinal.size > 200) cachePontoFinal.clear();
  cachePontoFinal.set(chave, resposta);
  return resposta;
};
