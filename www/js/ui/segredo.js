"use strict";
/* Compatibilidade de consumidores anteriores. A montagem tem agora um único
   cadastro público e nunca cria notas automaticamente. */
SIAB.segredo = {
  ARCO_IRIS: SIAB.montagens.find((m) => m.id === "arco-iris-ph").tubos,
  arcoIris: () => SIAB.montarMontagem("arco-iris-ph"),
  ligar() {},
};
