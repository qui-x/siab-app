"use strict";
SIAB.selecaoTubos = (() => {
  const $ = SIAB.$,
    estados = new WeakMap();
  function estado() {
    if (!estados.has(SIAB.state))
      estados.set(SIAB.state, { ativa: false, ids: new Set() });
    return estados.get(SIAB.state);
  }
  const tubos = () => SIAB.state.tubes.filter((t) => estado().ids.has(t.id));
  function atualizar() {
    const e = estado(),
      s = SIAB.state;
    if (s.view !== "overview") {
      e.ativa = false;
      e.ids.clear();
    }
    for (const id of e.ids)
      if (!s.tubes.some((t) => t.id === id)) e.ids.delete(id);
    $("selecao-tubos").hidden = !e.ativa;
    $("selecionar-tubos-btn").hidden = e.ativa;
    $("selecionar-tubos-btn").disabled = !s.tubes.length;
    $("selecao-tubos-contagem").textContent =
      `${e.ids.size} recipientes selecionados`;
    $("overview-hint").textContent =
      "Use Selecionar recipientes para comparar, vincular, misturar ou registrar.";
    const ts = tubos(),
      n = ts.length;
    ["comparar", "misturar", "vincular"].forEach((k) => {
      $(`selecao-${k}-btn`).hidden = n < 2;
    });
    ["registrar", "remover"].forEach((k) => {
      $(`selecao-${k}-btn`).hidden = !n;
    });
    $("selecao-desvincular-btn").hidden = !ts.some((t) => t.group);
    $("overview-grid").classList.toggle("selecting", e.ativa);
    $("workspace").classList.toggle("selecting-tubes", e.ativa);
    $("overview-grid")
      .querySelectorAll("[data-tube]")
      .forEach((el) => {
        el.classList.toggle(
          "tube-selected",
          e.ids.has(Number(el.dataset.tube)),
        );
        if (e.ativa)
          el.setAttribute(
            "aria-pressed",
            String(e.ids.has(Number(el.dataset.tube))),
          );
        else el.removeAttribute("aria-pressed");
      });
  }
  function sair() {
    estado().ativa = false;
    estado().ids.clear();
    atualizar();
  }
  function registrar() {
    for (const t of tubos())
      SIAB.progresso.anotar({
        tipo: "exploracao",
        titulo: t.name,
        linhas: [
          ["Conteúdo", SIAB.resumoConteudo(t)],
          ["pH", SIAB.instrumentos.leitura(t).texto],
          ["Indicador", SIAB.nomeIndicador(t)],
          [
            "Temperatura",
            `${SIAB.format(SIAB.chem.solve(t).temperature, 1)} °C`,
          ],
        ],
      });
    SIAB.notice("Exploração registrada no Caderno.");
    sair();
  }
  function comparar() {
    const ts = tubos();
    $("comparacao-corpo").innerHTML =
      `<div class="table-scroll" tabindex="0" role="region" aria-label="Dados da investigação"><table><thead><tr><th>Recipiente</th><th>Conteúdo</th><th>pH</th><th>Temperatura</th><th>Condutividade medida</th></tr></thead><tbody>${ts.map((t) => `<tr><td>${SIAB.escape(t.name)}</td><td>${SIAB.escape(SIAB.resumoConteudo(t))}</td><td>${SIAB.escape(SIAB.instrumentos.leitura(t).texto)}</td><td>${SIAB.format(SIAB.chem.solve(t).temperature, 1)} °C</td><td>${t.observacao?.condutividade ? SIAB.format(t.observacao.condutividade.valor) + " µS/cm" : "Não medida"}</td></tr>`).join("")}</tbody></table></div><p>A comparação conserva os conteúdos e não cria vínculo.</p>`;
    $("comparacao-dialog").showModal();
  }
  function misturar(ids, destinoId) {
    if (!SIAB.ActivityContext.guard("vessels.changeContent")) return false;
    const selected = SIAB.state.tubes.filter((t) => ids.includes(t.id)),
      dest = SIAB.state.tubes.find((t) => t.id === destinoId);
    if (selected.length < 2 || !dest)
      throw new Error("Selecione pelo menos dois recipientes e um destino.");
    const fontes = selected.includes(dest) ? selected : [...selected, dest];
    const mix = SIAB.misturarTubos(fontes);
    if (mix.volume > SIAB.capacidade(dest) + 1e-9)
      throw new Error(
        "A mistura excede a capacidade do recipiente de destino.",
      );
    const temp =
      fontes.reduce(
        (v, t) =>
          v + SIAB.chem.solve(t).temperature * SIAB.chem.solve(t).volume,
        0,
      ) / (mix.volume || 1);
    SIAB.alterar("misturar recipientes", () => {
      fontes.forEach((t) => {
        SIAB.instrumentos.parar(t);
        t.solution = "water";
        t.concentration = 0;
        t.initialVolume = 0;
        t.componentes = [];
        t.additions = [];
        t.indicator = "none";
        delete t.indicadores;
        t.group = null;
        delete t.observacao;
      });
      Object.assign(dest, {
        componentes: mix.componentes,
        initialVolume: mix.volume,
        indicadores: mix.indicadores,
        indicator: mix.indicator,
        temperature: temp,
      });
      SIAB.state.activeId = dest.id;
      SIAB.limparGrupos();
    });
    sair();
    return dest;
  }
  function ligar() {
    $("selecionar-tubos-btn").onclick = () => {
      estado().ativa = true;
      atualizar();
    };
    $("selecao-todos-btn").onclick = () => {
      const e = estado();
      e.ids =
        e.ids.size === SIAB.state.tubes.length
          ? new Set()
          : new Set(SIAB.state.tubes.map((t) => t.id));
      atualizar();
    };
    $("selecao-cancelar-btn").onclick = sair;
    $("overview-grid").addEventListener(
      "click",
      (e) => {
        const b = e.target.closest("[data-tube]");
        if (!b) return;
        const st = estado();
        if (st.ativa || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          st.ativa = true;
          const id = Number(b.dataset.tube);
          st.ids.has(id) ? st.ids.delete(id) : st.ids.add(id);
          atualizar();
        }
      },
      { capture: true },
    );
    $("selecao-comparar-btn").onclick = comparar;
    $("selecao-registrar-btn").onclick = registrar;
    $("selecao-vincular-btn").onclick = () => {
      SIAB.bancada.vincularTubos([...estado().ids], {
        contaGotas: true,
        substancia: false,
      });
      atualizar();
    };
    $("selecao-desvincular-btn").onclick = () => {
      SIAB.bancada.desvincularTubos([...estado().ids]);
      atualizar();
    };
    $("selecao-remover-btn").onclick = () => {
      const ids = [...estado().ids];
      SIAB.confirmar(
        "Remover recipientes?",
        "A remoção pode ser desfeita na bancada.",
        () => {
          SIAB.alterar("remover recipientes", (s) => {
            s.tubes = s.tubes.filter((t) => !ids.includes(t.id));
            s.activeId = s.tubes[0]?.id ?? null;
            SIAB.limparGrupos();
          });
          sair();
        },
        "Remover",
        "danger",
      );
    };
    $("selecao-misturar-btn").onclick = () => {
      $("mistura-destino-select").innerHTML = SIAB.state.tubes
        .map(
          (t) =>
            `<option value="${t.id}">${SIAB.escape(t.name)} · ${SIAB.capacidade(t)} mL</option>`,
        )
        .join("");
      $("mistura-erro").textContent = "";
      $("mistura-destino-dialog").showModal();
    };
    $("mistura-destino-form").onsubmit = (e) => {
      e.preventDefault();
      try {
        misturar([...estado().ids], Number($("mistura-destino-select").value));
        $("mistura-destino-dialog").close();
        SIAB.notice(
          "Conteúdos combinados. As origens ficaram vazias. Meça novamente.",
        );
      } catch (err) {
        $("mistura-erro").textContent = err.message;
      }
    };
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        estado().ativa &&
        !document.querySelector("dialog[open]")
      )
        sair();
    });
  }
  return {
    ligar,
    atualizar,
    sair,
    misturar,
    idsRelatorio: () => null,
    ids: () => [...estado().ids],
  };
})();
