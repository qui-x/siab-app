"use strict";
SIAB.migrarDados = () => {
  const p = SIAB.persistencia;
  const atual = p.ler("siab_investigacao_v2", null);
  if (atual?.schema === 2) return atual;
  const antigo = p.ler("siab_progresso_v1", {});
  const notas = Array.isArray(antigo.caderno) ? antigo.caderno : [];
  const tipos = {
    previsao: "exploracao",
    leitura: "exploracao",
    descoberta: "anotacao",
    desafio: "anotacao",
  };
  const dados = {
    schema: 2,
    missoes: {},
    temas: {},
    caderno: [],
    ultima: antigo.ultima || null,
  };
  Object.entries(antigo.missoes || {}).forEach(([id, m]) => {
    if (m?.concluida)
      dados.missoes[id] = {
        concluida: true,
        data: m.data,
        respostas: m.respostas || {},
      };
  });
  dados.caderno = notas
    .filter((n) => n && typeof n === "object")
    .map((n, i) => ({
      ...n,
      id: String(n.id || `legado-${i}`),
      tipo: tipos[n.tipo] || n.tipo || "anotacao",
      linhas: Array.isArray(n.linhas) ? n.linhas : [],
      legado: true,
    }));
  dados.caderno.forEach((n) => {
    const i = n.linhas.findIndex(
      (l) =>
        Array.isArray(l) && l[0] === "Tabela" && String(l[1]).includes(";"),
    );
    if (i >= 0 && !n.tabela) {
      n.tabela = {
        colunas: ["Gota", "Adicionado (mL)", "pH", "Cor"],
        linhas: String(n.linhas[i][1])
          .split(" | ")
          .map((l) => l.split(";")),
      };
      n.linhas.splice(i, 1);
    }
  });
  let modo;
  try {
    modo = localStorage.getItem("siab_modo");
  } catch (_) {}
  if (!p.ler("siab_inicializacao", null) && modo)
    p.salvar(
      "siab_inicializacao",
      modo === "completo" ? "inicio" : "laboratorio",
    );
  // A origem nunca é apagada: falha de quota permite repetir a migração sem perda.
  if (p.salvar("siab_investigacao_v2", dados))
    p.salvar("siab_migracao_v2", {
      em: new Date().toISOString(),
      notas: dados.caderno.length,
      missoes: Object.keys(dados.missoes).length,
    });
  return dados;
};
