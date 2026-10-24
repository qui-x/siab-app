/* Plataforma de execução do SIAB: aplicativo empacotado (Android, Windows, Linux,
   macOS) ou navegador. Carregado ANTES de tudo, sem depender do restante.
   - Android (Capacitor): window.Capacitor.isNativePlatform()
   - Windows/Linux/macOS (Electron): "Electron/" no agente de usuário
   Marca <html data-empacotado="true|false" data-plataforma="..."> para o CSS. */
(function () {
  "use strict";
  var NOMES = {
    android: "Android",
    ios: "iOS",
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
    web: "Navegador",
  };
  var api = { empacotado: false, tipo: "web", nome: NOMES.web };

  function detectar() {
    var ua = navigator.userAgent || "";
    var cap = window.Capacitor;
    var tipo = "web";
    var empacotado = false;
    if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
      var p = typeof cap.getPlatform === "function" ? cap.getPlatform() : "android";
      tipo = p === "ios" ? "ios" : "android";
      empacotado = true;
    } else if (/Electron\//.test(ua)) {
      empacotado = true;
      tipo = /Windows/.test(ua)
        ? "windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macos"
          : "linux";
    }
    api.empacotado = empacotado;
    api.tipo = tipo;
    api.nome = NOMES[tipo];
    var raiz = document.documentElement;
    raiz.setAttribute("data-empacotado", String(empacotado));
    raiz.setAttribute("data-plataforma", tipo);
  }

  api.local = function () {
    return api.empacotado ? "neste aplicativo" : "neste navegador";
  };
  api.deste = function () {
    return api.empacotado ? "deste aplicativo" : "deste navegador";
  };
  api.descricao = function () {
    return api.empacotado
      ? "Aplicativo para " + api.nome
      : "Versão para navegador";
  };

  function preencher() {
    try {
      if (!api.empacotado) detectar(); // a ponte nativa pode chegar um pouco depois
      var texto = api.descricao();
      var selo = document.getElementById("selo-app");
      var gaveta = document.getElementById("drawer-modo");
      var sobre = document.getElementById("about-modo");
      if (selo) {
        selo.textContent = api.empacotado ? "App · " + api.nome : "";
        selo.hidden = !api.empacotado;
      }
      if (gaveta) {
        gaveta.textContent = texto;
        gaveta.hidden = false;
      }
      if (sobre) {
        sobre.textContent = "Executando como: " + texto + ".";
        sobre.hidden = false;
      }
      var locais = document.querySelectorAll("[data-local]");
      for (var i = 0; i < locais.length; i++) locais[i].textContent = api.local();
    } catch (e) {
      /* só informação visual: nunca interrompe a abertura */
    }
  }

  detectar();
  window.SIABPlataforma = api;
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", preencher);
  else preencher();
})();
