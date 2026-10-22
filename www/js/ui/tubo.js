"use strict";
/* Desenho da vidraria em SVG (tubo de ensaio, béquer ou erlenmeyer), com o
   líquido na cor calculada pelo motor.

   Tamanho de verdade: cada recipiente é desenhado com as medidas reais de
   catálogo (diâmetro D e altura H, em mm), em um sistema comum de coordenadas.
   O enquadramento de tela amplia cada recipiente para caber na área disponível;
   as proporções geométricas e a conversão entre volume e altura não mudam.
   - Tubo de ensaio 12 × 75 mm: o tubo "de 5 mL" de catálogo.
   - Béquer forma baixa (Griffin), medidas da norma ISO 3819.
   - Erlenmeyer de gargalo estreito, medidas da norma ISO 1773 (o de 125 mL
     não está na norma: medidas aproximadas de catálogo).
   A altura do líquido vem do volume dentro da forma real (sólido de
   revolução, somado em fatias finas): no tubo e no béquer ela cresce por igual;
   no erlenmeyer, que é um cone, a mesma quantidade sobe mais perto do gargalo.
   Por isso a marca da capacidade fica a cerca de 2/3 da altura do béquer e na
   metade do erlenmeyer: vidraria de verdade tem folga acima da capacidade. */
SIAB.MEDIDAS_VIDRO = {
  tubo: { 5: { D: 12, H: 75 } },
  bequer: {
    10: { D: 26, H: 35 },
    25: { D: 34, H: 50 },
    50: { D: 42, H: 60 },
    100: { D: 50, H: 70 },
    250: { D: 70, H: 95 },
    500: { D: 85, H: 120 },
    1000: { D: 105, H: 145 },
  },
  erlenmeyer: {
    25: { D: 42, H: 75, d: 22 },
    50: { D: 51, H: 80, d: 22 },
    125: { D: 64, H: 120, d: 26 },
    250: { D: 85, H: 145, d: 34 },
  },
};

SIAB.formaVidro = (() => {
  const S = 2.4; // unidades do desenho por mm
  const BASE = 350; // linha da bancada (fundo de fora do recipiente)
  const ALTO = 145; // o recipiente mais alto (erlenmeyer de 250 mL), em mm
  const TOPO = BASE - ALTO * S - 30; // topo da cena: cabe o mais alto e o conta-gotas
  const ROTULOS = 34; // espaço à direita para os números da escala
  const cache = new Map();

  // Medidas da capacidade pedida (ou da maior que existir, se não houver).
  function medidas(tipo, capacidade) {
    const tabela = SIAB.MEDIDAS_VIDRO[tipo] || SIAB.MEDIDAS_VIDRO.tubo;
    if (tabela[capacidade]) return tabela[capacidade];
    const lista = Object.keys(tabela)
      .map(Number)
      .sort((x, y) => x - y);
    return tabela[lista.find((c) => c >= capacidade) || lista.at(-1)];
  }

  function criar(tipo, capacidade) {
    const m = medidas(tipo, capacidade);
    const ro = (m.D / 2) * S,
      alto = m.H * S,
      yt = BASE - alto;
    const parede = (tipo === "tubo" ? 0.8 : 1) * S,
      fundo = (tipo === "tubo" ? 0.8 : 1.5) * S;
    const ri = ro - parede,
      yib = BASE - fundo;
    const bico = tipo === "bequer" ? Math.min(3 * S, ro * 0.2) : 0;
    const largura = Math.max(100, 2 * (ro + bico + ROTULOS)),
      cx = largura / 2;
    const f = (n) => n.toFixed(1);
    let raio,
      contorno,
      interno,
      borda,
      reflexo,
      gargalo = 0;
    if (tipo === "erlenmeyer") {
      const rno = (m.d / 2) * S,
        rni = rno - parede,
        yn = yt + 0.2 * alto,
        rc = Math.min(4 * S, ro * 0.2);
      const hc = yib - yn;
      gargalo = rni;
      raio = (z) => (z <= hc ? ri - ((ri - rni) * z) / hc : rni);
      contorno = `M${f(cx - rno - 3)} ${f(yt)}h3V${f(yn)}L${f(cx - ro)} ${f(BASE - rc)}q-1 ${f(rc)} ${f(rc)} ${f(rc)}H${f(cx + ro - rc)}q${f(rc + 1)} 0 ${f(rc)} ${f(-rc)}L${f(cx + rno)} ${f(yn)}V${f(yt)}h3`;
      interno = `M${f(cx - rni)} ${f(yt + 1)}V${f(yn + 1)}L${f(cx - ri)} ${f(yib - rc * 0.8)}q-1 ${f(rc * 0.8)} ${f(rc * 0.8)} ${f(rc * 0.8)}H${f(cx + ri - rc * 0.8)}q${f(rc * 0.8 + 1)} 0 ${f(rc * 0.8)} ${f(-rc * 0.8)}L${f(cx + rni)} ${f(yn + 1)}V${f(yt + 1)}Z`;
      borda = `M${f(cx - rno - 3)} ${f(yt)}h${f(2 * rno + 6)}`;
      reflexo = `M${f(cx - ri * 0.72)} ${f(yib - 8)}L${f(cx - rni * 0.6)} ${f(yn + 12)}`;
    } else if (tipo === "bequer") {
      const rc = Math.min(3 * S, ro * 0.25);
      raio = () => ri;
      contorno = `M${f(cx - ro - bico)} ${f(yt)}c${f(bico * 0.6)} ${f(bico * 0.4)} ${f(bico)} ${f(bico * 1.2)} ${f(bico)} ${f(bico * 2.4)}V${f(BASE - rc)}a${f(rc)} ${f(rc)} 0 0 0 ${f(rc)} ${f(rc)}H${f(cx + ro - rc)}a${f(rc)} ${f(rc)} 0 0 0 ${f(rc)} ${f(-rc)}V${f(yt)}h3`;
      interno = `M${f(cx - ri)} ${f(yt + 2)}V${f(yib - rc * 0.7)}a${f(rc * 0.7)} ${f(rc * 0.7)} 0 0 0 ${f(rc * 0.7)} ${f(rc * 0.7)}H${f(cx + ri - rc * 0.7)}a${f(rc * 0.7)} ${f(rc * 0.7)} 0 0 0 ${f(rc * 0.7)} ${f(-rc * 0.7)}V${f(yt + 2)}Z`;
      borda = `M${f(cx - ro - bico - 2)} ${f(yt)}h4`;
      reflexo = `M${f(cx - ri + 6)} ${f(yt + alto * 0.2)}V${f(yib - alto * 0.12)}`;
    } else {
      raio = (z) =>
        z < ri ? Math.sqrt(Math.max(0, ri * ri - (ri - z) ** 2)) : ri;
      contorno = `M${f(cx - ro)} ${f(yt)}V${f(BASE - ro)}A${f(ro)} ${f(ro)} 0 0 0 ${f(cx + ro)} ${f(BASE - ro)}V${f(yt)}`;
      interno = `M${f(cx - ri)} ${f(yt + 1)}V${f(yib - ri)}A${f(ri)} ${f(ri)} 0 0 0 ${f(cx + ri)} ${f(yib - ri)}V${f(yt + 1)}Z`;
      borda = `M${f(cx - ro - 3)} ${f(yt)}h${f(2 * ro + 6)}`;
      reflexo = `M${f(cx - ri * 0.55)} ${f(yt + 10)}V${f(yib - ri)}`;
    }
    // Volume acumulado do fundo de dentro até cada altura z (fatias de 0,5 unidade).
    const passo = 0.5,
      acumulado = [0];
    for (let z = 0; z < yib - yt; z += passo)
      acumulado.push(
        acumulado.at(-1) + Math.PI * raio(z + passo / 2) ** 2 * passo,
      );
    const mL = 1000 * S ** 3; // 1 mL = 1000 mm³, em unidades do desenho
    // Altura (y) da superfície para uma fração da capacidade.
    const altura = (fracao) => {
      const alvo = Math.max(0, fracao) * capacidade * mL;
      let i = 1;
      while (i < acumulado.length - 1 && acumulado[i] < alvo) i++;
      const a = acumulado[i - 1],
        b = acumulado[i];
      return (
        yib - (i - 1 + (b > a ? Math.min(1, (alvo - a) / (b - a)) : 0)) * passo
      );
    };
    return {
      tipo,
      capacidade,
      S,
      BASE,
      TOPO,
      cx,
      largura,
      yt,
      ro,
      ri,
      bico,
      gargalo,
      contorno,
      interno,
      borda,
      reflexo,
      liquido: [cx - ri - 2, 2 * ri + 4],
      sombra: ro + 4,
      altura,
      meia: (y) => (y > yib ? 0 : raio(yib - y)),
      // Ponta do conta-gotas: um pouco acima da boca (no mais alto, entra no gargalo).
      ponta: Math.max(yt - 12, TOPO + 58),
    };
  }

  return (tipo, capacidade) => {
    const chave = `${tipo}|${capacidade}`;
    if (!cache.has(chave)) cache.set(chave, criar(tipo, capacidade));
    return cache.get(chave);
  };
})();

// Marcas da escala: cerca de 5 marcas, com números redondos (1, 2, 5, 10, 25 ou 50 mL).
SIAB.marcasDeVolume = (capacidade) => {
  const passo =
    [1, 2, 5, 10, 25, 50, 100].find((p) => capacidade / p <= 5) || 100;
  return Array.from(
    { length: Math.floor(capacidade / passo) },
    (_, i) => (i + 1) * passo,
  );
};

// Estado visual de um recipiente: altura e cor do líquido, marcas e cor das gotas.
function estadoDoVidro(tube, vidraria) {
  const tipo = SIAB.MEDIDAS_VIDRO[tube.vidraria || vidraria]
    ? tube.vidraria || vidraria
    : "tubo";
  const capacidade = SIAB.capacidade(tube, tipo);
  const forma = SIAB.formaVidro(tipo, capacidade);
  const r = SIAB.chem.solve(tube);
  const c = SIAB.chem.liquid(tube, SIAB.state.indicatorOnly, r);
  const y = forma.altura(Math.min(1, r.volume / capacidade));
  // A gota tem a cor do que está no conta-gotas (quase sempre incolor: vidro-azulado;
  // suspensão, como o leite de magnésia: branca).
  const doConta = SIAB.solutions[tube.titrant];
  const natural = doConta?.natural;
  const corGota =
    natural && natural.opacity > 0.05
      ? `rgb(${natural.rgb.join(",")})`
      : doConta?.kind === "suspension"
        ? "rgba(242, 242, 238, .96)"
        : "rgba(214, 232, 255, .92)";
  // Turvação: sólido sem dissolver (Mg(OH)₂, Al(OH)₃). Quanto mais gramas por
  // litro, mais leitoso; o sólido assenta no fundo se ficar parado.
  const gL = SIAB.chem.solidos(tube, r).reduce((sum, x) => sum + x.gL, 0);
  const turvo = gL > 0 ? Math.min(0.72, 1 - Math.exp(-gL / 0.8)) : 0;
  const fundo = forma.altura(0);
  const sedimento = turvo
    ? Math.max(6, (fundo - y) * Math.min(0.25, 0.06 + gL / 25))
    : 0;
  // Bolhas de CO₂ (ilustração): CO₂ dissolvido acima da solubilidade.
  const gas = SIAB.chem.co2(tube, r);
  const nome = SIAB.VIDRARIAS?.[tipo]?.nome || "Tubo de ensaio";
  const m = SIAB.MEDIDAS_VIDRO[tipo][capacidade];
  return {
    tipo,
    forma,
    capacidade,
    r,
    c,
    y,
    meia: forma.meia(y),
    rgb: `rgb(${c.rgb.join(",")})`,
    corGota,
    turvo,
    fundo,
    sedimento,
    bolhas: gas.excesso > 0 ? Math.round(5 + 13 * Math.min(1, gas.excesso)) : 0,
    rotulo: `${tube.name} (${nome.toLowerCase()} de ${capacidade} mL${m ? `, ${m.D} × ${m.H} mm` : ""}): solução ${c.name}${turvo ? ", turva" : ""}${gas.excesso > 0 ? ", com bolhas de CO₂" : ""}, ${SIAB.format(r.volume)} mililitros`,
  };
}

// Bolhas de CO₂ subindo do fundo até a superfície (no sistema do líquido:
// superfície em y = 0). Paradas, sem animação, ficam espalhadas pela altura.
function bolhasHTML(v) {
  if (!v.bolhas) return "";
  const coluna = Math.max(6, v.fundo - v.y);
  let semente = 11;
  const sorteio = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: v.bolhas }, () => {
    const x = v.forma.cx + (sorteio() - 0.5) * 1.5 * Math.max(4, v.meia - 3);
    const alto = coluna * (0.1 + 0.85 * sorteio());
    const r = 1.4 + 1.8 * sorteio();
    return `<circle class="bolha" cx="${x.toFixed(1)}" cy="${alto.toFixed(1)}" r="${r.toFixed(1)}" style="--sobe:${(coluna - alto).toFixed(1)}px;--y:${alto.toFixed(1)}px;--dx:${((sorteio() - 0.5) * 4).toFixed(1)}px;animation-duration:${(1.1 + 1.4 * sorteio()).toFixed(2)}s;animation-delay:-${(2.5 * sorteio()).toFixed(2)}s"/>`;
  }).join("");
}

// Menisco: a água molha o vidro e sobe um pouco junto da parede (menisco
// côncavo, cerca de 1 mm num tubo estreito). O volume se lê pela parte de
// baixo dele, que é a superfície desenhada (y = 0 no sistema do líquido).
function meniscoD(cx, meia, S) {
  const h = 1.1 * S,
    k = Math.min(2.2 * S, meia * 0.45);
  return `M${(cx - meia).toFixed(1)} 0V${(-h).toFixed(1)}Q${(cx - meia).toFixed(1)} 0 ${(cx - meia + k).toFixed(1)} 0ZM${(cx + meia).toFixed(1)} 0V${(-h).toFixed(1)}Q${(cx + meia).toFixed(1)} 0 ${(cx + meia - k).toFixed(1)} 0Z`;
}

// Ponta da bureta com torneira, presa sobre o erlenmeyer (o frasco das
// titulações). Mesmo sistema de coordenadas do conta-gotas: ponta em (80, 12).
// A coluna sobe até o topo da cena; a torneira abre enquanto goteja.
function buretaSVG(forma, corGota) {
  // Trecho visível da bureta acompanha o enquadramento, inclusive nos frascos pequenos.
  const topo = -52;
  const marcas = [];
  for (let y = -24, i = 0; y > topo + 4; y -= 6, i++)
    marcas.push(`<path class="bu-marca" d="M75 ${y}h${i % 5 === 0 ? 5 : 3}"/>`);
  return `<g class="bureta" aria-hidden="true">
      <rect class="bu-liquido" x="76.3" y="${topo.toFixed(1)}" width="7.4" height="${(-16 - topo).toFixed(1)}" style="fill:${corGota}"/>
      <path class="bu-vidro" d="M75 ${topo.toFixed(1)}V-16M85 ${topo.toFixed(1)}V-16"/>
      ${marcas.join("")}
      <rect class="bu-torneira" x="73" y="-16" width="14" height="9" rx="2"/>
      <path class="bu-ponta" d="M77.2 -7h5.6l-1.6 19h-2.4Z"/>
      <path class="bu-ponta-liquido" d="M78.3 -7h3.4l-1.1 17h-1.2Z" style="fill:${corGota}"/>
      <g class="bu-chave"><rect x="63" y="-13.5" width="34" height="4" rx="2"/><circle cx="80" cy="-11.5" r="3.2"/></g>
    </g>`;
}

// O foco enquadra o recipiente e o conta-gotas na área disponível. As medidas
// e o nível continuam proporcionais; a ampliação de tela varia com a vidraria.
// Os outros contextos enquadram só o recipiente, para caber no cartão.
SIAB.tubeSVG = (tube, prefix, small = false, vidraria = "tubo") => {
  const v = estadoDoVidro(tube, vidraria);
  const { forma, capacidade, y } = v;
  const foco = prefix === "focus";
  const id = `${prefix}-clip-${tube.id}`;
  const cx = forma.cx;
  const [x0, largura] = forma.liquido;
  const ticks = SIAB.marcasDeVolume(capacidade)
    .map((vol) => {
      const yy = forma.altura(vol / capacidade),
        dentro = cx + forma.meia(yy);
      const tamanho = Math.min(8, forma.meia(yy) * 0.6);
      return `<path class="tube-tick" d="M${(dentro - 1).toFixed(1)} ${yy.toFixed(1)}h-${tamanho.toFixed(1)}" stroke-width="1"/>${small ? "" : `<text class="tube-graduation" x="${(dentro + 3 * forma.S + 6).toFixed(1)}" y="${(yy + 4).toFixed(1)}">${vol}</text>`}`;
    })
    .join("");
  const contaGotas =
    foco && v.tipo === "erlenmeyer"
      ? `<g transform="translate(${(cx - 80).toFixed(1)} ${(forma.ponta - 12).toFixed(1)})">${buretaSVG(forma, v.corGota)}</g>`
      : foco
        ? `<g transform="translate(${(cx - 80).toFixed(1)} ${(forma.ponta - 12).toFixed(1)})"><g class="conta-gotas-vidro" aria-hidden="true">
      <path class="cg-bulbo" d="M70 -22v-11a10 10 0 0 1 20 0v11Z"/>
      <rect class="cg-colar" x="73" y="-23" width="14" height="4" rx="1"/>
      <path class="cg-vidro" d="M75 -19v21l3.4 10h3.2l3.4-10v-21Z"/>
      <path class="cg-liquido" d="M76.4 -8v10l2.6 7.6h2l2.6-7.6v-10Z" style="fill:${v.corGota}"/>
    </g></g>`
        : "";
  // Margem suficiente para bulbo, bureta, gotas e agitação, sem reservar a
  // altura de um erlenmeyer de 250 mL para um tubo de ensaio ou béquer pequeno.
  const topoFoco = Math.min(forma.yt - 8, forma.ponta - 70);
  const caixa = foco
    ? `0 ${topoFoco.toFixed(1)} ${forma.largura.toFixed(1)} ${(forma.BASE + 14 - topoFoco).toFixed(1)}`
    : `0 ${(forma.yt - 8).toFixed(1)} ${forma.largura.toFixed(1)} ${(forma.BASE + 14 - forma.yt + 8).toFixed(1)}`;
  return `<svg class="tube-svg vidro-${v.tipo}${foco ? " vidro-foco" : ""}" viewBox="${caixa}" role="img" aria-label="${SIAB.escape(v.rotulo)}">
    <defs><clipPath id="${id}"><path d="${forma.interno}"/></clipPath>${foco ? `<clipPath id="${id}-abaixo"><rect x="0" y="0" width="${forma.largura.toFixed(1)}" height="400"/></clipPath>` : ""}<pattern id="${id}-grao" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".9"/><circle cx="5" cy="4.5" r=".7"/></pattern></defs>
    ${contaGotas}
    <g class="vidro-corpo" style="transform-origin:${cx.toFixed(1)}px ${forma.BASE}px">
    <path class="tube-outline" d="${forma.contorno}" stroke-width="2"/>
    <g clip-path="url(#${id})">
      <g class="liquido" style="transform:translateY(${y.toFixed(1)}px)">
        <rect class="liquid-body" x="${x0.toFixed(1)}" y="0" width="${largura.toFixed(1)}" height="400" style="fill:${v.rgb};fill-opacity:${v.c.opacity}"/>
        <ellipse class="liquido-superficie" cx="${cx.toFixed(1)}" cy="0" rx="${v.meia.toFixed(1)}" ry="3" style="fill:${v.rgb};fill-opacity:${Math.min(1, v.c.opacity + 0.12)}"/>
        <path class="menisco" d="${meniscoD(cx, v.meia, forma.S)}" style="fill:${v.rgb};fill-opacity:${v.c.opacity}"/>
        <g class="turvacao" style="--turvo:${v.turvo.toFixed(2)}"${v.turvo ? "" : " hidden"}><ellipse cx="${cx.toFixed(1)}" cy="0" rx="${v.meia.toFixed(1)}" ry="3"/><rect x="${x0.toFixed(1)}" y="0" width="${largura.toFixed(1)}" height="400"/><rect class="turvacao-grao" x="${x0.toFixed(1)}" y="0" width="${largura.toFixed(1)}" height="400" fill="url(#${id}-grao)"/></g>
        <g class="bolhas">${foco ? bolhasHTML(v) : ""}</g>
        ${foco ? `<g class="efeitos-dentro" clip-path="url(#${id}-abaixo)"></g><g class="efeitos-superficie"></g>` : ""}
      </g>
      <rect class="sedimento" x="${x0.toFixed(1)}" y="${(v.fundo - v.sedimento).toFixed(1)}" width="${largura.toFixed(1)}" height="${(v.sedimento + 6).toFixed(1)}"${v.turvo ? "" : " hidden"}/>
    </g>
    <path d="${forma.borda}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path class="tube-reflection" d="${forma.reflexo}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${ticks}
    </g>
    <ellipse cx="${cx.toFixed(1)}" cy="${forma.BASE + 5}" rx="${forma.sombra.toFixed(1)}" ry="4" fill="currentColor" opacity=".08"/>
    ${foco ? '<g class="efeitos"></g>' : ""}
  </svg>`;
};

/* Vidraria da bancada (tubo em foco) com movimento.
   O desenho é ATUALIZADO, não recriado, a cada gota: assim o nível sobe e a
   cor muda com transição, e os efeitos de uma gota não somem no meio.
   Cada gota: forma-se na ponta do conta-gotas (a borracha aperta), cai
   acelerando até a superfície e, ao bater, faz ondas, respingos e uma nuvem da
   nova cor que se espalha. Na viragem do indicador, a nuvem é maior. O nível
   e a cor do líquido mudam quando a gota chega. Sem nada disso com
   "Reduzir animações" ou "Leitura simples". */
SIAB.vidro = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const DURACAO_ZONA = 360; // ms por etapa da mistura da gota

  /* Cor da zona da gota enquanto ela se mistura: a gota com 1,5, 3, 6… 96
     gotas de volume do líquido que já estava lá, até o recipiente todo. Cada
     etapa é calculada pelo motor (SIAB.chem.zona). Longe do ponto final, a cor
     local some logo; perto dele, demora; depois dele, fica. É o sinal que se
     usa no laboratório: o ponto final é quando a cor dura (cerca de 30 s,
     agitando). */
  function coresDaZona(tube) {
    const dv = tube.additions.at(-1) || tube.dropVolume;
    const r = SIAB.chem.solve(tube);
    const antes = r.volume - dv;
    const lista = [];
    for (const k of [1.5, 3, 6, 12, 24, 48, 96]) {
      if (k * dv >= antes) break;
      const z = SIAB.chem.zona(tube, k * dv);
      const c = SIAB.chem.liquid(z.tubo, SIAB.state.indicatorOnly, z.r);
      lista.push({
        rgb: `rgb(${c.rgb.join(",")})`,
        opacity: c.opacity,
        k,
        pH: z.r.pH,
      });
    }
    const final = SIAB.chem.liquid(tube, SIAB.state.indicatorOnly, r);
    lista.push({
      rgb: `rgb(${final.rgb.join(",")})`,
      opacity: final.opacity,
      k: 96,
      pH: r.pH,
    });
    return lista;
  }
  let impacto = 0,
    pendente = null,
    proximaGota = 0,
    fimPingando = null;

  const semMovimento = () => {
    const e = window.A11Y?.estado || {};
    return (
      e.motion ||
      e.reading === "on" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  };

  function aplicar(caixa, tube, vidraria) {
    const svg = caixa.querySelector("svg");
    const v = estadoDoVidro(tube, vidraria);
    svg.setAttribute("aria-label", v.rotulo);
    svg.querySelector(".liquido").style.transform =
      `translateY(${v.y.toFixed(1)}px)`;
    const corpo = svg.querySelector(".liquid-body"),
      sup = svg.querySelector(".liquido-superficie");
    corpo.style.fill = v.rgb;
    corpo.style.fillOpacity = v.c.opacity;
    sup.style.fill = v.rgb;
    sup.style.fillOpacity = Math.min(1, v.c.opacity + 0.12);
    sup.setAttribute("rx", v.meia.toFixed(1));
    const menisco = svg.querySelector(".menisco");
    if (menisco) {
      menisco.setAttribute("d", meniscoD(v.forma.cx, v.meia, v.forma.S));
      menisco.style.fill = v.rgb;
      menisco.style.fillOpacity = v.c.opacity;
    }
    svg.querySelectorAll(".bu-liquido, .bu-ponta-liquido").forEach((el) => {
      el.style.fill = v.corGota;
    });
    const cg = svg.querySelector(".cg-liquido");
    if (cg) cg.style.fill = v.corGota;
    const turvacao = svg.querySelector(".turvacao"),
      sedimento = svg.querySelector(".sedimento");
    if (turvacao) {
      turvacao.hidden = !v.turvo;
      turvacao.style.setProperty("--turvo", v.turvo.toFixed(2));
      turvacao.querySelector("ellipse").setAttribute("rx", v.meia.toFixed(1));
      sedimento.hidden = !v.turvo;
      sedimento.setAttribute("y", (v.fundo - v.sedimento).toFixed(1));
      sedimento.setAttribute("height", (v.sedimento + 6).toFixed(1));
      if (!v.turvo) svg.classList.remove("assentado");
    }
    const bolhas = svg.querySelector(".bolhas");
    const chaveBolhas = `${v.bolhas}|${v.y.toFixed(0)}`;
    if (bolhas && bolhas.dataset.chave !== chaveBolhas) {
      bolhas.dataset.chave = chaveBolhas;
      bolhas.innerHTML = bolhasHTML(v);
    }
  }

  // Sólido em suspensão assenta depois de um tempo parado (acelerado: na
  // vida real, minutos). Uma gota ou "Agitar" suspende de novo.
  let assentar = null;
  function suspender(caixa) {
    const svg = caixa.querySelector("svg.vidro-foco");
    clearTimeout(assentar);
    if (!svg) return;
    svg.classList.remove("assentado");
    assentar = setTimeout(() => {
      const atual = caixa.querySelector("svg.vidro-foco");
      if (atual && !atual.querySelector(".turvacao")?.hidden)
        atual.classList.add("assentado");
    }, 12000);
  }

  // Desenha o tubo em foco: recria só quando muda o tubo, a vidraria ou a capacidade.
  function desenhar(caixa, tube, vidraria) {
    const chave = `${tube.id}|${tube.vidraria || vidraria}|${SIAB.capacidade(tube, tube.vidraria || vidraria)}|${SIAB.activeBench}`;
    if (caixa.dataset.chave !== chave || !caixa.querySelector("svg .liquido")) {
      clearTimeout(pendente);
      caixa.innerHTML = SIAB.tubeSVG(tube, "focus", false, vidraria);
      caixa.dataset.chave = chave;
      suspender(caixa);
      return;
    }
    // Uma gota ainda está caindo: o líquido muda quando ela chegar.
    const falta = impacto - performance.now();
    clearTimeout(pendente);
    if (falta > 0)
      pendente = setTimeout(() => {
        const t = SIAB.current();
        if (t) aplicar(caixa, t, SIAB.state.vidraria);
      }, falta);
    else aplicar(caixa, tube, vidraria);
  }

  function criar(pai, tag, atributos) {
    const el = document.createElementNS(NS, tag);
    Object.entries(atributos).forEach(([k, v]) => el.setAttribute(k, v));
    pai.append(el);
    return el;
  }
  const sumir = (el, animacao) => {
    animacao.onfinish = () => el.remove();
  };

  // Conta-gotas visível enquanto uma sequência de gotas acontece.
  function pingando(caixa, ligado) {
    clearTimeout(fimPingando);
    if (ligado) caixa.classList.add("pingando");
    else
      fimPingando = setTimeout(() => caixa.classList.remove("pingando"), 500);
  }

  // Uma gota (o tubo já tem a gota a mais: o motor calcula o destino).
  function gota(caixa, tube, vidraria, { viragem = false } = {}) {
    const svg = caixa.querySelector("svg.vidro-foco");
    if (!svg || semMovimento() || !svg.animate) return 0;
    const agora = performance.now();
    const inicio = Math.max(agora, proximaGota);
    if (inicio - agora > 560) return Math.max(0, impacto - agora); // rajada grande: basta ~8 gotas visíveis
    proximaGota = inicio + 70;
    const espera = inicio - agora;
    const v = estadoDoVidro(tube, vidraria);
    const cx = v.forma.cx,
      ponta = v.forma.ponta;
    const queda = Math.max(12, v.y - ponta - 3);
    const formar = 90,
      cair = Math.round(120 + 14 * Math.sqrt(queda)),
      total = formar + cair;
    // Tamanho de verdade: uma gota de volume V é uma esfera de diâmetro
    // d = ∛(6V/π) (0,05 mL → 4,6 mm; 0,01 mL → 2,7 mm), na escala do desenho.
    // O desenho da gota mede 8,4 unidades de largura.
    const vGota = Math.min(0.1, tube.additions.at(-1) || tube.dropVolume);
    const esc = (Math.cbrt((6 * vGota * 1000) / Math.PI) * v.forma.S) / 8.4;
    impacto = Math.max(impacto, agora + espera + total);
    suspender(caixa);

    // Borracha do conta-gotas aperta.
    svg
      .querySelector(".cg-bulbo")
      ?.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(.78, .9)", offset: 0.45 },
          { transform: "scale(1, 1)" },
        ],
        { duration: 240, delay: espera, easing: "ease-out" },
      );

    // A gota: forma-se na ponta e cai acelerando, esticando um pouco.
    const g = criar(svg.querySelector(".efeitos"), "path", {
      class: "gota-caindo",
      d: "M0 -5.5c2.6 4 4.2 6.4 4.2 8.5a4.2 4.2 0 0 1-8.4 0c0-2.1 1.6-4.5 4.2-8.5Z",
      fill: v.corGota,
    });
    g.style.opacity = 0;
    sumir(
      g,
      g.animate(
        [
          {
            transform: `translate(${cx}px, ${ponta}px) scale(${(0.2 * esc).toFixed(2)})`,
            opacity: 1,
            offset: 0,
          },
          {
            transform: `translate(${cx}px, ${(ponta + 3 * esc).toFixed(1)}px) scale(${esc.toFixed(2)})`,
            opacity: 1,
            offset: formar / total,
            easing: "cubic-bezier(.55, 0, 1, .55)",
          },
          {
            transform: `translate(${cx}px, ${(ponta + 3 * esc + queda).toFixed(1)}px) scale(${(0.85 * esc).toFixed(2)}, ${(1.25 * esc).toFixed(2)})`,
            opacity: 1,
            offset: 1,
          },
        ],
        { duration: total, delay: espera, fill: "forwards" },
      ),
    );

    // Chegada: ondas, respingos, nuvem de cor e a superfície balançando.
    const chegada = espera + total;
    // Ondas e nuvem ficam no sistema do líquido (superfície em y = 0): acompanham o
    // nível; a nuvem só aparece abaixo da superfície.
    const superficie = svg.querySelector(".efeitos-superficie"),
      dentro = svg.querySelector(".efeitos-dentro");
    const w = Math.max(8, v.meia);
    [0, 130].forEach((atraso, i) => {
      const onda = criar(superficie, "ellipse", {
        class: "onda",
        cx: 0,
        cy: 0,
        rx: w * 0.9,
        ry: 3,
        "vector-effect": "non-scaling-stroke",
        stroke: i ? v.rgb : v.corGota,
      });
      onda.style.opacity = 0;
      sumir(
        onda,
        onda.animate(
          [
            {
              transform: `translate(${cx}px, 0) scale(.06, .3)`,
              opacity: 0.95,
            },
            { transform: `translate(${cx}px, 0) scale(1, 1.3)`, opacity: 0 },
          ],
          {
            duration: 520,
            delay: chegada + atraso,
            easing: "cubic-bezier(.2, .7, .3, 1)",
            fill: "forwards",
          },
        ),
      );
    });
    // Nuvem com a cor do pH LOCAL (ver coresDaZona): a zona da gota cresce até
    // virar o recipiente todo; enquanto o pH local está do outro lado da
    // viragem, a cor é outra (a fenolftaleína fica rosa onde o NaOH cai).
    const zona = coresDaZona(tube);
    const ultimo = zona.length - 1;
    const alcance = Math.min(w * 1.8, 60);
    const nuvem = criar(dentro, "circle", {
      class: "nuvem-cor",
      cx: 0,
      cy: 0,
      r: 10,
    });
    nuvem.style.opacity = 0;
    sumir(
      nuvem,
      nuvem.animate(
        zona.map((c, i) => ({
          offset: i / (ultimo || 1),
          fill: c.rgb,
          // A zona cresce como o volume misturado (raio ∝ raiz cúbica).
          transform: `translate(${cx}px, ${(6 + 22 * Math.cbrt(i / (ultimo || 1))).toFixed(1)}px) scale(${((0.25 + (alcance / 10 - 0.25) * Math.cbrt(Math.min(1, c.k / 96))) * (viragem ? 1.25 : 1)).toFixed(2)})`,
          // Zona incolor: só um leve véu da mistura; zona colorida: bem visível.
          opacity:
            i === ultimo
              ? 0
              : c.opacity < 0.2
                ? 0.12
                : Math.min(0.95, c.opacity + 0.2),
        })),
        {
          duration: DURACAO_ZONA * ultimo,
          delay: chegada,
          easing: "linear",
          fill: "forwards",
        },
      ),
    );
    // Efervescência onde a gota cai: se ali o CO₂ passa da solubilidade
    // (ácido caindo em bicarbonato, ou o contrário), sobe um jorro de bolhas.
    const dvGota = tube.additions.at(-1) || 0;
    if (dvGota > 0 && v.r.volume > 2.5 * dvGota) {
      const z = SIAB.chem.zona(tube, 1.5 * dvGota);
      if (SIAB.chem.co2(z.tubo, z.r).excesso > 0) {
        for (let i = 0; i < 8; i++) {
          const b = criar(dentro, "circle", {
            class: "bolha-jorro",
            cx: 0,
            cy: 0,
            r: (1 + (i % 3) * 0.6).toFixed(1),
          });
          b.style.opacity = 0;
          const dx = (((i * 37) % 11) - 5) * Math.min(1.6, w / 12);
          sumir(
            b,
            b.animate(
              [
                {
                  transform: `translate(${cx + dx * 0.3}px, ${10 + (i % 4) * 5}px)`,
                  opacity: 0.95,
                },
                {
                  transform: `translate(${cx + dx}px, 0px)`,
                  opacity: 0.9,
                  offset: 0.85,
                },
                { transform: `translate(${cx + dx}px, -2px)`, opacity: 0 },
              ],
              {
                duration: 520 + 60 * i,
                delay: chegada + 40 * i,
                easing: "ease-in",
                fill: "forwards",
              },
            ),
          );
        }
      }
    }
    [-1, 1, 0].forEach((lado, i) => {
      const pingo = criar(svg.querySelector(".efeitos"), "circle", {
        class: "respingo",
        cx: 0,
        cy: 0,
        r: i === 2 ? 1.3 : 1.7,
        fill: v.corGota,
      });
      pingo.style.opacity = 0;
      const dx = lado * (6 + i * 2),
        alto = i === 2 ? 17 : 11;
      sumir(
        pingo,
        pingo.animate(
          [
            { transform: `translate(${cx}px, ${v.y}px)`, opacity: 1 },
            {
              transform: `translate(${cx + dx * 0.6}px, ${v.y - alto}px)`,
              opacity: 1,
              offset: 0.45,
              easing: "ease-in",
            },
            { transform: `translate(${cx + dx}px, ${v.y - 1}px)`, opacity: 0 },
          ],
          {
            duration: 380,
            delay: chegada,
            easing: "ease-out",
            fill: "forwards",
          },
        ),
      );
    });
    svg
      .querySelector(".liquido-superficie")
      ?.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(.97, 2.4)" },
          { transform: "scale(1.01, .5)" },
          { transform: "scale(1, 1.3)" },
          { transform: "scale(1, 1)" },
        ],
        { duration: 480, delay: chegada, easing: "ease-out" },
      );
    return chegada;
  }

  // Agitar (girar o erlenmeyer, mexer o béquer, sacudir o tubo): o vidro
  // balança e a mistura termina na hora; as nuvens de cor local somem na cor
  // do recipiente todo. Devolve em quantos ms a mistura acaba.
  function agitar(caixa) {
    const svg = caixa.querySelector("svg.vidro-foco");
    if (!svg) return 0;
    svg.classList.add("agitando");
    setTimeout(() => svg.classList.remove("agitando"), 900);
    suspender(caixa);
    svg.querySelectorAll(".nuvem-cor").forEach((n) =>
      n.getAnimations().forEach((a) => {
        a.playbackRate = 10;
      }),
    );
    if (semMovimento() || !svg.animate) {
      svg.querySelectorAll(".nuvem-cor").forEach((n) => n.remove());
      return 0;
    }
    svg
      .querySelector(".vidro-corpo")
      ?.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-4deg)" },
          { transform: "rotate(3.5deg)" },
          { transform: "rotate(-2.5deg)" },
          { transform: "rotate(1.5deg)" },
          { transform: "rotate(0deg)" },
        ],
        { duration: 900, easing: "ease-in-out" },
      );
    svg
      .querySelector(".liquido-superficie")
      ?.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(1, 3)" },
          { transform: "scale(1, 1.8)" },
          { transform: "scale(1, 1)" },
        ],
        { duration: 900, easing: "ease-in-out" },
      );
    return 900;
  }

  return { desenhar, gota, pingando, agitar, coresDaZona };
})();
