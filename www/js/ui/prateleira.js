"use strict";
/* Prateleira de frascos (substitui o antigo formulário de substância).
   Dois menus recolhíveis, "Tubo" e "Conta-gotas", mostram o frasco em uso.
   Abrir um deles mostra a lista de frascos logo abaixo dele; tocar em um
   frasco coloca a solução ali e o menu se fecha (menos rolagem na página).
   Os grupos da lista (frutas, alimentos, laboratório…) também se recolhem:
   abre só o grupo do frasco em uso; uma busca abre os grupos que têm resultado. */
SIAB.prateleira = (() => {
  const VIDRO = [214, 226, 240];
  const MENUS = { tube: "menu-tubo", titrant: "menu-gotas" };
  const ROTULOS = { tube: "Tubo", titrant: "Conta-gotas" };
  let aberto = null; // 'tube', 'titrant' ou null
  let gruposAbertos = null; // grupos abertos pela pessoa (null: ainda não mexeu)

  function corDoFrasco(solution) {
    if (solution.natural && solution.natural.opacity > 0.05)
      return `rgb(${solution.natural.rgb.join(",")})`;
    return `rgba(${VIDRO.join(",")},.35)`;
  }

  // O que está em uso no tubo selecionado, para o cabeçalho de cada menu.
  function emUso(destino) {
    const t = SIAB.current();
    if (!t)
      return {
        nome: destino === "tube" ? "Escolha o primeiro frasco" : "Vazio",
        cor: "transparent",
        vazio: true,
      };
    if (destino === "tube" && t.componentes?.length) {
      return {
        nome: `Mistura de ${t.componentes.length} ${t.componentes.length === 1 ? "componente" : "componentes"}`,
        cor: "linear-gradient(135deg,#d22b3a,#ebc92a,#239aab,#6c49bf)",
      };
    }
    const x = SIAB.solutions[destino === "tube" ? t.solution : t.titrant];
    return { nome: x.name, cor: corDoFrasco(x) };
  }

  function renderMenus() {
    for (const [destino, id] of Object.entries(MENUS)) {
      const botao = SIAB.$(id);
      if (!botao) continue;
      const atual = emUso(destino);
      botao.querySelector(".menu-frasco-atual").textContent = atual.nome;
      botao.querySelector(".menu-frasco-cor").style.background = atual.cor;
      botao.classList.toggle("sem-frasco", Boolean(atual.vazio));
      botao.setAttribute("aria-expanded", String(aberto === destino));
    }
  }

  function renderLista() {
    const box = SIAB.$("shelf");
    if (!box || !aberto) return;
    if (!SIAB.ActivityContext.allows(SIAB.state.destination === "titrant" ? "bench.changeTitrant" : "bench.changeInitialSolution")) {box.replaceChildren(); return;}
    const s = SIAB.state,
      t = SIAB.current();
    const query = SIAB.normalizar(SIAB.$("shelf-search").value);
    const destino = t
      ? s.destination === "tube"
        ? "no tubo"
        : "no conta-gotas"
      : s.destination === "tube"
        ? "num tubo novo"
        : "no conta-gotas de um tubo novo";
    const atual = t
      ? s.destination === "tube"
        ? t.solution
        : t.titrant
      : null;
    const grupos = Object.entries(SIAB.solutionGroups)
      .map(([grupo, rotulo]) => {
        const frascos = Object.entries(SIAB.solutions)
          .filter(([, x]) => x.group === grupo)
          .filter(
            ([, x]) =>
              !query ||
              SIAB.normalizar(
                `${x.name} ${x.formula || ""} ${rotulo} ${x.label || ""}`,
              ).includes(query),
          );
        if (!frascos.length) return "";
        const botoes = frascos
          .map(([id, x]) => {
            const marcas = [];
            if (id === t?.solution && !t.componentes?.length)
              marcas.push('<span class="tag tag-tubo">no tubo</span>');
            if (id === t?.titrant)
              marcas.push('<span class="tag tag-gotas">conta-gotas</span>');
            const detalhe = [
              x.formula && x.kind !== "sample" ? x.formula : "",
              x.label,
            ]
              .filter(Boolean)
              .join(" · ");
            const estado = [
              id === t?.solution && !t.componentes?.length
                ? "está no tubo"
                : "",
              id === t?.titrant ? "está no conta-gotas" : "",
            ]
              .filter(Boolean)
              .join(" e ");
            return `<button type="button" class="bottle" data-solution="${id}" aria-label="${SIAB.escape(x.name)}. ${SIAB.escape(x.label || "")}. Colocar ${destino}.${estado ? " Atualmente " + estado + "." : ""}">
          <span class="bottle-dot" style="background:${corDoFrasco(x)}" aria-hidden="true"></span>
          <span class="bottle-text"><strong>${SIAB.escape(x.name)}</strong><small>${SIAB.escape(detalhe)}</small></span>
          <span class="bottle-tags" aria-hidden="true">${marcas.join("")}</span>
        </button>`;
          })
          .join("");
        // Com busca, abrem os grupos que têm resultado; sem busca, os que a
        // pessoa abriu (no começo, só o grupo do frasco em uso).
        const abrir =
          query ||
          (gruposAbertos
            ? gruposAbertos.has(grupo)
            : SIAB.solutions[atual]?.group === grupo);
        return `<details class="shelf-group" data-grupo="${grupo}"${abrir ? " open" : ""}>
        <summary class="shelf-title">${SIAB.escape(rotulo)} <span class="shelf-conta">${frascos.length}</span></summary>
        <div class="shelf-bottles">${botoes}</div>
      </details>`;
      })
      .join("");
    box.innerHTML =
      grupos ||
      '<p class="empty-choice">Nenhum frasco com esse nome. Tente outra busca.</p>';
  }

  function render() {
    renderMenus();
    renderLista();
  }

  // Abre o menu de um destino ("tube" ou "titrant"): a lista vai para baixo dele.
  function abrir(destino, { foco = null } = {}) {
    if (!SIAB.ActivityContext.guard(destino === "titrant" ? "bench.changeTitrant" : "bench.changeInitialSolution")) return;
    const corpo = SIAB.$("menu-frasco-corpo");
    aberto = destino;
    SIAB.state.destination = destino;
    gruposAbertos = null;
    SIAB.$(MENUS[destino]).closest(".menu-frasco").append(corpo);
    corpo.setAttribute("aria-labelledby", MENUS[destino]);
    corpo.hidden = false;
    render();
    if (foco === "busca") SIAB.$("shelf-search").focus();
  }

  // Fecha o menu aberto; com foco, devolve o foco ao cabeçalho.
  function fechar(foco = false) {
    if (!aberto) return;
    const destino = aberto;
    aberto = null;
    SIAB.$("menu-frasco-corpo").hidden = true;
    SIAB.$("shelf-search").value = "";
    renderMenus();
    if (foco) SIAB.$(MENUS[destino]).focus();
  }

  function alternar(destino) {
    if (aberto === destino) fechar(true);
    else abrir(destino);
  }

  function ligar() {
    for (const [destino, id] of Object.entries(MENUS)) {
      SIAB.$(id).addEventListener("click", () => alternar(destino));
    }
    SIAB.$("shelf-search").addEventListener("input", renderLista);
    // Guarda os grupos abertos ou fechados pela pessoa (só sem busca).
    SIAB.$("shelf").addEventListener(
      "toggle",
      (evento) => {
        const grupo = evento.target.closest?.("[data-grupo]");
        if (!grupo || !grupo.isConnected || SIAB.$("shelf-search").value)
          return;
        gruposAbertos = new Set(
          [
            ...SIAB.$("shelf").querySelectorAll("details[data-grupo][open]"),
          ].map((x) => x.dataset.grupo),
        );
      },
      true,
    );
    // Esc fecha o menu (antes de fechar o cartão flutuante ou o painel do celular).
    SIAB.$("secao-frascos").addEventListener("keydown", (evento) => {
      if (evento.key !== "Escape" || !aberto) return;
      evento.stopPropagation();
      if (evento.target.id === "shelf-search" && evento.target.value) return; // a busca limpa primeiro
      evento.preventDefault();
      fechar(true);
    });
  }

  function renderIndicadores() {
    const box = SIAB.$("indicator-chips");
    if (!box) return;
    const t = SIAB.current();
    const chip = ([id, x]) => {
      let amostra = "transparent";
      if (x.acid)
        amostra = `linear-gradient(90deg,rgb(${x.acid.join(",")}),rgb(${x.middle.join(",")}),rgb(${x.base.join(",")}))`;
      if (id === "universal" || id === "cabbage") {
        const cores = [2, 5, 7, 9, 12].map(
          (pH) => `rgb(${SIAB.chem.color(id, pH).rgb.join(",")})`,
        );
        amostra = `linear-gradient(90deg,${cores.join(",")})`;
      }
      const faixa = x.acid
        ? ` <small>${SIAB.format(x.low, 1)}–${SIAB.format(x.high, 1)}</small>`
        : "";
      return `<label class="chip"><input type="radio" name="indicador" value="${id}" ${t?.indicator === id ? "checked" : ""}><span class="chip-cor" style="background:${amostra}" aria-hidden="true"></span><span>${SIAB.escape(x.short)}${x.extra ? faixa : ""}</span></label>`;
    };
    // Os indicadores a mais (vermelho de metila, cúrcuma…) ficam recolhidos,
    // e abrem sozinhos quando um deles está em uso.
    const lista = Object.entries(SIAB.indicators);
    const extras = lista.filter(([, x]) => x.extra);
    const emUso = extras.some(([id]) => id === t?.indicator);
    const aberto = box.querySelector(".indicadores-extra")?.open;
    box.innerHTML =
      lista
        .filter(([, x]) => !x.extra)
        .map(chip)
        .join("") +
      (extras.length
        ? `<details class="indicadores-extra"${emUso || aberto ? " open" : ""}><summary>Mais indicadores <span class="shelf-conta">${extras.length}</span></summary><div class="chip-list">${extras.map(chip).join("")}</div></details>`
        : "");
  }

  return {
    render,
    renderIndicadores,
    ligar,
    abrir,
    fechar,
    get aberto() {
      return aberto;
    },
    ROTULOS,
  };
})();
