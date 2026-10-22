"use strict";
SIAB.telas = {};
SIAB.rota = { nome: null, parametro: "" };
SIAB.irPara = (rota) => {
  if (location.hash === rota) SIAB.rotear();
  else location.hash = rota;
};
SIAB.rotear = () => {
  let partes = location.hash.replace(/^#\/?/, "").split("/");
  let nome = partes[0] || SIAB.persistencia.ler("siab_inicializacao", "inicio"),
    parametro = "";
  try {
    parametro = decodeURIComponent(partes.slice(1).join("/"));
  } catch (_) {
    SIAB.notice("O endereço está incompleto.");
  }
  const antigas = {
    desafios: "missoes",
    desafio: "missao",
    aula: "missoes",
    trilhas: "aprender",
  };
  if (antigas[nome]) {
    nome = antigas[nome];
    SIAB.notice(
      "Este endereço foi atualizado para a organização atual do SIAB.",
    );
  }
  if (nome === "missao" && SIAB.missaoAlias?.[parametro])
    parametro = SIAB.missaoAlias[parametro];
  if (nome === "manual" && SIAB.manualRegistry?.aliases[parametro])
    parametro = SIAB.manualRegistry.aliases[parametro];
  if (SIAB.atividades) {
    const permitido = SIAB.atividades.guardarRota(nome, parametro);
    nome = permitido.nome;
    parametro = permitido.parametro;
  }
  if (!SIAB.telas[nome]) {
    SIAB.notice("Tela não encontrada. Consulte a navegação do SIAB.");
    nome = "inicio";
    parametro = "";
  }
  const anterior = SIAB.rota.nome;
  SIAB.telas[anterior]?.sair?.(nome);
  const tela = SIAB.telas[nome];
  document.querySelectorAll("main > [data-tela]").forEach((el) => {
    el.hidden = el.dataset.tela !== tela.secao;
  });
  SIAB.rota = { nome, parametro };
  document.body.dataset.rota = nome;
  const canonical = `#/${nome}${parametro ? "/" + encodeURIComponent(parametro) : ""}`;
  if (location.hash !== canonical)
    try {
      history.replaceState(null, "", canonical);
    } catch (_) {}
  tela.entrar(parametro);
  document.title = `${tela.titulo?.(parametro) || "Investigar"} · SIAB`;
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.dataset.nav === (tela.menu || nome))
      el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  SIAB.atividades?.atualizarCabecalho();
  document.dispatchEvent(new CustomEvent("siab:rota"));
  if (anterior) {
    window.scrollTo(0, 0);
    document
      .querySelector(`main > [data-tela="${tela.secao}"] [data-foco]`)
      ?.focus({ preventScroll: true });
  }
};
