"use strict";
/* Folha de impressão do SIAB.
   Imprimir não é tirar uma foto da tela: a folha tem cabeçalho de documento
   (logotipo, título, data e campos Nome e Turma), cores claras para papel,
   medidas em pontos e numeração de página (css/stylesiab.css, @media print).

   - Bancada (laboratório ou missão): em vez dos botões e painéis, sai um
     RELATÓRIO DA BANCADA: resumo de todos os recipientes, o recipiente em foco
     (desenho, preparo, leitura, gráfico e tabela de gotas), ou todos os
     recipientes escolhidos na visão geral, cada um com seus detalhes. Espaço para
     observações e a nota sobre o modelo químico.
   - Caderno, manual e demais telas: o conteúdo da tela, com o cabeçalho da folha.
   Funciona pelo botão "Imprimir relatório", pelos botões de imprimir de cada
   tela e pelo Ctrl+P do navegador (eventos beforeprint e afterprint).
   O VLibras e os controles da tela nunca saem no papel. */
SIAB.impressao = (() => {
  const $ = SIAB.$;
  const esc = SIAB.escape;
  const TITULOS = {
    laboratorio: "Relatório da bancada",
    missao: "Relatório da missão",
    caderno: "Caderno de laboratório",
    manual: "Manual",
    professor: "Guia do Professor",
    aprender: "Temas",
    missoes: "Missões",
    roteiros: "Roteiros Experimentais",
    inicio: "SIAB",
  };
  let inserido = null; // cabeçalho posto numa tela durante a impressão

  const agora = () =>
    new Date().toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  // Logotipo no próprio HTML (uma imagem externa pode não carregar a tempo da impressão).
  const LOGO = `<svg class="folha-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true"><defs>
    <linearGradient id="folha-contorno" x1="9" y1="10" x2="23" y2="29" gradientUnits="userSpaceOnUse"><stop stop-color="#DC2626"/><stop offset=".34" stop-color="#DB2777"/><stop offset=".65" stop-color="#C026D3"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>
    <linearGradient id="folha-liquido" x1="12" y1="18" x2="20" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#DC2626"/><stop offset=".48" stop-color="#C026D3"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>
    <linearGradient id="folha-gota" x1="13.3" y1="2" x2="18.7" y2="9" gradientUnits="userSpaceOnUse"><stop stop-color="#DC2626"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>
    <path d="M16 2C15.2 3.5 13.3 5.6 13.3 7a2.7 2.7 0 0 0 5.4 0c0-1.4-1.9-3.5-2.7-5Z" fill="url(#folha-gota)"/>
    <path d="M10 11v12a6 6 0 0 0 12 0V11M8.5 11h15" stroke="url(#folha-contorno)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 18c2.5-1.5 5.5 1.5 8 0v5a4 4 0 0 1-8 0Z" fill="url(#folha-liquido)"/></svg>`;

  // Cabeçalho de documento, comum a todas as folhas.
  function cabecalho(titulo, { aluno = true, subtitulo = "" } = {}) {
    return `<header class="folha-cabecalho">
      <div class="folha-titulo">
        <div class="folha-marca">${LOGO}<div><strong>SIAB</strong><span>Simulador Interativo de Ácidos e Bases</span></div></div>
        <h1>${esc(titulo)}</h1>
        <p class="folha-sub">${subtitulo ? `${esc(subtitulo)} · ` : ""}impresso em ${agora()} · versão ${SIAB.version}</p>
      </div>
      ${aluno ? '<div class="folha-aluno"><p><span>Nome</span></p><p><span>Turma</span></p><p><span>Data</span></p></div>' : ""}
    </header>`;
  }

  // Antes de imprimir: monta a folha certa para a tela em uso.
  function preparar() {
    if (document.body.classList.contains("imprimindo-roteiro")) {
      document.body.classList.add("imprimindo-folha");
      return;
    }
    limpar();
    if (SIAB.rota.nome === "relatorio") {
      SIAB.relatorios.preparar();
      return;
    }
    if (["laboratorio", "missao"].includes(SIAB.rota.nome)) {
      SIAB.relatorios.capturar();
      SIAB.relatorios.preparar();
      return;
    }
    document.body.classList.add("imprimindo");
    const nome = SIAB.rota?.nome;
    // Roteiro do professor: já tem folha própria (js/telas/professor.js).
    if (document.body.classList.contains("imprimindo-roteiro")) return;
    const tela = document.querySelector("main [data-tela]:not([hidden])");
    if (!tela) return;
    const titulo =
      TITULOS[nome] || tela.querySelector("h1")?.textContent.trim() || "SIAB";
    inserido = document.createElement("div");
    inserido.className = "so-impressao";
    inserido.innerHTML = cabecalho(titulo, { aluno: nome === "caderno" });
    tela.prepend(inserido);
  }
  function limpar() {
    document.body.classList.remove("imprimindo", "imprimindo-folha");
    inserido?.remove();
    inserido = null;
  }

  function imprimir() {
    preparar();
    window.print();
  }

  function ligar() {
    window.addEventListener("beforeprint", preparar);
    window.addEventListener("afterprint", () => {
      limpar();
      $("folha-impressao").innerHTML = "";
    });
    $("imprimir-relatorio")?.addEventListener("click", () =>
      SIAB.irPara("#/relatorio"),
    );
  }

  return { ligar, imprimir, preparar, limpar, cabecalho };
})();
