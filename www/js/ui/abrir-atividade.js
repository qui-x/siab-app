"use strict";
/* Entrada de atividades por link, código ou aplicativo.
   - Aceita o link completo (qualquer endereço), siab://atividade/<código> ou só o código.
   - window.SIABAbrirLink(texto) é o ponto de entrada usado pelo Android e pelo
     Electron quando o sistema entrega um link siab:// ao aplicativo. */
SIAB.abrirLink = (() => {
  // v1.<chave 32 bytes>.<iv 12 bytes>.<conteúdo cifrado>, em base64url
  const PADRAO = /v1\.[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22,}/;

  // v2 (curto): 2.<base64url>, confirmado pelo CRC embutido
  const PADRAO_V2 = /(^|[^A-Za-z0-9_.-])(2\.[A-Za-z0-9_-]{12,})/g;

  const CAMINHO = /(?:#\/|siab:\/\/)(?:a|atividade)\/([A-Za-z0-9_.~-]+)/g;
  const EXATO_V1 = new RegExp("^" + PADRAO.source + "$");

  // Confere se o texto é uma referência de atividade completa e válida
  function referenciaValida(c) {
    if (!c) return false;
    if (c.indexOf("v1.") === 0) return EXATO_V1.test(c);
    if (c.indexOf("2.") === 0) return SIAB.atividadeV2 && SIAB.atividadeV2.valido(c);
    return Boolean(SIAB.atividadeV2 && SIAB.atividadeV2.validoNome(c));
  }

  function extrairToken(texto) {
    const t = String(texto || "").trim();
    // 1) endereços conhecidos: .../#/a/<nome>, .../#/atividade/<código>, siab://...
    const caminhos = new RegExp(CAMINHO.source, "g");
    let m;
    while ((m = caminhos.exec(t)) !== null) {
      const c = m[1].replace(/\.+$/, "");
      if (referenciaValida(c)) return c;
    }
    // 2) o texto inteiro é só o nome da atividade ou o código
    if (/^[A-Za-z0-9_.~-]+$/.test(t) && referenciaValida(t.replace(/\.+$/, "")))
      return t.replace(/\.+$/, "");
    // 3) código solto no meio de uma frase
    let achado;
    PADRAO_V2.lastIndex = 0;
    while ((achado = PADRAO_V2.exec(t)) !== null)
      if (SIAB.atividadeV2 && SIAB.atividadeV2.valido(achado[2])) return achado[2];
    const v1 = PADRAO.exec(t);
    return v1 ? v1[0] : null;
  }

  function abrir(texto, silencioso) {
    const token = extrairToken(texto);
    if (!token) {
      if (!silencioso)
        SIAB.notice("Não encontrei uma atividade nesse link ou código.");
      return false;
    }
    SIAB.irPara(`#/a/${token}`);
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
      const token = extrairToken(location.hash);
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
        if (resposta && resposta.url) abrir(resposta.url, true);
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

  // Chamado pelo sistema (Android e Electron): link do site sem atividade só abre o app.
  window.SIABAbrirLink = (texto) => abrir(texto, true);
  ligar();
  return { extrairToken, abrir };
})();
