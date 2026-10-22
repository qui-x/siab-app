"use strict";
/* RC.4: registro central do Manual. Texto de uso, sem dados privados de atividades. */
SIAB.manualContent = {
  categories: [
    {
      id: "comecar",
      title: "Comece por aqui",
      summary: "Primeiros passos, navegação e uso offline.",
      icon: "home",
      group: "Orientação",
    },
    {
      id: "bancada",
      title: "Bancada",
      summary: "Prepare soluções e acompanhe cada recipiente.",
      icon: "tube",
      group: "Investigue",
    },
    {
      id: "explorar",
      title: "Explorar",
      summary: "Conecte cores, partículas e transformações.",
      icon: "eye",
      group: "Investigue",
    },
    {
      id: "medir",
      title: "Medir",
      summary: "Use instrumentos e registre evidências.",
      icon: "ruler",
      group: "Investigue",
    },
    {
      id: "calcular",
      title: "Calcular",
      summary: "Interprete concentrações, tabelas e gráficos.",
      icon: "chart",
      group: "Investigue",
    },
    {
      id: "instrumentos",
      title: "Instrumentos",
      summary: "Escolha a técnica e compreenda seus limites.",
      icon: "meter",
      group: "Investigue",
    },
    {
      id: "montagens",
      title: "Montagens prontas",
      summary: "Conheça as bancadas pré-configuradas.",
      icon: "mount",
      group: "Prepare e registre",
    },
    {
      id: "roteiros",
      title: "Roteiros Experimentais",
      summary: "Siga uma investigação com objetivo e tarefas.",
      icon: "list",
      group: "Prepare e registre",
    },
    {
      id: "relatorios",
      title: "Relatórios",
      summary: "Reúna resultados, interpretação e conclusão.",
      icon: "report",
      group: "Prepare e registre",
    },
    {
      id: "caderno",
      title: "Caderno",
      summary: "Guarde notas e investigações escolhidas por você.",
      icon: "notebook",
      group: "Prepare e registre",
    },
    {
      id: "acessibilidade",
      title: "Acessibilidade",
      summary: "Ajuste leitura, cores e navegação.",
      icon: "access",
      group: "Orientação",
    },
    {
      id: "problemas",
      title: "Ajuda e solução de problemas",
      summary: "Encontre uma resposta para dúvidas frequentes.",
      icon: "help",
      group: "Orientação",
    },
    {
      id: "professor",
      title: "Área do Professor",
      summary: "Configure atividades e consulte orientações.",
      icon: "teacher",
      group: "Para ensinar",
    },
  ],
  topics: [
    {
      id: "comecar",
      title: "Primeiros passos",
      category: "comecar",
      summary:
        "Monte um experimento, observe as mudanças e escolha como registrar suas descobertas.",
      purpose:
        "A bancada livre permite explorar sem uma atividade restrita. Uma nova bancada começa vazia; uma sessão já salva pode ser retomada.",
      steps: [
        "Abra o Laboratório. Se a bancada estiver vazia, escolha uma solução para criar o primeiro recipiente.",
        "Abra Montagem para escolher preparo, vidraria e módulo.",
        "Use Ver para observar, medir ou analisar. As ações de gotejar e agitar ficam junto à bancada.",
        "Abra Dados para consultar medições e acessar o relatório.",
      ],
      example:
        "Comece com uma solução e um indicador. Adicione uma gota, observe a cor e faça uma leitura de pH.",
      related: ["bancada", "ph", "menu", "app"],
      keywords: ["inicio", "começar", "primeira visita", "bancada livre"],
      details: [],
      diagram: "workspace",
      actions: [
        {
          label: "Ir à bancada",
          route: "#/laboratorio",
        },
        {
          label: "Iniciar tour da bancada",
          command: "tour",
        },
      ],
    },
    {
      id: "bancada",
      title: "Usar a bancada",
      category: "bancada",
      summary:
        "O recipiente fica em foco; Montagem, Ver e Dados abrem as ferramentas de que você precisa.",
      purpose:
        "Prepare em Montagem, investigue em Ver e reúna registros em Dados. Fechar um painel libera espaço para o experimento.",
      steps: [
        "Em Montagem, use Resumo para consultar as condições e Preparo para escolher soluções e indicador.",
        "Use Objetos para vidrarias e recipientes, e Módulo para Explorar, Medir ou Calcular.",
        "Abra Ver e escolha Observar, Medir ou Analisar. Use Dados para tabela, histórico e relatório.",
        "No celular, os mesmos botões ficam na parte inferior. Voltar retorna um nível; Fechar devolve o foco à bancada.",
      ],
      example:
        "Abra a Tabela e use Expandir quando precisar de mais espaço. Feche o painel para voltar ao recipiente.",
      related: ["prateleira", "vidraria", "conta-gotas", "tubos"],
      keywords: [
        "layout",
        "montagem",
        "docas",
        "painel",
        "celular",
        "mobile",
        "tablet",
        "workspace",
      ],
      details: [
        {
          title: "Bancada livre e atividade",
          text: "Na bancada livre você escolhe a montagem. Em uma atividade, só aparecem as opções disponibilizadas pelo professor. Consulte [[atividades|Atividades por link]].",
        },
      ],
      diagram: "workspace",
      actions: [
        {
          label: "Ir à bancada",
          route: "#/laboratorio",
        },
      ],
    },
    {
      id: "menu",
      title: "Página inicial e navegação",
      category: "comecar",
      summary: "A Página inicial reúne os caminhos principais do SIAB.",
      purpose:
        "Use Aprender para conceitos, Missões para desafios de investigação, Roteiros Experimentais para atividades estruturadas, Laboratório para exploração e Caderno para registros.",
      steps: [
        "Escolha um caminho na Página inicial ou abra o Menu.",
        "No Menu, entre em Preferências → Inicialização para escolher a tela de entrada.",
        "Use Manual para consulta e Área do Professor para preparar atividades.",
      ],
      example: "",
      related: ["comecar", "aprender", "roteiros"],
      keywords: ["menu", "inicialização", "tela inicial"],
      details: [],
      actions: [
        {
          label: "Abrir Página inicial",
          route: "#/inicio",
        },
      ],
    },
    {
      id: "modulos",
      title: "Escolher um módulo",
      category: "comecar",
      summary:
        "Explorar, Medir e Calcular são três modos independentes de investigar.",
      purpose:
        "O módulo muda os controles e o detalhamento. Não é necessário concluir um módulo para usar outro.",
      steps: [
        "Abra Montagem → Módulo.",
        "Escolha Explorar, Medir ou Calcular pelo objetivo da investigação.",
        "Ative o módulo desejado. Em atividades, a escolha pode estar definida pelo professor.",
      ],
      example: "",
      related: ["explorar", "medir", "calcular"],
      keywords: ["modo", "módulos", "nível"],
      details: [],
      diagram: "modules",
    },
    {
      id: "explorar",
      title: "Explorar: observar e manipular",
      category: "explorar",
      summary:
        "Compare cores, indicadores e transformações visíveis antes de aprofundar os números.",
      purpose:
        "O módulo Explorar enfatiza soluções, indicadores e vidrarias. As ferramentas de Ver continuam sujeitas à configuração da atividade.",
      steps: [
        "Ative Explorar em Montagem → Módulo.",
        "Escolha solução e indicador em Preparo.",
        "Goteje e observe cor, volume, turvação ou sólido, quando representados.",
        "Use Ver → Observar para conectar a cena às representações.",
      ],
      example:
        "Compare a mesma solução com dois indicadores. Uma diferença de cor não significa que a solução mudou de pH.",
      related: ["indicadores", "observar", "tubos"],
      keywords: ["observação", "cor", "manipulação"],
      details: [],
      actions: [
        {
          label: "Ir à bancada",
          route: "#/laboratorio",
        },
      ],
    },
    {
      id: "medir",
      title: "Medir: coletar evidências",
      category: "medir",
      summary:
        "Controle volumes e diluições e obtenha leituras com os instrumentos disponíveis.",
      purpose:
        "O módulo Medir acrescenta ajustes de volume inicial, diluição e tamanho da gota. Medir também é o nome da família de instrumentos em Ver; os dois controles têm funções diferentes.",
      steps: [
        "Ative o módulo em Montagem → Módulo.",
        "Em Preparo, confira volume inicial, diluição e volume da gota.",
        "Abra Ver → Medir e selecione pH, Temperatura ou Condutividade.",
        "Acione a medição e consulte os registros em Dados.",
      ],
      example:
        "Faça uma leitura de pH, adicione uma dose e meça novamente. Compare as duas evidências na Tabela.",
      related: ["painel-medir", "phmetro", "fita", "titulacao"],
      keywords: ["medida", "medição", "medidor", "coletar"],
      details: [],
      diagram: "measurement",
      actions: [
        {
          label: "Ir à bancada",
          route: "#/laboratorio",
        },
      ],
    },
    {
      id: "calcular",
      title: "Calcular: interpretar quantidades",
      category: "calcular",
      summary:
        "Relacione concentrações e equilíbrio químico às observações e medições.",
      purpose:
        "O módulo Calcular acrescenta concentrações no preparo e detalhes quantitativos nas representações. Valores calculados pelo modelo são diferentes de leituras instrumentais.",
      steps: [
        "Ative Calcular em Montagem → Módulo.",
        "Em Preparo, confira as concentrações disponíveis.",
        "Use Ver → Observar para espécies e equações; use Analisar para interpretar os registros.",
        "Compare o que foi medido com o que foi calculado, respeitando os limites de cada um.",
      ],
      example:
        "Compare uma leitura de pH com as concentrações de H₃O⁺ e OH⁻ mostradas pelo modelo.",
      related: ["especies", "equacao", "analisar", "limites"],
      keywords: ["concentração", "mol", "cálculo", "quantitativo"],
      details: [],
      actions: [
        {
          label: "Ir à bancada",
          route: "#/laboratorio",
        },
      ],
    },
    {
      id: "prateleira",
      title: "Escolher soluções e reagentes",
      category: "bancada",
      summary:
        "Em Montagem → Preparo, escolha qual solução vai para o recipiente e qual vai para o conta-gotas.",
      purpose:
        "A escolha do destino evita trocar o conteúdo do tubo quando você queria mudar apenas o reagente adicionado.",
      steps: [
        "Abra Montagem → Preparo.",
        "Selecione o destino Tubo ou Conta-gotas.",
        "Escolha o frasco e confira o nome exibido na bancada.",
        "Se necessário, ajuste o indicador e os valores permitidos pelo módulo.",
      ],
      example:
        "Para adicionar base a um ácido, mantenha o ácido no Tubo e escolha a base no Conta-gotas.",
      related: ["conta-gotas", "medidas", "frascos"],
      keywords: ["solução", "reagente", "frasco", "preparo", "prateleira"],
      details: [
        {
          title: "Troca de solução",
          text: "Trocar o preparo altera o experimento. Confira o recipiente em foco antes de modificar a solução. Uma medição anterior não representa automaticamente o novo preparo.",
        },
      ],
    },
    {
      id: "vidraria",
      title: "Vidrarias e capacidade",
      category: "bancada",
      summary:
        "Tubo de ensaio, béquer e erlenmeyer oferecem formatos e capacidades diferentes.",
      purpose: "Escolha a vidraria adequada ao volume que pretende manipular.",
      steps: [
        "Abra Montagem → Objetos.",
        "Escolha a vidraria e, quando disponível, sua capacidade.",
        "Confira o volume inicial e o espaço livre antes de adicionar reagente.",
      ],
      example:
        "Uma titulação com mais volume pode usar um erlenmeyer. A capacidade limita a quantidade que cabe no recipiente.",
      related: ["medidas", "tubos"],
      keywords: ["recipiente", "béquer", "erlenmeyer", "tubo", "capacidade"],
      details: [
        {
          title: "Limites do desenho",
          text: "As marcas são representações didáticas, não vidrarias volumétricas certificadas. Em um grupo vinculado, a adição respeita o recipiente com menor espaço livre.",
        },
      ],
    },
    {
      id: "medidas",
      title: "Volumes, diluição e concentração",
      category: "bancada",
      summary:
        "Os ajustes de preparo definem as quantidades usadas no experimento.",
      purpose:
        "Medir permite ajustar volume inicial, diluição e tamanho da gota. Calcular também expõe concentrações em mol/L.",
      steps: [
        "Abra Montagem → Preparo e os ajustes do preparo.",
        "Informe os valores disponíveis no módulo e aplique a preparação.",
        "Confira as condições exibidas antes de iniciar novas medições.",
      ],
      example:
        "Compare uma solução antes e depois da diluição. Adicionar água conserva a quantidade de soluto e pode mudar o equilíbrio.",
      related: ["medir", "calcular", "conta-gotas"],
      keywords: ["volume", "concentração", "diluir", "diluição", "gota"],
      details: [
        {
          title: "Hipóteses do modelo",
          text: "O modelo considera volumes aditivos. Não faz média de pH: calcula novamente o equilíbrio a partir da composição.",
        },
      ],
    },
    {
      id: "conta-gotas",
      title: "Gotejar, adicionar volume e agitar",
      category: "bancada",
      summary:
        "As ações próximas ao recipiente permitem intervir e observar o que mudou.",
      purpose:
        "Use gotas pequenas para acompanhar mudanças graduais e os botões de volume para doses maiores.",
      steps: [
        "Confira o reagente mostrado no conta-gotas.",
        "Toque em Segure para gotejar para adicionar uma gota, ou mantenha pressionado para repetir.",
        "Use os atalhos de gotas e volume quando necessário; no celular, abra Doses.",
        "Use Agitar para uniformizar a representação e Desfazer para recuperar uma intervenção recente.",
      ],
      example:
        "Faça uma leitura, adicione uma gota e leia novamente. O valor anterior permanece identificado até uma nova medição.",
      related: ["titulacao", "prever", "ph"],
      keywords: [
        "conta gotas",
        "gotejamento",
        "gotas",
        "agitação",
        "agitar",
        "dose",
        "desfazer",
      ],
      details: [
        {
          title: "Agitação e equilíbrio",
          text: "O equilíbrio químico é imediato no modelo. Agitar atua na representação visual, sem simular cinética. A adição para ao atingir a capacidade.",
        },
        {
          title: "Meia gota",
          text: "O erlenmeyer oferece a ação de meia gota. Use apenas os controles apresentados para a vidraria atual.",
        },
      ],
    },
    {
      id: "tubos",
      title: "Selecionar e comparar recipientes",
      category: "bancada",
      summary:
        "Alterne o recipiente em foco ou abra Visão geral para trabalhar com várias amostras.",
      purpose:
        "Comparar observa recipientes lado a lado; vincular faz com que recebam as mesmas intervenções do conta-gotas.",
      steps: [
        "Toque no nome de um recipiente na faixa da bancada para colocá-lo em foco.",
        "Abra Visão geral e use Selecionar recipientes para ações em conjunto.",
        "Escolha Comparar para observar, ou Vincular para sincronizar intervenções futuras.",
        "Para Misturar, escolha o destino e confira a capacidade antes de confirmar.",
      ],
      example:
        "Compare soluções com indicadores diferentes. Vincule apenas se quiser adicionar o mesmo reagente a todas.",
      related: ["bancada", "vidraria", "conta-gotas"],
      keywords: [
        "múltiplos tubos",
        "grupo",
        "comparação",
        "mistura",
        "vincular",
        "selecionar",
      ],
      details: [
        {
          title: "Vínculo não mistura",
          text: "Vincular sincroniza reagente, concentração e quantidade do conta-gotas, preservando o conteúdo que já estava nos recipientes.",
        },
        {
          title: "Mistura transfere conteúdo",
          text: "Misturar reúne todo o conteúdo no destino e esvazia as origens. A temperatura final usa média ponderada por volume para soluções aquosas; não há aquecimento de reação no modelo.",
        },
      ],
    },
    {
      id: "prever",
      title: "Prever e gotejar",
      category: "bancada",
      summary:
        "Compare sua previsão com as evidências observadas após uma intervenção.",
      purpose:
        "A sequência ajuda a separar hipótese, observação e interpretação.",
      steps: [
        "Abra Prever e gotejar.",
        "Registre uma previsão e escolha a intervenção.",
        "Execute e compare antes e depois.",
        "Escreva sua interpretação e use Registrar no Caderno se quiser guardá-la.",
      ],
      example: "",
      related: ["conta-gotas", "caderno"],
      keywords: ["previsão", "hipótese", "investigação"],
      details: [
        {
          title: "Registro",
          text: "A explicação é opcional na bancada livre. Uma atividade pode solicitá-la como parte da investigação.",
        },
      ],
    },
    {
      id: "ph",
      title: "O que o pH informa",
      category: "medir",
      summary:
        "O pH indica a condição ácido-base da solução e precisa ser interpretado junto à temperatura e à técnica de leitura.",
      purpose:
        "Use uma técnica disponível para obter evidência: [[indicadores|indicador]], [[fita|fita de pH]] ou [[phmetro|pHmetro]].",
      steps: [
        "Coloque o recipiente desejado em foco.",
        "Abra Ver → Medir → pH.",
        "Escolha a técnica disponível e execute a leitura.",
        "Após uma intervenção, faça nova leitura ou acompanhe a medição contínua.",
      ],
      example:
        "“pH não medido” significa que ainda não houve leitura instrumental. A solução pode ter cor mesmo sem essa leitura.",
      related: ["painel-medir", "fita", "phmetro", "temperatura"],
      keywords: ["acidez", "basicidade", "ácido", "base", "como medir ph"],
      details: [
        {
          title: "Neutralidade",
          text: "A referência de neutralidade depende da temperatura: pH neutro = pKw(T)/2. Em torno de 25 °C, a referência usual é próxima de 7.",
        },
        {
          title: "Leitura anterior",
          text: "Uma intervenção pode invalidar a medida pontual. “Leitura anterior” preserva a informação histórica e pede uma nova medição, sem atualizar o valor por conta própria.",
        },
      ],
    },
    {
      id: "painel-medir",
      title: "Usar Ver → Medir",
      category: "medir",
      summary: "A família Medir reúne pH, Temperatura e Condutividade.",
      purpose:
        "Cada instrumento registra uma grandeza diferente. Só aparecem os recursos liberados para a atividade.",
      steps: [
        "Abra Ver e selecione a família Medir.",
        "Escolha pH, Temperatura ou Condutividade.",
        "Acione o botão de medição da ferramenta.",
        "Consulte as medições em Dados → Tabela.",
      ],
      example: "",
      related: ["phmetro", "fita", "condutividade", "temperatura"],
      keywords: ["painel medir", "instrumentação", "ferramenta", "medição"],
      details: [],
      diagram: "measurement",
    },
    {
      id: "instrumentos",
      title: "Escolher um instrumento",
      category: "instrumentos",
      summary:
        "Indicador, fita, pHmetro, termômetro e condutivímetro oferecem evidências diferentes.",
      purpose:
        "Escolha a técnica pela pergunta da investigação, pela grandeza medida e pela resolução disponível.",
      steps: [
        "Confira quais instrumentos aparecem em Ver → Medir.",
        "Leia como usar e quais limites a técnica apresenta.",
        "Meça no recipiente em foco e identifique a técnica ao comparar resultados.",
      ],
      example: "",
      related: [
        "indicadores",
        "fita",
        "phmetro",
        "condutividade",
        "temperatura",
      ],
      keywords: ["instrumento", "aparelho", "técnica"],
      details: [],
      diagram: "instruments",
    },
    {
      id: "indicadores",
      title: "Indicadores ácido-base",
      category: "instrumentos",
      summary:
        "Um indicador adicionado à solução muda de cor em uma faixa de pH.",
      purpose:
        "É útil para observar tendências e regiões de viragem; a cor não equivale a uma leitura numérica precisa.",
      steps: [
        "Abra Montagem → Preparo e escolha um indicador.",
        "Observe a cor junto ao recipiente e leia seu nome.",
        "Adicione reagente e compare as mudanças com a faixa do indicador.",
      ],
      example:
        "A mesma solução pode produzir cores diferentes com indicadores distintos. Consulte a faixa de cada um.",
      related: ["tabela-indicadores", "fita", "ph"],
      keywords: [
        "indicador",
        "cor",
        "viragem",
        "fenolftaleína",
        "bromotimol",
        "repolho",
      ],
      details: [
        {
          title: "Cor própria da amostra",
          text: "Sem indicador preserva a cor própria. Realçar indicador muda a apresentação dos pigmentos da amostra, sem alterar o equilíbrio.",
        },
        {
          title: "Limitação",
          text: "A carta é didática e as cores aproximadas. Um indicador informa uma faixa; não substitui uma análise física de uma amostra real.",
        },
      ],
    },
    {
      id: "fita",
      title: "Fita de pH",
      category: "instrumentos",
      summary:
        "A fita de pH fornece uma estimativa aproximada pela comparação de cor.",
      purpose:
        "Use-a quando uma faixa de pH for suficiente ou quando for a técnica disponibilizada na atividade.",
      steps: [
        "Coloque o recipiente em foco e abra Ver → Medir → pH.",
        "Toque em Mergulhar fita no recipiente.",
        "Compare a cor com a escala de 0 a 14 e leia a estimativa.",
        "Após adicionar reagente, mergulhe uma nova fita para obter outra leitura.",
      ],
      example:
        "“≈ 4” é uma estimativa em passos de uma unidade, não uma leitura de 4,00.",
      related: ["phmetro", "indicadores", "compactacao"],
      keywords: [
        "papel indicador",
        "papel de ph",
        "fita de ph",
        "tira",
        "estimativa",
      ],
      details: [
        {
          title: "Resolução e extremos",
          text: "A resolução didática é de 1 unidade. Valores nos extremos da escala não descrevem com precisão soluções fora dessa faixa.",
        },
        {
          title: "Comparar técnicas",
          text: "Diferencie a estimativa da fita da resolução de 0,01 do [[phmetro|pHmetro]]. Mais casas na exibição não eliminam os limites do modelo.",
        },
      ],
      diagram: "strip",
    },
    {
      id: "phmetro",
      title: "pHmetro",
      category: "instrumentos",
      summary:
        "O pHmetro fornece uma leitura numérica de pH após a estabilização.",
      purpose:
        "Use-o para acompanhar variações menores do que as distinguidas pela [[fita|fita de pH]].",
      steps: [
        "Coloque o recipiente em foco e abra Ver → Medir → pH.",
        "No pHmetro, toque em Medir uma vez para iniciar a leitura com o eletrodo.",
        "Aguarde o aviso de leitura estável. O resultado é registrado.",
        "Para acompanhar intervenções, escolha Medição contínua; encerre com Retirar eletrodo.",
      ],
      example:
        "Meça antes de adicionar reagente e repita depois. No modo pontual, a leitura antiga não muda sozinha.",
      related: ["ph", "fita", "titulacao", "tabela"],
      keywords: [
        "medidor de ph",
        "ph meter",
        "eletrodo",
        "calibração",
        "estabilização",
        "medição contínua",
      ],
      details: [
        {
          title: "Como interpretar",
          text: "A resolução exibida é de 0,01. Isso descreve a mecânica didática do instrumento, não uma garantia de exatidão para uma amostra real.",
        },
        {
          title: "Calibração simulada",
          text: "Calibrar com padrões 4,00 e 7,00 usa referências a 25 °C. Não há ruído aleatório. A estabilização é parte da interação; o equilíbrio da solução já foi calculado.",
        },
        {
          title: "Leitura anterior",
          text: "Depois de mudar o preparo ou adicionar reagente, repita a leitura pontual. No modo contínuo, novas leituras são registradas após as mudanças.",
        },
      ],
      diagram: "meter",
    },
    {
      id: "condutividade",
      title: "Condutivímetro",
      category: "instrumentos",
      summary:
        "O condutivímetro estima a condução elétrica da solução a partir de suas espécies iônicas.",
      purpose:
        "Compare a presença e as contribuições dos íons; condutividade não é sinônimo de pH.",
      steps: [
        "Abra Ver → Medir → Condutividade.",
        "Toque em Medir condutividade.",
        "Leia o resultado em µS/cm e confira se a leitura é atual ou anterior.",
        "Após uma intervenção, meça novamente.",
      ],
      example:
        "Soluções com pH semelhante podem ter condutividades diferentes por causa de sua composição iônica.",
      related: ["especies", "temperatura", "limites"],
      keywords: [
        "condutividade",
        "condutivimetro",
        "condutimetro",
        "condução",
        "eletricidade",
        "ions",
      ],
      details: [
        {
          title: "Limites",
          text: "A estimativa ideal soma contribuições iônicas e usa mobilidades de referência a 25 °C. Algumas mobilidades são estimadas. Não se aplica uma correção térmica arbitrária.",
        },
      ],
    },
    {
      id: "temperatura",
      title: "Temperatura da solução",
      category: "instrumentos",
      summary:
        "O termômetro registra a temperatura usada para o recipiente em foco.",
      purpose:
        "A temperatura da solução, o ambiente da bancada e a referência meteorológica são condições diferentes.",
      steps: [
        "Abra Ver → Medir → Temperatura.",
        "Toque em Registrar temperatura.",
        "Se o controle estiver disponível, informe um valor e aplique à solução.",
        "Faça novas medições para comparar as condições.",
      ],
      example:
        "Alterar a temperatura pode mudar a referência de neutralidade; pH neutro não é sempre exatamente 7.",
      related: ["ph", "condutividade", "atividades"],
      keywords: [
        "termômetro",
        "temperatura",
        "ambiente",
        "cidade",
        "neutralidade",
      ],
      details: [
        {
          title: "Referências",
          text: "Você pode usar a referência de 25 °C ou a temperatura do ambiente da bancada. A consulta opcional por cidade depende da internet; sem resposta, há referência de 25 °C e ajuste manual.",
        },
        {
          title: "Limites térmicos",
          text: "O modelo ajusta a autoionização da água. Ka, pKIn, Kps e mobilidades mantêm valores de referência; não há dependências térmicas inventadas.",
        },
      ],
    },
    {
      id: "observar",
      title: "Usar Ver → Observar",
      category: "explorar",
      summary:
        "Partículas, Espécies, Equações e Transferência de próton mostram perspectivas complementares da solução.",
      purpose:
        "Conecte o que aparece no recipiente ao modelo de moléculas, íons e equilíbrio.",
      steps: [
        "Abra Ver → Observar.",
        "Escolha uma representação disponível.",
        "Consulte a legenda e selecione uma espécie quando o controle existir.",
        "Compare a mesma espécie em outra representação.",
      ],
      example: "",
      related: ["particulas", "especies", "equacao", "proton"],
      keywords: ["representações", "microscópico", "macroscópico", "simbólico"],
      details: [],
      diagram: "representations",
    },
    {
      id: "particulas",
      title: "Partículas",
      category: "explorar",
      summary:
        "A visão de partículas representa moléculas e íons de forma proporcional e simplificada.",
      purpose:
        "Observe quais espécies predominam e conecte-as à cor e ao equilíbrio.",
      steps: [
        "Abra Ver → Observar → Partículas.",
        "Consulte a legenda e selecione a espécie que deseja destacar.",
        "Quando disponível, compare as escalas de representação.",
      ],
      example: "",
      related: ["especies", "equacao", "distribuicao"],
      keywords: ["moléculas", "íons", "lupa", "microscópico"],
      details: [
        {
          title: "Escala",
          text: "O número de desenhos não é uma contagem literal de partículas. A escala logarítmica amplia espécies raras para que possam ser vistas.",
        },
      ],
    },
    {
      id: "especies",
      title: "Espécies em solução",
      category: "explorar",
      summary:
        "A tabela de espécies mostra concentrações calculadas pelo modelo químico.",
      purpose:
        "Use fórmula, carga e predominância para interpretar a composição.",
      steps: [
        "Abra Ver → Observar → Espécies.",
        "Leia a concentração em mol/L e a indicação de predominância.",
        "Selecione uma espécie para conectá-la às demais representações.",
      ],
      example: "",
      related: ["particulas", "distribuicao", "calcular"],
      keywords: ["espécie", "concentração", "carga", "predominância"],
      details: [
        {
          title: "Cálculo não é medição",
          text: "Esses valores resultam do modelo. Uma leitura instrumental só existe depois de usar a técnica correspondente.",
        },
      ],
    },
    {
      id: "equacao",
      title: "Equações",
      category: "explorar",
      summary:
        "As equações descrevem simbolicamente o equilíbrio e as espécies envolvidas.",
      purpose:
        "Use-as para relacionar ácidos, bases e produtos aos dados da solução.",
      steps: [
        "Abra Ver → Observar → Equações.",
        "Identifique reagentes, produtos e as informações quantitativas disponíveis no módulo.",
        "Compare a equação com Partículas e Espécies.",
      ],
      example: "",
      related: ["proton", "calcular", "especies"],
      keywords: ["equação", "reação", "equilíbrio", "neutralização"],
      details: [
        {
          title: "Interpretação",
          text: "Uma equação é uma representação do sistema químico. Ela não é um registro instrumental nem comprova que uma medição foi feita.",
        },
      ],
    },
    {
      id: "proton",
      title: "Transferência de próton",
      category: "explorar",
      summary: "Na descrição de Brønsted, o ácido doa H⁺ e a base recebe H⁺.",
      purpose:
        "Compare os pares ácido-base conjugados, que diferem por um próton.",
      steps: [
        "Abra Ver → Observar → Transferência de próton.",
        "Identifique doador e receptor.",
        "Selecione um componente e conecte-o às outras representações.",
      ],
      example: "",
      related: ["equacao", "especies"],
      keywords: ["proton", "prótons", "Brønsted", "par conjugado"],
      details: [
        {
          title: "Em água",
          text: "A água pode receber o próton e formar H₃O⁺. Na neutralização, H₃O⁺ doa o próton e OH⁻ o recebe, formando água.",
        },
      ],
    },
    {
      id: "analisar",
      title: "Usar Ver → Analisar",
      category: "calcular",
      summary:
        "Gráfico, ΔpH/ΔV, Distribuição de espécies, Histórico e Tabela ajudam a interpretar a investigação.",
      purpose:
        "Gráfico e derivada usam leituras registradas; distribuição descreve o equilíbrio calculado; histórico organiza eventos.",
      steps: [
        "Abra Ver → Analisar e escolha uma ferramenta.",
        "Confira a origem dos dados antes de interpretar.",
        "Use Expandir quando a tabela ou o gráfico precisar de mais espaço.",
      ],
      example: "",
      related: ["grafico", "derivada", "distribuicao", "historico", "tabela"],
      keywords: ["análise", "analisar", "dados"],
      details: [],
    },
    {
      id: "grafico",
      title: "Gráfico de pH por volume",
      category: "calcular",
      summary:
        "O gráfico conecta medições de pH ao volume de reagente adicionado.",
      purpose:
        "Compare o avanço de uma titulação usando evidências registradas, não uma curva prevista automaticamente.",
      steps: [
        "Faça pelo menos duas medições com uma técnica de pH disponível.",
        "Adicione reagente entre leituras para acompanhar a variação com o volume.",
        "Abra Ver → Analisar → Gráfico.",
        "Leia o volume adicionado no eixo horizontal e o pH no vertical.",
      ],
      example:
        "Fita usa linha tracejada; pHmetro, linha contínua. Compare séries da mesma técnica e do mesmo preparo.",
      related: ["titulacao", "derivada", "tabela"],
      keywords: ["gráfico", "curva", "eixo", "volume", "ponto"],
      details: [
        {
          title: "Origem dos pontos",
          text: "Sem leituras suficientes, o gráfico informa o que falta. As linhas apenas conectam registros. Mudanças de preparo e de técnica separam séries.",
        },
      ],
    },
    {
      id: "derivada",
      title: "ΔpH/ΔV: mudança por volume",
      category: "calcular",
      summary:
        "ΔpH/ΔV mostra quanto o pH mudou entre leituras para cada volume adicionado.",
      purpose:
        "Valores mais intensos indicam regiões onde uma pequena adição produziu maior mudança de pH.",
      steps: [
        "Registre leituras sucessivas com a mesma técnica, em volumes distintos.",
        "Abra Ver → Analisar → ΔpH/ΔV.",
        "Compare a variação com o gráfico e os dados de origem.",
      ],
      example:
        "Se o pH muda de 4 para 5 após 1 mL, a razão nesse intervalo é 1 unidade de pH por mL. É um exemplo ilustrativo.",
      related: ["grafico", "titulacao", "compactacao"],
      keywords: ["derivada", "delta", "ΔpH/ΔV", "salto", "equivalência"],
      details: [
        {
          title: "Resolução importa",
          text: "Intervalos de volume nulo não produzem essa razão. A derivada usa dados brutos sucessivos da mesma técnica; a resolução da fita pode gerar degraus. Um pico isolado exige interpretação, não identifica sozinho uma equivalência exata.",
        },
      ],
    },
    {
      id: "distribuicao",
      title: "Distribuição de espécies",
      category: "calcular",
      summary:
        "A distribuição compara frações de espécies de um mesmo sistema químico.",
      purpose:
        "Observe como as formas ácido-base variam e qual delas predomina.",
      steps: [
        "Abra Ver → Analisar → Distribuição de espécies.",
        "Leia as frações ou percentuais e selecione a espécie de interesse.",
        "Compare com Espécies e Equações.",
      ],
      example: "",
      related: ["especies", "equacao", "limites"],
      keywords: ["distribuição", "fração", "percentual"],
      details: [
        {
          title: "Disponibilidade",
          text: "A representação depende da presença de uma família química apropriada na solução. Os percentuais vêm do equilíbrio calculado, não de medições instrumentais.",
        },
      ],
    },
    {
      id: "historico",
      title: "Histórico da sessão",
      category: "calcular",
      summary: "O Histórico mostra a sequência cronológica de ações e eventos.",
      purpose:
        "Consulte o que foi feito e em que ordem para interpretar as evidências.",
      steps: [
        "Abra Dados → Histórico ou Ver → Analisar → Histórico.",
        "Leia os eventos em ordem e relacione-os às intervenções.",
        "Use a Tabela para consultar medições de forma estruturada.",
      ],
      example: "",
      related: ["tabela", "caderno", "relatorios"],
      keywords: ["histórico", "eventos", "cronologia", "registro"],
      details: [
        {
          title: "Histórico não é Caderno",
          text: "O Histórico não é compactado e não é copiado automaticamente para o Caderno. O [[caderno|Caderno]] reúne registros que você escolhe guardar.",
        },
      ],
    },
    {
      id: "tabela",
      title: "Tabela de medições",
      category: "calcular",
      summary:
        "A Tabela organiza as leituras registradas com técnica, valor e contexto.",
      purpose:
        "Compare resultados sem confundir medição com a sequência de eventos do Histórico.",
      steps: [
        "Abra Dados → Tabela ou Ver → Analisar → Tabela.",
        "Escolha Compacta para agrupar leituras semelhantes ou Completa para ver cada registro.",
        "Use Ver medições para expandir um grupo e Expandir para ampliar o painel.",
        "Quando necessário, exporte CSV com os dados brutos.",
      ],
      example: "",
      related: ["compactacao", "historico", "relatorios"],
      keywords: ["tabela", "medições", "CSV", "exportar", "dados"],
      details: [],
      diagram: "compaction",
    },
    {
      id: "compactacao",
      title: "Tabela compacta e completa",
      category: "calcular",
      summary:
        "A tabela compacta reúne medições semelhantes sem apagar os dados originais.",
      purpose:
        "A leitura fica mais curta, preservando contagem, faixa e acesso a cada registro.",
      steps: [
        "Na Tabela, escolha Compacta.",
        "Confira a quantidade de leituras e a faixa do grupo.",
        "Use Ver medições para inspecionar seus registros.",
        "Escolha Completa para voltar à lista individual.",
      ],
      example:
        "Leituras repetidas com a mesma técnica e condições podem formar um grupo. Trocar o instrumento ou o preparo separa os registros.",
      related: ["tabela", "derivada", "fita", "phmetro"],
      keywords: [
        "compactação",
        "agrupar",
        "agrupamento",
        "expandir",
        "completa",
        "compacta",
        "repetidos",
      ],
      details: [
        {
          title: "Critério do agrupamento",
          text: "A compactação considera a resolução do instrumento e o contexto da medição, agrupando apenas registros contíguos compatíveis. Não une indiscriminadamente toda a sessão.",
        },
        {
          title: "Dados preservados",
          text: "Os dados brutos não são apagados. Cálculos, derivada e exportação CSV continuam usando os registros originais.",
        },
      ],
      diagram: "compaction",
    },
    {
      id: "titulacao",
      title: "Titulação ácido-base",
      category: "medir",
      summary:
        "Uma titulação acompanha a resposta da solução à adição gradual de um reagente.",
      purpose: "Relacione volume adicionado, mudança de cor e leituras de pH.",
      steps: [
        "Confira solução inicial, reagente e condições de preparo.",
        "Faça uma leitura inicial com a técnica disponível.",
        "Adicione uma dose conhecida e meça novamente; repita em passos menores perto de uma mudança rápida.",
        "Interprete a Tabela, o Gráfico e, quando disponível, ΔpH/ΔV.",
      ],
      example:
        "Use um [[roteiros|Roteiro Experimental]] para uma investigação orientada, ou uma [[montagens|Montagem pronta]] para iniciar a exploração.",
      related: ["conta-gotas", "phmetro", "grafico", "derivada"],
      keywords: [
        "titulação",
        "titular",
        "titulante",
        "equivalência",
        "ácido base",
      ],
      details: [
        {
          title: "Cor e equivalência",
          text: "O ponto de viragem depende do indicador. A interpretação da equivalência depende do sistema e das evidências; não presuma que toda equivalência tem pH 7.",
        },
      ],
      diagram: "titration",
    },
    {
      id: "montagens",
      title: "Montagens prontas",
      category: "montagens",
      summary:
        "Uma Montagem pronta é uma bancada pré-configurada para exploração.",
      purpose:
        "Use-a para começar rapidamente e comparar condições. Ela não exige a estrutura de identificação e relatório de um [[roteiros|Roteiro Experimental]].",
      steps: [
        "Use Abrir Montagens prontas para entrar no catálogo.",
        "Escolha uma montagem e leia o que ela propõe observar.",
        "Monte na bancada e explore os recipientes preparados.",
        "Para retomar o experimento, use Laboratório na navegação.",
      ],
      example:
        "Uma montagem com indicadores diferentes permite comparar as cores em condições preparadas.",
      related: ["roteiros", "bancada"],
      keywords: [
        "montagem",
        "montagens prontas",
        "pré-configurada",
        "catálogo",
      ],
      details: [],
      actions: [
        {
          label: "Abrir Montagens prontas",
          route: "#/montagens",
        },
      ],
    },
    {
      id: "roteiros",
      title: "Roteiros Experimentais",
      category: "roteiros",
      summary:
        "Um Roteiro Experimental é uma atividade estruturada com objetivo e tarefas de investigação.",
      purpose:
        "Cada roteiro pertence a um único módulo e conduz à coleta e interpretação de evidências.",
      steps: [
        "Abra o catálogo de Roteiros Experimentais e selecione uma ficha.",
        "Leia objetivo, tarefas e montagem. Preencha a identificação solicitada.",
        "Use Montar na bancada para iniciar a experiência.",
        "Realize a investigação e abra o Relatório da Experiência.",
      ],
      example:
        "A coleção contempla as substâncias do catálogo em investigações temáticas. Escolha pelo objetivo e pelo módulo indicado.",
      related: ["montagens", "relatorios", "atividades"],
      keywords: [
        "roteiro",
        "experimento",
        "atividade estruturada",
        "identificação",
        "ficha",
      ],
      details: [
        {
          title: "Montagem ou Roteiro?",
          text: "Montagem pronta configura a bancada para explorar. Roteiro acrescenta objetivo, tarefas e registro da experiência. Esta página explica o recurso; o catálogo é aberto pelo botão acima.",
        },
      ],
      diagram: "report",
      actions: [
        {
          label: "Abrir Roteiros Experimentais",
          route: "#/roteiros",
        },
      ],
    },
    {
      id: "aprender",
      title: "Temas e Missões",
      category: "roteiros",
      summary:
        "Temas apresentam conceitos; Missões propõem problemas e objetivos de investigação.",
      purpose:
        "Escolha a abordagem que ajuda sua pergunta, sem uma sequência obrigatória entre módulos.",
      steps: [
        "Em Aprender, escolha um Tema para consultar conceitos e conexões.",
        "Em Missões, leia o problema e os objetivos.",
        "Investigue e registre evidências. Uma missão concluída pode ser refeita.",
      ],
      example: "",
      related: ["comecar", "prever", "caderno"],
      keywords: ["tema", "missão", "missões", "aprender", "objetivo"],
      details: [],
      actions: [
        {
          label: "Abrir Aprender",
          route: "#/aprender",
        },
        {
          label: "Abrir Missões",
          route: "#/missoes",
        },
      ],
    },
    {
      id: "relatorios",
      title: "Relatórios",
      category: "relatorios",
      summary:
        "O relatório reúne a montagem, os dados obtidos e a interpretação escrita da investigação.",
      purpose:
        "Uma experiência formal gera Relatório da Experiência; a bancada livre gera Relatório da Bancada, sem inventar objetivo ou pergunta.",
      steps: [
        "Abra Dados → Abrir relatório.",
        "Confira a identificação, a montagem e os resultados automáticos.",
        "Preencha observações, análise, interpretação, resposta à investigação e conclusão.",
        "Escolha Relatório completo, Para preencher à mão ou Atividade de análise (Professor). Nos modos em papel, selecione 5, 10, 15, 20, 25 ou uma quantidade personalizada de 5 a 60 linhas por campo. O padrão é 10.",
        "Na Atividade de análise, escolha as condições, dados, tabela, gráficos e cálculos incluídos, e quais campos autorais ficarão em branco. Use medições da bancada ou insira dados explicitamente hipotéticos.",
        "Após novas medições, use Atualizar dados da bancada. Use Imprimir / Salvar como PDF ou registre no Caderno.",
      ],
      example:
        "Use a impressão preenchida para entregar a investigação, ou Para preencher à mão, preservando dados e deixando apenas campos autorais vazios.",
      related: ["roteiros", "tabela", "caderno"],
      keywords: ["relatório", "imprimir", "exportar", "PDF", "conclusão"],
      details: [
        {
          title: "Dados e texto",
          text: "Condições iniciais, reagente, medições, tabelas, gráficos e estado final vêm do experimento. A tabela preserva técnicas e contextos, e a compactação não altera os dados brutos. O Histórico cronológico permanece em Dados → Histórico. Identificação e textos autorais são salvos no navegador.",
        },
        {
          title: "Imprimir ou salvar PDF",
          text: "A impressão usa um formato próprio para papel. Na janela de impressão do navegador, escolha uma impressora ou Salvar como PDF, se essa opção estiver disponível.",
        },
      ],
      diagram: "report",
      actions: [
        {
          label: "Abrir relatório atual",
          route: "#/relatorio",
        },
      ],
    },
    {
      id: "caderno",
      title: "Caderno de investigação",
      category: "caderno",
      summary:
        "Registros pessoais de investigações, hipóteses, descobertas e práticas.",
      purpose:
        "Guarde notas pessoais. Ao encerrar uma atividade com dados, a Prática realizada fica registrada automaticamente, com Abrir dados e Abrir relatório.",
      steps: [
        "Abra Caderno pela navegação.",
        "Escreva uma anotação ou consulte os registros existentes.",
        "Filtre o tipo de registro quando precisar localizar uma investigação.",
        "Exporte CSV ou imprima para manter uma cópia.",
      ],
      example:
        "Uma exploração livre só vai para o Caderno quando você pede para registrar.",
      related: ["historico", "relatorios", "persistencia"],
      keywords: ["caderno", "anotação", "notas", "salvar"],
      details: [
        {
          title: "Quatro recursos diferentes",
          text: "Histórico é a sequência de eventos. Tabela organiza medições. Relatório reúne evidências e interpretação de uma experiência; o Caderno guarda notas pessoais e práticas realizadas, sem copiar o relatório inteiro como texto.",
        },
      ],
      actions: [
        {
          label: "Abrir Caderno",
          route: "#/caderno",
        },
      ],
    },
    {
      id: "acessibilidade",
      title: "Ajustar a experiência de uso",
      category: "acessibilidade",
      summary:
        "Tema, contraste, texto, cores e movimento podem ser adaptados no painel Acessibilidade.",
      purpose:
        "Escolha uma apresentação confortável para ler e interagir; os nomes e símbolos acompanham as informações de cor.",
      steps: [
        "Abra Acessibilidade no cabeçalho ou no Menu.",
        "Ajuste tema claro ou escuro, contraste, tamanho e espaçamento do texto.",
        "Confira os filtros de cor e a opção de reduzir movimento.",
        "Use Tab para percorrer os controles e veja [[atalhos|Navegação por teclado]].",
      ],
      example: "",
      related: ["atalhos", "app"],
      keywords: [
        "acessível",
        "contraste",
        "daltonismo",
        "tema claro",
        "escuro",
        "fonte",
        "movimento",
        "Libras",
      ],
      details: [
        {
          title: "Libras e internet",
          text: "O tradutor VLibras é opcional e depende da internet. O restante da consulta essencial do Manual funciona offline junto ao aplicativo.",
        },
      ],
      actions: [
        {
          label: "Abrir Acessibilidade",
          command: "a11y",
        },
      ],
    },
    {
      id: "atalhos",
      title: "Navegação por teclado",
      category: "acessibilidade",
      summary:
        "Use as teclas de navegação dos controles para percorrer o SIAB sem depender do mouse.",
      purpose:
        "O foco visível indica qual link, botão ou campo vai responder à próxima ação.",
      steps: [
        "Use Tab para avançar e Shift+Tab para voltar entre controles.",
        "Use Enter em links; Enter ou Espaço ativam botões e expansores.",
        "Use as setas nas abas da família Ver.",
        "Use Esc para fechar diálogos e painéis contextuais; no Manual, Esc fecha o índice móvel aberto.",
      ],
      example: "",
      related: ["acessibilidade", "bancada"],
      keywords: [
        "teclado",
        "atalho",
        "Tab",
        "Shift",
        "Enter",
        "Espaço",
        "Esc",
        "setas",
      ],
      details: [],
    },
    {
      id: "problemas",
      title: "Ajuda e solução de problemas",
      category: "problemas",
      summary:
        "Encontre o motivo de uma opção ausente ou de um resultado que ainda não apareceu.",
      purpose:
        "Uma restrição da atividade pode ser intencional. Confira o contexto antes de reiniciar sua investigação.",
      steps: [
        "Identifique o recipiente em foco e o módulo atual.",
        "Confira se está em uma atividade enviada pelo professor.",
        "Consulte a dúvida abaixo e siga o próximo passo indicado.",
      ],
      example: "",
      related: ["atividades", "grafico", "compactacao", "persistencia"],
      keywords: ["erro", "problema", "não aparece", "não consigo", "travado"],
      details: [
        {
          title: "Não consigo alterar a solução",
          text: "Em uma atividade enviada pelo professor, o preparo pode estar definido. Consulte Montagem → Resumo e as orientações. Isso faz parte da configuração da atividade.",
        },
        {
          title: "Um instrumento não aparece",
          text: "Só aparecem instrumentos disponibilizados para o contexto. Confira Ver → Medir e consulte o professor se a investigação pedir uma técnica que não foi oferecida.",
        },
        {
          title: "Não consigo abrir outro Roteiro",
          text: "Uma atividade restrita mantém você na investigação atual. Para sair, use Encerrar atividade e confirme, quando for o momento apropriado.",
        },
        {
          title: "O gráfico ainda não apareceu",
          text: "Faça ao menos duas leituras com uma técnica de pH disponível. Para acompanhar volume e calcular ΔpH/ΔV, adicione reagente entre as leituras. Veja [[grafico|Gráfico de pH por volume]].",
        },
        {
          title: "Minha tabela está compactada",
          text: "Isso é uma forma de apresentar leituras semelhantes. Use Completa ou Ver medições; os dados originais foram preservados. Veja [[compactacao|Tabela compacta e completa]].",
        },
        {
          title: "Vejo uma leitura anterior",
          text: "O valor foi registrado antes da última intervenção. Faça nova medição pontual ou use a medição contínua do pHmetro, quando disponível.",
        },
      ],
    },
    {
      id: "atividades",
      title: "Atividades por link e modo restrito",
      category: "problemas",
      summary:
        "Em atividades enviadas pelo professor, algumas opções ficam indisponíveis por fazerem parte da configuração.",
      purpose:
        "O ambiente concentra a investigação nos recursos escolhidos; uma opção ausente não significa necessariamente erro.",
      steps: [
        "Abra o link recebido e leia a apresentação.",
        "Inicie a atividade e consulte a montagem preparada.",
        "Use os botões de ajuda para dúvidas curtas, sem abandonar o experimento.",
        "Use Finalizar para concluir a prática e abrir seu relatório. Encerrar atividade sai do contexto e volta ao Início, preservando os dados no Caderno.",
      ],
      example: "",
      related: ["problemas", "roteiros", "relatorios"],
      keywords: [
        "restrito",
        "restrita",
        "permissão",
        "link do aluno",
        "professor",
        "bloqueado",
      ],
      details: [
        {
          title: "Retomar ou iniciar outra tentativa",
          text: "Ao reabrir o mesmo link, escolha Continuar sessão ou Iniciar nova sessão. Se já finalizou, escolha Ver relatório anterior ou Iniciar nova tentativa. A nova tentativa recebe uma identidade própria; os dados e relatórios anteriores continuam separados.",
        },
        {
          title: "Encerrar com ou sem dados",
          text: "Com dados, você pode continuar, abrir o relatório antes de sair ou encerrar. Encerrar atualiza a mesma Prática realizada no Caderno, sem duplicá-la. Sem dados, a confirmação é simples e nenhum registro vazio é criado. A preferência de inicialização permanece igual.",
        },
        {
          title: "Ajuda durante a atividade",
          text: "Em modo restrito, a ajuda contextual continua disponível, mas não oferece acesso ao Manual completo nem a outras áreas. As opções só reaparecem quando você sai da atividade pela ação própria.",
        },
      ],
    },
    {
      id: "professor",
      title: "Preparar uma atividade",
      category: "professor",
      summary:
        "A Área do Professor reúne configuração, link do aluno e orientações para conduzir a investigação.",
      purpose:
        "Prepare uma Missão, um Roteiro Experimental ou uma Montagem pronta com os recursos adequados à turma.",
      steps: [
        "Abra a Área do Professor e escolha o tipo e o item da atividade.",
        "Configure identificação, módulo, temperatura, instrumentos, representações, análises e permissões oferecidas.",
        "Gere o link e use Abrir como aluno para conferir a experiência configurada.",
        "Consulte Orientações e a impressão do guia na própria Área do Professor.",
      ],
      example:
        "Atividades recentes podem ser reabertas ou duplicadas para preparar outra configuração.",
      related: ["atividades", "roteiros", "projetor"],
      keywords: [
        "docente",
        "professor",
        "criar atividade",
        "configurar",
        "gerar link",
        "orientações",
        "impressão",
      ],
      details: [
        {
          title: "Orientações do professor",
          text: "Referências de resposta e orientações específicas ficam na Área do Professor. Esta página explica o fluxo de preparação e não reproduz resultados esperados para o estudante.",
        },
      ],
      actions: [
        {
          label: "Abrir Área do Professor",
          route: "#/professor",
        },
      ],
    },
    {
      id: "projetor",
      title: "Modo projetor",
      category: "professor",
      summary:
        "O modo projetor amplia a apresentação da mesma bancada para uso coletivo.",
      purpose:
        "Apresente o experimento com melhor leitura a distância, mantendo as ferramentas contextuais.",
      steps: [
        "Ative Menu → Preferências → Apresentação · Modo projetor, ou use o controle da Área do Professor.",
        "Abra apenas Montagem, Ver ou Dados conforme a explicação.",
        "Desative o modo ao voltar ao uso individual.",
      ],
      example: "",
      related: ["bancada", "acessibilidade"],
      keywords: ["projeção", "projetor", "aula", "ampliar"],
      details: [],
    },
    {
      id: "app",
      title: "Instalação e uso offline",
      category: "comecar",
      summary:
        "O Manual essencial acompanha o aplicativo e pode ser consultado sem conexão após o preparo do acesso offline.",
      purpose:
        "Use a versão instalada ou o arquivo HTML independente conforme a forma de acesso disponível.",
      steps: [
        "Na versão oferecida por um endereço compatível, abra o aplicativo uma vez conectado.",
        "Use Instalar quando o navegador oferecer essa opção.",
        "Teste a abertura sem conexão antes da aula.",
        "O HTML independente pode ser aberto diretamente no navegador e também inclui este Manual.",
      ],
      example: "",
      related: ["persistencia", "acessibilidade"],
      keywords: [
        "offline",
        "sem internet",
        "PWA",
        "instalar",
        "standalone",
        "arquivo HTML",
      ],
      details: [
        {
          title: "Recursos externos",
          text: "A consulta meteorológica e o VLibras dependem da internet. Não são necessários para ler o Manual ou executar a bancada.",
        },
        {
          title: "Instalação disponível",
          text: "A opção de instalar depende do navegador e da forma como o aplicativo foi disponibilizado. Abrir o HTML como arquivo local não instala a PWA.",
        },
      ],
    },
    {
      id: "persistencia",
      title: "Guardar e recuperar registros",
      category: "comecar",
      summary:
        "O SIAB guarda preferências, Caderno e relatórios no navegador utilizado.",
      purpose: "Mantenha cópias exportadas do que precisa conservar ou enviar.",
      steps: [
        "Confira os registros no Caderno e os textos no relatório.",
        "Use as opções de exportação e impressão para guardar uma cópia.",
        "Se aparecer um aviso de armazenamento indisponível ou cheio, exporte antes de fechar.",
        "Para retomar uma atividade, conserve também o link recebido.",
      ],
      example: "",
      related: ["caderno", "relatorios", "app"],
      keywords: [
        "salvamento",
        "salvar",
        "recuperar",
        "armazenamento",
        "backup",
      ],
      details: [
        {
          title: "Mesmo navegador",
          text: "Limpar os dados do site ou usar outro navegador pode impedir a retomada dos registros locais. Uma exportação é a forma de manter uma cópia independente.",
        },
      ],
    },
    {
      id: "limites",
      title: "O que o modelo representa",
      category: "calcular",
      summary:
        "O SIAB é um modelo didático de soluções aquosas e equilíbrio ácido-base.",
      purpose:
        "Use as representações para investigar relações, sem tratar o resultado como medição de uma amostra física.",
      steps: [
        "Confira a classificação da solução ou amostra utilizada.",
        "Diferencie cálculo do modelo e leitura instrumental simulada.",
        "Interprete os resultados considerando as condições de preparo e os limites apresentados.",
      ],
      example: "",
      related: ["calcular", "frascos", "precipitacao"],
      keywords: ["modelo", "limitação", "ideal", "precisão"],
      details: [
        {
          title: "Hipóteses",
          text: "O equilíbrio é imediato e usa conservação de matéria e balanço de cargas em solução ideal. O pH de uma mistura não é uma média dos pHs.",
        },
        {
          title: "Não representado",
          text: "O modelo não inclui atividades químicas, cinética, aquecimento de reação ou troca gasosa aberta. Amostras representativas têm composição parcial.",
        },
      ],
    },
    {
      id: "precipitacao",
      title: "Precipitação e redissolução",
      category: "calcular",
      summary:
        "Algumas suspensões de hidróxidos podem apresentar sólido e mudanças de solubilidade.",
      purpose:
        "Observe o sólido quando o sistema químico utilizado incluir esse comportamento.",
      steps: [
        "Escolha uma solução ou suspensão apropriada do catálogo.",
        "Observe a representação de sólido e faça intervenções permitidas.",
        "Compare a cena com Espécies e Equações.",
      ],
      example: "",
      related: ["limites", "frascos", "observar"],
      keywords: [
        "precipitação",
        "precipitado",
        "solubilidade",
        "sólido",
        "Kps",
        "redissolução",
      ],
      details: [
        {
          title: "Limite do recurso",
          text: "O modelo representa sistemas específicos com produto de solubilidade. Não há um banco geral de precipitados para todas as combinações de frascos.",
        },
      ],
    },
    {
      id: "frascos",
      title: "Biblioteca de substâncias",
      category: "bancada",
      summary:
        "Consulte as substâncias disponíveis e sua classificação no modelo.",
      purpose:
        "A biblioteca é uma referência explicativa. Escolha frascos em Montagem → Preparo para montar um experimento.",
      steps: [
        "Localize a substância e confira seu tipo.",
        "Interprete amostras representativas como aproximações de composição.",
        "Abra a bancada para preparar a solução nas condições que deseja investigar.",
      ],
      example: "",
      related: ["prateleira", "limites"],
      keywords: [
        "substância",
        "catálogo",
        "biblioteca",
        "frascos",
        "ácidos",
        "bases",
        "sais",
      ],
      details: [],
      generated: "substances",
      actions: [
        {
          label: "Ir à bancada",
          route: "#/laboratorio",
        },
      ],
    },
    {
      id: "tabela-indicadores",
      title: "Biblioteca de indicadores",
      category: "instrumentos",
      summary:
        "Compare nomes, faixas de viragem e cores dos indicadores presentes no SIAB.",
      purpose:
        "Use a faixa para escolher um indicador coerente com a investigação.",
      steps: [
        "Consulte a faixa e os nomes das cores na tabela.",
        "Em Montagem → Preparo, selecione o indicador desejado.",
        "Compare a cor observada e a leitura de uma técnica disponível.",
      ],
      example: "",
      related: ["indicadores", "fita", "titulacao"],
      keywords: [
        "biblioteca indicadores",
        "carta de cores",
        "faixa de viragem",
      ],
      details: [
        {
          title: "Carta didática",
          text: "Cores e faixas são referências de interpretação no simulador. Não use esta carta como instrumento físico de análise.",
        },
      ],
      generated: "indicators",
    },
  ],
  aliases: {
    layout: "bancada",
    montagem: "bancada",
    leitura: "ph",
    ver: "painel-medir",
    representacoes: "observar",
    phmeter: "phmetro",
    "ph-strip": "fita",
    titration: "titulacao",
    mounts: "montagens",
    reports: "relatorios",
    equacoes: "equacao",
  },
};
SIAB.manualContent.topics.push({
  id: "referencias",
  title: "Referências e créditos",
  category: "calcular",
  summary:
    "Fontes do modelo químico e créditos das dependências do aplicativo.",
  purpose:
    "Consulte as fontes originais para aprofundar conceitos e constantes usados pelo SIAB.",
  steps: [
    "Abra uma fonte de referência de acordo com o assunto investigado.",
    "Confira as condições e as limitações descritas no modelo científico.",
  ],
  related: ["limites", "tabela-indicadores"],
  keywords: ["referências", "créditos", "licença", "bibliografia"],
  details: [
    {
      title: "Licenças",
      text: "SIAB: GNU GPL v3. dialog-polyfill 0.5.6: BSD-3-Clause; contribuição do projeto GoogleChrome/dialog-polyfill. Os avisos completos acompanham o pacote em LICENSE e vendor/dialog-polyfill/LICENSE.",
    },
  ],
  references: [
    {
      label: "OpenStax — Chemistry 2e, cap. 14 (ácidos e bases)",
      url: "https://openstax.org/books/chemistry-2e/pages/14-introduction",
    },
    {
      label: "OpenStax — Apêndice H (Ka de ácidos fracos)",
      url: "https://openstax.org/books/chemistry-2e/pages/h-ionization-constants-of-weak-acids",
    },
    {
      label: "OpenStax — Apêndice I (Kb de bases fracas)",
      url: "https://openstax.org/books/chemistry-2e/pages/i-ionization-constants-of-weak-bases",
    },
    {
      label: "OpenStax — Apêndice J (Kps)",
      url: "https://openstax.org/books/chemistry-2e/pages/j-solubility-products",
    },
    {
      label:
        "D. C. Harris, Análise Química Quantitativa : constantes de dissociação e indicadores",
      url: null,
    },
    {
      label:
        "CRC Handbook of Chemistry and Physics : pKa e condutividade iônica limite (λ°)",
      url: null,
    },
    {
      label:
        "Nelson e Cox, Princípios de Bioquímica de Lehninger : pKa dos aminoácidos",
      url: null,
    },
    {
      label:
        "Baes e Mesmer, The Hydrolysis of Cations : acidez dos cátions metálicos hidratados",
      url: null,
    },
    {
      label: "OpenStax — Chemistry 2e, 14.7 (titulações e indicadores)",
      url: "https://openstax.org/books/chemistry-2e/pages/14-7-acid-base-titrations",
    },
    {
      label: "IUPAC — Ponto de equivalência",
      url: "https://goldbook.iupac.org/terms/view/09042",
    },
    {
      label: "PhET — Soluções ácido-base (lupa de partículas)",
      url: "https://phet.colorado.edu/pt_BR/simulations/acid-base-solutions",
    },
    {
      label: "ACS — Indicador de repolho roxo",
      url: "https://www.acs.org/education/activities/red-cabbage-indicator.html",
    },
  ],
});
SIAB.manualRegistry = (() => {
  const { categories, topics, aliases } = SIAB.manualContent;
  const byId = new Map(topics.map((t) => [t.id, t]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const resolve = (id) => byId.get(aliases[id] || id);
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9Δ]+/gi, " ")
      .trim();
  const stem = (word) =>
    word.length > 4
      ? word.replace(/oes$/, "ao").replace(/ais$/, "al").replace(/s$/, "")
      : word;
  const stop = new Set([
    "a",
    "o",
    "as",
    "os",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "um",
    "uma",
    "e",
    "como",
    "para",
    "no",
    "na",
    "com",
    "meu",
    "minha",
  ]);
  const tokens = (value) =>
    normalize(value)
      .split(/\s+/)
      .filter((w) => w && !stop.has(w))
      .map(stem);
  const index = topics.map((topic) => ({
    topic,
    title: normalize(topic.title),
    keys: normalize(topic.keywords.join(" ")),
    words: tokens(
      [
        topic.title,
        topic.summary,
        topic.purpose,
        ...topic.keywords,
        ...topic.steps,
        topic.example,
        ...topic.details.map((d) => d.title + " " + d.text),
      ].join(" "),
    ),
  }));
  function search(query) {
    const clean = normalize(String(query).slice(0, 120)),
      terms = tokens(clean);
    if (!terms.length) return [];
    return index
      .map((x) => ({
        topic: x.topic,
        score: terms.every((t) =>
          x.words.some((w) => w === t || (t.length > 2 && w.startsWith(t))),
        )
          ? 1 +
            (x.title === clean ? 100 : 0) +
            (x.title.includes(clean) ? 30 : 0) +
            (x.keys.includes(clean) ? 20 : 0) +
            terms.reduce(
              (n, t) =>
                n + (tokens(x.title).some((w) => w.startsWith(t)) ? 5 : 0),
              0,
            )
          : 0,
      }))
      .filter((x) => x.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          topics.indexOf(a.topic) - topics.indexOf(b.topic),
      )
      .map((x) => x.topic);
  }
  return {
    categories,
    topics,
    aliases,
    resolve,
    category: (id) => categoryMap.get(id),
    search,
    normalize,
    index,
  };
})();
// Compatibility for integrations that inspect the list; rendering uses the registry.
SIAB.manual = SIAB.manualContent.topics;
