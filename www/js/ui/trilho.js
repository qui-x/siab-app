"use strict";
/* Adaptador de chamadas maduras (tour, manual, seleção de recipientes).
   Toda apresentação pertence a workspace.js, sem segunda lógica de dock. */
SIAB.trilho = {
  ligar: () => SIAB.workspace.init(),
  mostrar: (panel, item) => SIAB.workspace.show(panel, item),
  expandir: (panel, item) => SIAB.workspace.show(panel, item),
  suspender: () => SIAB.workspace.suspend(),
  retomar: () => SIAB.workspace.resume(),
  fecharFlutuante: (restore = true) => {
    SIAB.workspace.close("left", restore);
    SIAB.workspace.close("right", restore);
  },
  get estado() {
    return {
      controls: SIAB.workspace.state.left === "collapsed",
      "ver-panel": SIAB.workspace.state.right === "collapsed",
    };
  },
  get flutuante() {
    return null;
  },
};
