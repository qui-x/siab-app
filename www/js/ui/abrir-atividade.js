"use strict";
/* Entrada de atividades por link, código ou aplicativo.
   - Aceita o link completo (qualquer endereço), siab://atividade/<código> ou só o código.
   - window.SIABAbrirLink(texto) é o ponto de entrada usado pelo Android e pelo
     Electron quando o sistema entrega um link siab:// ao aplicativo. */
SIAB.abrirLink = (() => {
  // v1.<chave 32 bytes>.<iv 12 bytes>.<conteúdo cifrado>, em base64url
  const PADRAO = /v1\.[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22,}/;

  function extrairToken(texto) {
    const achado = PADRAO.exec(String(texto || ""));
    return achado ? achado[0] : null;
  }

  function abrir(texto) {
    const token = extrairToken(texto);
    if (!token) {
      SIAB.notice("Não encontrei uma atividade nesse link ou código.");
      return false;
    }
    SIAB.irPara(`#/atividade/${token}`);
    return true;
  }

  function ligarDialogo() {
    const dialogo = SIAB.$("abrir-atividade-dialog");
    const campo = SIAB.$("abrir-atividade-campo");
    const estado = SIAB.$("abrir-atividade-estado");
    if (!dialogo || !campo || !estado) return;
    document.addEventListener("click", (evento) => {
      if (!evento.target.closest("[data-abrir-atividade]")) return;
      if (SIAB.gaveta && SIAB.gaveta.fechar) SIAB.gaveta.fechar();
      campo.value = "";
      estado.textContent = "";
      dialogo.showModal();
      campo.focus();
    });
    SIAB.$("abrir-atividade-confirmar").onclick = () => {
      if (extrairToken(campo.value)) {
        dialogo.close();
        abrir(campo.value);
      } else {
        estado.textContent =
          "Não encontrei uma atividade nesse texto. Confira se o link ou o código está completo.";
        campo.focus();
      }
    };
    SIAB.$("abrir-atividade-colar").onclick = async () => {
      try {
        campo.value = await navigator.clipboard.readText();
        estado.textContent = "";
      } catch (_) {
        estado.textContent =
          "Não foi possível colar automaticamente. Toque no campo e use Colar.";
        campo.focus();
      }
    };
  }

  // Navegador no Android: oferece abrir a mesma atividade no aplicativo, se instalado.
  // O endereço intent:// volta para esta página quando o aplicativo não existe.
  function ligarAtalhoDoApp() {
    const bloco = SIAB.$("abrir-no-app");
    if (!bloco) return;
    const atualizar = () => {
      const empacotado = window.SIABPlataforma && window.SIABPlataforma.empacotado;
      const rota = /^#\/atividade\/(.+)$/.exec(location.hash);
      const token = rota && extrairToken(rota[1]);
      if (empacotado || !token || !/Android/i.test(navigator.userAgent)) {
        bloco.hidden = true;
        return;
      }
      bloco.querySelector("a").href =
        `intent://atividade/${token}#Intent;scheme=siab;` +
        `S.browser_fallback_url=${encodeURIComponent(location.href)};end`;
      bloco.hidden = false;
    };
    window.addEventListener("hashchange", atualizar);
    atualizar();
  }

  // Android empacotado: pega o link que abriu o aplicativo a frio.
  function lerLinkInicialDoAndroid() {
    const cap = window.Capacitor;
    if (!cap || typeof cap.nativePromise !== "function") return;
    if (!(window.SIABPlataforma && window.SIABPlataforma.empacotado)) return;
    cap
      .nativePromise("SIABLink", "getLaunchLink", {})
      .then((resposta) => {
        if (resposta && resposta.url) abrir(resposta.url);
      })
      .catch(() => {});
  }

  function ligar() {
    try {
      ligarDialogo();
      ligarAtalhoDoApp();
    } catch (erro) {
      /* a entrada por link nunca deve impedir a abertura do SIAB */
    }
    window.addEventListener("load", () => setTimeout(lerLinkInicialDoAndroid, 400));
  }

  window.SIABAbrirLink = (texto) => abrir(texto);
  ligar();
  return { extrairToken, abrir };
})();
