"use strict";
/* Animação de abertura: toca ao abrir o aplicativo ou recarregar a página.
   Cinco tubos de ensaio, cada um com um indicador, recebem gotas e trocam de
   composto (ácido → neutro → básico). As cores e os valores de pH vêm do
   próprio motor químico (SIAB.chem), os mesmos da bancada.
   Pula com um toque, clique ou tecla. Não aparece com "Reduzir animações",
   com a preferência do sistema de reduzir movimento, nem quando o usuário
   desliga em Menu ☰ → Acessibilidade → Animação de abertura. */
SIAB.abertura = (() => {
  const CHAVE = "siab_abertura";
  // [frasco, rótulo] em cada etapa. Todos a 0,01 mol/L (amostras como preparadas).
  const TUBOS = [
    {
      indicador: "phenol",
      nome: "Fenolftaleína",
      etapas: [
        ["hcl", "HCl"],
        ["water", "H₂O"],
        ["naoh", "NaOH"],
      ],
    },
    {
      indicador: "btb",
      nome: "Bromotimol",
      etapas: [
        ["acetic", "CH₃COOH"],
        ["nacl", "NaCl"],
        ["ammonia", "NH₃"],
      ],
    },
    {
      indicador: "cabbage",
      nome: "Repolho",
      etapas: [
        ["lemon", "Limão"],
        ["water", "H₂O"],
        ["bicarbonate", "NaHCO₃"],
      ],
    },
    {
      indicador: "methyl",
      nome: "Metilorange",
      etapas: [
        ["hcl", "HCl"],
        ["acetic", "CH₃COOH"],
        ["na2co3", "Na₂CO₃"],
      ],
    },
    {
      indicador: "universal",
      nome: "Universal",
      etapas: [
        ["hcl", "HCl"],
        ["nacl", "NaCl"],
        ["naoh", "NaOH"],
      ],
    },
  ];
  // Momento (ms) em que cada etapa começa; depois vem a marca e a saída.
  const TEMPOS = {
    encher: 150,
    etapas: [150, 1000, 1750],
    marca: 2350,
    sair: 3200,
    fim: 3650,
  };
  const timers = [];
  let ativa = false;

  // Texto simples ('on'/'off'): o index.html lê a mesma chave antes de desenhar a página.
  const ligada = () => {
    try {
      return localStorage.getItem(CHAVE) !== "off";
    } catch (erro) {
      return true;
    }
  };

  // Cor e pH que a bancada mostraria para esse frasco com esse indicador.
  function leitura(solucao, indicador) {
    const tubo = {
      ...SIAB.TUBE_DEFAULTS,
      solution: solucao,
      indicator: indicador,
      concentration: 0.01,
      additions: [],
    };
    const r = SIAB.chem.solve(tubo);
    const cor = SIAB.chem.liquid(tubo, false, r);
    return {
      pH: r.pH,
      cor: `rgba(${cor.rgb.map(Math.round).join(",")},${Math.round(Math.max(cor.opacity, 0.22) * 100) / 100})`,
      nome: cor.name,
    };
  }

  const X = (n) => 50 + n * 75;
  function desenhar(caixa) {
    const tubos = TUBOS.map((t, n) => {
      const x = X(n);
      return `<g class="ab-tubo" data-n="${n}">
        <text class="ab-indicador" x="${x}" y="16">${SIAB.escape(t.nome)}</text>
        <clipPath id="ab-clip-${n}"><path d="M${x - 15} 34v112a15 15 0 0 0 30 0V34Z"/></clipPath>
        <g clip-path="url(#ab-clip-${n})">
          <rect class="ab-liquido" x="${x - 16}" y="32" width="32" height="130"/>
          <circle class="ab-bolha" cx="${x - 5}" cy="150" r="2.2"/><circle class="ab-bolha" cx="${x + 6}" cy="156" r="1.6"/>
        </g>
        <path class="ab-vidro" d="M${x - 17} 30v116a17 17 0 0 0 34 0V30M${x - 21} 30h42"/>
        <path class="ab-brilho" d="M${x - 10} 42v96"/>
        <path class="ab-gota" d="M${x} 22c2.4 4 4 6.3 4 8.3a4 4 0 0 1-8 0c0-2 1.6-4.3 4-8.3Z"/>
        <text class="ab-formula" x="${x}" y="190"></text>
        <text class="ab-ph" x="${x}" y="207"></text>
      </g>`;
    }).join("");
    caixa.querySelector(".abertura-tubos").innerHTML =
      `<path class="ab-suporte" d="M14 104h372"/>${tubos}<path class="ab-suporte" d="M14 124h372"/>`;
  }

  function etapa(caixa, k) {
    caixa.querySelectorAll(".ab-tubo").forEach((g) => {
      const t = TUBOS[g.dataset.n];
      const [solucao, rotulo] = t.etapas[k];
      const l = leitura(solucao, t.indicador);
      const liquido = g.querySelector(".ab-liquido");
      const altura = 62 + k * 16;
      g.querySelector(".ab-gota").style.animationDelay =
        `${g.dataset.n * 50}ms`;
      if (k > 0) {
        g.classList.remove("pingando");
        void g.getBoundingClientRect();
        g.classList.add("pingando");
      }
      // A cor muda quando a gota chega ao líquido.
      timers.push(
        setTimeout(
          () => {
            liquido.style.transform = `scaleY(${altura / 130})`;
            liquido.style.fill = l.cor;
            g.dataset.cor = l.nome;
            const formula = g.querySelector(".ab-formula"),
              ph = g.querySelector(".ab-ph");
            formula.classList.add("trocando");
            timers.push(
              setTimeout(() => {
                formula.textContent = rotulo;
                ph.textContent = `pH ${SIAB.format(l.pH, 1)}`;
                formula.classList.remove("trocando");
              }, 140),
            );
          },
          k > 0 ? 260 + g.dataset.n * 50 : 0,
        ),
      );
    });
  }

  function encerrar() {
    if (!ativa) return;
    ativa = false;
    timers.splice(0).forEach(clearTimeout);
    const caixa = document.getElementById("abertura");
    document.removeEventListener("keydown", encerrar, true);
    if (!caixa) return;
    caixa.classList.add("saindo");
    setTimeout(() => caixa.remove(), 350);
    document.documentElement.dataset.abertura = "fim";
  }

  function iniciar() {
    const caixa = document.getElementById("abertura");
    if (!caixa) return;
    // Desligada ou com movimento reduzido: some sem tocar.
    const reduzir =
      window.A11Y?.estado?.motion ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!ligada() || reduzir || getComputedStyle(caixa).display === "none") {
      caixa.remove();
      return;
    }
    ativa = true;
    desenhar(caixa);
    TEMPOS.etapas.forEach((ms, k) =>
      timers.push(setTimeout(() => etapa(caixa, k), ms)),
    );
    timers.push(
      setTimeout(() => caixa.classList.add("com-marca"), TEMPOS.marca),
    );
    timers.push(setTimeout(encerrar, TEMPOS.sair));
    caixa.addEventListener("pointerdown", encerrar);
    document.addEventListener("keydown", encerrar, true);
  }

  function definir(ligar) {
    try {
      localStorage.setItem(CHAVE, ligar ? "on" : "off");
    } catch (erro) {
      /* vale só nesta visita */
    }
  }

  return { iniciar, encerrar, definir, ligada, leitura, TUBOS, TEMPOS };
})();
SIAB.abertura.iniciar();
