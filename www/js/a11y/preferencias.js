"use strict";
/* Painel de acessibilidade do menu ☰ (linhas com interruptores, no estilo do
   Laboratório Virtual). Liga os controles à API A11Y (a11y.js) e às
   preferências de som, vibração e Libras. */
SIAB.initPreferences = () => {
  const $ = SIAB.$;
  const LIBRAS = "siab_libras_v1";

  // O a11y.js dá prioridade aos parâmetros do endereço (?theme=…) ao abrir a página.
  // Mantê-los iguais à escolha atual faz a preferência valer depois de recarregar.
  function atualizarEndereco() {
    try {
      history.replaceState(
        null,
        "",
        location.pathname + A11Y.query() + location.hash,
      );
    } catch (erro) {
      /* file:// pode bloquear; a memória local continua valendo */
    }
  }

  function sync() {
    atualizarEndereco();
    const e = window.A11Y.estado;
    document.documentElement.classList.toggle("large-text", e.fontScale >= 1.4);
    $("tema-escuro").checked = e.theme !== "light";
    $("contraste-check").checked = e.contrast;
    $("font-output").textContent = Math.round(e.fontScale * 100) + "%";
    $("font-minus").disabled = e.fontScale <= 0.8;
    $("font-plus").disabled = e.fontScale >= 2;
    $("espacamento-check").checked = e.spacing;
    $("motion-check").checked = e.motion;
    $("abertura-check").checked = SIAB.abertura.ligada();
    $("leitura-check").checked = e.reading === "on";
    $("cvd-select").value = e.colorblind;
    $("sound-check").checked = SIAB.som.prefs.som;
    $("vibrate-check").checked = SIAB.som.prefs.vibrar;
    $("libras-check").checked = SIAB.armazenamento.ler(LIBRAS, false);
    const tema = e.contrast
      ? "#000000"
      : e.theme === "light"
        ? "#e4eaf2"
        : "#0c1520";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", tema);
    SIAB.refreshSelects?.();
  }

  function definir(chave, valor) {
    A11Y.definir(chave, valor);
    sync();
    SIAB.loja.avisar();
  }

  $("tema-escuro").addEventListener("change", (evento) =>
    definir("theme", evento.target.checked ? "dark" : "light"),
  );
  $("contraste-check").addEventListener("change", (evento) =>
    definir("contrast", evento.target.checked),
  );
  $("espacamento-check").addEventListener("change", (evento) =>
    definir("spacing", evento.target.checked),
  );
  $("motion-check").addEventListener("change", (evento) =>
    definir("motion", evento.target.checked),
  );
  $("abertura-check").addEventListener("change", (evento) => {
    SIAB.abertura.definir(evento.target.checked);
    SIAB.notice(
      evento.target.checked
        ? "A animação de abertura toca na próxima vez que o SIAB abrir."
        : "Animação de abertura desligada.",
    );
  });
  $("leitura-check").addEventListener("change", (evento) =>
    definir("reading", evento.target.checked ? "on" : "off"),
  );
  $("cvd-select").addEventListener("change", (evento) =>
    definir("colorblind", evento.target.value),
  );
  for (const [id, delta] of [
    ["font-minus", -0.1],
    ["font-plus", 0.1],
  ]) {
    $(id).addEventListener("click", () => {
      definir(
        "fontScale",
        Math.round(
          Math.max(0.8, Math.min(2, A11Y.estado.fontScale + delta)) * 10,
        ) / 10,
      );
    });
  }
  $("sound-check").addEventListener("change", (evento) => {
    SIAB.som.definir("som", evento.target.checked);
    if (evento.target.checked) SIAB.som.tocar(7);
  });
  $("vibrate-check").addEventListener("change", (evento) => {
    SIAB.som.definir("vibrar", evento.target.checked);
    if (evento.target.checked) SIAB.som.vibrar();
  });
  $("libras-check").addEventListener("change", (evento) => {
    SIAB.armazenamento.gravar(LIBRAS, evento.target.checked);
    if (evento.target.checked) carregarLibras();
    else
      SIAB.notice("O tradutor de Libras sai da tela ao recarregar a página.");
  });
  $("a11y-restaurar").addEventListener("click", () => {
    [
      "theme",
      "contrast",
      "fontScale",
      "spacing",
      "motion",
      "reading",
      "colorblind",
    ].forEach((chave) => {
      A11Y.definir(
        chave,
        { theme: "dark", fontScale: 1, reading: "off", colorblind: "none" }[
          chave
        ] ?? false,
      );
    });
    SIAB.som.definir("som", false);
    SIAB.som.definir("vibrar", false);
    SIAB.abertura.definir(true);
    sync();
    SIAB.loja.avisar();
    SIAB.notice("Preferências de acessibilidade restauradas.");
  });

  /* VLibras: tradutor oficial do governo federal (vlibras.gov.br). Precisa de
     internet, por isso é opcional e só carrega quando o usuário liga. */
  function carregarLibras() {
    if (document.getElementById("vlibras-script")) return;
    const widget = document.createElement("div");
    widget.setAttribute("vw", "");
    widget.className = "enabled";
    widget.id = "vlibras-widget";
    widget.innerHTML =
      '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.append(widget);
    const script = document.createElement("script");
    script.id = "vlibras-script";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    const falha = () => {
      script.remove();
      widget.remove();
      SIAB.notice(
        "O VLibras não pôde ser carregado agora. Verifique a conexão ou tente mais tarde.",
      );
    };
    script.onload = () => {
      try {
        new window.VLibras.Widget("https://vlibras.gov.br/app");
        window.onload?.();
      } catch (erro) {
        falha();
      }
    };
    script.onerror = falha;
    document.body.append(script);
  }

  sync();
  if (SIAB.armazenamento.ler(LIBRAS, false)) carregarLibras();
};
