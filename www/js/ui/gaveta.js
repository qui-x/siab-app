"use strict";
/* Menu lateral (gaveta), no estilo do Laboratório Virtual: navegação, modos,
   roteiros de teste, acessibilidade e aplicativo.
   É um <dialog> aberto com showModal(): o navegador leva o foco para dentro,
   fecha com Esc e deixa o resto da página inerte. Fecha também com ×, com
   toque fora e depois de escolher um destino. */
SIAB.gaveta = (() => {
  const $ = SIAB.$;

  function expandir(botao, aberto) {
    botao.setAttribute("aria-expanded", String(aberto));
    $(botao.getAttribute("aria-controls")).hidden = !aberto;
  }

  // secao: 'acessibilidade' abre direto no painel de acessibilidade.
  function abrir(secao) {
    contexto();
    const gaveta = $("app-drawer");
    if (!gaveta.open) gaveta.showModal();
    $("menu-btn").setAttribute("aria-expanded", "true");
    if (secao === "acessibilidade") {
      expandir($("a11y-toggle"), true);
      $("a11y-toggle").focus();
      $("a11y-toggle").scrollIntoView({ block: "start" });
    } else {
      $("drawer-title").parentElement.querySelector(".drawer-close").focus();
    }
  }

  function fechar() {
    if ($("app-drawer").open) $("app-drawer").close();
  }

  function contexto() {
    const r = SIAB.rota,
      c = SIAB.ActivityContext.current;
    const title = SIAB.telas[r.nome]?.titulo?.(r.parametro) || "SIAB";
    $("drawer-now-title").textContent = r.nome === "manual" ? "Manual" : title;
    $("drawer-now-detail").textContent =
      r.nome === "laboratorio"
        ? `${SIAB.state.montagem?.titulo || (SIAB.state.experiencia ? "Roteiro Experimental" : "Bancada livre")} · ${SIAB.MODULOS[SIAB.state.level].nome}`
        : r.nome === "manual"
          ? (() => {
              const t = SIAB.manualRegistry.resolve(r.parametro);
              return t
                ? `${SIAB.manualRegistry.category(t.category).title} › ${t.title}`
                : "Guia de uso e consulta";
            })()
          : r.nome === "roteiro"
            ? `Roteiro Experimental · ${SIAB.experimentos.find((x) => x.id === r.parametro)?.titulo || title}`
            : "Seu contexto atual";
    $("drawer-continue").textContent = ["laboratorio", "missao"].includes(
      r.nome,
    )
      ? "Continuar na bancada"
      : "Continuar nesta tela";
    $("drawer-activity-context").textContent = c
      ? `${c.activity.title} · ${SIAB.MODULOS[c.activity.module].nome}`
      : "";
  }

  function projetor(on) {
    if (SIAB.ActivityContext.restricted()) return false;
    document.body.classList.toggle("projetor", on);
    document.documentElement.dataset.projetor = on ? "on" : "off";
    $("projetor-check").checked = $("drawer-projector").checked = on;
    SIAB.persistencia.salvar("siab_projetor", on);
    SIAB.workspace?.refresh();
  }

  function ligar() {
    const gaveta = $("app-drawer");
    $("drawer-versao").textContent = SIAB.version;
    expandir(
      gaveta.querySelector('[aria-controls="drawer-navigation"]'),
      matchMedia("(max-width: 900px)").matches,
    );
    $("drawer-continue").onclick = fechar;
    $("drawer-projector").onchange = (e) => projetor(e.target.checked);
    projetor(!!SIAB.persistencia.ler("siab_projetor", false));

    $("menu-btn").addEventListener("click", () => abrir());
    $("access-btn").addEventListener("click", () => abrir("acessibilidade"));
    gaveta.addEventListener("close", () =>
      $("menu-btn").setAttribute("aria-expanded", "false"),
    );

    gaveta.addEventListener("click", (evento) => {
      // Toque no fundo escurecido (fora da caixa da gaveta).
      const caixa = gaveta.getBoundingClientRect();
      if (
        evento.target === gaveta &&
        (evento.clientX > caixa.right || evento.clientX < caixa.left)
      ) {
        fechar();
        return;
      }
      const expansor = evento.target.closest(
        ".drawer-cat-expand, #a11y-toggle",
      );
      if (expansor) {
        expandir(expansor, expansor.getAttribute("aria-expanded") !== "true");
        return;
      }
      const roteiro = evento.target.closest("[data-montar]");
      if (roteiro) {
        fechar();
        SIAB.manualTela.montar(roteiro.dataset.montar);
        return;
      }
      // Escolheu um destino: fecha, como no menu do Laboratório Virtual.
      if (evento.target.closest("a[href]")) fechar();
    });

    $("drawer-tour").addEventListener("click", () => {
      fechar();
      SIAB.tour.iniciar();
    });
    $("drawer-guia").addEventListener("click", () => {
      fechar();
      $("guide-dialog").showModal();
    });
    $("about-btn").addEventListener("click", () => {
      fechar();
      $("about-dialog").showModal();
    });
  }

  return { ligar, abrir, fechar, projetor };
})();
