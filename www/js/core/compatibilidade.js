/* Compatibilidade carregada ANTES do aplicativo. Sintaxe ES5 para que uma
   falha de sintaxe nos demais módulos ainda produza uma orientação visível.
   Não altera o motor químico nem substitui APIs que já existem. */
(function () {
  "use strict";
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      configurable: true,
      writable: true,
      value: function (indice) {
        if (this == null) throw new TypeError("Lista não informada");
        var lista = Object(this);
        var tamanho = Math.max(
          0,
          Math.min(Math.floor(Number(lista.length) || 0), 9007199254740991),
        );
        var n = Number(indice) || 0;
        n = n < 0 ? Math.ceil(n) : Math.floor(n);
        var posicao = n < 0 ? tamanho + n : n;
        return posicao < 0 || posicao >= tamanho ? undefined : lista[posicao];
      },
    });
  }
  if (!Object.hasOwn) {
    Object.defineProperty(Object, "hasOwn", {
      configurable: true,
      writable: true,
      value: function (objeto, chave) {
        return Object.prototype.hasOwnProperty.call(objeto, chave);
      },
    });
  }

  // Safari antigo oferece addListener/removeListener nas consultas de tela.
  if (window.matchMedia) {
    var consultar = window.matchMedia;
    window.matchMedia = function (consulta) {
      var media = consultar.call(window, consulta);
      if (!media.addEventListener && media.addListener) {
        media.addEventListener = function (tipo, ouvinte) {
          if (tipo === "change") media.addListener(ouvinte);
        };
        media.removeEventListener = function (tipo, ouvinte) {
          if (tipo === "change") media.removeListener(ouvinte);
        };
      }
      return media;
    };
  }

  var semHas = !(
    window.CSS &&
    CSS.supports &&
    CSS.supports("selector(:has(*))")
  );
  if (semHas) document.documentElement.classList.add("sem-has");
  function atualizarOpcoes() {
    if (!semHas) return;
    var opcoes = document.querySelectorAll(
      ".chip, .vidraria-opcoes label, .segmented label, .opcao",
    );
    for (var i = 0; i < opcoes.length; i++) {
      var entrada = opcoes[i].querySelector("input");
      if (!entrada) continue;
      opcoes[i].classList.toggle("opcao-marcada", entrada.checked);
      opcoes[i].classList.toggle("opcao-desabilitada", entrada.disabled);
    }
  }
  document.addEventListener("change", atualizarOpcoes);

  var concluido = false;
  var falhou = false;
  function mostrarFalha() {
    if (!document.body || document.getElementById("falha-abertura")) return;
    var abertura = document.getElementById("abertura");
    if (abertura) abertura.parentNode.removeChild(abertura);
    var aviso = document.createElement("section");
    aviso.id = "falha-abertura";
    aviso.className = "falha-abertura";
    aviso.setAttribute("role", "alert");
    aviso.innerHTML =
      "<strong>Não foi possível concluir a abertura do SIAB.</strong>" +
      "<p>Recarregue a página com internet. Se continuar, abra o endereço publicado no Safari, Chrome, Firefox ou Edge atualizado. No iPhone e iPad, atualize também o sistema e evite a prévia de arquivos ou de aplicativos de mensagens.</p>" +
      '<button type="button" class="secondary-btn">Recarregar página</button>';
    aviso.querySelector("button").addEventListener("click", function () {
      window.location.reload();
    });
    document.body.appendChild(aviso);
  }
  window.addEventListener(
    "error",
    function (evento) {
      if (concluido) return;
      // Erros de imagens não interrompem o aplicativo; scripts e execução, sim.
      if (
        evento.target === window ||
        (evento.target && evento.target.tagName === "SCRIPT")
      )
        falhou = true;
    },
    true,
  );
  window.addEventListener("load", function () {
    if (!concluido || falhou) mostrarFalha();
  });

  window.SIABCompat = {
    atualizarOpcoes: atualizarOpcoes,
    prepararDialogos: function () {
      var dialogos = document.querySelectorAll("dialog");
      for (var i = 0; i < dialogos.length; i++) {
        var dialogo = dialogos[i];
        if (typeof dialogo.showModal === "function") continue;
        window.dialogPolyfill.registerDialog(dialogo);
        dialogo.classList.add("dialog-alternativo");
        dialogo.setAttribute("role", "dialog");
        dialogo.setAttribute("aria-modal", "true");
        // O polyfill controla o foco durante a abertura; devolvemos ao fechar.
        (function (alvo) {
          var abrir = alvo.showModal;
          var origem = null;
          alvo.showModal = function () {
            origem = document.activeElement;
            return abrir.call(alvo);
          };
          alvo.addEventListener("close", function () {
            if (origem && document.documentElement.contains(origem))
              origem.focus();
          });
        })(dialogo);
      }
    },
    concluir: function () {
      atualizarOpcoes();
      concluido = Boolean(
        window.SIAB && window.SIAB.rota && window.SIAB.rota.nome,
      );
      if (!concluido || falhou) mostrarFalha();
      document.documentElement.setAttribute(
        "data-app-pronto",
        String(concluido && !falhou),
      );
    },
  };
})();
