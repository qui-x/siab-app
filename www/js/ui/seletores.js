"use strict";
/* Seletores temáticos. O <select> continua guardando o valor do formulário;
   um botão, uma busca e uma lista substituem a janela nativa do navegador,
   seguindo o tema e aceitando teclado. */
SIAB.initSelects = () => {
  const $ = SIAB.$;
  const dialog = $("choice-dialog");
  const list = $("choice-options");
  const records = [];
  let origin = null,
    visible = [],
    active = 0;

  SIAB.refreshSelects = () => {
    SIABCompat.atualizarOpcoes();
    records.forEach(({ select, button }) => {
      const label = select.selectedOptions[0]?.textContent || "Escolher";
      button.querySelector("span").textContent = label;
      button.disabled = select.disabled;
      button.setAttribute("aria-label", `${select.dataset.label}: ${label}`);
    });
  };

  function focusOption(scroll = false) {
    const options = [...list.querySelectorAll('[role="option"]')];
    options.forEach((option, index) => {
      option.dataset.active = String(index === active);
    });
    if (options[active]) {
      list.setAttribute("aria-activedescendant", options[active].id);
      if (scroll) options[active].scrollIntoView?.({ block: "nearest" });
    } else {
      list.removeAttribute("aria-activedescendant");
    }
  }

  function paint() {
    if (!origin) return;
    const query = SIAB.normalizar($("choice-search").value);
    visible = [...origin.select.options].filter(
      (option) =>
        !option.disabled &&
        !option.hidden &&
        SIAB.normalizar(
          option.textContent + " " + (option.parentElement.label || ""),
        ).includes(query),
    );
    active = Math.max(
      0,
      visible.findIndex((option) => option.selected),
    );
    let previousGroup = null;
    list.innerHTML = visible
      .map((option, index) => {
        const group =
          option.parentElement.tagName === "OPTGROUP"
            ? option.parentElement.label
            : "";
        const heading =
          group && previousGroup !== group
            ? `<div class="choice-group" role="presentation">${SIAB.escape(group)}</div>`
            : "";
        previousGroup = group;
        return `${heading}<div id="choice-option-${index}" role="option" aria-selected="${option.selected}" class="choice-option" data-choice-index="${index}"><span>${SIAB.escape(option.textContent)}</span><span class="choice-check" aria-hidden="true">${option.selected ? "✓" : ""}</span></div>`;
      })
      .join("");
    $("choice-count").textContent =
      `${visible.length} ${visible.length === 1 ? "opção disponível" : "opções disponíveis"}`;
    $("choice-empty").hidden = visible.length !== 0;
    focusOption();
  }

  function choose(index) {
    if (!origin || !visible[index]) return;
    const select = origin.select;
    select.value = visible[index].value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    SIAB.refreshSelects();
    dialog.close();
  }

  // Transforma um <select> em botão temático. Pode ser chamada depois, para selects novos.
  SIAB.enhanceSelect = (select) => {
    if (records.some((record) => record.select === select)) return;
    if (!select.id) select.id = `select-${select.name || records.length}`;
    if (!select.dataset.label)
      select.dataset.label =
        select.closest("label")?.firstChild?.textContent?.trim() ||
        "Escolher opção";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "themed-select";
    button.id = `${select.id}-trigger`;
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", "choice-dialog");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML =
      '<span></span>' + SIAB.icons.svg("dropdown");
    select.hidden = true;
    select.after(button);
    const record = { select, button };
    records.push(record);
    select.addEventListener("change", SIAB.refreshSelects);
    button.addEventListener("click", () => {
      origin = record;
      $("choice-title").textContent = select.dataset.label;
      $("choice-search").value = "";
      $("choice-search-field").hidden = select.options.length < 8;
      button.setAttribute("aria-expanded", "true");
      paint();
      dialog.showModal();
      list.focus();
    });
    SIAB.refreshSelects();
  };

  document.querySelectorAll("select").forEach(SIAB.enhanceSelect);

  list.addEventListener("click", (event) => {
    const option = event.target.closest("[data-choice-index]");
    if (option) choose(Number(option.dataset.choiceIndex));
  });
  list.addEventListener("keydown", (event) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (!visible.length) return;
    if (event.key === "ArrowDown") active = (active + 1) % visible.length;
    if (event.key === "ArrowUp")
      active = (active - 1 + visible.length) % visible.length;
    if (event.key === "Home") active = 0;
    if (event.key === "End") active = visible.length - 1;
    if (event.key === "Enter" || event.key === " ") choose(active);
    else focusOption(true);
  });
  $("choice-search").addEventListener("input", paint);
  $("choice-search").addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list.focus();
      focusOption(true);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      choose(active);
    }
  });
  dialog.addEventListener("close", () => {
    const previous = origin;
    origin = null;
    if (previous) {
      previous.button.setAttribute("aria-expanded", "false");
      previous.button.focus();
    }
  });
  SIAB.refreshSelects();
};
