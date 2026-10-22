"use strict";
SIAB.motor = (() => {
  let ativa = null;
  function contexto() {
    const s = SIAB.state,
      tubos = s.tubes.map((tube) => {
        const r = SIAB.chem.solve(tube);
        return { tube, r, nome: tube.name, cor: r.indicator.name };
      });
    return {
      tubos,
      tubo: (nome) => tubos.find((t) => t.nome === nome),
      ativo: SIAB.current()?.name,
      estado: s,
      respostas: ativa?.respostas || {},
      visitados: new Set(ativa?.visitados || []),
    };
  }
  function iniciar(id) {
    if (SIAB.ActivityContext?.restricted()) return null;
    const def = SIAB.missoes.find((m) => m.id === id);
    if (!def) return null;
    const b = SIAB.criarBancada(),
      groups = {};
    def.bancada.tubos.forEach((spec) => {
      const { grupo, ...x } = spec;
      if (grupo && !groups[grupo]) groups[grupo] = b.nextGroup++;
      SIAB.newTube(
        {
          ...x,
          group: grupo ? groups[grupo] : null,
          groupMode: "drops",
          groupShare: { contaGotas: true, substancia: false },
        },
        b,
      );
    });
    b.activeId = b.tubes[0]?.id;
    b.level = def.bancada.nivel || "explorar";
    b.verTab = "ph";
    SIAB.benches.mission = b;
    SIAB.usarBancada("mission");
    ativa = {
      def,
      respostas: {},
      evidencias: {},
      visitados: [],
      concluida: false,
    };
    return ativa;
  }
  function atualizar() {
    if (!ativa || SIAB.activeBench !== "mission") return;
    const ctx = contexto();
    if (!ativa.visitados.includes(ctx.ativo)) ativa.visitados.push(ctx.ativo);
    ativa.def.passos.forEach((p, i) => {
      if (p.tipo === "agir") {
        try {
          if (p.concluido(ctx)) ativa.evidencias[i] = true;
        } catch (_) {
          /* uma condição pode exigir outra configuração de bancada */
        }
      }
    });
  }
  function concluido() {
    if (!ativa) return false;
    atualizar();
    const atos = ativa.def.passos
      .map((p, i) => (p.tipo === "agir" ? i : null))
      .filter((x) => x !== null);
    return (
      (atos.length
        ? atos.every((i) => ativa.evidencias[i])
        : SIAB.state.tubes.some(
            (t) => t.additions.length || t.observacao?.leituras?.length,
          )) && Boolean(ativa.respostas.conclusao?.trim())
    );
  }
  function concluir() {
    if (ativa?.concluida) return true;
    if (!concluido()) return false;
    ativa.concluida = true;
    SIAB.progresso.concluirMissao(ativa.def.id, ativa.respostas);
    SIAB.progresso.anotar({
      tipo: "missao",
      titulo: ativa.def.titulo,
      linhas: [["Conclusão", ativa.respostas.conclusao]],
    });
    return true;
  }
  function restaurar(x) {
    const ctx = SIAB.ActivityContext?.current;
    if (
      ctx?.permissions.navigation.mode === "restricted" &&
      (ctx.activity.type !== "missao" || ctx.activity.item !== x?.id)
    )
      return false;
    const def = SIAB.missoes.find((m) => m.id === x?.id);
    if (def)
      ativa = {
        def,
        respostas: x.respostas || {},
        evidencias: x.evidencias || {},
        visitados: x.visitados || [],
        concluida: !!x.concluida,
      };
  }
  return {
    iniciar,
    contexto,
    atualizar,
    concluido,
    concluir,
    restaurar,
    responder(id, v) {
      if (ativa) ativa.respostas[id] = v;
    },
    get ativa() {
      return ativa;
    },
  };
})();
