"use strict";
SIAB.missaoTela = (() => {
  const $ = SIAB.$,
    esc = SIAB.escape;
  function render() {
    const a = SIAB.motor.ativa;
    if (!a) return;
    const m = a.def;
    const tasks = m.passos
      .map((p, i) => ({ p, i }))
      .filter((x) => x.p.tipo === "agir");
    $("painel-missao").innerHTML =
      `<article class="missao-card"><p class="eyebrow">MISSÃO · ${a.concluida ? "Concluído" : "Não realizado"}</p><h2 data-foco tabindex="-1">${esc(m.titulo)}</h2><h3>O problema</h3><p>${esc(m.resumo)}</p><h3>Objetivo e regras</h3><p>Escolha sua estratégia. Registre evidências da bancada e uma conclusão que responda ao problema.</p><ul class="mission-objectives">${tasks.map(({ p, i }) => `<li data-objective="${i}">${esc(p.texto)} <strong>${a.evidencias[i] ? "Concluído" : ""}</strong></li>`).join("")}</ul>${tasks.length ? "" : "<p>Faça uma intervenção ou medição e use a evidência em sua conclusão.</p>"}${m.bancada.controles?.includes("temperatura") ? "<p>Ajuste a temperatura no VER → Medir → Temperatura.</p>" : ""}<details><summary>Contexto e evidências</summary>${m.passos.filter(p => p.tipo === "contexto" || p.tipo === "evidencia").map(p => `<p>${esc(p.texto)}</p>`).join("")}</details><details><summary>Perguntas para investigar</summary>${m.passos
        .filter((p) => p.tipo === "pergunta" || p.tipo === "interpretacao")
        .map(
          (p) => `<p>${esc(p.pergunta || "Que evidência você procura?")}</p>`,
        )
        .join(
          "",
        )}</details><label class="field">Conclusão<textarea id="missao-conclusao" rows="4" maxlength="6000">${esc(a.respostas.conclusao || "")}</textarea></label><p id="missao-feedback" role="status"></p><div class="actions"><button class="primary-btn" id="missao-concluir">Concluir missão</button><button class="quiet-btn" id="missao-refazer">Refazer</button><button class="secondary-btn" data-open-report>Relatório</button></div></article>`;
    $("mission-bar").hidden = false;
    $("mission-bar").textContent = m.titulo;
  }
  function atualizar() {
    if (SIAB.rota.nome !== "missao") return;
    SIAB.motor.atualizar();
    document.querySelectorAll("[data-objective]").forEach((el) => {
      el.querySelector("strong").textContent = SIAB.motor.ativa.evidencias[
        el.dataset.objective
      ]
        ? "Concluído"
        : "";
    });
  }
  function ligar() {
    const p = $("painel-missao");
    p.addEventListener("input", (e) => {
      if (e.target.id === "missao-conclusao") {
        SIAB.motor.responder("conclusao", e.target.value);
        SIAB.atividades?.salvarSessao();
      }
    });
    p.addEventListener("click", (e) => {
      if (e.target.closest("#missao-concluir")) {
        const ok = SIAB.motor.concluir();
        $("missao-feedback").textContent = ok
          ? "Concluído. Síntese registrada no Caderno."
          : "Confira as condições da bancada e escreva sua conclusão.";
        if (ok) SIAB.atividades?.salvarSessao();
      }
      if (e.target.closest("#missao-refazer")) {
        SIAB.motor.iniciar(SIAB.motor.ativa.def.id);
        SIAB.render(true);
        render();
      }
    });
    $("mission-bar").addEventListener("click", () => SIAB.bancada.openSheet());
    SIAB.loja.assinar(atualizar);
  }
  return { render, ligar };
})();
SIAB.telas.missao = {
  secao: "bancada",
  menu: "missoes",
  titulo: (id) => SIAB.missoes.find((m) => m.id === id)?.titulo || "Missão",
  entrar(id) {
    const m = SIAB.missoes.find((m) => m.id === id);
    if (!m) {
      SIAB.notice(
        "Missão antiga não identificada. Escolha uma missão na lista.",
      );
      SIAB.irPara("#/missoes");
      return;
    }
    if (SIAB.motor.ativa?.def.id !== id) SIAB.motor.iniciar(id);
    SIAB.usarBancada("mission");
    SIAB.bancada.configurar({
      modo: "missao",
      controles: [...new Set([...(m.bancada.controles || []), "poe"])],
      nivel: m.bancada.nivel || "explorar",
    });
    SIAB.state.level = m.bancada.nivel || "explorar";
    SIAB.$("boas-vindas").hidden = true;
    SIAB.missaoTela.render();
    SIAB.render(true);
  },
  sair() {
    SIAB.bancada.closeSheet(false);
    SIAB.$("mission-bar").hidden = true;
  },
};
