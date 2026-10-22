"use strict";
/* Única fonte para ícones semânticos. Diagramas e instrumentos conservam seus SVGs próprios. */
SIAB.icons = (() => {
  const paths = Object.freeze({
    close: "M6 6l12 12M18 6 6 18",
    menu: "M4 6h16M4 12h16M4 18h16",
    exchange: "M3 7h17M16 3l4 4-4 4M21 17H4M8 13l-4 4 4 4",
    flow: "M3 5h5a4 4 0 0 1 4 4v5a4 4 0 0 0 4 4h5M17 14l4 4-4 4",
    collapse: "M9 4v5H4M9 9 3 3M15 20v-5h5M15 15l6 6M14 3h7v7M3 14v7h7",
    expand: "M8 3H3v5M3 3l6 6M16 21h5v-5M21 21l-6-6M14 3h7v7M3 14v7h7",

    /* Chevron específico para abrir/recolher seções */
    chevron: "M9 6l6 6-6 6",

    dropdown: "M6 9.5 12 15.5l6-6M12 4v5",
    next: "M6 12h11M11.5 5.5 18 12l-6.5 6.5",
    previous: "M18 12H7M12.5 5.5 6 12l6.5 6.5",
    history: "M4 8a9 9 0 1 1-1 7M3 3v6h6M12 7v6l4 2",
    table: "M4 4h16v16H4ZM4 9h16M4 14h16M10 4v16",
    prepare:
      "M4 3h7M5 3v5l-3 7a3 3 0 0 0 3 4h5a3 3 0 0 0 3-4l-3-7V3M4 13h7M19 9c-1 2-3 4-3 6a3 3 0 0 0 6 0c0-2-2-4-3-6Z",
    setup:
      "M3 20h18M7 20V4h10M5 4h4M13 7h6M14 7v7a2 2 0 0 0 4 0V7M7 11h7M5 15h4",
    home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
    learn:
      "M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8ZM8 19h8M10 22h4M9 8l3 3 3-3M12 11v5",
    mission: "M20 12a8 8 0 1 1-8-8M16 12a4 4 0 1 1-4-4M12 12l9-9M17 3h4v4",
    protocol: "M8 5H5v16h14V5h-3M8 3h8v4H8ZM8 11l1 1 2-2M13 11h3M8 16h8",
    lab: "M4 4h8M5 4v14a3 3 0 0 0 6 0V4M5 13h6M18 5c1 2 3 4 3 6a3 3 0 0 1-6 0c0-2 2-4 3-6Z",
    notebook: "M6 3h14v18H6ZM3 7h5M3 12h5M3 17h5M11 7h5M11 11h5M11 15h3",
    manual:
      "M12 5C8 3 4 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-1-10 1ZM12 5v16M16 6v7l2-2 2 2V6",
    mount:
      "M2 18h20M4 18v3M20 18v3M5 3h6M6 3v10a2 2 0 0 0 4 0V3M6 10h4M16 6v4l-3 5h8l-3-5V6M15 6h4",
    professor:
      "M8 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M2 20v-5a3 3 0 0 1 6 0v5M13 6h8v15h-9V6h1M14 3h5v5h-5ZM15 12h3M15 16h3",
    accessibility:
      "M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M4 8l8 2 8-2M12 10v5M7 22l5-7 5 7",
    settings: "M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M7 14v6",
    tour: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 8l-3 5-5 3 3-5Z",
    install: "M12 3v12M8 11l4 4 4-4M4 17v4h16v-4",
    about: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 11v6M12 7h.01",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    ruler: "M4 17 17 4l3 3L7 20H4ZM8 13l2 2M11 10l2 2M14 7l2 2",
    chart: "M4 3v17h17M7 16l4-5 4 2 5-8",
    meter:
      "M3 4h12v15H3ZM6 7h6v5H6ZM15 7h3a3 3 0 0 1 3 3v4M19 14h3v7h-3ZM6 15h2M11 15h1",
    report: "M5 3h10l4 4v14H5ZM15 3v5h4M8 12h8M8 16h8",
    data: "M3 7V4h7l2 3h9v13H3ZM7 12h2M7 16h2M12 12h5M12 16h5",
    help: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M9 8a3 3 0 1 1 4 3c-1 1-1 1-1 3M12 17h.01",
    arrow: "M4 9v6M4 12h15M13.5 6.5 19 12l-5.5 5.5",
    back: "M20 9v6M20 12H5M10.5 6.5 5 12l5.5 5.5",
    explore: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16 16l4.5 4.5M8 11h6M11 8v6",
    calculator:
      "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01",
    search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0M15 15l6 6",
    projector: "M3 4h18v13H3ZM8 22l4-5 4 5M12 17v5",
  });

  const aliases = {
    book: "manual",
    tube: "lab",
    flask: "lab",
    list: "protocol",
    access: "accessibility",
    teacher: "professor",
    montagem: "setup",
    preparo: "prepare",
    observar: "eye",
    medir: "ruler",
    analisar: "chart",
    historico: "history",
    tabela: "table",
    ver: "eye",
    dados: "data",
  };

  function svg(name, extraClass = "") {
    name = aliases[name] || name;

    if (!paths[name]) {
      name = "help";
    }

    return `<svg
      class="siab-icon${extraClass ? " " + extraClass : ""}"
      data-icon="${name}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    ><path d="${paths[name]}"/></svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll("[data-app-icon]").forEach((el) => {
      el.outerHTML = svg(
        el.dataset.appIcon,
        el.getAttribute("class") || ""
      );
    });

    root.querySelectorAll("summary:not(.with-disclosure)").forEach((el) => {
      el.classList.add("with-disclosure");
      el.insertAdjacentHTML(
        "beforeend",
        svg("dropdown", "disclosure-icon")
      );
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    hydrate();

    new MutationObserver((records) => {
      const parents = new Set(
        records
          .filter((r) => r.addedNodes.length)
          .map((r) => r.target)
      );

      for (const parent of parents) {
        if (parent.querySelectorAll) {
          hydrate(parent);
        }
      }
    }).observe(document.body, {
      childList: true,
      subtree: true,
    });
  });

  return Object.freeze({
    svg,
    hydrate,
    paths,
    aliases,
  });
})();