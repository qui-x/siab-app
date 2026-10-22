"use strict";
/* RC.4 — consulta sob demanda. Nenhuma ação do Manual cria tubos ou medições. */
SIAB.manualTela = (() => {
  const S = SIAB,
    $ = S.$,
    esc = S.escape,
    R = S.manualRegistry;
  let current = "",
    bound = false;
  const icon = S.icons.svg;
  const href = (id) => "#/manual/" + encodeURIComponent(id);
  function rich(text) {
    return String(text || "")
      .split(/(\[\[[^\]]+\]\])/g)
      .map((s) => {
        const match = s.match(/^\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]$/);
        if (!match) return esc(s);
        const t = R.resolve(match[1]);
        return t
          ? `<a href="${href(t.id)}">${esc(match[2] || t.title)}</a>`
          : esc(match[2] || match[1]);
      })
      .join("");
  }
  function actions(topic) {
    return (topic.actions || [])
      .map((a) =>
        a.route
          ? `<a class="secondary-btn" href="${esc(a.route)}">${esc(a.label)} ${icon("arrow")}</a>`
          : `<button type="button" class="secondary-btn" data-manual-command="${esc(a.command)}">${esc(a.label)}</button>`,
      )
      .join("");
  }
  function topicLink(t, compact = false) {
    const cat = R.category(t.category);
    return `<a class="manual-topic-link${compact ? " compact" : ""}" href="${href(t.id)}"><span class="manual-symbol">${icon({ historico: "history", tabela: "table", aprender: "learn", projetor: "projector", preparo: "prepare" }[t.id] || cat.icon)}</span><span><strong>${esc(t.title)}</strong><span>${esc(t.summary)}</span></span>${icon("arrow")}</a>`;
  }
  function diagram(kind) {
    if (kind === "workspace")
      return `<figure class="manual-diagram manual-workspace-map"><div class="manual-map-actions"><a href="${href("bancada")}">${icon("setup")}Montagem</a><a href="${href("painel-medir")}">${icon("eye")}Ver</a><a href="${href("tabela")}">${icon("data")}Dados</a></div><div class="manual-map-scene"><svg viewBox="0 0 180 160" role="img" aria-label="Recipiente ao centro, com espaço livre para observar o experimento"><path class="glass" d="M62 12h56M68 12v112a22 22 0 0 0 44 0V12"/><path class="liquid" d="M70 91h40v33a20 20 0 0 1-40 0Z"/><path class="ticks" d="M102 35h10M105 51h7M102 67h10"/><circle cx="77" cy="111" r="3" class="bubble"/><circle cx="96" cy="123" r="2" class="bubble"/></svg><div><strong>Seu experimento em foco</strong><span>Gotejar · Agitar · Medir</span></div></div><figcaption>Abra uma ferramenta quando precisar. Fechar o painel devolve espaço à bancada.</figcaption></figure>`;
    if (kind === "meter")
      return `<figure class="manual-diagram"><svg class="manual-instrument" viewBox="0 0 520 210" role="img" aria-label="Esquema do pHmetro: visor ligado por um cabo ao eletrodo mergulhado na solução. Aguarde estabilizar antes de interpretar a leitura."><rect x="25" y="30" width="218" height="150" rx="16" class="device"/><rect x="45" y="52" width="177" height="64" rx="6" class="screen"/><text x="63" y="91" class="readout">— —</text><text x="165" y="94">pH</text><text x="46" y="150">Visor</text><path d="M242 65C310 0 395 20 395 64" class="glass"/><path d="M348 95v76q0 22 46 22t46-22V95" class="glass"/><path d="M351 140h86v30q0 20-43 20t-43-20Z" class="liquid"/><rect x="389" y="62" width="13" height="98" rx="5" class="probe"/><text x="312" y="47">Eletrodo</text></svg><figcaption>Esquema do instrumento. O visor só apresenta uma leitura depois da medição.</figcaption></figure>`;
    if (kind === "strip")
      return `<figure class="manual-diagram"><div class="manual-strip"><span aria-hidden="true"></span><div><strong>Uma estimativa por faixa</strong><p>Compare a cor com a escala de 0 a 14. A leitura é apresentada em passos de 1 unidade de pH.</p></div></div><figcaption>A descrição e o número acompanham a cor; não é necessário distinguir apenas o tom.</figcaption></figure>`;
    if (kind === "compaction")
      return `<figure class="manual-diagram"><div class="manual-comparison"><div><strong>Compacta</strong><p>Um grupo de leituras compatíveis</p><span>Contagem + faixa + Ver medições</span></div>${icon("exchange")}<div><strong>Completa</strong><p>Cada leitura individual</p><span>Técnica + valor + contexto</span></div></div><figcaption>São duas apresentações dos mesmos dados. O agrupamento não remove registros.</figcaption></figure>`;
    if (kind === "instruments")
      return `<div class="manual-reference-table" role="region" aria-label="Comparação dos instrumentos" tabindex="0"><table><caption>Qual evidência você precisa?</caption><thead><tr><th scope="col">Técnica</th><th scope="col">Evidência</th><th scope="col">Limite principal</th></tr></thead><tbody><tr><th scope="row"><a href="${href("indicadores")}">Indicador</a></th><td>Cor e faixa de viragem</td><td>Não dá pH exato</td></tr><tr><th scope="row"><a href="${href("fita")}">Fita de pH</a></th><td>Estimativa de pH</td><td>Resolução de 1 unidade</td></tr><tr><th scope="row"><a href="${href("phmetro")}">pHmetro</a></th><td>Leitura numérica</td><td>Resolução simulada de 0,01</td></tr><tr><th scope="row"><a href="${href("condutividade")}">Condutivímetro</a></th><td>Condução em µS/cm</td><td>Estimativa ideal</td></tr><tr><th scope="row"><a href="${href("temperatura")}">Termômetro</a></th><td>Temperatura da solução</td><td>Condição do modelo</td></tr></tbody></table></div>`;
    const flow = {
      measurement: [
        ["Selecionar", "Recipiente em foco"],
        ["Medir", "Acionar o instrumento"],
        ["Interpretar", "Conferir técnica e valor"],
      ],
      titration: [
        ["Preparar", "Solução e reagente"],
        ["Adicionar e medir", "Registrar a cada intervenção"],
        ["Analisar", "Volume e mudança de pH"],
      ],
      report: [
        ["Investigar", "Obter evidências"],
        ["Interpretar", "Escrever suas conclusões"],
        ["Compartilhar", "Imprimir / Salvar como PDF"],
      ],
      modules: [
        ["Explorar", "Observar e manipular"],
        ["Medir", "Controlar volumes e coletar"],
        ["Calcular", "Relacionar quantidades"],
      ],
      representations: [
        ["Recipiente", "Cor e transformação visível"],
        ["Partículas", "Moléculas e íons"],
        ["Símbolos", "Equações e números"],
      ],
    }[kind];
    return flow
      ? `<figure class="manual-diagram"><ol class="manual-flow${kind === "modules" ? " independent" : ""}">${flow.map(([title, detail], i) => `<li><strong>${esc(title)}</strong><span>${esc(detail)}</span>${kind !== "modules" && i < flow.length - 1 ? icon("flow", "manual-flow-arrow") : ""}</li>`).join("")}</ol><figcaption>${kind === "modules" ? "Módulos independentes: escolha pelo objetivo, sem ordem obrigatória." : kind === "representations" ? "Três formas de interpretar o mesmo sistema." : "Uma sequência de consulta para orientar sua investigação."}</figcaption></figure>`
      : "";
  }
  function generated(kind) {
    if (kind === "substances") {
      return `<p class="manual-note">Referência: soluções mecanísticas a 0,0100 mol/L, temperatura de 25 °C, sem adições. Amostras usam sua composição representativa. O pH abaixo é calculado, não medido.</p><div class="manual-reference-table" tabindex="0" role="region" aria-label="Biblioteca de substâncias"><table><caption>Substâncias do catálogo</caption><thead><tr><th scope="col">Substância</th><th scope="col">Fórmula</th><th scope="col">Classificação</th><th scope="col">pH calculado</th></tr></thead><tbody>${Object.entries(
        S.solutions,
      )
        .map(([id, x]) => {
          const t = {
            ...S.TUBE_DEFAULTS,
            id: 0,
            name: "Referência",
            solution: id,
            concentration: x.kind === "sample" || x.kind === "water" ? 0 : 0.01,
            titrant: "water",
            indicator: "none",
            temperature: 25,
            additions: [],
          };
          return `<tr><th scope="row">${esc(x.name)}</th><td>${esc(x.kind === "sample" ? "—" : x.formula || "—")}</td><td>${esc(x.label || x.kind)}</td><td>${S.phFormat(S.chem.solve(t))}</td></tr>`;
        })
        .join("")}</tbody></table></div>`;
    }
    if (kind === "indicators")
      return `<div class="manual-reference-table" tabindex="0" role="region" aria-label="Biblioteca de indicadores"><table><caption>Faixas e cores de referência</caption><thead><tr><th scope="col">Indicador</th><th scope="col">Faixa de pH</th><th scope="col">Cores</th></tr></thead><tbody>${Object.entries(
        S.indicators,
      )
        .filter(([id]) => id !== "none")
        .map(([id, x]) => {
          const dot = (pH) =>
            `<span class="mini-dot" aria-hidden="true" style="background:rgb(${S.chem.color(id, pH).rgb.join(",")})"></span>`;
          const colors = x.acid
            ? `${dot(0)}${esc(x.acidName)} → ${dot((x.low + x.high) / 2)}${esc(x.middleName)} → ${dot(14)}${esc(x.baseName)}`
            : S.chem
                .colorNames(id)
                .map((name) => {
                  const [a, b] = S.chem.colorRange(id, name);
                  return `${dot((a + b) / 2)}${esc(name)} (${S.format(a, 0)}–${S.format(b, 0)})`;
                })
                .join(" · ");
          return `<tr><th scope="row">${esc(x.name)}</th><td>${x.acid ? S.format(x.low, 1) + " a " + S.format(x.high, 1) : "Carta aproximada de 1 a 14"}</td><td>${colors}</td></tr>`;
        })
        .join("")}</tbody></table></div>`;
    return "";
  }
  function accordion(t, print = false) {
    return t.details
      .map((d, i) =>
        print
          ? `<section class="manual-print-detail"><h3>${esc(d.title)}</h3><p>${rich(d.text)}</p></section>`
          : `<section class="manual-accordion"><h3><button type="button" class="secondary-btn" aria-expanded="false" aria-controls="manual-detail-${t.id}-${i}" id="manual-toggle-${t.id}-${i}" data-manual-expand>${esc(d.title)}${icon("dropdown", "disclosure-icon")}</button></h3><div id="manual-detail-${t.id}-${i}" aria-labelledby="manual-toggle-${t.id}-${i}" hidden><p>${rich(d.text)}</p></div></section>`,
      )
      .join("");
  }
  function article(t, print = false) {
    const cat = R.category(t.category),
      children =
        t.id === cat.id
          ? R.topics.filter((x) => x.category === cat.id && x.id !== t.id)
          : [];
    return `${!print ? `<nav class="manual-breadcrumb" aria-label="Caminho do Manual"><a href="#/manual">Manual</a>${t.id !== cat.id ? `<span aria-hidden="true">/</span><a href="${href(cat.id)}">${esc(cat.title)}</a>` : ""}<span aria-hidden="true">/</span><span aria-current="page">${esc(t.title)}</span></nav>` : ""}<article class="manual-article" data-manual-topic="${t.id}"><header><p class="eyebrow">${esc(cat.title)}</p><h1 ${!print ? 'id="manual-titulo" data-foco tabindex="-1"' : ""}>${esc(t.title)}</h1><p class="manual-lead">${rich(t.summary)}</p></header><section class="manual-purpose"><h2>Para que serve</h2><p>${rich(t.purpose)}</p></section>${t.diagram ? diagram(t.diagram) : ""}<section class="manual-how"><h2>Como usar</h2><ol class="manual-steps">${t.steps.map((s) => `<li>${rich(s)}</li>`).join("")}</ol></section>${t.example ? `<aside class="manual-example" aria-label="Exemplo"><strong>Exemplo</strong><p>${rich(t.example)}</p></aside>` : ""}${!print && t.actions?.length ? `<div class="manual-actions"><p>Use a função no programa</p>${actions(t)}</div>` : ""}${t.generated ? generated(t.generated) : ""}${t.details.length ? `<section class="manual-details"><h2>Detalhes importantes</h2>${accordion(t, print)}</section>` : ""}${!print && children.length ? `<section class="manual-more"><h2>Nesta categoria</h2><div class="manual-topic-list">${children.map((x) => topicLink(x, true)).join("")}</div></section>` : ""}${
      t.related.length
        ? `<nav class="manual-related" aria-label="Veja também"><h2>Veja também</h2><div>${t.related
            .map((id) => {
              const x = R.resolve(id);
              return `<a href="${href(x.id)}">${esc(x.title)} ${icon("arrow")}</a>`;
            })
            .join("")}</div></nav>`
        : ""
    }${(t.references || []).length ? `<section><h2>Fontes</h2><ul>${t.references.map((ref) => `<li>${ref.url ? `<a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.label)}</a>` : esc(ref.label)}</li>`).join("")}</ul></section>` : ""}</article>${!print ? `<a class="quiet-btn manual-back" href="${t.id === cat.id ? "#/manual" : href(cat.id)}">${icon("back")}Voltar ${t.id === cat.id ? "ao início do Manual" : "a " + esc(cat.title)}</a>` : ""}`;
  }
  function home() {
    return `<header class="manual-hero"><div><p class="eyebrow">MANUAL DO USUÁRIO</p><h1 id="manual-titulo" data-foco tabindex="-1">Encontre seu próximo passo.</h1><p>Uma dúvida na bancada? Consulte uma ferramenta, entenda uma leitura ou descubra por onde começar.</p><div class="manual-hero-actions"><a class="primary-btn" href="${href("comecar")}">Começar a usar ${icon("arrow")}</a><button class="quiet-btn" type="button" data-manual-command="tour">Iniciar tour da bancada</button></div></div>${diagram("workspace")}</header><nav class="manual-shortcuts" aria-label="Consultas rápidas"><span>QUERO SABER</span>${[
      ["phmetro", "Como medir pH"],
      ["montagens", "Como abrir uma montagem"],
      ["problemas", "Por que uma opção não aparece"],
    ]
      .map(
        ([id, label]) =>
          `<a href="${href(id)}">${esc(label)} ${icon("arrow")}</a>`,
      )
      .join("")}</nav>${[
      "Investigue",
      "Prepare e registre",
      "Orientação",
      "Para ensinar",
    ]
      .map(
        (group) =>
          `<section class="manual-category-section"><h2>${group}</h2><div class="manual-category-grid">${R.categories
            .filter((c) => c.group === group)
            .map(
              (c) =>
                `<a class="manual-category" href="${href(c.id)}"><span class="manual-symbol">${icon(c.icon)}</span><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="manual-category-action">Consultar ${icon("arrow")}</span></a>`,
            )
            .join("")}</div></section>`,
      )
      .join("")}`;
  }
  function setIndex(open, focus = false) {
    const button = $("manual-index-toggle");
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "Fechar índice" : "Índice do Manual";
    document
      .querySelector(".tela-manual")
      .classList.toggle("manual-index-open", open);
    if (focus) button.focus();
  }
  function index(id) {
    const cat = R.resolve(id)?.category;
    $("manual-indice").innerHTML =
      `<a class="manual-index-home" href="#/manual">${icon("book")}Início do Manual</a><ul>${R.categories
        .map(
          (c) =>
            `<li><a href="${href(c.id)}" ${id === c.id ? 'aria-current="page"' : ""}>${icon(c.icon)}${esc(c.title)}</a>${
              cat === c.id
                ? `<ul>${R.topics
                    .filter((t) => t.category === c.id && t.id !== c.id)
                    .map(
                      (t) =>
                        `<li><a href="${href(t.id)}" ${t.id === id ? 'aria-current="page"' : ""}>${esc(t.title)}</a></li>`,
                    )
                    .join("")}</ul>`
                : ""
            }</li>`,
        )
        .join("")}</ul>`;
  }
  function render(id = "", options = {}) {
    current = id;
    const topic = R.resolve(id),
      screen = document.querySelector(".tela-manual");
    screen.dataset.manualView = id ? "topic" : "home";
    if (!options.keepSearch) $("manual-busca").value = "";
    $("manual-clear").hidden = !$("manual-busca").value;
    setIndex(false);
    index(topic?.id || "");
    $("manual-imprimir").textContent =
      id && topic ? "Imprimir tópico" : "Imprimir guia rápido";
    $("manual-conteudo").innerHTML = id
      ? topic
        ? article(topic)
        : `<div class="manual-empty"><h1 id="manual-titulo" data-foco tabindex="-1">Tópico não encontrado</h1><p>Este endereço não corresponde a um tópico do Manual.</p><a class="secondary-btn" href="#/manual">Voltar ao índice</a></div>`
      : home();
    $("manual-status").textContent = "";
  }
  function search() {
    const query = $("manual-busca").value.trim();
    $("manual-clear").hidden = !query;
    if (!query) {
      render(current, { keepSearch: true });
      return;
    }
    const items = R.search(query);
    document.querySelector(".tela-manual").dataset.manualView = "search";
    setIndex(false);
    $("manual-status").textContent = items.length
      ? `${items.length} ${items.length === 1 ? "tópico encontrado" : "tópicos encontrados"}.`
      : "Nenhum tópico encontrado.";
    $("manual-conteudo").innerHTML =
      `<section class="manual-search-results"><p class="eyebrow">BUSCA NO MANUAL</p><h1 id="manual-titulo" data-foco tabindex="-1">${items.length ? "Resultados para “" + esc(query) + "”" : "Nenhum tópico encontrado"}</h1><p>${items.length ? "Escolha um tópico para abrir a explicação." : "Tente outro termo, como “pHmetro”, “fita” ou “relatório”. Você também pode voltar ao índice."}</p>${items.length ? `<ul>${items.map((t) => `<li><a href="${href(t.id)}"><span class="eyebrow">${esc(R.category(t.category).title)}</span><h2>${esc(t.title)}</h2><p>${esc(t.summary)}</p>${icon("arrow")}</a></li>`).join("")}</ul>` : ""}<a class="quiet-btn" href="#/manual">Voltar ao índice</a></section>`;
    $("manual-imprimir").textContent = "Imprimir guia rápido";
  }
  function preparePrint() {
    if (S.rota.nome !== "manual") return;
    const topic = R.resolve(current),
      searching = Boolean($("manual-busca").value.trim());
    $("manual-print").innerHTML =
      topic && !searching
        ? article(topic, true)
        : `<header><p>SIAB · Manual do Usuário</p><h1>Guia rápido de consulta</h1><p>Escolha o caminho pela sua dúvida. O Manual digital inclui instruções e referências completas para cada tópico.</p></header>${R.categories
            .map((c) => {
              const t = R.resolve(c.id);
              return `<section class="manual-print-category"><h2>${esc(c.title)}</h2><p>${rich(t.summary)}</p><ol>${t.steps
                .slice(0, 3)
                .map((s) => `<li>${rich(s)}</li>`)
                .join("")}</ol></section>`;
            })
            .join("")}`;
  }
  function bind() {
    if (bound) return;
    bound = true;
    $("manual-busca").addEventListener("input", search);
    $("manual-search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      search();
      $("manual-titulo")?.focus();
    });
    $("manual-clear").addEventListener("click", () => {
      $("manual-busca").value = "";
      search();
      $("manual-busca").focus();
    });
    $("manual-index-toggle").addEventListener("click", () =>
      setIndex(
        $("manual-index-toggle").getAttribute("aria-expanded") !== "true",
      ),
    );
    document.querySelector(".tela-manual").addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        $("manual-index-toggle").getAttribute("aria-expanded") === "true"
      ) {
        e.preventDefault();
        setIndex(false, true);
      }
    });
    document.querySelector(".tela-manual").addEventListener("click", (e) => {
      const expand = e.target.closest("[data-manual-expand]");
      if (expand) {
        const open = expand.getAttribute("aria-expanded") !== "true";
        expand.setAttribute("aria-expanded", String(open));
        $(expand.getAttribute("aria-controls")).hidden = !open;
      }
      const command = e.target.closest("[data-manual-command]")?.dataset
        .manualCommand;
      if (S.ActivityContext.restricted()) return;
      if (command === "tour") S.tour.iniciar();
      if (command === "a11y") S.gaveta.abrir("acessibilidade");
      const same = e.target.closest("a[href]");
      if (same && same.getAttribute("href") === location.hash) {
        e.preventDefault();
        S.irPara(same.getAttribute("href"));
      }
    });
    $("manual-imprimir").addEventListener("click", () => {
      preparePrint();
      window.print();
    });
    window.addEventListener("beforeprint", preparePrint);
    window.addEventListener("afterprint", () => {
      $("manual-print").innerHTML = "";
    });
    $("boas-vindas-fechar").addEventListener("click", () => {
      S.ajuda.marcarVisto();
      $("boas-vindas").hidden = true;
      $(S.current() ? "tube-name" : "vazia-titulo").focus();
    });
    S.ajuda.bind();
  }
  return {
    render,
    ligar: bind,
    prepararImpressao: preparePrint,
    icon,
    rich,
    href,
    // Compatibility: the drawer still owns the operational catalog action.
    montar: (id) => S.montarMontagem(id),
  };
})();

SIAB.ajuda = (() => {
  const S = SIAB,
    $ = S.$,
    R = S.manualRegistry,
    VISTO = "siab_manual_visto";
  let opener = null;
  function topicFor(target) {
    if (target?.dataset.manualHelp) return target.dataset.manualHelp;
    const id = target?.getAttribute("href")?.match(/^#\/manual\/(.+)$/)?.[1];
    // The general Ver help follows the active tool; other help links keep their own topic.
    if (id === "ver" || target?.hasAttribute("data-activity-help"))
      return S.state.verTab || "bancada";
    return id || S.state.verTab || "bancada";
  }
  function contextual(id = S.state.verTab, target = document.activeElement) {
    const t = R.resolve(id) || R.resolve("bancada"),
      restricted = S.ActivityContext.restricted();
    opener = target;
    S.gaveta.fechar();
    $("activity-help-title").textContent = t.title;
    $("activity-help-content").innerHTML =
      `<div class="manual-context"><p class="manual-context-summary">${S.escape(t.summary)}</p><p>${S.escape(t.purpose.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, key, label) => label || R.resolve(key)?.title || key))}</p><div class="manual-context-next"><strong>Próximo passo</strong><p>${S.escape(t.steps[0] || "")}</p></div>${restricted ? '<p class="field-hint">A ajuda permanece nesta atividade. Use somente os recursos disponibilizados pelo professor.</p>' : `<div class="manual-context-links">${t.id === "ph" ? '<a class="secondary-btn" data-manual-help-link href="#/manual/painel-medir">Como medir pH</a>' : ""}<a class="secondary-btn" data-manual-help-link href="${S.manualTela.href(t.id)}">Abrir no Manual ${S.manualTela.icon("arrow")}</a></div>`}</div>`;
    const dialog = $("activity-help-dialog");
    if (!dialog.open) dialog.showModal();
  }
  function bind() {
    document.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest(".ajuda-link,[data-manual-help]");
        if (!link) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        contextual(topicFor(link), link);
      },
      true,
    );
    $("activity-help-dialog").addEventListener("click", (e) => {
      const a = e.target.closest("[data-manual-help-link]");
      if (!a) return;
      e.preventDefault();
      if (S.ActivityContext.restricted()) return;
      opener = null;
      $("activity-help-dialog").close();
      S.irPara(a.getAttribute("href"));
    });
    $("activity-help-dialog").addEventListener("close", () => {
      const target = opener;
      opener = null;
      requestAnimationFrame(() => {
        if (S.rota.nome !== "laboratorio" && S.rota.nome !== "missao") return;
        if (
          target?.isConnected &&
          target.getClientRects().length &&
          !target.closest("[inert]")
        )
          target.focus({ preventScroll: true });
      });
    });
  }
  return {
    contextual,
    topicFor,
    bind,
    jaViu: () => S.armazenamento.ler(VISTO, false),
    marcarVisto: () => S.armazenamento.gravar(VISTO, true),
    aplicarPendente: () => {},
    mostrar: (id) =>
      S.irPara(S.manualTela.href(R.resolve(id)?.id || "bancada")),
  };
})();
SIAB.telas.manual = {
  secao: "manual",
  titulo: (id) => SIAB.manualRegistry.resolve(id)?.title || "Manual",
  entrar(id) {
    SIAB.ajuda.marcarVisto();
    SIAB.manualTela.render(id);
  },
  sair() {
    SIAB.$("manual-print").innerHTML = "";
  },
};
