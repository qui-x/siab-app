"use strict";
/* Amostras do cotidiano (expansão da versão 0.7): frutas, bebidas, casa e
   limpeza, farmácia, corpo humano e ambiente.
   Como as amostras de cotidiano.js, são REPRESENTATIVAS: o pH de referência
   (targetPH) vem de faixas publicadas (tabelas de pH de alimentos do FDA e da
   Clemson University; fisiologia humana; oceanografia), e a concentração dos
   sistemas ácido-base é um parâmetro didático. O motor calcula a carga fixa
   que deixa a amostra nesse pH e, a partir daí, responde a gotas e diluição.
   fixedCharge: 0 quando a amostra é só um ácido em água pura (água com gás,
   vitamina C, soro fisiológico e água destilada em contato com o ar).
   espectadores: íons que não trocam H⁺ (Na⁺, Cl⁻, Mg²⁺…). Não mudam o pH,
   mas aparecem na lupa e conduzem corrente (água do mar, soro, plasma). */

Object.assign(SIAB.acidFamilies, { gluconate: [3.86], chaBuffer: [5.0] });
Object.assign(SIAB.familySpecies, {
  gluconate: ["HGlc (ácido glucônico)", "Glc⁻"],
  chaBuffer: ["HA (ácidos do chá)", "A⁻ (chá)"],
});

(() => {
  const incolor = { rgb: [233, 237, 243], opacity: 0.02, name: "incolor" };
  const cor = (rgb, opacity, name) => ({ rgb, opacity, name });
  const sistemas = (lista) =>
    lista.map(([family, total]) => ({ family, total }));
  // m: pH de referência e sistemas; fixo: carga fixa conhecida (ácido em água pura).
  const m = (targetPH, ...lista) => ({ targetPH, systems: sistemas(lista) });
  const fixo = (fixedCharge, ...lista) => ({
    fixedCharge,
    systems: sistemas(lista),
  });
  const amostra = (
    name,
    group,
    model,
    natural,
    preparation,
    note,
    extra = {},
  ) => ({
    name,
    group,
    kind: "sample",
    label: extra.label || "Amostra do cotidiano",
    model,
    natural: natural || incolor,
    preparation,
    note,
    ...extra,
  });
  const ions = (pares) => pares.map(([formula, conc]) => ({ formula, conc }));

  Object.assign(SIAB.solutions, {
    /* ---------- Frutas e sucos ---------- */
    passionFruit: amostra(
      "Suco de maracujá",
      "fruits",
      m(3.0, ["citrate", 0.09]),
      cor([240, 190, 40], 0.62, "amarelo"),
      "Suco da polpa coado, sem água nem açúcar.",
      "Um dos sucos mais ácidos. O ácido cítrico é o principal responsável.",
    ),
    grape: amostra(
      "Suco de uva integral",
      "fruits",
      m(3.4, ["tartrate", 0.05], ["malate", 0.01]),
      cor([96, 24, 64], 0.92, "roxo"),
      "Suco de uva integral, sem água adicionada.",
      "O ácido tartárico é típico da uva. A cor escura (antocianinas) é também um indicador natural, e pode encobrir a viragem.",
    ),
    acerola: amostra(
      "Suco de acerola",
      "fruits",
      m(3.2, ["ascorbate", 0.06], ["malate", 0.02]),
      cor([214, 70, 40], 0.75, "vermelho alaranjado"),
      "Suco da fruta batida e coada.",
      "Uma das frutas mais ricas em vitamina C (ácido ascórbico).",
    ),
    cashew: amostra(
      "Suco de caju",
      "fruits",
      m(4.0, ["malate", 0.02], ["ascorbate", 0.01]),
      cor([238, 212, 125], 0.5, "amarelo pálido"),
      "Suco do pedúnculo do caju, coado.",
      "Menos ácido que os cítricos; também rico em vitamina C.",
    ),
    coconutWater: amostra(
      "Água de coco",
      "fruits",
      m(5.2, ["malate", 0.005]),
      cor([236, 236, 225], 0.1, "quase incolor"),
      "Água de coco verde, sem conservantes.",
      "Levemente ácida e rica em potássio (não representado).",
    ),
    watermelon: amostra(
      "Suco de melancia",
      "fruits",
      m(5.5, ["malate", 0.004]),
      cor([226, 90, 100], 0.6, "rosa avermelhado"),
      "Polpa batida e coada.",
      "Uma das frutas menos ácidas. O pigmento vermelho (licopeno) não muda com o pH.",
    ),

    /* ---------- Alimentos e bebidas ---------- */
    appleVinegar: amostra(
      "Vinagre de maçã",
      "kitchen",
      m(3.1, ["acetate", 0.5], ["malate", 0.01]),
      cor([226, 196, 120], 0.32, "âmbar claro"),
      "Vinagre de maçã comum (cerca de 4 % de acidez).",
      "Mesmo ácido acético do vinagre branco, com um pouco de ácido málico da fruta.",
    ),
    redWine: amostra(
      "Vinho tinto",
      "kitchen",
      m(3.5, ["tartrate", 0.03], ["malate", 0.005]),
      cor([100, 20, 40], 0.93, "vinho"),
      "Vinho tinto seco.",
      "A acidez vem dos ácidos tartárico e málico. O etanol não é simulado.",
    ),
    beer: amostra(
      "Cerveja",
      "kitchen",
      m(4.3, ["phosphate", 0.01], ["carbonate", 0.1]),
      cor([216, 160, 50], 0.55, "âmbar"),
      "Cerveja tipo pilsen, recém-aberta.",
      "O CO₂ dissolvido passa da solubilidade: aparecem bolhas (ilustração). Etanol e espuma não são simulados.",
    ),
    sparklingWater: amostra(
      "Água com gás",
      "kitchen",
      fixo(0, ["carbonate", 0.08]),
      incolor,
      "Água gaseificada sem sais adicionados, recém-aberta (cerca de 3,5 g de CO₂ por litro).",
      "O gás carbônico forma ácido carbônico: CO₂ + H₂O ⇌ H₂CO₃. Por isso a água com gás é ácida (pH perto de 3,8). Bolhas: ilustração.",
    ),
    lemonSoda: amostra(
      "Refrigerante de limão",
      "kitchen",
      m(3.1, ["citrate", 0.015], ["carbonate", 0.09]),
      cor([240, 245, 210], 0.1, "quase incolor"),
      "Refrigerante recém-aberto.",
      "Ácido cítrico (acidulante) mais o CO₂ do gás.",
    ),
    guarana: amostra(
      "Refrigerante de guaraná",
      "kitchen",
      m(3.3, ["citrate", 0.01], ["carbonate", 0.09]),
      cor([200, 110, 40], 0.55, "âmbar"),
      "Refrigerante recém-aberto.",
      "O corante caramelo pode encobrir a viragem do indicador.",
    ),
    blackTea: amostra(
      "Chá preto",
      "kitchen",
      m(5.0, ["chaBuffer", 0.005]),
      cor([150, 70, 25], 0.75, "castanho"),
      "Chá preparado com água quente, sem açúcar nem leite.",
      "Os polifenóis dão a leve acidez. Limão no chá clareia a cor: os pigmentos também mudam com o pH (não simulado).",
    ),
    hibiscusTea: amostra(
      "Chá de hibisco",
      "kitchen",
      m(2.9, ["citrate", 0.01], ["malate", 0.01]),
      cor([170, 20, 50], 0.85, "vermelho"),
      "Chá das flores secas, sem açúcar.",
      "As antocianinas do hibisco são indicador natural, como o repolho roxo; aqui a cor fica fixa.",
    ),
    honey: amostra(
      "Mel em água",
      "kitchen",
      m(3.9, ["gluconate", 0.02]),
      cor([226, 170, 60], 0.45, "âmbar claro"),
      "Uma colher de sopa de mel (cerca de 20 g) em 100 mL de água.",
      "A acidez vem do ácido glucônico, formado a partir da glicose.",
    ),
    soySauce: amostra(
      "Molho de soja (shoyu)",
      "kitchen",
      m(4.8, ["lactate", 0.05], ["acetate", 0.01]),
      cor([70, 30, 15], 0.95, "marrom escuro"),
      "Molho de soja comum.",
      "Fermentado: ácidos láctico e acético. Muito sal (não representado) e cor escura.",
    ),
    eggWhite: amostra(
      "Clara de ovo",
      "kitchen",
      m(8.9, ["carbonate", 0.01]),
      cor([245, 240, 200], 0.3, "amarelo pálido"),
      "Clara de um ovo com alguns dias, batida com um pouco de água.",
      "Um dos poucos alimentos básicos. O ovo perde CO₂ pela casca com o tempo, e o pH da clara sobe de cerca de 7,6 para 9.",
    ),

    /* ---------- Casa, limpeza e higiene ---------- */
    bleach: amostra(
      "Água sanitária",
      "home",
      m(12.0, ["hypochlorite", 0.34]),
      cor([228, 236, 190], 0.14, "amarelo esverdeado pálido"),
      "Água sanitária comum (2,0 a 2,5 % de cloro ativo).",
      "Hipoclorito de sódio com um pouco de NaOH. Nunca misture com ácidos (libera cloro) nem com amoníaco. Na vida real, ela descora os indicadores (não simulado).",
      { fixedIon: "Na⁺" },
    ),
    ammoniaCleaner: amostra(
      "Limpador com amoníaco",
      "home",
      m(11.5, ["ammonium", 0.5]),
      incolor,
      "Limpador doméstico com amoníaco.",
      "NH₃ em água: base fraca, mas concentrada. Irritante: não misture com água sanitária.",
    ),
    dishDetergent: amostra(
      "Detergente de louça",
      "home",
      m(7.2, ["phosphate", 0.001]),
      cor([240, 225, 110], 0.3, "amarelo"),
      "Detergente diluído em água (1 parte em 10).",
      "Detergentes de louça ficam perto do neutro para não agredir a pele. Espuma não é simulada.",
    ),
    allPurposeCleaner: amostra(
      "Limpador multiuso",
      "home",
      m(10.5, ["carbonate", 0.02]),
      incolor,
      "Limpador multiuso, como vem no frasco.",
      "Levemente básico: a base ajuda a soltar gordura.",
    ),
    toothpaste: amostra(
      "Creme dental em água",
      "home",
      m(8.5, ["carbonate", 0.02]),
      cor([244, 244, 244], 0.85, "branco"),
      "Um centímetro de creme dental em 20 mL de água.",
      "Levemente básico. O branco opaco dificulta ver o indicador.",
    ),
    shampoo: amostra(
      "Xampu diluído",
      "home",
      m(5.5, ["citrate", 0.005]),
      cor([235, 215, 160], 0.35, "amarelo pálido"),
      "Xampu diluído em água (1 parte em 10).",
      "Levemente ácido, perto do pH do couro cabeludo; o ácido cítrico acerta o pH.",
    ),

    /* ---------- Saúde e farmácia ---------- */
    effervescentAntacid: amostra(
      "Antiácido efervescente em água",
      "saude",
      m(6.2, ["carbonate", 0.1], ["citrate", 0.03]),
      incolor,
      "Um envelope de antiácido efervescente em um copo de água (200 mL), logo depois de dissolver.",
      "Bicarbonato e ácido cítrico reagem na água e liberam CO₂ (as bolhas). Sobra bicarbonato para neutralizar o ácido do estômago.",
    ),
    vitaminC: amostra(
      "Vitamina C em água (comprimido)",
      "saude",
      fixo(0, ["ascorbate", 0.0284]),
      incolor,
      "Um comprimido de 1 g de ácido ascórbico em 200 mL de água.",
      "Só ácido ascórbico em água: pH perto de 2,9.",
    ),
    saline: amostra(
      "Soro fisiológico",
      "saude",
      fixo(0, ["carbonate", 1.39e-5]),
      incolor,
      "Solução de NaCl a 0,9 % (0,154 mol/L), em frasco aberto.",
      "O NaCl não muda o pH, mas o soro não tem tampão: o CO₂ do ar o deixa levemente ácido (≈ 5,6). Conduz corrente muito melhor que a água pura.",
      {
        model: {
          ...fixo(0, ["carbonate", 1.39e-5]),
          espectadores: ions([
            ["Na⁺", 0.154],
            ["Cl⁻", 0.154],
          ]),
        },
      },
    ),
    aspirin: {
      name: "Ácido acetilsalicílico (AAS)",
      formula: "HAAS",
      kind: "weakAcid",
      ka: 10 ** -3.5,
      label: "Ácido fraco (medicamento)",
      group: "saude",
      acidForm: "HAAS",
      baseForm: "AAS⁻",
      ionization: "HAAS + H₂O ⇌ H₃O⁺ + AAS⁻",
      explain: "Ácido fraco (pKa 3,5). HAAS = C₉H₈O₄, a aspirina.",
      note: "Um comprimido de 500 mg em 200 mL dá cerca de 0,014 mol/L. No estômago (pH ≈ 2), fica quase todo na forma HAAS, que atravessa as membranas.",
    },

    /* ---------- Corpo humano ---------- */
    gastricJuice: amostra(
      "Suco gástrico",
      "corpo",
      m(1.5),
      cor([240, 240, 225], 0.1, "quase incolor"),
      "Suco do estômago em jejum.",
      "Ácido clorídrico produzido pelas células da parede do estômago. Enzimas e muco não são simulados.",
      {
        label: "Fluido do corpo",
        fixedIon: "Cl⁻",
        model: {
          ...m(1.5),
          espectadores: ions([
            ["Na⁺", 0.05],
            ["Cl⁻", 0.05],
          ]),
        },
      },
    ),
    saliva: amostra(
      "Saliva",
      "corpo",
      m(6.8, ["carbonate", 0.015], ["phosphate", 0.005]),
      cor([240, 240, 235], 0.1, "quase incolor"),
      "Saliva em repouso.",
      "Bicarbonato e fosfato tamponam a boca e protegem os dentes dos ácidos dos alimentos.",
      {
        label: "Fluido do corpo",
        model: {
          ...m(6.8, ["carbonate", 0.015], ["phosphate", 0.005]),
          espectadores: ions([
            ["Na⁺", 0.01],
            ["K⁺", 0.02],
            ["Cl⁻", 0.03],
          ]),
        },
      },
    ),
    plasma: amostra(
      "Plasma sanguíneo",
      "corpo",
      m(7.4, ["carbonate", 0.0252], ["phosphate", 0.001]),
      cor([238, 215, 140], 0.35, "amarelo palha"),
      "Plasma: o sangue sem as células.",
      "O principal tampão é o par H₂CO₃/HCO₃⁻ (24 mmol/L de bicarbonato). No corpo, a respiração elimina CO₂ e os rins ajustam o bicarbonato; aqui o sistema é fechado. pH normal: 7,35 a 7,45.",
      {
        label: "Fluido do corpo",
        model: {
          ...m(7.4, ["carbonate", 0.0252], ["phosphate", 0.001]),
          espectadores: ions([
            ["Na⁺", 0.142],
            ["Cl⁻", 0.103],
            ["K⁺", 0.0045],
            ["Ca²⁺", 0.0025],
          ]),
        },
      },
    ),
    urine: amostra(
      "Urina",
      "corpo",
      m(6.0, ["phosphate", 0.03]),
      cor([240, 210, 80], 0.35, "amarelo"),
      "Urina da manhã.",
      "O pH varia de 4,5 a 8 com a alimentação. Fosfatos tamponam; o amônio leva ácido para fora do corpo.",
      {
        label: "Fluido do corpo",
        model: {
          ...m(6.0, ["phosphate", 0.03]),
          espectadores: ions([
            ["Na⁺", 0.1],
            ["K⁺", 0.05],
            ["Cl⁻", 0.12],
          ]),
        },
      },
    ),
    sweat: amostra(
      "Suor",
      "corpo",
      m(5.5, ["lactate", 0.015]),
      incolor,
      "Suor recolhido depois de exercício.",
      "Levemente ácido (ácido láctico); o sal do suor conduz corrente.",
      {
        label: "Fluido do corpo",
        model: {
          ...m(5.5, ["lactate", 0.015]),
          espectadores: ions([
            ["Na⁺", 0.04],
            ["Cl⁻", 0.035],
          ]),
        },
      },
    ),
    tears: amostra(
      "Lágrima",
      "corpo",
      m(7.4, ["carbonate", 0.02]),
      incolor,
      "Lágrima basal.",
      "Quase o pH do sangue; colírios são ajustados para perto de 7,4.",
      {
        label: "Fluido do corpo",
        model: {
          ...m(7.4, ["carbonate", 0.02]),
          espectadores: ions([
            ["Na⁺", 0.14],
            ["Cl⁻", 0.12],
          ]),
        },
      },
    ),

    /* ---------- Água e ambiente ---------- */
    seawater: amostra(
      "Água do mar",
      "ambiente",
      m(8.1, ["carbonate", 0.0023], ["borate", 0.00042]),
      cor([200, 230, 235], 0.06, "quase incolor"),
      "Água do mar da superfície (salinidade 35).",
      "Carbonato e borato tamponam o oceano perto de pH 8,1. O CO₂ extra do ar está baixando esse pH (acidificação dos oceanos). Muitos íons: conduz muito.",
      {
        label: "Amostra ambiental",
        model: {
          ...m(8.1, ["carbonate", 0.0023], ["borate", 0.00042]),
          espectadores: ions([
            ["Na⁺", 0.469],
            ["Cl⁻", 0.546],
            ["Mg²⁺", 0.0528],
            ["SO₄²⁻", 0.0282],
            ["Ca²⁺", 0.0103],
            ["K⁺", 0.0102],
          ]),
        },
      },
    ),
    mineralWater: amostra(
      "Água mineral",
      "ambiente",
      m(7.5, ["carbonate", 0.002]),
      incolor,
      "Água mineral sem gás.",
      "O bicarbonato das rochas deixa a água levemente básica. O rótulo informa o pH na fonte.",
      {
        label: "Amostra ambiental",
        model: {
          ...m(7.5, ["carbonate", 0.002]),
          espectadores: ions([
            ["Ca²⁺", 0.0005],
            ["Mg²⁺", 0.0002],
            ["Na⁺", 0.0005],
          ]),
        },
      },
    ),
    tapWater: amostra(
      "Água da torneira",
      "ambiente",
      m(7.2, ["carbonate", 0.001]),
      incolor,
      "Água tratada da rede.",
      "A estação de tratamento corrige o pH (a norma pede de 6,0 a 9,0) e adiciona cloro.",
      { label: "Amostra ambiental" },
    ),
    poolWater: amostra(
      "Água de piscina",
      "ambiente",
      m(7.4, ["carbonate", 0.0015], ["hypochlorite", 2e-5]),
      incolor,
      "Água de piscina tratada (cerca de 1,5 mg/L de cloro livre).",
      "Mantém-se o pH perto de 7,4: em pH mais alto o cloro fica como ClO⁻, que desinfeta pior que o HClO. Veja o par HClO/ClO⁻ no diagrama de espécies.",
      { label: "Amostra ambiental" },
    ),
    distilledWater: amostra(
      "Água destilada exposta ao ar",
      "ambiente",
      fixo(0, ["carbonate", 1.39e-5]),
      incolor,
      "Água destilada deixada em um copo aberto.",
      "Sem tampão, ela absorve CO₂ do ar e fica com pH perto de 5,6. Por isso a água destilada do laboratório quase nunca mede 7.",
      { label: "Amostra ambiental" },
    ),
    acidSoil: amostra(
      "Solo ácido (extrato em água)",
      "ambiente",
      m(4.8, ["aluminio", 0.0005]),
      cor([170, 130, 90], 0.5, "marrom claro"),
      "Uma parte de terra agitada com duas partes de água e decantada.",
      "Em solos ácidos, o Al³⁺ dissolvido libera H₃O⁺ e prejudica as raízes. A calagem (calcário) sobe o pH e tira o alumínio de circulação.",
      { label: "Amostra ambiental" },
    ),
  });

  // O sal de cozinha em água conduz corrente: seus íons não mudam o pH.
  if (SIAB.solutions.salt)
    SIAB.solutions.salt.model.espectadores = ions([
      ["Na⁺", 0.171],
      ["Cl⁻", 0.171],
    ]);
})();
