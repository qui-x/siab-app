"use strict";
/* Régua de pH de 0 a 14, com as cores da carta universal e um marcador. */
SIAB.regua = (() => {
  // Cores de referência da carta universal usada pelo simulador.
  const stops = [0, 2, 4, 6, 7, 8, 10, 12, 14].map((pH) => [
    pH,
    SIAB.chem.color("universal", Math.max(1, pH)).rgb,
  ]);
  const gradiente = (id) =>
    `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">${stops.map(([pH, rgb]) => `<stop offset="${pH / 14}" stop-color="rgb(${rgb.join(",")})"/>`).join("")}</linearGradient>`;
  let contador = 0;

  // pH null = leitura oculta (sem marcador). neutro: pH neutro na temperatura.
  // faixa: { low, high, nome } desenha, sob a barra, a faixa de viragem do indicador.
  // concentracao: acrescenta a linha de [H₃O⁺] em potências de 10 (escala logarítmica).
  const SOBRE = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  const potencia = (n) =>
    `10${n ? "⁻" : ""}${String(n)
      .split("")
      .map((d) => SOBRE[d])
      .join("")}`;
  function svg(
    pH,
    {
      neutro = 7,
      rotulo = "Régua de pH",
      faixa = null,
      concentracao = false,
    } = {},
  ) {
    const id = `regua-grad-${++contador}`;
    const x = (v) => 8 + (v / 14) * 224;
    const marcador =
      pH === null
        ? ""
        : `<path class="regua-marcador" d="M${x(Math.max(0, Math.min(14, pH)))} 13l-6 -9h12Z"/>`;
    const neutroMarca = `<path class="regua-neutro" d="M${x(neutro)} 14v20" stroke-dasharray="2 2"/>`;
    const viragem = faixa
      ? `<path class="regua-faixa" d="M${x(faixa.low)} 33v4H${x(faixa.high)}v-4"/>`
      : "";
    const textoFaixa = faixa
      ? ` Viragem de ${faixa.nome} entre pH ${SIAB.format(faixa.low, 1)} e ${SIAB.format(faixa.high, 1)}.`
      : "";
    const descricao =
      (pH === null
        ? `${rotulo}: leitura oculta.`
        : `${rotulo}: marcador em pH ${SIAB.format(pH, 1)}. Neutro em ${SIAB.format(neutro, 1)}.`) +
      textoFaixa;
    const yRotulo = faixa ? 50 : 44;
    const linhaH = concentracao
      ? `<text class="regua-conc-titulo" x="8" y="${yRotulo + 14}">[H₃O⁺] mol/L</text>${[0, 7, 14].map((n) => `<text class="regua-conc" x="${x(n)}" y="${yRotulo + 26}" text-anchor="${n === 0 ? "start" : n === 14 ? "end" : "middle"}">${potencia(n)}</text>`).join("")}`
      : "";
    const textoConc = concentracao
      ? " Cada unidade de pH corresponde a 10 vezes mais ou menos H₃O⁺."
      : "";
    return `<svg class="regua-svg" viewBox="0 0 240 ${yRotulo + 4 + (concentracao ? 26 : 0)}" role="img" aria-label="${descricao}${textoConc}">
      <defs>${gradiente(id)}</defs>
      <rect x="8" y="16" width="224" height="14" rx="7" fill="url(#${id})"/>
      ${neutroMarca}${marcador}${viragem}
      <text x="8" y="${yRotulo}">0</text><text x="${x(7)}" y="${yRotulo}" text-anchor="middle">7</text><text x="232" y="${yRotulo}" text-anchor="end">14</text>
      ${linhaH}
    </svg>`;
  }
  return { svg };
})();
