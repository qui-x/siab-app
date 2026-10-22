"use strict";
SIAB.telas.inicio = {
  secao: "inicio",
  titulo: () => "Início",
  entrar() {
    SIAB.$("inicio-temas-meta").textContent =
      `${SIAB.temas.length} temas para explorar`;
    SIAB.$("inicio-missoes-meta").textContent =
      `${SIAB.missoes.length} desafios para resolver`;
    SIAB.$("inicio-roteiros-meta").textContent =
      `${SIAB.experimentos.length} investigações guiadas`;
    const registros = SIAB.progresso.dados.caderno.length;
    SIAB.$("inicio-caderno-meta").textContent = registros
      ? `${registros} ${registros === 1 ? "registro salvo" : "registros salvos"}`
      : "Pronto para suas descobertas";
  },
};
