"use strict";
/* Tour guiado da bancada (coachmark), no estilo do Laboratório Virtual:
   escurece a tela, contorna uma parte por vez e explica em um cartão com
   "Pular tour", "Voltar" e "Próximo". Abre pelo aviso de boas-vindas ou pelo
   menu ☰ → Tour guiado. É um <dialog> modal: Esc encerra. */
SIAB.tour = (() => {
  const $ = SIAB.$;

  // alvoCelular: o que contornar quando a parte fica em outro lugar no celular.
  const PASSOS = [
    {
      alvo: "#controls",
      alvoCelular: "#workspace-montagem",
      titulo: "Prepare a bancada",
      texto:
        "Abra Montagem → Preparo → Prateleira para escolher a solução; em Objetos, escolha a vidraria.",
    },
    {
      alvo: "#modulos",
      alvoCelular: "#workspace-montagem",
      titulo: "Escolha um módulo",
      texto:
        "Explorar, Medir e Calcular são independentes. Escolha pelo objetivo da investigação.",
    },
    {
      alvo: "#drop-btn",
      titulo: "Faça uma intervenção",
      texto:
        "Use o conta-gotas e os controles. Um toque adiciona uma gota; Desfazer recupera o estado anterior.",
    },
    {
      alvo: "#large-tube",
      titulo: "Observe",
      texto:
        "Procure mudanças visíveis: cor, volume, turvação e bolhas representativas.",
    },
    {
      alvo: "#ver-panel",
      alvoCelular: "#workspace-ver",
      titulo: "Investigue e consulte os dados",
      texto:
        "Em Ver, observe, meça e analise. Em Dados, consulte Histórico, Tabela e Relatório.",
    },
  ];
  let passos = [],
    atual = 0;

  function visivel(elemento) {
    const r = elemento.getBoundingClientRect();
    return (
      r.width > 0 &&
      r.height > 0 &&
      getComputedStyle(elemento).visibility !== "hidden"
    );
  }

  function alvoDe(passo) {
    const seletor =
      (SIAB.bancada.mobile.matches && passo.alvoCelular) || passo.alvo;
    return [...document.querySelectorAll(seletor)].find(visivel) || null;
  }

  // Contorna o alvo e põe o cartão abaixo, acima ou ao lado, sem sair da tela.
  function posicionar() {
    const dialogo = $("tour");
    if (!dialogo.open) return;
    const alvo = alvoDe(passos[atual]);
    const anel = dialogo.querySelector(".tour-anel");
    const cartao = dialogo.querySelector(".tour-cartao");
    const L = window.innerWidth,
      A = window.innerHeight,
      M = 12;
    const c = cartao.getBoundingClientRect();
    if (!alvo) {
      anel.hidden = true;
      cartao.style.left = `${(L - c.width) / 2}px`;
      cartao.style.top = `${(A - c.height) / 2}px`;
      return;
    }
    const r = alvo.getBoundingClientRect();
    const topo = Math.max(r.top - 6, 4),
      base = Math.min(r.bottom + 6, A - 4);
    anel.hidden = false;
    Object.assign(anel.style, {
      left: `${Math.max(r.left - 6, 4)}px`,
      top: `${topo}px`,
      width: `${Math.min(r.right + 6, L - 4) - Math.max(r.left - 6, 4)}px`,
      height: `${base - topo}px`,
    });
    const limitarX = (x) => Math.min(Math.max(x, M), L - c.width - M);
    const limitarY = (y) => Math.min(Math.max(y, M), A - c.height - M);
    let x, y;
    if (base + M + c.height <= A - M) {
      x = limitarX(r.left + r.width / 2 - c.width / 2);
      y = base + M;
    } else if (topo - M - c.height >= M) {
      x = limitarX(r.left + r.width / 2 - c.width / 2);
      y = topo - M - c.height;
    } else if (r.right + M + c.width <= L - M) {
      x = r.right + M;
      y = limitarY(r.top);
    } else if (r.left - M - c.width >= M) {
      x = r.left - M - c.width;
      y = limitarY(r.top);
    } else {
      x = limitarX((L - c.width) / 2);
      y = A - c.height - M;
    }
    cartao.style.left = `${x}px`;
    cartao.style.top = `${y}px`;
  }

  function mostrar(n) {
    atual = n;
    const passo = passos[n];
    SIAB.workspace.close("left", false);
    SIAB.workspace.close("right", false);
    if (!SIAB.bancada.mobile.matches) {
      if (n === 0) SIAB.workspace.open("left", "preparo");
      if (n === 1) SIAB.workspace.open("left", "modulo");
      if (n === 4) SIAB.workspace.open("right", "particulas");
    }
    $("tour-passo").textContent = `PASSO ${n + 1} DE ${passos.length}`;
    $("tour-titulo").textContent = passo.titulo;
    $("tour-texto").textContent = passo.texto;
    $("tour-pontos").innerHTML = passos
      .map((_, i) => `<span${i === n ? ' class="atual"' : ""}></span>`)
      .join("");
    $("tour-voltar").hidden = n === 0;
    $("tour-proximo").innerHTML =
      (n === passos.length - 1 ? "Concluir" : "Próximo") +
      SIAB.icons.svg("next");
    $("tour-voltar").innerHTML = SIAB.icons.svg("previous") + "Voltar";
    alvoDe(passo)?.scrollIntoView({ block: "center", behavior: "auto" });
    requestAnimationFrame(posicionar);
    $("tour-proximo").focus();
  }

  function comecar() {
    // Painéis recolhidos ficam fixos durante o tour (os alvos moram neles).
    SIAB.trilho.suspender();
    passos = PASSOS;
    if (!passos.length) SIAB.trilho.retomar();
    if (!passos.length) return;
    $("tour").showModal();
    mostrar(0);
  }

  function iniciar() {
    if (
      SIAB.atividades?.ativa ||
      SIAB.rota.nome === "missao" ||
      SIAB.state.experiencia
    ) {
      SIAB.notice("O tour está disponível no laboratório livre.");
      return;
    }
    if (SIAB.rota.nome === "laboratorio") {
      comecar();
      return;
    }
    window.addEventListener(
      "hashchange",
      () => requestAnimationFrame(comecar),
      { once: true },
    );
    SIAB.irPara("#/laboratorio");
  }

  function encerrar() {
    if ($("tour").open) $("tour").close();
  }

  function ligar() {
    $("tour-proximo").addEventListener("click", () => {
      if (atual < passos.length - 1) mostrar(atual + 1);
      else encerrar();
    });
    $("tour-voltar").addEventListener("click", () =>
      mostrar(Math.max(0, atual - 1)),
    );
    $("tour-pular").addEventListener("click", encerrar);
    $("tour").addEventListener("close", () => {
      SIAB.trilho.retomar();
      SIAB.ajuda.marcarVisto();
      $("boas-vindas").hidden = true;
      // O foco volta ao botão que abriu o tour; se ele sumiu, vai para o nome do tubo.
      requestAnimationFrame(() => {
        const foco = document.activeElement;
        if (!foco || foco === document.body || !visivel(foco))
          $(SIAB.current() ? "tube-name" : "vazia-titulo").focus();
      });
    });
    window.addEventListener("resize", posicionar);
    document.addEventListener("scroll", posicionar, true);
    $("boas-vindas-tour").addEventListener("click", iniciar);
  }

  return { ligar, iniciar, encerrar, PASSOS };
})();
