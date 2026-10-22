"use strict";
SIAB.experimentos = (() => {
  const stories = {
    "titulacao-forte": [
      "Uma gota faz a diferença",
      "Investigação de equivalência em titulação ácido forte–base forte",
      "Uma equipe precisa localizar o ponto de neutralização sem confundi-lo com a primeira mudança de cor.",
      "Como reconhecer a equivalência a partir de medidas e de uma mudança de cor?",
    ],
    "titulacao-fraco": [
      "Além da mudança de cor",
      "Titulação de ácido acético com base forte",
      "Um laboratório compara um ácido fraco com um ácido forte de mesma concentração.",
      "A natureza do ácido muda a curva e o pH na equivalência?",
    ],
    "titulacao-base-fraca": [
      "O caminho de volta",
      "Titulação de amônia por ácido clorídrico",
      "Uma solução básica será neutralizada por adições controladas de ácido.",
      "Qual evidência marca a neutralização de uma base fraca?",
    ],
    "tres-indicadores": [
      "Três cores, uma reação",
      "Comparação das faixas de viragem de indicadores",
      "Três equipes escolhem indicadores diferentes para acompanhar a mesma titulação.",
      "Todos os indicadores sinalizam o mesmo volume de titulante?",
    ],
    tampao: [
      "Quando o pH se recusa a mudar",
      "Investigação da capacidade de uma solução tampão",
      "Duas soluções recebem a mesma intervenção. Uma contém um par conjugado, a outra é água.",
      "Como a composição influencia a resistência à mudança de pH?",
    ],
    sais: [
      "O sal revela sua origem",
      "Hidrólise e caráter ácido-base de soluções salinas",
      "Sais visualmente parecidos foram dissolvidos em água.",
      "Que relação existe entre os íons presentes e o caráter da solução?",
    ],
    antiacidos: [
      "O sólido que enfrenta o ácido",
      "Solubilidade e neutralização de hidróxidos",
      "Suspensões de hidróxidos são usadas para estudar neutralização e dissolução.",
      "Como o ácido altera a quantidade de sólido e o pH?",
    ],
    diluicao: [
      "Mais água, outra leitura",
      "Diluição e equilíbrio de uma solução ácida",
      "É preciso reduzir uma concentração sem adicionar uma base.",
      "Diluir e neutralizar produzem as mesmas transformações?",
    ],
    cotidiano: [
      "As cores da rotina",
      "Análise qualitativa de amostras representativas",
      "A equipe compara alimentos e produtos usando um indicador natural.",
      "Até onde a cor permite caracterizar uma amostra?",
    ],
    chuva: [
      "Gotas sobre um lago",
      "Acidez ambiental e correção controlada",
      "Um lago representativo recebe água de cal em pequenas porções.",
      "Como intervir sem ultrapassar a faixa de interesse?",
    ],
  };
  const list = SIAB.montagens.filter(m => stories[m.id]).map((m) => {
    const [titulo, subtitulo, problema, pergunta] = stories[m.id];
    return {
      id: m.id,
      titulo,
      subtitulo,
      problema,
      pergunta,
      modulo: m.nivel,
      objetivo: `Relacionar composição, intervenção e evidências em ${subtitulo.toLocaleLowerCase("pt-BR")}.`,
      tarefas: [
        "Examine a composição e a vidraria da montagem.",
        "Escolha uma técnica disponível e registre a observação ou medida antes da intervenção.",
        "Realize adições pequenas e registre novamente com a mesma técnica.",
        "Compare os registros e responda à pergunta usando evidências.",
      ],
      observar:
        "Cores, volumes, leituras instrumentais e mudanças de espécies. Distinga observação de cálculo interno.",
      tubos: m.tubos.map((x) => ({ ...x })),
      bncc: ["EM13CNT301", "EM13CNT302"],
      professor: {
        objetivo: m.objetivo,
        discussao: "Solicite evidências e explicite as aproximações do modelo.",
        erros:
          "Confundir cor com leitura exata; confundir força com concentração; supor neutralidade fixa em pH 7.",
      },
    };
  });
  const used = new Set(
    list.flatMap((r) =>
      r.tubos.flatMap((t) => [t.solution, t.titrant]).filter(Boolean),
    ),
  );
  const groups = {};
  Object.entries(SIAB.solutions).forEach(([id, s]) => {
    if (!used.has(id)) (groups[s.group || s.kind] ||= []).push(id);
  });
  const themes = {
    acidosFortes: [
      "Quanto ácido há aqui?",
      "Comparação de ácidos fortes",
      "calcular",
    ],
    acidosFracos: [
      "Nem todo ácido se entrega",
      "Ionização de ácidos fracos",
      "calcular",
    ],
    basesFortes: [
      "Os íons por trás da base",
      "Dissociação de bases fortes",
      "calcular",
    ],
    basesFracas: [
      "Prótons em negociação",
      "Equilíbrio de bases fracas",
      "calcular",
    ],
    tampoes: [
      "Resistir tem um limite",
      "Capacidade de soluções tampão",
      "medir",
    ],
    salts: ["Íons que mudam a água", "Hidrólise de sais", "calcular"],
    metais: [
      "As cores dos metais",
      "Hidrólise de cátions metálicos",
      "explorar",
    ],
    saude: [
      "Química em pequenas doses",
      "Modelos de substâncias relacionadas à saúde",
      "medir",
    ],
    health: [
      "Química em pequenas doses",
      "Modelos de substâncias relacionadas à saúde",
      "medir",
    ],
    ambiente: [
      "A química ao nosso redor",
      "Modelos ambientais de acidez",
      "explorar",
    ],
    home: [
      "A bancada encontra a casa",
      "Indicadores em amostras domésticas",
      "explorar",
    ],
    food: [
      "Sabores sob investigação",
      "Equilíbrios representativos de alimentos",
      "explorar",
    ],
    drinks: [
      "O que uma bebida revela",
      "Análise de bebidas representativas",
      "medir",
    ],
  };
  const indicators = Object.keys(SIAB.indicators).filter((x) => x !== "none");
  let k = 0;
  Object.entries(groups).forEach(([g, ids]) => {
    for (let start = 0; start < ids.length; start += 6) {
      const block = ids.slice(start, start + 6),
        theme = themes[g] || [
          "Soluções em perspectiva",
          "Comparação de composição e equilíbrio",
          "explorar",
        ];
      list.push({
        id: `colecao-${g}-${start / 6 + 1}`,
        titulo: `${theme[0]}${ids.length > 6 ? " · " + (start / 6 + 1) : ""}`,
        subtitulo: theme[1],
        modulo: theme[2],
        problema: `A equipe recebeu ${block.map((id) => SIAB.solutions[id].name).join(", ")}. Os nomes e a aparência não bastam para prever seu comportamento na água.`,
        pergunta:
          "Como composição, concentração e equilíbrio explicam as diferenças observadas entre estas soluções?",
        objetivo: `Comparar ${theme[1].toLowerCase()} controlando volumes e condições.`,
        tarefas: [
          "Observe cada solução sem confundir propriedades da amostra com as do indicador.",
          "Meça o pH com a técnica escolhida e registre a temperatura.",
          "Compare as espécies do modelo e a condutividade, quando disponíveis.",
          "Adicione pequenas quantidades de água, refaça as medidas e interprete a mudança.",
        ],
        observar:
          "Cor própria, faixa do indicador, medidas antes/depois, presença de sólido e espécies predominantes. Em amostras, a composição é parcial.",
        tubos: block.map((id) => ({
          solution: id,
          name: SIAB.solutions[id].name,
          concentration: 0.01,
          initialVolume: 1,
          titrant: "water",
          indicator: indicators[k++ % indicators.length],
        })),
        bncc: ["EM13CNT301", "EM13CNT302"],
        professor: {
          objetivo:
            "Diferenciar composição, concentração e modelo representativo.",
          discussao:
            "Compare medições sob a mesma técnica e condições. Discuta os pares conjugados e a conservação de matéria.",
          erros: "Inferir concentração ou composição completa apenas pelo pH.",
        },
      });
    }
  });
  // Audita a cobertura ao construir o catálogo; os testes também verificam os dados.
  return list;
})();
