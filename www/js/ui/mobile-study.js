"use strict";
/* Complementos de leitura e enquadramento. Workspace controla todos os painéis,
   preservando uma única lógica para conteúdo, permissões, foco e apresentação. */
(() => {
  const S = SIAB,
    $ = S.$,
    root = document.documentElement;
  const mobile = matchMedia("(max-width: 900px)");
  const shortViewport = matchMedia("(max-height: 650px)");
  let frame = 0;
  root.dataset.mobileStudy = "on";
  root.dataset.mobileCards = "lista";
  // Espaço constante para o toast existente, fora da região rolável do SVG.
  // Aparecer, trocar de texto ou expirar nunca muda a altura da cena.
  const noticeSpace = document.createElement("div");
  noticeSpace.id = "mobile-bench-notice-space";
  $("dose-area").before(noticeSpace);
  function button(id, label, cls = "secondary-btn") {
    const el = document.createElement("button");
    el.id = id;
    el.type = "button";
    el.textContent = label;
    el.className = `mobile-study-control ${cls}`;
    return el;
  }
  const doses = button("mobile-doses-toggle", "Doses");
  doses.setAttribute("aria-controls", "dose-shortcuts");
  doses.setAttribute("aria-expanded", "false");
  document.querySelector("#dose-area .dose-actions").append(doses);
  doses.addEventListener("click", () => {
    const expanded = root.dataset.mobileDoses !== "on";
    root.dataset.mobileDoses = expanded ? "on" : "off";
    doses.setAttribute("aria-expanded", String(expanded));
    update();
  });
  const cards = button("mobile-card-toggle", "Ver em grade");
  cards.setAttribute("aria-controls", "overview-grid");
  cards.setAttribute("aria-pressed", "false");
  document.querySelector(".overview-heading-actions").append(cards);
  cards.addEventListener("click", () => {
    const grid = root.dataset.mobileCards !== "grade";
    root.dataset.mobileCards = grid ? "grade" : "lista";
    cards.setAttribute("aria-pressed", String(grid));
    cards.textContent = grid ? "Ver em lista" : "Ver em grade";
  });
  function update() {
    frame = 0;
    const vv = visualViewport;
    root.style.setProperty(
      "--mobile-visible-height",
      `${Math.round(vv?.height || innerHeight)}px`,
    );
    $("focus-tab").firstChild.textContent = "Tubo em foco";
    cards.hidden = $("overview-grid").classList.contains("selecting");
    const focus = mobile.matches && !$("workspace").hidden &&
      !$("workspace").classList.contains("vazia") && !$("focus-view").hidden;
    root.dataset.mobileFocus = focus ? "on" : "off";
    if (!focus) {
      if (mobile.matches && $("toast").dataset.contexto === "bancada" && !$("toast").childElementCount) $("toast").hidden = true;
      return;
    }
    root.dataset.mobileNotice = shortViewport.matches ? "side" : "footer";
    const header = document.querySelector(".app-header").getBoundingClientRect();
    const banner = $("activity-banner");
    const bannerHeight = banner?.getClientRects().length ? banner.getBoundingClientRect().height : 0;
    root.style.setProperty("--mobile-workspace-height", `${(vv?.height || innerHeight) - header.height - bannerHeight}px`);
    root.style.setProperty("--mobile-launchers-height", `${$("workspace-launchers").getBoundingClientRect().height}px`);
    let rect = noticeSpace.getBoundingClientRect();
    if (shortViewport.matches) {
      // Em pouca altura, o espaço vazio ao lado do SVG recebe o mesmo toast.
      // O retângulo do desenho é calculado pelo viewBox, sem mudar sua escala.
      const glass = $("large-tube"), box = glass.getBoundingClientRect();
      const view = glass.querySelector("svg")?.viewBox.baseVal;
      const drawnWidth = view?.height ? Math.min(box.width, box.height * view.width / view.height) : box.width;
      rect = { top: box.top, height: box.height };
      root.style.setProperty("--bench-notice-left", `${box.left}px`);
      root.style.setProperty("--bench-notice-width", `${Math.max(0, (box.width - drawnWidth) / 2 - 8)}px`);
    }
    root.style.setProperty("--bench-notice-top", `${rect.top}px`);
    root.style.setProperty("--bench-notice-height", `${rect.height}px`);
    $("tube-name").title = $("tube-name").textContent;
    $("titrant-label").title = $("titrant-label").textContent;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  window.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);
  document.addEventListener("scroll", schedule, { passive: true, capture: true });
  document.addEventListener("click", schedule);
  S.loja.assinar(schedule);
  new MutationObserver(schedule).observe($("workspace"), {
    attributes: true,
    attributeFilter: ["hidden", "class"],
  });
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(schedule);
    for (const el of [
      document.querySelector(".app-header"),
      $("dose-area"),
      document.querySelector(".focus-heading"),
      $("focus-view"),
      noticeSpace,
    ])
      observer.observe(el);
    const banner = document.querySelector(".activity-banner");
    if (banner) observer.observe(banner);
  }
  window.SIABMobileStudy = {
    mostrar(area) {
      if (area === "analise") S.workspace.open("right");
      else $(area === "tubos" ? "overview-tab" : "focus-tab").click();
    },
    atualizar: schedule,
    prateleira(group) {
      S.workspace.open(
        "left",
        { medidas: "preparo", modulos: "modulo", acoes: "objetos" }[group] ||
          group,
      );
    },
  };
  schedule();
})();
