"use strict";
SIAB.telas.aprender = {
  secao: "aprender",
  titulo: () => "Temas",
  entrar() {
    SIAB.$("temas-lista").innerHTML = SIAB.temas
      .map(
        (t) =>
          `<a class="content-row" href="#/tema/${t.id}"><span><strong>${SIAB.escape(t.titulo)}</strong><small>${SIAB.escape(t.conceito)}</small></span><span>${SIAB.progresso.dados.temas[t.id]?.concluida ? "Revisado" : "Não revisado"}</span></a>`,
      )
      .join("");
  },
};
SIAB.telas.tema = {
  secao: "tema",
  menu: "aprender",
  titulo: (id) => SIAB.temas.find((t) => t.id === id)?.titulo || "Tema",
  entrar(id) {
    const t = SIAB.temas.find((t) => t.id === id);
    if (!t) {
      SIAB.notice("Tema não encontrado.");
      SIAB.irPara("#/aprender");
      return;
    }
    const missao =
      SIAB.missoes.find((m) => m.id === t.missao) ||
      SIAB.missoes.find((m) =>
        m.bancada.tubos.some((x) => x.solution === t.solution),
      );
    const roteiro = SIAB.experimentos.find((r) =>
      r.tubos.some((x) => x.solution === t.solution),
    );
    SIAB.$("tema-conteudo").innerHTML =
      `<p class="eyebrow">APRENDER · TEMA</p><h1 data-foco tabindex="-1">${SIAB.escape(t.titulo)}</h1><p class="lead">${SIAB.escape(t.conceito)}</p><p>Investigue na bancada e use o VER para conectar observações, medidas e representações do modelo.</p><div class="actions"><button class="primary-btn" data-tema-bancada="${t.id}">Investigar na bancada</button>${missao ? `<a class="secondary-btn" href="#/missao/${missao.id}">Missão relacionada</a>` : ""}${roteiro ? `<a class="secondary-btn" href="#/roteiro/${roteiro.id}">Roteiro relacionado</a>` : ""}<button class="quiet-btn" data-tema-concluir="${t.id}">${SIAB.progresso.dados.temas[id]?.concluida ? "Revisado" : "Marcar como revisado"}</button></div>`;
  },
};
SIAB.telas.missoes = {
  secao: "missoes",
  titulo: () => "Missões",
  entrar() {
    SIAB.$("missoes-lista").innerHTML = SIAB.missoes
      .map(
        (m) =>
          `<a class="content-row" href="#/missao/${m.id}"><span><strong>${SIAB.escape(m.titulo)}</strong><small>${SIAB.escape(m.resumo)}</small></span><span>${SIAB.progresso.missao(m.id)?.concluida ? "Concluído" : "Não realizado"}</span></a>`,
      )
      .join("");
  },
};
