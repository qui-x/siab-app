"use strict";
/* Aplicativo instalável (PWA): registra o service worker, oferece a
   instalação e avisa quando há uma versão nova.
   Só funciona aberto por HTTPS ou localhost; aberto como arquivo
   (file://) o SIAB continua funcionando, mas sem instalação. */
SIAB.pwa = (() => {
  let pedidoInstalacao = null;

  function podeUsarServiceWorker() {
    return (
      "serviceWorker" in navigator &&
      (location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1")
    );
  }

  // Quando uma versão nova assume, a página em uso ainda é a antiga:
  // avisa e recarrega só quando o usuário pedir (nada se perde no meio de uma missão).
  function avisarAtualizacao() {
    const toast = SIAB.$("toast");
    toast.innerHTML =
      'Nova versão do SIAB instalada. <button type="button" class="text-btn" id="pwa-recarregar">Recarregar</button>';
    toast.hidden = false;
    SIAB.$("pwa-recarregar").addEventListener("click", () => location.reload());
  }

  function iniciar() {
    // Dois botões: no cabeçalho (computador) e no menu ☰ → Aplicativo.
    const botoes = [SIAB.$("install-btn"), SIAB.$("drawer-install")];
    // O HTML único não publica manifesto nem service worker.
    const publicavel =
      Boolean(document.querySelector('link[rel="manifest"]')) &&
      podeUsarServiceWorker();
    const modoApp = matchMedia("(display-mode: standalone)");
    let instalado = modoApp.matches || navigator.standalone === true;
    const atualizarBotoes = () => {
      botoes[0].hidden = !publicavel || instalado || !pedidoInstalacao;
      // Safari/iOS não oferece beforeinstallprompt: o menu abre as instruções.
      botoes[1].hidden = !publicavel || instalado;
    };
    atualizarBotoes();
    modoApp.addEventListener("change", (evento) => {
      instalado = evento.matches || navigator.standalone === true;
      atualizarBotoes();
    });
    window.addEventListener("beforeinstallprompt", (evento) => {
      evento.preventDefault();
      pedidoInstalacao = evento;
      atualizarBotoes();
    });
    botoes.forEach((botao) =>
      botao.addEventListener("click", async () => {
        SIAB.gaveta.fechar();
        if (!pedidoInstalacao) {
          SIAB.irPara("#/manual/app");
          return;
        }
        try {
          await pedidoInstalacao.prompt();
          const escolha = await pedidoInstalacao.userChoice;
          instalado = escolha.outcome === "accepted";
          if (instalado)
            SIAB.notice(
              "SIAB instalado. Abra uma vez com internet antes de usar offline.",
            );
        } catch (erro) {
          SIAB.irPara("#/manual/app");
        } finally {
          pedidoInstalacao = null;
          atualizarBotoes();
        }
      }),
    );
    window.addEventListener("appinstalled", () => {
      instalado = true;
      pedidoInstalacao = null;
      atualizarBotoes();
    });
    if (!publicavel) return;
    // Na primeira visita não há controlador: a instalação não precisa de aviso.
    const tinhaVersaoAnterior = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (tinhaVersaoAnterior) avisarAtualizacao();
    });
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* sem service worker: o app continua funcionando online */
    });
  }

  return { iniciar, podeUsarServiceWorker };
})();
