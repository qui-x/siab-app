"use strict";
/* Estado das bancadas.
   Existem duas bancadas: a do laboratório livre e a da missão em andamento.
   SIAB.state sempre aponta para a bancada em uso, por isso as outras partes do
   programa não precisam saber em qual tela estão. */
SIAB.criarBancada = () => ({
  tubes: [],
  activeId: null,
  nextId: 1,
  nextGroup: 1,
  view: "focus", // 'focus' (tubo em foco) ou 'overview' (visão geral)
  relatorioIds: null, // null: relatório padrão; lista: apenas estes recipientes
  showPH: true,
  indicatorOnly: false, // "Realçar indicador": oculta a cor própria da amostra
  level: "explorar", // explorar, medir ou calcular (controles visíveis)
  destination: "tube", // a prateleira coloca o frasco no tubo ou no conta-gotas
  verTab: "grafico", // aba do painel VER
  vidraria: "tubo", // tubo, bequer ou erlenmeyer (sempre começa no tubo de ensaio)
  capacidades: { bequer: 50, erlenmeyer: 125 }, // mL escolhidos para cada vidraria (tubo: sempre 5)
  history: [], // pilha para desfazer ações
});

SIAB.benches = { lab: SIAB.criarBancada(), mission: null };
SIAB.activeBench = "lab";
Object.defineProperty(SIAB, "state", {
  get: () => SIAB.benches[SIAB.activeBench],
  configurable: true,
});
SIAB.usarBancada = (nome) => {
  const ctx = SIAB.ActivityContext?.current;
  if (ctx && nome !== (ctx.activity.type === "missao" ? "mission" : "lab")) return false;
  SIAB.activeBench = nome;
};

SIAB.current = () => SIAB.state.tubes.find((t) => t.id === SIAB.state.activeId);
// Tubos vinculados recebem as mesmas gotas.
SIAB.targets = (tube) =>
  tube.group ? SIAB.state.tubes.filter((t) => t.group === tube.group) : [tube];
// Partes do preparo de um grupo:
// - Comparar indicadores (groupMode ausente): o grupo compartilha tudo.
// - Vínculo manual (groupMode 'drops'): as gotas sempre; a substância do
//   tubo e o conta-gotas só se escolhidos ao vincular (groupShare).
// parte: 'substancia' (frasco, concentração, volume inicial, diluição) ou
// 'contaGotas' (frasco, concentração e diluição do conta-gotas).
SIAB.compartilha = (tube, parte) =>
  Boolean(tube?.group) &&
  (tube.groupMode !== "drops" || Boolean(tube.groupShare?.[parte]));
SIAB.preparoTargets = (tube, parte = "substancia") =>
  SIAB.compartilha(tube, parte) ? SIAB.targets(tube) : [tube];
// O que um grupo manual compartilha, em texto ("substância e conta-gotas").
SIAB.textoCompartilhado = (tube) => {
  const partes = [
    SIAB.compartilha(tube, "substancia") && "substância",
    SIAB.compartilha(tube, "contaGotas") && "conta-gotas",
  ].filter(Boolean);
  return partes.join(" e ");
};
SIAB.nomeGrupo = (tube) => (tube.group ? `Grupo ${tube.group}` : "");
SIAB.limparGrupos = (bench = SIAB.state) => {
  const tamanhos = new Map();
  bench.tubes.forEach((t) => {
    if (t.group) tamanhos.set(t.group, (tamanhos.get(t.group) || 0) + 1);
  });
  bench.tubes.forEach((t) => {
    if (!t.group || tamanhos.get(t.group) < 2) {
      t.group = null;
      delete t.groupMode;
      delete t.groupShare;
    }
  });
};

SIAB.TUBE_DEFAULTS = {
  solution: "water",
  concentration: 0.01,
  initialVolume: 1,
  dilution: 1,
  titrant: "naoh",
  titrantConcentration: 0.01,
  titrantDilution: 1,
  dropVolume: 0.05,
  indicator: "btb",
  additions: [],
  group: null,
  temperature: 25,
};

// Vidrarias da bancada: nome, dica e capacidades (mL) que se pode escolher.
// O tubo de ensaio tem sempre 5 mL (microescala); béquer e erlenmeyer têm os
// tamanhos comuns de laboratório escolar.
SIAB.VIDRARIAS = {
  tubo: {
    nome: "Tubo de ensaio",
    curto: "Tubo",
    capacidades: [5],
    dica: "Microescala (5 mL): o clássico dos testes rápidos com poucas gotas.",
  },
  bequer: {
    nome: "Béquer",
    curto: "Béquer",
    capacidades: [10, 25, 50, 100, 250],
    dica: "Boca larga, para misturar e aquecer. Marcas aproximadas (± 5 %).",
  },
  erlenmeyer: {
    nome: "Erlenmeyer",
    curto: "Erlenmeyer",
    capacidades: [25, 50, 125, 250],
    dica: "O frasco das titulações: a boca estreita evita respingos. Cônico, com marcas aproximadas (± 5 %).",
  },
};

// Capacidade (mL) da vidraria em uso numa bancada.
SIAB.capacidadeDaBancada = (bench = SIAB.state) =>
  (bench?.vidraria && bench.vidraria !== "tubo"
    ? bench.capacidades?.[bench.vidraria]
    : null) || SIAB.CAPACITY_ML;
// Volume inicial de um recipiente novo: 20 % da capacidade (1 mL no tubo de ensaio).
SIAB.volumePadrao = (bench = SIAB.state) =>
  Math.round(SIAB.capacidadeDaBancada(bench) * 0.2 * 100) / 100;

// Escala do recipiente: o que acompanha a capacidade escolhida.
// - casas: casas decimais do volume DENTRO do recipiente. As marcas de béquer
//   e erlenmeyer são aproximadas (incerteza de cerca de 5 % da capacidade):
//   mostrar centésimos de mL num béquer de 250 mL seria uma precisão que o
//   vidro não tem. O volume que SAI do conta-gotas, contado gota a gota,
//   continua com 2 casas.
// - atalhos: volumes dos botões "+… mL", perto de 1/10 da capacidade e um
//   passo menor, para encher um recipiente grande sem centenas de toques.
// - previsao: gotas oferecidas em "Prever e gotejar", de cerca de 1 % a 10 %
//   da capacidade (com gota de 0,05 mL): num béquer grande, 20 gotas quase
//   não mudam o pH, e a previsão ficaria sem graça.
SIAB.ESCALAS = [
  { ate: 5, casas: 2, atalhos: [1], previsao: [1, 5, 10, 20] },
  { ate: 10, casas: 1, atalhos: [1], previsao: [5, 10, 20, 40] },
  { ate: 50, casas: 1, atalhos: [1, 5], previsao: [10, 20, 50, 100] },
  { ate: 125, casas: 1, atalhos: [5, 10], previsao: [20, 50, 100, 200] },
  { ate: Infinity, casas: 0, atalhos: [10, 25], previsao: [50, 100, 200, 500] },
];
SIAB.escala = (capacidade = SIAB.capacidadeDaBancada()) =>
  SIAB.ESCALAS.find((e) => capacidade <= e.ate);
// Volume dentro de um recipiente, com as casas da escala dele ("10,3 mL").
SIAB.volumeTexto = (volume, capacidade) =>
  SIAB.format(volume, SIAB.escala(capacidade).casas);

SIAB.newTube = (options = {}, bench = SIAB.state) => {
  if (SIAB.ActivityContext && !SIAB.ActivityContext.guard("vessels.add")) return null;
  const id = bench.nextId++;
  const tube = {
    id,
    name: `${SIAB.VIDRARIAS[bench.vidraria]?.curto || "Tubo"} ${id}`,
    ...SIAB.TUBE_DEFAULTS,
    initialVolume: SIAB.volumePadrao(bench),
    ...options,
  };
  tube.additions = [...tube.additions];
  bench.tubes.push(tube);
  return tube;
};

// Capacidade de um recipiente: a própria (béquer da mistura geral) ou a da
// vidraria. Sem vidraria indicada, usa a da bancada em uso.
SIAB.capacidade = (tube, vidraria = SIAB.state?.vidraria) =>
  tube.capacidade ||
  (vidraria && vidraria !== "tubo"
    ? SIAB.state?.capacidades?.[vidraria]
    : null) ||
  SIAB.CAPACITY_ML;

// Mistura geral (montagem): junta tudo o que há nos tubos — soluções,
// gotas e indicadores — num só recipiente. Função pura, sem mexer na bancada.
// Componentes iguais (mesmo frasco, concentração e diluição) somam o volume.
SIAB.misturarTubos = (tubos) => {
  const componentes = new Map(),
    indicadores = new Map();
  let total = 0;
  for (const t of tubos) {
    const partes = SIAB.chem.base(t).map((x) => ({ ...x }));
    const gotas = SIAB.chem.added(t);
    if (gotas > 0)
      partes.push({
        id: t.titrant,
        concentration: t.titrantConcentration,
        volume: gotas,
        dilution: t.titrantDilution,
      });
    for (const p of partes) {
      if (!(p.volume > 0)) continue;
      const chave = `${p.id}|${p.concentration}|${p.dilution || 1}`;
      const atual = componentes.get(chave);
      if (atual) atual.volume += p.volume;
      else
        componentes.set(chave, {
          id: p.id,
          concentration: p.concentration,
          volume: p.volume,
          dilution: p.dilution || 1,
        });
    }
    const volume = partes.reduce((sum, p) => sum + p.volume, 0);
    total += volume;
    const deste = t.indicadores?.length
      ? t.indicadores
      : [{ id: t.indicator, fracao: 1 }];
    for (const x of deste)
      indicadores.set(x.id, (indicadores.get(x.id) || 0) + x.fracao * volume);
  }
  const listaInd = [...indicadores]
    .map(([id, v]) => ({ id, fracao: total ? v / total : 0 }))
    .filter((x) => x.fracao > 0);
  const comCor = listaInd
    .filter((x) => x.id !== "none")
    .sort((a, b) => b.fracao - a.fracao);
  return {
    volume: total,
    componentes: [...componentes.values()],
    indicadores: listaInd,
    indicator: comCor[0]?.id || "none",
  };
};

// Desfazer: guarda uma cópia dos tubos antes de cada ação.
SIAB.registrar = (descricao, bench = SIAB.state) => {
  bench.history.push({
    descricao,
    copia: JSON.stringify({
      tubes: bench.tubes,
      activeId: bench.activeId,
      nextId: bench.nextId,
      nextGroup: bench.nextGroup,
      vidraria: bench.vidraria,
      capacidades: bench.capacidades,
    }),
  });
  if (bench.history.length > 60) bench.history.shift();
};
SIAB.desfazer = (bench = SIAB.state) => {
  const ultima = bench.history.pop();
  if (!ultima) return null;
  Object.assign(bench, JSON.parse(ultima.copia));
  if (!bench.tubes.some((t) => t.id === bench.activeId))
    bench.activeId = bench.tubes[0]?.id ?? null;
  return ultima.descricao;
};

// A bancada do laboratório começa vazia: o primeiro frasco escolhido na
// prateleira cria o "Tubo 1" (ver colocar, em js/telas/bancada.js).
