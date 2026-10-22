"use strict";
/* Compatibilidade da tabela histórica. Persistência, migração e conclusão têm módulos próprios. */
/* Tabela de gotas compacta (caderno, aba Histórico e folha impressa).
   Numa titulação longa, centenas de gotas seguidas dão quase a mesma leitura
   e a tabela vira uma lista enorme. Gotas SEGUIDAS com a MESMA COR e pH QUASE
   IGUAL (no máximo 0,2 de diferença da primeira do grupo) viram um registro só:
     "51–100 | 2,55–5,00 | 2,31–2,48 | vermelho"
   Cada registro junta até 50 gotas (100 quando a tabela passa de 1000 gotas).
   Perto do ponto final, onde a cor ou o pH mudam de uma gota para a outra,
   cada gota continua numa linha própria: é ali que a leitura importa.
   A gota 0 (antes de gotejar) fica sempre sozinha, e tabelas curtas (até 60
   linhas) não mudam. Com o pH oculto ("—"), agrupa só pela cor.
   Trabalha sobre as linhas em texto, então serve também para notas antigas. */
SIAB.TABELA_COMPACTA = {
  limite: 60,
  tolerancia: 0.2,
  bloco: 50,
  blocoGrande: 100,
  muitasGotas: 1000,
};
SIAB.compactarTabela = (
  tabela,
  { limite = SIAB.TABELA_COMPACTA.limite } = {},
) => {
  const { tolerancia, bloco, blocoGrande, muitasGotas } = SIAB.TABELA_COMPACTA;
  if (!tabela?.linhas || tabela.compacta || tabela.linhas.length <= limite)
    return tabela;
  // "2,31" → 2.31; "≈ 3,4" → 3.4; "—" → NaN.
  const numero = (texto) =>
    Number(
      String(texto)
        .replace("≈", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim() || NaN,
    );
  const gotas = tabela.linhas.length - 1;
  const maximo = gotas > muitasGotas ? blocoGrande : bloco;
  const grupos = [];
  tabela.linhas.forEach((linha, i) => {
    const grupo = grupos.at(-1),
      primeira = grupo?.[0];
    const pH = numero(linha[2]),
      pH0 = primeira ? numero(primeira[2]) : NaN;
    const mesmoPH = Number.isFinite(pH)
      ? Math.abs(pH - pH0) <= tolerancia + 1e-9
      : !Number.isFinite(pH0);
    if (i > 1 && grupo.length < maximo && linha[3] === primeira[3] && mesmoPH)
      grupo.push(linha);
    else grupos.push([linha]);
  });
  const faixa = (a, b) => (a === b ? a : `${a}–${b}`);
  return {
    colunas: [...tabela.colunas],
    linhas: grupos.map((g) =>
      g.length === 1
        ? [...g[0]]
        : [
            faixa(g[0][0], g.at(-1)[0]),
            faixa(g[0][1], g.at(-1)[1]),
            faixa(g[0][2], g.at(-1)[2]),
            g[0][3],
          ],
    ),
    compacta: true,
    gotas,
    porLinha: maximo,
  };
};
// Frase que explica a tabela compacta (mostrada junto dela).
SIAB.notaCompacta = (tabela) =>
  tabela?.compacta
    ? `${tabela.gotas} gotas em ${tabela.linhas.length} linhas: gotas seguidas com a mesma cor e pH quase igual (até ${tabela.porLinha}) estão juntas; perto do ponto final, cada gota tem sua linha.`
    : "";

// Fachada para os consumidores históricos; não mantém sistema de pontuação.
SIAB.progresso = (() => {
  const dados = SIAB.migrarDados();
  const salvar = () => SIAB.persistencia.salvar("siab_investigacao_v2", dados);
  const id = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    dados,
    salvar,
    missao: (chave) => dados.missoes[chave] || null,
    concluirMissao(chave, respostas) {
      dados.missoes[chave] = {
        concluida: true,
        data: new Date().toISOString(),
        respostas,
      };
      salvar();
    },
    concluirTema(chave) {
      dados.temas[chave] = { concluida: true, data: new Date().toISOString() };
      salvar();
    },
    anotar(entrada) {
      const chave = id();
      dados.caderno.unshift({
        ...entrada,
        id: chave,
        data: new Date().toISOString(),
      });
      salvar();
      return chave;
    },
    atualizarNota(chave, campos) {
      const n = dados.caderno.find((n) => n.id === chave);
      if (n) Object.assign(n, campos);
      salvar();
    },
    removerNota(chave) {
      dados.caderno = dados.caderno.filter((n) => n.id !== chave);
      salvar();
    },
    limparCaderno() {
      dados.caderno = [];
      salvar();
    },
    apagarTudo() {
      dados.missoes = {};
      dados.temas = {};
      dados.caderno = [];
      salvar();
    },
  };
})();
