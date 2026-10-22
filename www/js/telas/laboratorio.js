"use strict";
/* Tela do laboratório livre: a bancada com prateleira e módulos. */
SIAB.telas.laboratorio = {
  secao: "bancada",
  menu: "laboratorio",
  titulo: () => "Bancada",
  entrar() {
    SIAB.usarBancada("lab");
    SIAB.bancada.configurar({ modo: "laboratorio" });
    SIAB.render(true);
    SIAB.$("boas-vindas").hidden =
      SIAB.ajuda.jaViu() ||
      Boolean(SIAB.state.experiencia || SIAB.atividades?.ativa);
    SIAB.ajuda.aplicarPendente();
  },
  sair() {
    SIAB.bancada.closeSheet(false);
  },
};
