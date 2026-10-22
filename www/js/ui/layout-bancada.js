"use strict";
/* Distribuição visual: mede a área efetivamente disponível, sem alterar o
   estado químico, a ordem dos tubos ou os elementos que recebem os gestos. */
SIAB.layoutBancada = (() => {
  const $ = SIAB.$;
  let quadro = 0;

  function organizar() {
    quadro = 0;
    const vista = $("overview-view"),
      grade = $("overview-grid");
    if ($("workspace").hidden || vista.hidden) return;
    const cartoes = [...grade.querySelectorAll(".overview-tube")];
    if (!cartoes.length) return;
    // No celular o CSS mantém a lista vertical e alvos grandes para seleção.
    if (window.matchMedia("(max-width: 900px)").matches) {
      grade.removeAttribute("data-layout");
      grade.style.removeProperty("--overview-columns");
      grade.style.removeProperty("--overview-card-height");
      return;
    }
    const estilo = getComputedStyle(vista),
      fonte =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const largura = grade.clientWidth,
      espaco = 12;
    if (!largura) return;
    const fixo = [...vista.children]
      .filter((el) => el !== grade && !el.hidden)
      .reduce((s, el) => {
        const css = getComputedStyle(el);
        return (
          s +
          el.getBoundingClientRect().height +
          (parseFloat(css.marginTop) || 0) +
          (parseFloat(css.marginBottom) || 0)
        );
      }, 0);
    const desktop = window.matchMedia("(min-width: 1201px)").matches;
    const altoVista = desktop
      ? vista.clientHeight
      : Math.max(480, window.innerHeight - 180);
    const altura = Math.max(
      180,
      altoVista -
        fixo -
        parseFloat(estilo.paddingTop) -
        parseFloat(estilo.paddingBottom),
    );
    const razao = Math.max(
      ...cartoes.map((el) => {
        const v = el.querySelector("svg")?.viewBox.baseVal;
        return v?.height ? v.width / v.height : 0.5;
      }),
    );
    let melhor = null;
    // Avalia linhas equilibradas (10 => 5+5, 7 => 4+3 quando há duas linhas).
    // O último grupo cresce para ocupar toda a largura, sem células vazias.
    for (let linhas = 1; linhas <= cartoes.length; linhas++) {
      const colunas = Math.ceil(cartoes.length / linhas);
      if (Math.ceil(cartoes.length / colunas) !== linhas) continue;
      const w = (largura - espaco * (colunas - 1)) / colunas;
      if (w < Math.min(largura, 10.5 * fonte)) continue;
      for (const modo of ["vertical", "horizontal"]) {
        if (modo === "horizontal" && w < 16 * fonte) continue;
        const minimo = modo === "horizontal" ? 12 * fonte : 17 * fonte;
        const h = Math.max(minimo, (altura - espaco * (linhas - 1)) / linhas);
        const imagemH = modo === "horizontal" ? h - 28 : h - 8.5 * fonte - 28;
        const imagemW = modo === "horizontal" ? (w - 36) * 0.46 : w - 32;
        const desenho = Math.min(imagemH, imagemW / razao);
        const transborda = Math.max(
          0,
          h * linhas + espaco * (linhas - 1) - altura,
        );
        const nota = desenho - transborda * 0.85 - linhas * 2;
        if (!melhor || nota > melhor.nota) melhor = { colunas, h, modo, nota };
      }
    }
    if (!melhor) return;
    grade.dataset.layout = melhor.modo;
    grade.style.setProperty("--overview-columns", melhor.colunas);
    grade.style.setProperty(
      "--overview-card-height",
      `${Math.floor(melhor.h)}px`,
    );
    // Nomes longos, grupos e texto ampliado têm prioridade sobre caber sem rolar.
    const alturaTexto = Math.max(
      ...cartoes.map(
        (el) => el.querySelector(".overview-details").scrollHeight,
      ),
    );
    const minimoReal = alturaTexto + (melhor.modo === "vertical" ? 120 : 28);
    if (minimoReal > melhor.h)
      grade.style.setProperty(
        "--overview-card-height",
        `${Math.ceil(minimoReal)}px`,
      );
  }

  function atualizar() {
    if (!quadro) quadro = requestAnimationFrame(organizar);
  }

  function ligar() {
    window.addEventListener("resize", atualizar);
    if (typeof ResizeObserver !== "undefined") {
      const observar = new ResizeObserver(atualizar);
      [
        document.querySelector(".experiment"),
        $("overview-view"),
        ...[...$("overview-view").children].filter(
          (el) => el.id !== "overview-grid",
        ),
      ].forEach((el) => observar.observe(el));
    }
    // Fonte, projeção e preferências podem mudar sem redimensionar a janela.
    new MutationObserver(atualizar).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class", "data-projetor"],
    });
    document.fonts?.ready.then(atualizar);
  }

  return { ligar, atualizar };
})();
