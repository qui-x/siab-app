"use strict";
/* Bancada compartilhada pelo laboratório livre e pelas missões.
   Aqui ficam as ações (gotejar, colocar frasco, desfazer, renomear…) e os
   eventos dos botões. A configuração diz quais controles cada modo mostra. */
SIAB.bancada = (() => {
  const $ = SIAB.$;
  const TODOS = [
    "gotas",
    "atalhos",
    "poe",
    "ph",
    "indicador",
    "realcar",
    "tubos",
    "renomear",
    "comparar",
  ];
  const config = {
    modo: "laboratorio",
    controles: new Set(TODOS),
    ver: ["grafico", "particulas", "condutividade", "equacao", "historico"],
    nivel: "explorar",
  };
  const mobile = matchMedia("(max-width: 900px)");
  let confirmAction = null,
    lastSheetFocus = null,
    deltaTimer = null,
    sequencia = null;

  function configurar({
    modo = "laboratorio",
    controles = TODOS,
    ver = ["grafico", "particulas", "condutividade", "equacao", "historico"],
    nivel = "explorar",
  } = {}) {
    config.modo = modo;
    config.controles = new Set(controles);
    config.ver = ver;
    config.nivel = nivel;
    $("painel-laboratorio").hidden = modo !== "laboratorio";
    $("painel-missao").hidden = modo !== "missao";
    $("controls-title").textContent =
      modo === "missao" ? "Missão" : "Prateleira";
  }

  /* ---------- Confirmação e painel inferior (celular) ---------- */
  SIAB.confirmar = (
    titulo,
    mensagem,
    acao,
    rotulo = "Confirmar",
    intencao = "default",
    opcoes = {},
  ) => {
    $("confirm-title").textContent = titulo;
    $("confirm-text").textContent = mensagem;
    $("confirm-yes").textContent = rotulo;
    $("confirm-yes").className = intencao === "danger" ? "danger-btn" : "primary-btn";
    $("confirm-dialog").dataset.intent = intencao;
    $("confirm-cancel").textContent = opcoes.cancelar || "Cancelar";
    $("confirm-extra").hidden = !opcoes.extra;
    $("confirm-extra").textContent = opcoes.extra?.rotulo || "";
    $("confirm-extra").onclick = () => {$("confirm-dialog").close();opcoes.extra?.acao();};
    confirmAction = acao;
    $("confirm-dialog").showModal();
    $("confirm-cancel").focus();
  };

  // A mesma apresentação gerencia docas e bottom sheets; os conteúdos e
  // as ações da bancada continuam nos componentes originais.
  function closeSheet(restore = true) {
    SIAB.workspace?.close("left", restore);
  }
  function openSheet() {
    SIAB.workspace?.open("left");
  }
  function responsive() {
    SIAB.workspace?.refresh();
  }

  /* ---------- Gotas ---------- */
  function limiteDaGota(fracao = 1) {
    return SIAB.targets(SIAB.current()).find(
      (x) =>
        SIAB.chem.solve(x).volume + x.dropVolume * fracao >
        SIAB.capacidade(x) + 1e-9,
    );
  }

  function leitura() {
    const t = SIAB.current(),
      r = SIAB.chem.solve(t);
    return { pH: r.pH, cor: SIAB.chem.indicatorColor(t, r.pH).name, r };
  }

  // Uma sequência de gotas (um toque, um "segurar" ou +5) vira uma única ação de desfazer.
  function iniciarSequencia() {
    if (sequencia) return;
    sequencia = { ...leitura(), n: 0, viragem: null };
    SIAB.registrar("gotas");
    SIAB.vidro.pingando($("large-tube"), true);
  }
  function gotaDaSequencia(fracao = 1) {
    if (!sequencia) iniciarSequencia();
    const limite = limiteDaGota(fracao);
    if (limite) {
      sequencia.limite = true;
      SIAB.notice(
        `${limite.name} não comporta mais esta dose. Capacidade: ${SIAB.format(SIAB.capacidade(limite), 0)} mL.${SIAB.current().group ? " Nenhum tubo do grupo recebeu a dose." : ""}`,
      );
      return false;
    }
    SIAB.targets(SIAB.current()).forEach((x) =>
      x.additions.push(x.dropVolume * fracao),
    );
    sequencia.n++;
    const agora = leitura();
    const virou =
      SIAB.current().indicator !== "none" &&
      !sequencia.viragem &&
      agora.cor !== sequencia.cor;
    const chegada = SIAB.vidro.gota(
      $("large-tube"),
      SIAB.current(),
      SIAB.state.vidraria,
      { viragem: virou },
    );
    if (virou) {
      sequencia.viragem = `${sequencia.cor} → ${agora.cor}`;
      // Viragem: a cor mudou e ficou (ponto final observado). Sem piscar o
      // contorno: o sinal é a própria cor, que agora não some ao misturar.
      setTimeout(() => SIAB.som.vibrar(), chegada);
    }
    // Numa rajada (+5 gotas, +1 mL, +5 mL) a tela e o som ficam para o fim.
    if (!emLote) {
      SIAB.som.tocar(agora.pH);
      SIAB.loja.avisar();
    }
    return true;
  }
  function fimSequencia() {
    if (!sequencia) return;
    const feita = sequencia;
    sequencia = null;
    SIAB.vidro.pingando($("large-tube"), false);
    if (feita.n === 0) {
      SIAB.state.history.pop();
      SIAB.loja.avisar();
      return;
    }
    const s = SIAB.state,
      t = SIAB.current(),
      agora = leitura();
    const cor = SIAB.chem.liquid(t, s.indicatorOnly, agora.r);
    SIAB.targets(t).forEach((x) =>
      SIAB.instrumentos.evento(
        x,
        `${feita.n} ${feita.n === 1 ? "gota adicionada" : "gotas adicionadas"}`,
      ),
    );
    mostrarDelta(feita.pH, agora.pH, feita.n);
    // Na lupa, as partículas das gotas entram e reagem.
    if (s.verTab === "particulas")
      requestAnimationFrame(() => SIAB.lupa.reagir($("ver-conteudo"), t));
    const texto = `${feita.n} ${feita.n === 1 ? "gota" : "gotas"}${t.group ? " em cada tubo vinculado" : ""}. Total ${agora.r.drops}. Cor ${cor.name}. ${SIAB.instrumentos.leitura(t).texto}.${feita.viragem ? ` Viragem: ${feita.viragem}. A cor ficou: ponto final com ${SIAB.format(agora.r.added)} mL.` : ""}`;
    SIAB.announce(texto);
    SIAB.loja.avisar();
    // Um aviso por sequência concluída, com o volume que realmente entrou
    // (inclusive meia gota ou lote interrompido pela capacidade).
    if (mobile.matches) {
      const volume = SIAB.format(agora.r.added - feita.r.added, 3).replace(/0$/, "");
      const material = SIAB.solutions[t.titrant];
      SIAB.notice(
        `Adicionado: ${volume} mL de ${material.formula || material.name}${t.group ? " no tubo em foco" : ""}.${feita.limite ? " Próxima dose não cabe." : ""}`,
        { contexto: "bancada" },
      );
    }
  }
  let emLote = false;
  function gotejar(n) {
    iniciarSequencia();
    let feitas = 0;
    emLote = n > 1;
    try {
      for (let k = 0; k < n; k++) {
        if (!gotaDaSequencia()) break;
        feitas++;
      }
    } finally {
      emLote = false;
    }
    if (feitas > 0) SIAB.som.tocar(leitura().pH);
    fimSequencia();
    return feitas;
  }

  // Meia gota (bureta): perto do ponto final, abre-se a torneira só até a gota
  // ficar pendurada na ponta; ela é encostada na parede do erlenmeyer e lavada
  // para dentro com a pisseta. Metade do volume de uma gota.
  function meiaGota() {
    iniciarSequencia();
    const ok = gotaDaSequencia(0.5);
    if (ok) SIAB.som.tocar(leitura().pH);
    fimSequencia();
    if (ok)
      setTimeout(
        () =>
          SIAB.announce(
            `Meia gota (${SIAB.format(SIAB.current().dropVolume / 2, 3)} mL): pendurada na ponta, encostada na parede e lavada para dentro.`,
          ),
        50,
      );
  }

  // Agitar: termina a mistura (as cores locais das gotas somem na cor do todo).
  function agitar() {
    const t = SIAB.current();
    if (!t) return;
    SIAB.instrumentos.evento(t, "Agitação realizada");
    SIAB.atividades?.salvarSessao();
    const ms = SIAB.vidro.agitar($("large-tube"));
    const c = SIAB.chem.liquid(t, SIAB.state.indicatorOnly);
    setTimeout(
      () =>
        SIAB.announce(
          `Agitado: a cor ficou ${c.name} por igual no recipiente.`,
        ),
      ms,
    );
  }

  function mostrarDelta(antes, depois, n) {
    const chip = $("ph-delta");
    chip.textContent = `+${n} gotas · observe ou meça novamente`;
    chip.hidden = false;
    clearTimeout(deltaTimer);
    deltaTimer = setTimeout(() => {
      chip.hidden = true;
    }, 2800);
  }

  const eReagente = (id) => !SIAB.isEveryday(id) && id !== "water";
  function colocar(id) {
    if (
      !SIAB.ActivityContext.guard(
        SIAB.state.destination === "titrant"
          ? "bench.changeTitrant"
          : "bench.changeInitialSolution",
      )
    )
      return false;
    const s = SIAB.state,
      x = SIAB.solutions[id];
    if (!x) return;
    const alvo = s.destination === "titrant" ? "titrant" : "tube";
    // Bancada vazia: o frasco escolhido cria o primeiro tubo (com água e sem indicador).
    const primeiro = !SIAB.current();
    SIAB.alterar(
      alvo === "tube"
        ? `colocar ${x.name} no tubo`
        : `colocar ${x.name} no conta-gotas`,
      (estado) => {
        if (primeiro) {
          estado.activeId = SIAB.newTube({
            solution: "water",
            indicator: "none",
          }).id;
          estado.view = "focus";
        }
        SIAB.preparoTargets(
          SIAB.current(),
          alvo === "tube" ? "substancia" : "contaGotas",
        ).forEach((tubo) => {
          if (alvo === "tube") {
            // Um frasco novo substitui o conteúdo (também o de uma mistura).
            delete tubo.componentes;
            delete tubo.indicadores;
            tubo.solution = id;
            tubo.dilution = 1;
            if (eReagente(id) && !(tubo.concentration > 0))
              tubo.concentration = 0.01;
          } else {
            tubo.titrant = id;
            tubo.titrantDilution = 1;
            if (eReagente(id) && !(tubo.titrantConcentration > 0))
              tubo.titrantConcentration = 0.01;
          }
          tubo.additions = [];
        });
      },
    );
    SIAB.syncForm();
    const onde = alvo === "tube" ? "no tubo" : "no conta-gotas";
    const juntos = SIAB.preparoTargets(
      SIAB.current(),
      alvo === "tube" ? "substancia" : "contaGotas",
    ).length;
    SIAB.notice(
      primeiro
        ? `${SIAB.current().name} criado com ${x.name} ${onde}. Agora escolha um indicador.`
        : juntos > 1
          ? `${x.name} ${onde} dos ${juntos} tubos do ${SIAB.nomeGrupo(SIAB.current())}. As gotas recomeçaram; use Desfazer para voltar.`
          : `${x.name} ${onde}. As gotas recomeçaram; use Desfazer para voltar.`,
    );
    SIAB.announce(`${x.name} ${onde}.`);
    // O menu da prateleira se fecha depois da escolha (o foco volta ao cabeçalho
    // dele). No celular, o painel também fecha: o resultado aparece na hora.
    const noCelular =
      mobile.matches && $("controls").classList.contains("open");
    SIAB.prateleira.fechar(!noCelular);
    if (noCelular) closeSheet();
  }

  function erroForm(form, campo, mensagem) {
    const box = $(form + "-error");
    box.textContent = mensagem;
    box.hidden = false;
    if (campo) {
      $(campo).setAttribute("aria-invalid", "true");
      $(campo).setAttribute("aria-describedby", box.id);
      $(campo).focus();
    }
  }
  function limparErros(form) {
    $(form + "-error").hidden = true;
    $(form + "-form")
      .querySelectorAll("[aria-invalid]")
      .forEach((el) => {
        el.removeAttribute("aria-invalid");
        el.removeAttribute("aria-describedby");
      });
  }

  function aplicarMedidas(evento) {
    if (
      !SIAB.ActivityContext.guard([
        "bench.changePreparation",
        "bench.changeConcentration",
        "bench.changeInitialVolume",
        "vessels.changeVolume",
      ])
    ) {
      evento.preventDefault();
      return false;
    }
    evento.preventDefault();
    limparErros("prepare");
    const t = SIAB.current();
    const medidas = {
      concentration: Number($("concentration").value),
      initialVolume: Number($("initial-volume").value),
      titrantConcentration: Number($("titrant-concentration").value),
      dropVolume: Number($("drop-volume").value),
      dilution: Number($("dilution-select").value),
      titrantDilution: Number($("titrant-dilution-select").value),
    };
    const maximo = Math.round(SIAB.capacidade(t) * 0.8 * 100) / 100;
    if (
      !Number.isFinite(medidas.initialVolume) ||
      medidas.initialVolume < 0.1 ||
      medidas.initialVolume > maximo
    ) {
      erroForm(
        "prepare",
        "initial-volume",
        `O volume inicial deve ficar entre 0,1 e ${SIAB.format(maximo, maximo % 1 ? 2 : 0)} mL (80 % da capacidade).`,
      );
      return;
    }
    if (![0.01, 0.02, 0.05, 0.1].includes(medidas.dropVolume)) {
      erroForm(
        "prepare",
        "drop-volume-trigger",
        "Escolha um dos volumes de gota disponíveis.",
      );
      return;
    }
    const checar = [
      [t.solution, medidas.concentration, "concentration"],
      [t.titrant, medidas.titrantConcentration, "titrant-concentration"],
    ];
    for (const [id, c, campo] of checar) {
      if (eReagente(id) && (!Number.isFinite(c) || c < 0.0001 || c > 0.1)) {
        erroForm(
          "prepare",
          SIAB.state.level === "calcular" ? campo : null,
          "A concentração deve ficar entre 0,0001 e 0,1 mol/L.",
        );
        return;
      }
    }
    if (!eReagente(t.solution))
      medidas.concentration = t.solution === "water" ? 0 : t.concentration;
    if (!eReagente(t.titrant))
      medidas.titrantConcentration =
        t.titrant === "water" ? 0 : t.titrantConcentration;
    if (!SIAB.isEveryday(t.solution)) medidas.dilution = 1;
    if (!SIAB.isEveryday(t.titrant)) medidas.titrantDilution = 1;
    // Cada parte do preparo vai para os tubos que a compartilham; o volume da
    // gota é sempre comum ao grupo.
    const doTubo = {
      concentration: medidas.concentration,
      initialVolume: medidas.initialVolume,
      dilution: medidas.dilution,
    };
    const doConta = {
      titrantConcentration: medidas.titrantConcentration,
      titrantDilution: medidas.titrantDilution,
    };
    SIAB.alterar("aplicar medidas", () => {
      SIAB.preparoTargets(t, "substancia").forEach((x) =>
        Object.assign(x, doTubo, { additions: [] }),
      );
      SIAB.preparoTargets(t, "contaGotas").forEach((x) =>
        Object.assign(x, doConta, { additions: [] }),
      );
      SIAB.targets(t).forEach((x) => {
        x.dropVolume = medidas.dropVolume;
      });
    });
    closeSheet();
    const comum = SIAB.textoCompartilhado(t);
    SIAB.notice(
      t.groupMode === "drops"
        ? `Preparo atualizado${comum ? ` (${comum}) em todo o ${SIAB.nomeGrupo(t)}` : " neste tubo"}. O volume da gota vale para todo o grupo. Use Desfazer para voltar.`
        : SIAB.targets(t).length > 1
          ? "Medidas aplicadas aos tubos vinculados."
          : "Medidas aplicadas. Use Desfazer para voltar.",
    );
  }

  /* ---------- Vidraria e capacidade ---------- */
  // Troca o desenho de todos os recipientes. Nomes padrão acompanham
  // ("Tubo 2" vira "Béquer 2"); nomes dados pelo estudante ficam como estão.
  // Se a capacidade muda, o volume inicial acompanha na mesma proporção (o
  // recipiente continua cheio até a mesma altura) e as gotas recomeçam.
  // Tudo numa só ação de "Desfazer" (que também devolve a vidraria).
  function mudarRecipiente(descricao, mudar) {
    if (
      !SIAB.ActivityContext.guard([
        "bench.changeGlassware",
        "vessels.changeGlassware",
      ])
    )
      return false;
    if (!SIAB.ActivityContext.allows("bench.changeGlassware")) {
      const t = SIAB.current(),
        draft = {
          ...SIAB.state,
          vidraria: t.vidraria || SIAB.state.vidraria,
          capacidades: { ...SIAB.state.capacidades },
        };
      mudar(draft);
      const capacity = SIAB.capacidadeDaBancada(draft);
      if (SIAB.chem.solve(t).volume > capacity) {
        SIAB.notice("O conteúdo não cabe nessa vidraria.");
        return false;
      }
      SIAB.alterar(descricao, () => {
        t.vidraria = draft.vidraria;
        t.capacidade = capacity;
      });
      return true;
    }
    const s = SIAB.state;
    const antes = SIAB.capacidadeDaBancada(s);
    const aviso = [];
    SIAB.alterar(descricao, (estado) => {
      mudar(estado);
      const depois = SIAB.capacidadeDaBancada(estado);
      const curtos = Object.values(SIAB.VIDRARIAS)
        .map((x) => x.curto)
        .join("|");
      const padrao = new RegExp(`^(${curtos}) (\\d+)$`);
      estado.tubes.forEach((t) => {
        if (t.vidraria) return; // o béquer da mistura geral tem vidraria própria
        const m = t.name.match(padrao);
        if (m) t.name = `${SIAB.VIDRARIAS[estado.vidraria].curto} ${m[2]}`;
        if (depois !== antes) {
          const novo =
            Math.round(((t.initialVolume * depois) / antes) * 100) / 100;
          if (!aviso.length)
            aviso.push(
              `${SIAB.volumeTexto(t.initialVolume, antes)} → ${SIAB.volumeTexto(novo, depois)} mL`,
            );
          t.initialVolume = Math.min(depois * 0.8, Math.max(0.1, novo));
          t.additions = [];
        }
      });
    });
    SIAB.render(true);
    const v = SIAB.VIDRARIAS[s.vidraria];
    const tamanho =
      s.vidraria === "tubo" ? "5 mL" : `${SIAB.capacidadeDaBancada(s)} mL`;
    SIAB.announce(`${v.nome} de ${tamanho}.`);
    if (aviso.length)
      SIAB.notice(
        `${v.nome} de ${tamanho}: volume inicial ${aviso[0]}. As gotas recomeçaram; use Desfazer para voltar.`,
      );
  }
  function trocarVidraria(valor) {
    const local =
      !SIAB.ActivityContext.allows("bench.changeGlassware") &&
      SIAB.ActivityContext.allows("vessels.changeGlassware");
    const atual = local
      ? SIAB.current()?.vidraria || SIAB.state.vidraria
      : SIAB.state.vidraria;
    if (!SIAB.VIDRARIAS[valor] || atual === valor) return;
    mudarRecipiente("trocar vidraria", (estado) => {
      estado.vidraria = valor;
    });
  }
  function trocarCapacidade(ml) {
    const s = SIAB.state;
    const local =
      !SIAB.ActivityContext.allows("bench.changeGlassware") &&
      SIAB.ActivityContext.allows("vessels.changeGlassware");
    const vidraria = local
      ? SIAB.current()?.vidraria || s.vidraria
      : s.vidraria;
    if (
      vidraria === "tubo" ||
      !SIAB.VIDRARIAS[vidraria].capacidades.includes(ml) ||
      (local ? SIAB.capacidade(SIAB.current()) : s.capacidades[vidraria]) === ml
    )
      return;
    mudarRecipiente("trocar capacidade", (estado) => {
      estado.capacidades = { ...estado.capacidades, [vidraria]: ml };
    });
  }

  /* ---------- Tubos ---------- */
  function selecionarTubo(id) {
    const s = SIAB.state;
    if (!s.tubes.some((t) => t.id === id)) return;
    limparErros("prepare");
    closeSheet(false);
    s.activeId = id;
    s.view = "focus";
    SIAB.render(true);
    SIAB.loja.avisar();
    SIAB.announce(`${SIAB.current().name} selecionado.`);
  }

  function adicionarTubo() {
    if (!SIAB.ActivityContext.guard("vessels.add")) return false;
    const s = SIAB.state;
    if (s.tubes.length >= SIAB.MAX_TUBES) return;
    let novo;
    // O novo tubo usa o mesmo conta-gotas do tubo atual (ou o padrão, se a bancada estiver vazia).
    const atual = SIAB.current();
    SIAB.alterar("novo tubo", () => {
      novo = SIAB.newTube({
        solution: "water",
        indicator: "none",
        ...(atual && {
          titrant: atual.titrant,
          titrantConcentration: atual.titrantConcentration,
          titrantDilution: atual.titrantDilution,
        }),
      });
    });
    selecionarTubo(novo.id);
    SIAB.notice(
      `${novo.name} adicionado com água. Escolha um frasco na prateleira.`,
    );
    if (mobile.matches) openSheet();
  }

  function removerTubo() {
    if (!SIAB.ActivityContext.guard("vessels.remove")) return false;
    const s = SIAB.state;
    const t = SIAB.current();
    if (!t) return;
    SIAB.confirmar(
      "Remover tubo?",
      `“${t.name}” e suas gotas serão removidos. Você pode desfazer depois.`,
      () => {
        closeSheet(false);
        const indice = s.tubes.indexOf(t);
        SIAB.alterar("remover tubo", (estado) => {
          estado.tubes = estado.tubes.filter((x) => x.id !== t.id);
          SIAB.limparGrupos(estado);
          estado.activeId = estado.tubes.length
            ? estado.tubes[Math.min(indice, estado.tubes.length - 1)].id
            : null;
        });
        SIAB.render(true);
        // Sem tubos, a bancada volta ao início (vazia); o foco vai para o aviso.
        if (!s.tubes.length) $("vazia-titulo").focus();
        SIAB.notice(
          s.tubes.length
            ? "Tubo removido."
            : "Tubo removido. A bancada está vazia; use Desfazer para voltar.",
        );
      },
      "Remover tubo",
      "danger",
    );
  }

  function compararIndicadores() {
    if (SIAB.ActivityContext.restricted() || !SIAB.ActivityContext.guard("measurements.indicator")) return false;
    return SIAB.montarMontagem("tres-indicadores");
  }

  // Vínculo manual: as gotas sempre; opcionalmente a substância do tubo e o
  // conta-gotas. O tubo de referência (em foco, ou o primeiro marcado) dá o
  // volume da gota e, quando escolhidos, a substância e o conta-gotas. Um tubo
  // que muda de substância ou de conta-gotas recomeça as gotas: as antigas
  // foram feitas com outro reagente e não valeriam para o novo.
  const CAMPOS = {
    substancia: [
      "solution",
      "concentration",
      "initialVolume",
      "dilution",
      "componentes",
    ],
    contaGotas: ["titrant", "titrantConcentration", "titrantDilution"],
  };
  const mesmos = (a, b, parte) =>
    CAMPOS[parte].every(
      (k) => JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null),
    );
  // O grupo já é exatamente estes tubos, com estas mesmas partes compartilhadas?
  function vinculoIgual(tubos, opcoes) {
    const p = tubos[0];
    return (
      Boolean(p?.group) &&
      p.groupMode === "drops" &&
      tubos.every((t) => t.group === p.group) &&
      SIAB.targets(p).length === tubos.length &&
      Boolean(p.groupShare?.substancia) === Boolean(opcoes.substancia) &&
      Boolean(p.groupShare?.contaGotas) === Boolean(opcoes.contaGotas)
    );
  }
  function referenciaDe(tubos) {
    return tubos.find((t) => t.id === SIAB.state.activeId) || tubos[0];
  }
  // Tubos que mudariam de substância ou de conta-gotas (e recomeçariam as gotas).
  function mudariam(tubos, opcoes) {
    const ref = referenciaDe(tubos);
    return tubos.filter(
      (t) =>
        t !== ref &&
        ["substancia", "contaGotas"].some(
          (parte) => opcoes[parte] && !mesmos(t, ref, parte),
        ),
    );
  }

  function vincularTubos(ids, opcoes = {}) {
    if (!SIAB.ActivityContext.guard("bench.changePreparation")) return false;
    opcoes = { substancia: false, contaGotas: true };
    if (!config.controles.has("tubos")) return false;
    const s = SIAB.state,
      escolhidos = new Set(ids);
    const tubos = s.tubes.filter((t) => escolhidos.has(t.id));
    if (tubos.length < 2 || vinculoIgual(tubos, opcoes)) return false;
    const referencia = referenciaDe(tubos);
    const partilha = {
      substancia: Boolean(opcoes.substancia),
      contaGotas: Boolean(opcoes.contaGotas),
    };
    const recomecam = mudariam(tubos, partilha);
    let grupo;
    SIAB.alterar("vincular tubos", (estado) => {
      grupo = estado.nextGroup++;
      tubos.forEach((t) => {
        t.group = grupo;
        t.groupMode = "drops";
        t.groupShare = { ...partilha };
        t.dropVolume = referencia.dropVolume;
        if (t === referencia || !recomecam.includes(t)) return;
        const entregue = SIAB.chem.added(t);
        if (entregue > 0) {
          t.componentes = [
            ...SIAB.chem.base(t).map((x) => ({ ...x })),
            {
              id: t.titrant,
              concentration: t.titrantConcentration,
              dilution: t.titrantDilution,
              volume: entregue,
            },
          ];
          t.additions = [];
        }
        for (const parte of ["substancia", "contaGotas"]) {
          if (!partilha[parte]) continue;
          for (const k of CAMPOS[parte]) {
            if (referencia[k] === undefined) delete t[k];
            else t[k] = JSON.parse(JSON.stringify(referencia[k]));
          }
        }
        // Conteúdo anterior foi consolidado antes de trocar o titulante.
      });
      SIAB.limparGrupos(estado);
    });
    const comum = SIAB.textoCompartilhado(referencia);
    SIAB.notice(
      `Grupo ${grupo}: ${tubos.length} tubos vinculados. Gotas de ${SIAB.format(referencia.dropVolume)} mL, como em ${referencia.name}.` +
        (comum
          ? ` Compartilham ${comum} de ${referencia.name}${recomecam.length ? `; ${recomecam.map((t) => t.name).join(", ")} ${recomecam.length === 1 ? "recomeçou" : "recomeçaram"} as gotas` : ""}.`
          : " Cada tubo mantém sua amostra e seu conta-gotas.") +
        " Cada um mantém o indicador. Use Desfazer para voltar.",
    );
    return true;
  }

  function desvincularTubos(ids) {
    if (!SIAB.ActivityContext.guard("bench.changePreparation")) return false;
    if (!config.controles.has("tubos")) return false;
    const escolhidos = new Set(ids),
      tubos = SIAB.state.tubes.filter((t) => escolhidos.has(t.id) && t.group);
    if (!tubos.length) return false;
    SIAB.alterar("desvincular tubos", (estado) => {
      tubos.forEach((t) => {
        t.group = null;
        delete t.groupMode;
        delete t.groupShare;
      });
      SIAB.limparGrupos(estado);
    });
    SIAB.notice(
      `${tubos.length} ${tubos.length === 1 ? "tubo desvinculado" : "tubos desvinculados"}. Os preparos e o histórico foram mantidos. Use Desfazer para voltar.`,
    );
    return true;
  }

  function desvincular() {
    const t = SIAB.current();
    if (t) desvincularTubos([t.id]);
  }

  function recomecar() {
    SIAB.alterar("recomeçar gotas", () => {
      const t = SIAB.current();
      (t.groupMode === "drops" ? [t] : SIAB.targets(t)).forEach((x) => {
        x.additions = [];
      });
    });
    closeSheet();
    SIAB.notice("Gotas removidas. Use Desfazer para voltar.");
  }

  function desfazer() {
    const descricao = SIAB.desfazer();
    if (!descricao) return;
    SIAB.render(true);
    SIAB.loja.avisar();
    SIAB.announce(`Desfeito: ${descricao}.`);
    // Se o botão usado sumiu (a bancada ficou vazia ou deixou de estar), o foco vai para o título visível.
    if (
      document.activeElement?.closest("[hidden]") ||
      document.activeElement === document.body
    ) {
      $(SIAB.current() ? "tube-name" : "vazia-titulo").focus();
    }
  }

  /* ---------- Prever, observar, explicar (M1) ---------- */
  let previsao = null;
  function abrirPrevisao() {
    const t = SIAB.current();
    if (!t) return;
    previsao = null;
    $("poe-form").reset();
    $("poe-form").hidden = false;
    $("poe-resultado").hidden = true;
    $("poe-contexto").textContent = SIAB.resumoConteudo(t);
    $("poe-title").textContent = "Prever e gotejar";
    $("poe-dialog").showModal();
  }
  function conferirPrevisao(evento) {
    evento.preventDefault();
    const form = new FormData(evento.target),
      t = SIAB.current();
    const observar = () => {
      const r = SIAB.chem.solve(t);
      return {
        volume: r.volume,
        cor: r.color.name,
        leitura: SIAB.instrumentos.leitura(t),
      };
    };
    const antes = observar(),
      n = Math.max(1, Math.min(500, Number(form.get("gotas")) || 1)),
      feitas = gotejar(n);
    previsao = {
      tipo: "exploracao",
      titulo: "Prever e gotejar · " + t.name,
      linhas: [
        ["Previsão", form.get("aberta")?.trim() || form.get("direcao")],
        [
          "Antes",
          `${antes.cor}; ${SIAB.format(antes.volume)} mL; ${antes.leitura.texto}`,
        ],
        ["Gotas", String(feitas)],
      ],
    };
    const depois = observar();
    previsao.linhas.push([
      "Depois",
      `${depois.cor}; ${SIAB.format(depois.volume)} mL; ${depois.leitura.texto}`,
    ]);
    $("poe-comparacao").innerHTML =
      previsao.linhas
        .map(
          ([k, v]) =>
            `<p><strong>${SIAB.escape(k)}:</strong> ${SIAB.escape(v)}</p>`,
        )
        .join("") +
      "<p>Se a leitura ficou anterior, meça novamente no VER antes de concluir. Uma previsão aberta não é classificada automaticamente como certa ou errada.</p>";
    $("poe-form").hidden = true;
    $("poe-resultado").hidden = false;
    $("poe-explicacao").value = "";
    $("poe-explicacao").required = Boolean(
      SIAB.atividades?.ativa || SIAB.rota.nome === "missao",
    );
    $("poe-explicacao").focus();
  }
  function salvarExplicacao(evento) {
    evento.preventDefault();
    if (previsao) {
      previsao.linhas.push([
        "Explicação",
        $("poe-explicacao").value.trim() || "Não informada",
      ]);
      if ($("poe-registrar").checked) {
        SIAB.progresso.anotar(previsao);
        SIAB.notice("Investigação registrada no Caderno.");
      }
    }
    $("poe-dialog").close();
  }

  /* ---------- Eventos ---------- */
  function ligar() {
    SIAB.contaGotas.ligar($("drop-btn"), {
      inicio: iniciarSequencia,
      gotejar: gotaDaSequencia,
      fim: fimSequencia,
    });
    $("drop5-btn").addEventListener("click", () => gotejar(5));
    $("meia-gota-btn").addEventListener("click", meiaGota);
    // Os atalhos em mL mudam com a capacidade (data-ml, escrito por render.js).
    $("drop1ml-btn").addEventListener("click", (evento) =>
      gotejar(
        Math.round(
          Number(evento.currentTarget.dataset.ml || 1) /
            SIAB.current().dropVolume,
        ),
      ),
    );
    $("drop5ml-btn").addEventListener("click", (evento) =>
      gotejar(
        Math.round(
          Number(evento.currentTarget.dataset.ml || 5) /
            SIAB.current().dropVolume,
        ),
      ),
    );
    $("poe-btn").addEventListener("click", abrirPrevisao);
    $("poe-form").addEventListener("submit", conferirPrevisao);
    $("poe-resultado").addEventListener("submit", salvarExplicacao);
    $("undo-btn").addEventListener("click", desfazer);
    $("agitar-btn").addEventListener("click", agitar);
    // Altura da barra do conta-gotas (fixa no celular): a página reserva esse espaço.
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        document.documentElement.style.setProperty(
          "--dose-h",
          `${Math.ceil($("dose-area").getBoundingClientRect().height)}px`,
        );
      }).observe($("dose-area"));
      // Setas de transferência de próton: redesenha quando o painel muda de largura.
      let larguraVer = 0;
      new ResizeObserver(([item]) => {
        const w = Math.round(item.contentRect.width);
        if (w === larguraVer) return;
        larguraVer = w;
        if (SIAB.state.verTab === "equacao")
          SIAB.equacao.setas($("ver-conteudo"));
      }).observe($("ver-conteudo"));
    }

    $("focus-tab").addEventListener("click", () => {
      closeSheet(false);
      SIAB.state.view = "focus";
      SIAB.render(true);
    });
    $("overview-tab").addEventListener("click", () => {
      closeSheet(false);
      SIAB.state.view = "overview";
      SIAB.render(true);
    });
    $("ordenar-ph-btn").addEventListener("click", () => {
      SIAB.state.ordemPH = !SIAB.state.ordemPH;
      SIAB.render(true);
      SIAB.announce(
        SIAB.state.ordemPH
          ? "Recipientes em ordem de pH, do mais ácido ao mais básico."
          : "Recipientes na ordem da bancada.",
      );
    });
    document.addEventListener("click", (evento) => {
      const tubo = evento.target.closest("[data-tube]");
      if (tubo) selecionarTubo(Number(tubo.dataset.tube));
      const frasco = evento.target.closest("[data-solution]");
      if (frasco && frasco.closest("#shelf")) colocar(frasco.dataset.solution);
    });
    $("add-tube-btn").addEventListener("click", adicionarTubo);
    // Botões do aviso "Bancada vazia".
    $("vazia-agua").addEventListener("click", adicionarTubo);
    $("vazia-desfazer").addEventListener("click", desfazer);
    $("vazia-prateleira").addEventListener("click", () => {
      if (mobile.matches) openSheet();
      else SIAB.trilho.mostrar("controls", "frascos");
      SIAB.prateleira.abrir("tube", { foco: "busca" });
    });

    $("rename-btn").addEventListener("click", () => {
      if (!SIAB.ActivityContext.guard("vessels.rename")) return;
      $("new-name").value = SIAB.current().name;
      limparErros("rename");
      $("rename-dialog").showModal();
      $("new-name").select();
    });
    $("new-name").addEventListener("input", () => limparErros("rename"));
    $("rename-form").addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (!SIAB.ActivityContext.guard("vessels.rename")) return;
      const nome = $("new-name").value.trim().replace(/\s+/g, " ");
      if (!nome || nome.length > 40) {
        erroForm("rename", "new-name", "Digite um nome com 1 a 40 caracteres.");
        return;
      }
      SIAB.alterar("renomear", () => {
        SIAB.current().name = nome;
      });
      $("rename-dialog").close();
      SIAB.announce(`Nome alterado para ${nome}.`);
    });

    $("ph-toggle").addEventListener("click", () => {
      SIAB.state.showPH = !SIAB.state.showPH;
      SIAB.loja.avisar();
    });
    $("indicator-only").addEventListener("change", (evento) => {
      SIAB.state.indicatorOnly = evento.target.checked;
      SIAB.loja.avisar();
    });
    $("indicator-chips").addEventListener("change", (evento) => {
      if (evento.target.name !== "indicador") return;
      if (!SIAB.ActivityContext.guard("bench.changeIndicator")) {
        SIAB.render(true);
        SIAB.notice("Indicador indisponível nesta atividade.");
        return;
      }
      const valor = evento.target.value;
      // Escolher um indicador substitui a mistura de indicadores, se houver.
      SIAB.alterar("trocar indicador", () => {
        SIAB.current().indicator = valor;
        delete SIAB.current().indicadores;
      });
      SIAB.announce(`Indicador: ${SIAB.indicators[valor].name}.`);
      document
        .querySelector(`#indicator-chips input[value="${valor}"]`)
        ?.focus();
    });
    SIAB.modulos.ligar();
    document
      .querySelectorAll('input[name="vidraria"]')
      .forEach((x) =>
        x.addEventListener("change", () => trocarVidraria(x.value)),
      );
    $("capacidade-opcoes").addEventListener("change", (evento) => {
      if (evento.target.name === "capacidade")
        trocarCapacidade(Number(evento.target.value));
    });
    SIAB.prateleira.ligar();
    $("prepare-form").addEventListener("input", () => limparErros("prepare"));
    $("prepare-form").addEventListener("change", () => limparErros("prepare"));
    $("prepare-form").addEventListener("submit", aplicarMedidas);
    $("compare-btn").addEventListener("click", compararIndicadores);
    $("unlink-btn").addEventListener("click", desvincular);
    $("restart-btn").addEventListener("click", recomecar);
    $("remove-btn").addEventListener("click", removerTubo);

    // Chips do VER (celular e tablet): escolhem a aba e rolam até o painel.
    document.querySelector(".view-tabs").addEventListener("click", (evento) => {
      const chip = evento.target.closest("[data-ir-ver]");
      if (!chip) return;
      if (!SIAB.selecionarVer(chip.dataset.irVer)) return;
      SIAB.loja.avisar();
      $("ver-panel").scrollIntoView({
        block: "start",
        behavior: A11Y.estado.motion ? "auto" : "smooth",
      });
      $(`tab-${chip.dataset.irVer}`)?.focus({ preventScroll: true });
    });

    $("ver-conteudo").addEventListener("click", (evento) => {
      const botao = evento.target.closest("[data-acao]");
      if (!botao) return;
      const t = SIAB.current();
      if (botao.dataset.acao === "lupa-escala") {
        SIAB.state.lupaLog = !SIAB.state.lupaLog;
        SIAB.loja.avisar();
        SIAB.$("ver-conteudo")
          .querySelector('[data-acao="lupa-escala"]')
          ?.focus();
        SIAB.announce(
          SIAB.state.lupaLog
            ? "Lupa em escala logarítmica: os íons raros aparecem."
            : "Lupa em escala linear.",
        );
        return;
      }
      // Ponte entre representações: uma espécie tocada na Equação, na Condução,
      // no diagrama de espécies ou na legenda da lupa fica em destaque na lupa.
      if (botao.dataset.acao === "destacar") {
        const s = SIAB.state,
          f = botao.dataset.especie,
          naLupa = s.verTab === "particulas";
        s.destaque = naLupa && s.destaque === f ? null : f;
        if (SIAB.verDisponivel("particulas")) s.verTab = "particulas";
        SIAB.loja.avisar();
        [
          ...SIAB.$("ver-conteudo").querySelectorAll(
            ".lupa-legenda [data-especie]",
          ),
        ]
          .find((b) => b.dataset.especie === f)
          ?.focus();
        SIAB.announce(
          s.destaque
            ? `Lupa de partículas: ${f} em destaque.`
            : "Lupa de partículas: todas as espécies.",
        );
        return;
      }
      if (botao.dataset.acao === "grafico-modo") {
        SIAB.state.graficoModo = botao.dataset.modo;
        SIAB.loja.avisar();
        SIAB.$("ver-conteudo")
          .querySelector(`[data-modo="${botao.dataset.modo}"]`)
          ?.focus();
        SIAB.announce(
          {
            ph: "Gráfico: pH × volume.",
            derivada: "Gráfico: derivada ΔpH/ΔV; o pico marca a equivalência.",
            especies: "Gráfico: fração de cada espécie × pH.",
          }[botao.dataset.modo],
        );
        return;
      }
      if (botao.dataset.acao === "csv") {
        if (!SIAB.ActivityContext.guard("files.csv")) return;
        const nome =
          SIAB.normalizar(t.name)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "tubo";
        SIAB.baixarArquivo(`siab-${nome}.csv`, SIAB.historyCSV(t));
        SIAB.notice("Tabela baixada em CSV.");
      }
      if (botao.dataset.acao === "registrar") {
        if (!SIAB.ActivityContext.guard("files.notebook")) return;
        const r = SIAB.chem.solve(t);
        SIAB.progresso.anotar({
          tipo: "exploracao",
          titulo: `Leitura · ${t.name}`,
          linhas: [
            [
              "Tubo",
              SIAB.solutionSummary(t.solution, t.concentration, t.dilution),
            ],
            [
              "Conta-gotas",
              SIAB.solutionSummary(
                t.titrant,
                t.titrantConcentration,
                t.titrantDilution,
              ),
            ],
            ["Gotas", `${r.drops} (${SIAB.format(r.added)} mL)`],
            [
              "Indicador",
              `${SIAB.nomeIndicador(t)}: ${SIAB.chem.indicatorColor(t, r.pH).name}`,
            ],
            ["pH", SIAB.instrumentos.leitura(t).texto],
          ],
          // Tabela compacta: gotas iguais seguidas viram uma linha (ver progresso.js).
          tabela: SIAB.historicoTabela(t),
        });
        SIAB.notice("Leitura registrada no caderno.");
      }
    });

    $("prepare-btn").addEventListener("click", openSheet);
    $("close-controls").addEventListener("click", () => closeSheet());
    $("sheet-backdrop").addEventListener("click", () => closeSheet());
    $("confirm-yes").addEventListener("click", () => {
      const acao = confirmAction;
      confirmAction = null;
      $("confirm-dialog").close();
      if (acao) acao();
    });
    $("confirm-dialog").addEventListener("close", () => {
      confirmAction = null;
    });
    mobile.addEventListener("change", responsive);
    SIAB.loja.assinar(() => SIAB.render());
    responsive();
  }

  return {
    config,
    configurar,
    adicionarTubo,
    removerTubo,
    aplicarMedidas,
    ligar,
    gotejar,
    meiaGota,
    agitar,
    colocar,
    selecionarTubo,
    vincularTubos,
    desvincularTubos,
    vinculoIgual,
    mudariam,
    referenciaDe,
    trocarVidraria,
    trocarCapacidade,
    openSheet,
    closeSheet,
    responsive,
    TODOS,
    mobile,
  };
})();
