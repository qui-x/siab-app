"use strict";
SIAB.entradaEspecifica = Boolean(
  location.hash && !["#", "#/"].includes(location.hash),
);
SIAB.iniciarInvestigacao = () => {
  const $ = SIAB.$;
  const startupDialog = $("startup-dialog");
  const atualizarInicializacao = () => {
    const escolha = SIAB.persistencia.ler("siab_inicializacao", null);
    startupDialog.querySelectorAll(".startup-opcao").forEach((botao) => {
      botao.setAttribute(
        "aria-pressed",
        String(botao.dataset.startup === escolha),
      );
    });
  };
  const abrirInicializacao = () => {
    atualizarInicializacao();
    if (!startupDialog.open) startupDialog.showModal();
  };
  const saved = SIAB.persistencia.ler("siab_bancada_v2", null);
  if (saved?.tubes && Array.isArray(saved.tubes)) SIAB.benches.lab = saved;
  $("prof-identificacao").innerHTML = SIAB.identificacaoHTML();
  SIAB.professor.montarRecursos();
  SIAB.activityUI.bind();
  SIAB.ligarVer();
  SIAB.relatorios.ligar();
  SIAB.atividades.restaurar();
  SIAB.atividades.ligar();
  const salvar = () => {
    if (!SIAB.atividades.ativa)
      SIAB.persistencia.salvar("siab_bancada_v2", SIAB.benches.lab);
  };
  SIAB.loja.assinar(salvar);
  window.addEventListener("pagehide", salvar);
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button,a");
    if (!b) return;
    if (b.hasAttribute("data-startup-settings")) {
      SIAB.gaveta.fechar();
      abrirInicializacao();
    }
    if (b.dataset.startup) {
      const choice = b.dataset.startup;
      if (choice === "reset") {
        SIAB.persistencia.salvar("siab_inicializacao", null);
        atualizarInicializacao();
        startupDialog.querySelector('[data-startup="inicio"]').focus();
        SIAB.notice("Escolha novamente sua tela inicial.");
        return;
      }
      SIAB.persistencia.salvar("siab_inicializacao", choice);
      $("startup-dialog").close();
      SIAB.irPara("#/" + choice);
    }
    if (b.dataset.temaConcluir) {
      SIAB.progresso.concluirTema(b.dataset.temaConcluir);
      SIAB.telas.tema.entrar(b.dataset.temaConcluir);
    }
    if (b.dataset.temaBancada) {
      const tema = SIAB.temas.find((x) => x.id === b.dataset.temaBancada);
      const s = SIAB.criarBancada();
      SIAB.newTube(
        {
          solution: SIAB.solutions[tema.solution] ? tema.solution : "water",
          indicator: "universal",
        },
        s,
      );
      s.activeId = s.tubes[0].id;
      SIAB.benches.lab = s;
      SIAB.irPara("#/laboratorio");
    }
    if (b.dataset.montagem) SIAB.montarMontagem(b.dataset.montagem);
    if (b.hasAttribute("data-open-report")) SIAB.irPara("#/relatorio");
    if (b.hasAttribute("data-activity-resume") && !SIAB.atividades.ativa)
      SIAB.irPara(
        SIAB.activeBench === "mission"
          ? `#/missao/${SIAB.motor.ativa?.def.id}`
          : "#/laboratorio",
      );
  });
  document.addEventListener("submit", (e) => {
    if (e.target.dataset.startExperiment) {
      e.preventDefault();
      const r = SIAB.experimentos.find(
        (x) => x.id === e.target.dataset.startExperiment,
      );
      SIAB.montarExperimento(r, Object.fromEntries(new FormData(e.target)));
    }
  });
  // Permissions are checked before actions, including the original indicator controls.
  document.addEventListener(
    "click",
    (e) => {
      const restricted = SIAB.atividades.ativa?.config;
      if (!restricted) return;
      const el = e.target.closest(
        "[data-indicator],#compare-btn,[data-nivel],[data-montagem],[data-montar]",
      );
      if (!el) return;
      if (
        (el.matches("[data-indicator],#compare-btn") &&
          !restricted.instrumentos.includes("indicador")) ||
        (restricted.navegacao === "restrita" &&
          (el.matches("[data-montagem],[data-montar]") ||
            (el.dataset.nivel && el.dataset.nivel !== restricted.modulo)))
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        SIAB.notice("Ação não disponível nesta atividade.");
      }
    },
    true,
  );
  const vv = window.visualViewport;
  function viewport() {
    const height = vv?.height || window.innerHeight,
      top = vv?.offsetTop || 0;
    document.documentElement.style.setProperty(
      "--visual-height",
      `${height}px`,
    );
    document.documentElement.style.setProperty(
      "--keyboard-offset",
      `${Math.max(0, window.innerHeight - height - top)}px`,
    );
    if (document.activeElement?.matches("input,textarea,select"))
      requestAnimationFrame(() =>
        document.activeElement.scrollIntoView({ block: "nearest" }),
      );
  }
  vv?.addEventListener("resize", viewport);
  vv?.addEventListener("scroll", viewport);
  window.addEventListener("resize", viewport);
  document.addEventListener("focusin", viewport);
  viewport();
  if (
    !SIAB.entradaEspecifica &&
    !SIAB.persistencia.ler("siab_inicializacao", null) &&
    !SIAB.atividades.ativa
  ) {
    // A escolha só entra depois da animação; não interrompe uma navegação
    // ou outro diálogo que o usuário já tenha aberto nesse intervalo.
    const apresentarInicializacao = () => {
      if (
        SIAB.rota.nome !== "inicio" ||
        SIAB.atividades.ativa ||
        SIAB.persistencia.ler("siab_inicializacao", null) ||
        document.querySelector("dialog[open]")
      )
        return;
      const abertura = $("abertura");
      if (abertura && getComputedStyle(abertura).display !== "none") {
        setTimeout(apresentarInicializacao, 150);
        return;
      }
      abrirInicializacao();
    };
    setTimeout(apresentarInicializacao, 250);
  }
};
