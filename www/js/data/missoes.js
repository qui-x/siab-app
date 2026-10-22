"use strict";
/* Missões investigativas: problema, ações verificáveis, evidências e perguntas abertas.
   A ordem é preservada para compatibilidade dos registros de evidência existentes.
   Interpretações de referência são exibidas somente no apoio do professor. */
SIAB.concepcoes = {
  C1: "Ácido forte é o mesmo que ácido concentrado.",
  C2: "Neutralização sempre dá pH 7.",
  C3: "Todo sal é neutro.",
  C4: "Diluir bastante um ácido o torna básico.",
  C5: "A cor do indicador informa o pH exato.",
  C6: "A escala de pH é linear.",
  C7: "HCl continua como molécula dentro da água.",
  C8: "Tampão impede qualquer mudança de pH.",
  C9: "Ponto de viragem e ponto de equivalência são a mesma coisa.",
  C10: "Neutro é sempre pH 7.",
};
SIAB.bncc = {
  EM13CNT104:
    "Avaliar benefícios e riscos de materiais e produtos à saúde e ao ambiente.",
  EM13CNT205:
    "Interpretar resultados e fazer previsões, reconhecendo incertezas e limites das ciências.",
  EM13CNT301:
    "Construir questões, hipóteses e previsões; interpretar modelos e dados experimentais.",
  EM13CNT302:
    "Comunicar resultados com gráficos, tabelas e equações, usando tecnologias digitais.",
  EM13CNT307:
    "Analisar propriedades dos materiais para avaliar seu uso e propor soluções seguras.",
};
SIAB.missoes = [
  {
    id: "repolho-roxo",
    titulo: "O que o repolho roxo revela",
    resumo:
      "Classifique amostras do cotidiano pela cor de um indicador natural.",
    professor: {
      objetivo:
        "Reconhecer ácido, base e neutro pela cor de um indicador natural.",
      concepcoes: ["C5"],
      bncc: ["EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "Limão",
          solution: "lemon",
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "Vinagre",
          solution: "vinegar",
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "Água",
          solution: "water",
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "Bicarbonato",
          solution: "bicarbonate",
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "Sabão",
          solution: "soap",
          titrant: "water",
          indicator: "cabbage",
        },
      ],
      mostrarPH: false,
      nivel: "explorar",
      ver: [],
      controles: [],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "O extrato de repolho roxo muda de cor conforme o meio. Os cinco tubos têm amostras do cotidiano com algumas gotas do extrato. Toque em cada tubo na bancada para ver a cor.",
      },
      {
        tipo: "pergunta",
        pergunta: "Classifique cada amostra.",
      },
      {
        tipo: "evidencia",
        texto:
          "Use a técnica de pH disponível para conferir. pH menor que 7: ácido. Igual a 7: neutro. Maior que 7: básico. Compare com suas previsões.",
      },
      {
        tipo: "interpretacao",
        pergunta: "Que cor o repolho roxo mostra em meio ácido?",
        interpretacao:
          "No limão e no vinagre (pH 2,3 e 2,5) o extrato fica rosa. Perto do neutro, violeta; em meio básico, azul e depois verde.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Por que o bicarbonato e o sabão ficaram de cor diferente do limão?",
        interpretacao:
          "Bicarbonato e sabão formam soluções básicas (mais OH⁻ que H₃O⁺). Os pigmentos do repolho mudam de estrutura, e de cor, conforme a quantidade de H₃O⁺ do meio.",
      },
    ],
  },
  {
    id: "tres-indicadores",
    titulo: "Um tubo, três olhares",
    resumo: "A mesma titulação vista por três indicadores diferentes.",
    professor: {
      objetivo:
        "Relacionar a mudança de cor à faixa de viragem de cada indicador.",
      concepcoes: ["C5", "C9"],
      bncc: ["EM13CNT301", "EM13CNT205"],
    },
    bancada: {
      tubos: [
        {
          name: "Alaranjado de metila",
          solution: "hcl",
          concentration: 0.01,
          titrant: "naoh",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "methyl",
          grupo: "A",
        },
        {
          name: "Azul de bromotimol",
          solution: "hcl",
          concentration: 0.01,
          titrant: "naoh",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "btb",
          grupo: "A",
        },
        {
          name: "Fenolftaleína",
          solution: "hcl",
          concentration: 0.01,
          titrant: "naoh",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "phenol",
          grupo: "A",
        },
      ],
      mostrarPH: false,
      nivel: "medir",
      ver: ["grafico"],
      controles: ["gotas", "atalhos"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Os três tubos têm 1 mL de HCl 0,01 mol/L, cada um com um indicador. As gotas de NaOH 0,01 mol/L caem nos três ao mesmo tempo (adições vinculadas).",
      },
      {
        tipo: "pergunta",
        pergunta: "Ao gotejar NaOH, qual indicador muda de cor primeiro?",
      },
      {
        tipo: "agir",
        texto: "Segure o botão de gotejar até a fenolftaleína ficar rosa.",
        concluido: (ctx) =>
          ["rosa claro", "rosa"].includes(ctx.tubo("Fenolftaleína").cor),
      },
      {
        tipo: "evidencia",
        texto:
          "O alaranjado de metila muda entre pH 3,1 e 4,4; o bromotimol entre 6,0 e 7,6; a fenolftaleína entre 8,2 e 10. No gráfico, a faixa colorida mostra a viragem do indicador do tubo selecionado.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Na 20ª gota, as quantidades de HCl e NaOH ficaram iguais (pH 7). Qual indicador estava na cor de transição nesse ponto?",
        interpretacao:
          "O verde do bromotimol aparece entre pH 6,0 e 7,6. Por isso ele é uma boa escolha para titular ácido forte com base forte.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Por que os três indicadores mudaram de cor em momentos diferentes, se a solução era a mesma?",
        interpretacao:
          "Cada indicador tem sua própria faixa de viragem. Conforme o pH sobe, a solução atravessa primeiro a faixa do alaranjado de metila, depois a do bromotimol e por último a da fenolftaleína.",
      },
    ],
  },
  {
    id: "cor-que-engana",
    titulo: "Nem toda cor é do indicador",
    resumo: "Pigmentos de alimentos podem esconder a cor do indicador.",
    professor: {
      objetivo: "Distinguir a cor própria da amostra da cor do indicador.",
      concepcoes: ["C5"],
      bncc: ["EM13CNT205"],
    },
    bancada: {
      tubos: [
        {
          name: "Café",
          solution: "coffee",
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "Suco de morango",
          solution: "strawberry",
          titrant: "water",
          indicator: "cabbage",
        },
      ],
      mostrarPH: false,
      nivel: "explorar",
      ver: [],
      controles: ["realcar"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Café e suco de morango têm pigmentos. Os dois tubos também têm extrato de repolho roxo. A cor que você vê é uma mistura.",
      },
      {
        tipo: "pergunta",
        pergunta: "Dá para saber, só olhando, se o café é ácido?",
      },
      {
        tipo: "agir",
        texto:
          "Ative “Realçar indicador” (abaixo, neste cartão) para ver só a cor do indicador.",
        concluido: (ctx) => ctx.estado.indicatorOnly === true,
      },
      {
        tipo: "evidencia",
        texto:
          "Com o realce, o repolho mostra violeta no café (pH ≈ 5,0, levemente ácido) e rosa no morango (pH ≈ 3,4). O realce é um recurso do simulador: no laboratório real a cor própria continua lá.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "No laboratório real, o que pode ajudar a ler o indicador em uma amostra muito colorida?",
        interpretacao:
          "Diluir clareia os pigmentos. Mas atenção: diluir também aproxima o pH de 7, então a leitura muda um pouco. Outra saída é usar um medidor de pH.",
      },
      {
        tipo: "interpretacao",
        pergunta: "Por que a cor do café não basta para dizer se ele é ácido?",
        interpretacao:
          "A cor marrom vem dos pigmentos do café, não do meio ácido. A cor observada mistura pigmento e indicador; é preciso separar as duas contribuições.",
      },
    ],
  },
  {
    id: "ionizacao",
    titulo: "Dentro da água: ionização",
    resumo:
      "Use a lupa para ver o que acontece com as moléculas de ácido na água.",
    professor: {
      objetivo:
        "Representar a ionização de ácidos fortes e fracos no nível das partículas.",
      concepcoes: ["C7"],
      bncc: ["EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "HCl",
          solution: "hcl",
          concentration: 0.01,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "Ácido acético",
          solution: "acetic",
          concentration: 0.01,
          titrant: "water",
          indicator: "universal",
        },
      ],
      mostrarPH: false,
      nivel: "medir",
      ver: ["particulas", "equacao"],
      verInicial: "particulas",
      controles: [],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Os dois tubos têm ácido a 0,01 mol/L. O painel Partículas funciona como uma lupa: mostra íons e moléculas dissolvidos (a água fica de fora).",
      },
      {
        tipo: "pergunta",
        pergunta: "Na água, o que acontece com as moléculas de HCl?",
      },
      {
        tipo: "evidencia",
        texto:
          "Na lupa do tubo HCl só há íons: H₃O⁺ e Cl⁻. O HCl é um ácido forte: HCl + H₂O → H₃O⁺ + Cl⁻.",
      },
      {
        tipo: "pergunta",
        pergunta: "E o ácido acético, na mesma concentração?",
      },
      {
        tipo: "agir",
        texto:
          "Selecione o tubo “Ácido acético” na bancada e veja suas partículas.",
        concluido: (ctx) =>
          ctx.ativo === "Ácido acético" && ctx.estado.verTab === "particulas",
      },
      {
        tipo: "evidencia",
        texto:
          "Só cerca de 4 % das moléculas de ácido acético se ionizam (α ≈ 4,2 %). Por isso o pH dele (3,38) é maior que o do HCl (2,00), mesmo com a mesma concentração.",
      },
      {
        tipo: "interpretacao",
        pergunta: "Qual equação representa um ácido fraco?",
        interpretacao:
          "A seta dupla (⇌) indica equilíbrio: a maior parte das moléculas continua inteira. A seta simples indica ionização praticamente completa.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Explique, com partículas, a diferença entre um ácido forte e um ácido fraco.",
        interpretacao:
          "No ácido forte, praticamente todas as moléculas doam H⁺ à água e viram íons. No fraco, a maioria das moléculas continua inteira; só uma pequena fração se ioniza.",
      },
    ],
  },
  {
    id: "forte-ou-concentrado",
    titulo: "Forte ou concentrado?",
    resumo: "Um ácido forte diluído contra um ácido fraco concentrado.",
    professor: {
      objetivo:
        "Diferenciar força (fração ionizada) de concentração (quantidade por litro).",
      concepcoes: ["C1"],
      bncc: ["EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "Tubo A",
          solution: "hcl",
          concentration: 0.001,
          titrant: "naoh",
          titrantConcentration: 0.1,
          dropVolume: 0.01,
          indicator: "universal",
        },
        {
          name: "Tubo B",
          solution: "acetic",
          concentration: 0.1,
          titrant: "naoh",
          titrantConcentration: 0.1,
          dropVolume: 0.01,
          indicator: "universal",
        },
      ],
      mostrarPH: false,
      nivel: "medir",
      ver: ["particulas", "grafico"],
      controles: ["gotas", "atalhos"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Tubo A: ácido clorídrico, forte, diluído (0,001 mol/L). Tubo B: ácido acético, fraco, concentrado (0,1 mol/L). Os dois têm 1 mL.",
      },
      {
        tipo: "pergunta",
        pergunta: "Qual tubo tem o menor pH (mais ácido)?",
      },
      {
        tipo: "evidencia",
        texto:
          "O ácido fraco concentrado tem pH um pouco menor: 2,88 contra 3,00. Força não é o mesmo que concentração.",
      },
      {
        tipo: "pergunta",
        pergunta:
          "Qual tubo vai precisar de mais NaOH para chegar à equivalência?",
      },
      {
        tipo: "agir",
        texto:
          "Goteje NaOH 0,1 mol/L nos dois tubos até o pH de cada um passar de 7. Selecione um tubo de cada vez. Use +1 mL se quiser ir mais rápido.",
        concluido: (ctx) =>
          ctx.tubo("Tubo A").r.pH > 6.99 && ctx.tubo("Tubo B").r.pH > 6.99,
      },
      {
        tipo: "evidencia",
        texto:
          "O tubo B precisou de 100 vezes mais NaOH: 1,00 mL contra 0,01 mL. Ele tinha 100 vezes mais ácido, embora só cerca de 1,3 % estivesse ionizado no início.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Qual é a diferença entre um ácido forte e um ácido concentrado?",
        interpretacao:
          "Forte: quase todas as moléculas se ionizam. Concentrado: há muito ácido por litro. Um ácido fraco pode ser concentrado, e um forte pode estar diluído.",
      },
    ],
  },
  {
    id: "sais-cores",
    titulo: "Todo sal é neutro?",
    resumo: "Quatro sais, quatro cores de repolho roxo.",
    professor: {
      objetivo:
        "Relacionar o caráter da solução de um sal ao ácido e à base de origem.",
      concepcoes: ["C3"],
      bncc: ["EM13CNT301", "EM13CNT307"],
    },
    bancada: {
      tubos: [
        {
          name: "NaCl",
          solution: "nacl",
          concentration: 0.1,
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "NH₄Cl",
          solution: "nh4cl",
          concentration: 0.1,
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "CH₃COONa",
          solution: "ch3coona",
          concentration: 0.1,
          titrant: "water",
          indicator: "cabbage",
        },
        {
          name: "Na₂CO₃",
          solution: "na2co3",
          concentration: 0.1,
          titrant: "water",
          indicator: "cabbage",
        },
      ],
      mostrarPH: false,
      nivel: "explorar",
      ver: ["equacao"],
      controles: [],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Sal é um produto da reação entre um ácido e uma base. Os quatro tubos têm sais dissolvidos (0,1 mol/L) com extrato de repolho roxo.",
      },
      {
        tipo: "pergunta",
        pergunta: "Classifique a solução de cada sal.",
      },
      {
        tipo: "evidencia",
        texto:
          "NaCl: neutro (7,00). NH₄Cl: ácido (5,13). CH₃COONa: básico (8,87). Na₂CO₃: básico (11,65). No painel Equação, veja de que ácido e de que base cada sal vem.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "O NH₄Cl vem do HCl (ácido forte) e da NH₃ (base fraca). Qual é o caráter da solução?",
        interpretacao:
          "O íon NH₄⁺ doa H⁺ à água (NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺). O Cl⁻, que vem de um ácido forte, não reage.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Use a origem dos sais (ácido e base, fortes ou fracos) para explicar as cores.",
        interpretacao:
          "Sal de ácido forte e base forte dá solução neutra. De ácido forte e base fraca, ácida. De ácido fraco e base forte, básica: o ânion recebe H⁺ da água e libera OH⁻.",
      },
    ],
  },
  {
    id: "chuva-acida",
    titulo: "Chuva ácida e calagem",
    resumo: "Óxidos ácidos na chuva e a correção com cal.",
    professor: {
      objetivo:
        "Relacionar óxidos ácidos à acidez da chuva e aplicar a neutralização na correção de águas e solos.",
      concepcoes: ["C6"],
      bncc: ["EM13CNT104", "EM13CNT307"],
    },
    bancada: {
      tubos: [
        {
          name: "Chuva limpa",
          solution: "cleanRain",
          initialVolume: 2,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "Chuva ácida",
          solution: "acidRain",
          initialVolume: 2,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "Lago",
          solution: "acidRain",
          initialVolume: 2,
          titrant: "limewater",
          titrantConcentration: 0.0005,
          dropVolume: 0.01,
          indicator: "universal",
        },
      ],
      mostrarPH: false,
      nivel: "medir",
      ver: ["equacao", "grafico"],
      controles: ["gotas"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "CO₂, SO₂ e NO₂ são óxidos ácidos: com a água, formam ácidos. CO₂ + H₂O ⇌ H₂CO₃. O SO₂ poluente vira SO₃ e depois H₂SO₄ (SO₃ + H₂O → H₂SO₄).",
      },
      {
        tipo: "pergunta",
        pergunta: "A chuva sem poluição é neutra (pH 7)?",
      },
      {
        tipo: "evidencia",
        texto:
          "A chuva limpa tem pH ≈ 5,6, pelo CO₂ dissolvido. Chama-se chuva ácida a que fica abaixo disso: aqui, pH ≈ 4,3.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Quantas vezes a [H₃O⁺] da chuva ácida (pH 4,3) é maior que a da chuva limpa (pH 5,6)?",
        interpretacao:
          "Cada unidade de pH vale 10 vezes. A diferença de 1,3 unidade dá 10^1,3 ≈ 20 vezes mais H₃O⁺.",
      },
      {
        tipo: "agir",
        texto:
          "O lago recebeu chuva ácida. Selecione o tubo “Lago” e goteje água de cal, Ca(OH)₂, até o pH ficar entre 6 e 8. Cuidado para não passar do ponto.",
        concluido: (ctx) =>
          ctx.tubo("Lago").r.pH >= 6 && ctx.tubo("Lago").r.pH <= 8,
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Por que a cal corrige a acidez? Escreva a equação da neutralização.",
        interpretacao:
          "A cal é uma base: Ca(OH)₂ + H₂SO₄ → CaSO₄ + 2 H₂O. O OH⁻ consome o H₃O⁺. Cal em excesso deixaria a água básica, o que também prejudica a vida no lago.",
      },
    ],
  },
  {
    id: "diluicao",
    titulo: "Diluir muda o quê?",
    resumo: "Acrescente água e acompanhe o pH se aproximar de 7.",
    professor: {
      objetivo:
        "Reconhecer que diluir aproxima o pH de 7 sem inverter o caráter da solução.",
      concepcoes: ["C4", "C6"],
      bncc: ["EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "Vinagre puro",
          solution: "vinegar",
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "Vinagre 1 + 9",
          solution: "vinegar",
          dilution: 10,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "HCl + água",
          solution: "hcl",
          concentration: 0.01,
          titrant: "water",
          dropVolume: 0.1,
          indicator: "universal",
        },
      ],
      mostrarPH: true,
      nivel: "medir",
      ver: ["grafico", "equacao"],
      controles: ["gotas", "atalhos"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Diluir é acrescentar solvente. A quantidade de ácido continua a mesma, mas fica espalhada em mais água: a concentração diminui.",
      },
      {
        tipo: "pergunta",
        pergunta: "Diluindo o vinagre 10 vezes (1 parte + 9 de água), o pH…",
      },
      {
        tipo: "evidencia",
        texto:
          "Vinagre puro: pH ≈ 2,5. Diluído 10 vezes: pH ≈ 3,0. Continua ácido, só que menos.",
      },
      {
        tipo: "agir",
        texto:
          "Selecione “HCl + água” e goteje água até o volume chegar a pelo menos 4 mL. Observe o pH a cada etapa.",
        concluido: (ctx) => ctx.tubo("HCl + água").r.volume >= 4 - 1e-9,
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Se você continuasse diluindo o HCl sem parar, o pH chegaria a…",
        interpretacao:
          "Com muita água, o H₃O⁺ do ácido fica cada vez mais raro e o pH se aproxima do da água pura (7). Diluir nunca transforma um ácido em base.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "O pH mudou, mas a quantidade de ácido no tubo mudou? Explique.",
        interpretacao:
          "A quantidade (em mol) de ácido ficou a mesma; só o volume aumentou. A concentração de H₃O⁺ diminuiu, por isso o pH aumentou.",
      },
    ],
  },
  {
    id: "curva-titulacao",
    titulo: "A curva da titulação",
    resumo: "Desenhe as curvas de um ácido forte e de um fraco.",
    professor: {
      objetivo:
        "Interpretar curvas de titulação: salto de pH, equivalência e meia-equivalência.",
      concepcoes: ["C2", "C9"],
      bncc: ["EM13CNT302", "EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "HCl",
          solution: "hcl",
          concentration: 0.01,
          titrant: "naoh",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "btb",
        },
        {
          name: "Ácido acético",
          solution: "acetic",
          concentration: 0.01,
          titrant: "naoh",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "phenol",
        },
      ],
      mostrarPH: true,
      nivel: "medir",
      ver: ["grafico", "historico", "equacao"],
      verInicial: "grafico",
      controles: ["gotas", "atalhos"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Titular é adicionar, gota a gota, uma solução de concentração conhecida até reagir todo o ácido. O gráfico registra o pH a cada gota.",
      },
      {
        tipo: "pergunta",
        pergunta:
          "No ponto de equivalência (ácido e base em quantidades iguais), o pH é sempre 7?",
      },
      {
        tipo: "agir",
        texto:
          "Titule o HCl até adicionar 1,5 mL de NaOH. Observe o salto no gráfico.",
        concluido: (ctx) => ctx.tubo("HCl").r.added >= 1.5 - 1e-9,
      },
      {
        tipo: "agir",
        texto: "Agora selecione o ácido acético e titule até 1,5 mL.",
        concluido: (ctx) => ctx.tubo("Ácido acético").r.added >= 1.5 - 1e-9,
      },
      {
        tipo: "evidencia",
        texto:
          "Com HCl, a equivalência (1,00 mL) tem pH 7,00. Com ácido acético, 8,22: o acetato formado é uma base. O ponto marcado “pH = pKa” (meia-equivalência) tem pH 4,75. No Histórico você pode baixar a tabela em CSV.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Para titular ácido acético com NaOH, qual indicador é mais adequado?",
        interpretacao:
          "A viragem precisa acontecer no salto de pH, que aqui fica acima de 7. O alaranjado de metila mudaria de cor logo no início.",
      },
      {
        tipo: "interpretacao",
        pergunta: "Por que a equivalência do ácido acético tem pH maior que 7?",
        interpretacao:
          "Na equivalência sobra acetato de sódio. O íon CH₃COO⁻ recebe H⁺ da água (hidrólise) e libera OH⁻, deixando o meio básico.",
      },
    ],
  },
  {
    id: "estomago",
    titulo: "Estômago virtual",
    resumo: "Dose três antiácidos e compare.",
    professor: {
      objetivo:
        "Aplicar a neutralização a antiácidos e comparar bases solúveis e pouco solúveis.",
      concepcoes: ["C2"],
      bncc: ["EM13CNT307", "EM13CNT104"],
    },
    bancada: {
      tubos: [
        {
          name: "Com Al(OH)₃",
          solution: "hcl",
          concentration: 0.1,
          titrant: "aloh3",
          titrantConcentration: 0.1,
          dropVolume: 0.02,
          indicator: "universal",
        },
        {
          name: "Com Mg(OH)₂",
          solution: "hcl",
          concentration: 0.1,
          titrant: "mgoh2",
          titrantConcentration: 0.1,
          dropVolume: 0.02,
          indicator: "universal",
        },
        {
          name: "Com bicarbonato",
          solution: "hcl",
          concentration: 0.1,
          titrant: "bicarbonate",
          dropVolume: 0.02,
          indicator: "universal",
        },
      ],
      mostrarPH: true,
      nivel: "medir",
      ver: ["grafico", "particulas", "equacao"],
      controles: ["gotas", "atalhos"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Cada tubo é um “estômago” com 1 mL de HCl 0,1 mol/L (pH 1). Antiácidos são bases que neutralizam parte desse ácido. Atividade didática: não é orientação de saúde.",
      },
      {
        tipo: "pergunta",
        pergunta:
          "Qual antiácido deve ser mais fácil de dosar sem passar do ponto (pH acima de 5)?",
      },
      {
        tipo: "agir",
        texto: "No tubo “Com Al(OH)₃”, goteje até o pH ficar entre 3 e 5.",
        concluido: (ctx) =>
          ctx.tubo("Com Al(OH)₃").r.pH >= 3 &&
          ctx.tubo("Com Al(OH)₃").r.pH <= 5,
      },
      {
        tipo: "agir",
        texto:
          "Agora tente o mesmo com Mg(OH)₂ e com bicarbonato: goteje pelo menos 0,5 mL de Mg(OH)₂ e 0,9 mL de bicarbonato.",
        concluido: (ctx) =>
          ctx.tubo("Com Mg(OH)₂").r.added >= 0.5 - 1e-9 &&
          ctx.tubo("Com bicarbonato").r.added >= 0.9 - 1e-9,
      },
      {
        tipo: "evidencia",
        texto:
          "O Al(OH)₃ é pouco solúvel: só dissolve enquanto há ácido para consumi-lo, e o pH para perto de 4. O Mg(OH)₂ passa de 9 logo após a equivalência. O bicarbonato forma H₂CO₃ (no estômago real, parte vira CO₂ e escapa; aqui o sistema é fechado).",
      },
      {
        tipo: "interpretacao",
        pergunta: "Por que o pH com Al(OH)₃ “trava” perto de 4?",
        interpretacao:
          "Com Kps = 2 × 10⁻³², quase nada de Al(OH)₃ se dissolve quando o meio deixa de ser ácido. Na lupa, os quadrados mostram o sólido que sobrou.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Escreva a equação da neutralização do HCl pelo Mg(OH)₂ e diga por que é possível exagerar na dose.",
        interpretacao:
          "Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O. O Mg(OH)₂ é mais solúvel que o Al(OH)₃: depois de neutralizar todo o ácido, ainda dissolve e deixa o meio básico.",
      },
    ],
  },
  {
    id: "grau-ionizacao",
    titulo: "Grau de ionização e diluição",
    resumo: "α do ácido acético em três concentrações (lei de Ostwald).",
    professor: {
      objetivo:
        "Calcular e interpretar o grau de ionização e a lei da diluição de Ostwald.",
      concepcoes: ["C1", "C7"],
      bncc: ["EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "0,1 mol/L",
          solution: "acetic",
          concentration: 0.1,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "0,01 mol/L",
          solution: "acetic",
          concentration: 0.01,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "0,001 mol/L",
          solution: "acetic",
          concentration: 0.001,
          titrant: "water",
          indicator: "universal",
        },
      ],
      mostrarPH: true,
      nivel: "calcular",
      ver: ["particulas", "equacao"],
      verInicial: "particulas",
      controles: [],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Grau de ionização (α) é a fração das moléculas de ácido que se ionizam: α = moléculas ionizadas ÷ moléculas dissolvidas.",
      },
      {
        tipo: "pergunta",
        pergunta: "Diluindo o ácido acético, α…",
      },
      {
        tipo: "agir",
        texto:
          "Veja na lupa as partículas dos três tubos: selecione um de cada vez.",
        concluido: (ctx) => ctx.tubos.every((x) => ctx.visitados.has(x.nome)),
      },
      {
        tipo: "evidencia",
        texto:
          "α = 1,3 % (0,1 mol/L), 4,2 % (0,01) e 12,5 % (0,001). É a lei da diluição de Ostwald: para ácidos fracos, α ≈ √(Ka/C).",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Se α aumenta com a diluição, por que o pH também aumenta (2,88 → 3,38 → 3,90)?",
        interpretacao:
          "[H₃O⁺] ≈ α · C. Diluir 10 vezes aumenta α cerca de 3 vezes (√10), mas divide C por 10: o produto diminui.",
      },
      {
        tipo: "interpretacao",
        pergunta: "Explique com suas palavras a lei da diluição de Ostwald.",
        interpretacao:
          "Quanto mais diluído um ácido fraco, maior a fração das moléculas que se ionizam (α ≈ √(Ka/C)); a concentração de H₃O⁺, porém, diminui.",
      },
    ],
  },
  {
    id: "hidrolise",
    titulo: "Por que o sal muda o pH?",
    resumo: "Hidrólise salina com equações e partículas.",
    professor: {
      objetivo: "Explicar a hidrólise salina com equações e pares conjugados.",
      concepcoes: ["C3"],
      bncc: ["EM13CNT301"],
    },
    bancada: {
      tubos: [
        {
          name: "NH₄Cl",
          solution: "nh4cl",
          concentration: 0.1,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "CH₃COONa",
          solution: "ch3coona",
          concentration: 0.1,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "Na₂CO₃",
          solution: "na2co3",
          concentration: 0.1,
          titrant: "water",
          indicator: "universal",
        },
      ],
      mostrarPH: true,
      nivel: "calcular",
      ver: ["equacao", "particulas"],
      verInicial: "equacao",
      controles: [],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Na hidrólise, um íon do sal reage com a água e produz H₃O⁺ ou OH⁻. Íons vindos de ácido forte (Cl⁻) ou de base forte (Na⁺) não reagem.",
      },
      {
        tipo: "pergunta",
        pergunta: "Qual íon de cada sal reage com a água?",
      },
      {
        tipo: "evidencia",
        texto:
          "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (ácida). CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (básica). CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻ (básica). Veja a equação de cada tubo.",
      },
      {
        tipo: "agir",
        texto: "Na lupa (Partículas), encontre o NH₃ formado no tubo de NH₄Cl.",
        concluido: (ctx) =>
          ctx.ativo === "NH₄Cl" && ctx.estado.verTab === "particulas",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Por que Na₂CO₃ 0,1 mol/L (pH 11,65) é mais básico que CH₃COONa 0,1 mol/L (pH 8,87)?",
        interpretacao:
          "Quanto mais fraco o ácido conjugado (Ka do HCO₃⁻ = 4,7 × 10⁻¹¹; do CH₃COOH = 1,8 × 10⁻⁵), mais forte a base.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Explique a hidrólise do acetato de sódio usando pares conjugados.",
        interpretacao:
          "O CH₃COO⁻ é a base conjugada do ácido acético (fraco). Ele recebe H⁺ da água, formando CH₃COOH e OH⁻. O Na⁺ não reage. Sobra OH⁻: meio básico.",
      },
    ],
  },
  {
    id: "tampao",
    titulo: "Laboratório do tampão",
    resumo: "Água contra tampão: as mesmas gotas de ácido.",
    professor: {
      objetivo: "Caracterizar a solução-tampão e sua capacidade limitada.",
      concepcoes: ["C8"],
      bncc: ["EM13CNT301", "EM13CNT205"],
    },
    bancada: {
      tubos: [
        {
          name: "Água",
          solution: "water",
          titrant: "hcl",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "universal",
          grupo: "A",
        },
        {
          name: "Tampão acetato",
          solution: "acetateBuffer",
          concentration: 0.01,
          titrant: "hcl",
          titrantConcentration: 0.01,
          dropVolume: 0.05,
          indicator: "universal",
          grupo: "A",
        },
      ],
      mostrarPH: true,
      nivel: "medir",
      ver: ["grafico", "equacao", "particulas"],
      controles: ["gotas", "atalhos"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Uma solução-tampão tem um ácido fraco e sua base conjugada: aqui, ácido acético e acetato (0,01 mol/L de cada). As mesmas gotas de HCl 0,01 mol/L caem na água e no tampão.",
      },
      {
        tipo: "pergunta",
        pergunta: "Depois de 2 gotas de HCl, o que acontece?",
      },
      {
        tipo: "agir",
        texto:
          "Adicione 2 gotas de HCl (toque duas vezes no botão de gotejar).",
        concluido: (ctx) => ctx.tubo("Água").r.drops >= 2,
      },
      {
        tipo: "evidencia",
        texto:
          "Água: 7,00 → 3,04. Tampão: 4,75 → 4,66. O acetato consome o H₃O⁺: CH₃COO⁻ + H₃O⁺ → CH₃COOH + H₂O.",
      },
      {
        tipo: "agir",
        texto: "Continue gotejando até o tampão “quebrar”: pH abaixo de 4.",
        concluido: (ctx) => ctx.tubo("Tampão acetato").r.pH < 4,
      },
      {
        tipo: "interpretacao",
        pergunta: "Por que o tampão deixou de funcionar?",
        interpretacao:
          "O tampão tem capacidade limitada. O sangue, por exemplo, fica entre pH 7,35 e 7,45 graças a tampões como H₂CO₃/HCO₃⁻, dentro de certos limites.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Como o tampão resiste à adição de ácido? E por que tem limite?",
        interpretacao:
          "A base conjugada (CH₃COO⁻) reage com o H₃O⁺ adicionado e forma ácido fraco. Quando a base conjugada se esgota, o H₃O⁺ sobra e o pH cai.",
      },
    ],
  },
  {
    id: "temperatura",
    titulo: "Neutro nem sempre é 7",
    resumo: "Aqueça a água e acompanhe Kw.",
    professor: {
      objetivo:
        "Definir neutralidade como [H₃O⁺] = [OH⁻] e relacionar Kw à temperatura.",
      concepcoes: ["C10"],
      bncc: ["EM13CNT301", "EM13CNT205"],
    },
    bancada: {
      tubos: [
        {
          name: "Água pura",
          solution: "water",
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "HCl 0,0001 mol/L",
          solution: "hcl",
          concentration: 0.0001,
          titrant: "water",
          indicator: "universal",
        },
        {
          name: "NaOH 0,0001 mol/L",
          solution: "naoh",
          concentration: 0.0001,
          titrant: "water",
          indicator: "universal",
        },
      ],
      mostrarPH: true,
      nivel: "calcular",
      ver: ["equacao"],
      controles: ["temperatura"],
    },
    passos: [
      {
        tipo: "contexto",
        texto:
          "Neutro significa [H₃O⁺] = [OH⁻]. A autoionização da água (2 H₂O ⇌ H₃O⁺ + OH⁻) é endotérmica: aumenta com a temperatura. A 25 °C, Kw = 1,0 × 10⁻¹⁴.",
      },
      {
        tipo: "pergunta",
        pergunta: "Aquecendo água pura a 50 °C, o pH…",
      },
      {
        tipo: "agir",
        texto:
          "Use Ver → Medir → Temperatura para levar os tubos a 50 °C ou mais.",
        concluido: (ctx) => ctx.tubos.every((x) => x.tube.temperature >= 50),
      },
      {
        tipo: "evidencia",
        texto:
          "A 50 °C, pKw = 13,26: a água pura tem pH 6,63 e continua neutra ([H₃O⁺] = [OH⁻]). O HCl quase não muda (pH 4,00); o NaOH cai de 10,00 para 9,26, porque pH = pKw − pOH.",
      },
      {
        tipo: "interpretacao",
        pergunta: "A 37 °C (temperatura do corpo), o pH neutro é…",
        interpretacao:
          "A 37 °C, pKw ≈ 13,62, e o neutro é pKw/2 ≈ 6,81. O sangue (pH 7,35 a 7,45) é levemente básico.",
      },
      {
        tipo: "interpretacao",
        pergunta:
          "Por que a água quente tem pH menor que 7 e mesmo assim é neutra?",
        interpretacao:
          "O aquecimento aumenta a autoionização: formam-se mais H₃O⁺ e OH⁻, sempre na mesma quantidade. O pH cai, mas [H₃O⁺] continua igual a [OH⁻].",
      },
    ],
  },
];
