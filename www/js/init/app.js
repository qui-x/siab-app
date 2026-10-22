"use strict";
/* Inicialização: liga os módulos, os diálogos e o roteador. */
(() => {
  const $ = SIAB.$;
  SIABCompat.prepararDialogos();

  // Fechar diálogos pelo botão × e botões com data-close.
  document.addEventListener("click", (evento) => {
    const fechar = evento.target.closest("[data-close]");
    if (fechar) $(fechar.dataset.close).close();
  });
  $("about-version").textContent = SIAB.version;

  SIAB.initSelects();
  SIAB.initPreferences();
  SIAB.gaveta.ligar();
  SIAB.bancada.ligar();
  SIAB.layoutBancada.ligar();
  SIAB.trilho.ligar();
  SIAB.tour.ligar();
  SIAB.segredo.ligar();
  SIAB.impressao.ligar();
  SIAB.selecaoTubos.ligar();
  SIAB.missaoTela.ligar();
  SIAB.telas.caderno.ligar();
  SIAB.professor.ligar();
  SIAB.manualTela.ligar();
  SIAB.pwa.iniciar();
  SIAB.iniciarInvestigacao();

  // Cabeçalho adaptável: se não couber (fonte ampliada, muitas abas), primeiro
  // os botões ficam só com o ícone; se ainda faltar espaço, as abas descem para
  // uma segunda linha rolável. A altura real vai para --header-h (usada pelo layout).
  const cabecalho = document.querySelector(".app-header");
  let pedido = 0;
  function ajustarCabecalho() {
    cancelAnimationFrame(pedido);
    pedido = requestAnimationFrame(() => {
      const transborda = () =>
        cabecalho.scrollWidth > cabecalho.clientWidth + 1;
      cabecalho.classList.remove("compacto", "em-duas-linhas");
      if (transborda()) cabecalho.classList.add("compacto");
      if (transborda()) cabecalho.classList.add("em-duas-linhas");
      document.documentElement.style.setProperty(
        "--header-h",
        `${cabecalho.getBoundingClientRect().height}px`,
      );
    });
  }
  if (typeof ResizeObserver !== "undefined") {
    const observador = new ResizeObserver(ajustarCabecalho);
    [
      cabecalho,
      cabecalho.querySelector(".main-nav"),
      cabecalho.querySelector(".header-actions"),
    ].forEach((x) => observador.observe(x));
  }
  window.addEventListener("resize", ajustarCabecalho);
  document.addEventListener("siab:modo", ajustarCabecalho);

  window.addEventListener("hashchange", SIAB.rotear);
  SIAB.rotear();
})();
