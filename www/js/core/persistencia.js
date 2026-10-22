"use strict";
SIAB.persistencia = (() => {
  const memoria = new Map(),
    pendentes = new Set();
  function ler(chave, padrao) {
    if (pendentes.has(chave)) return memoria.get(chave) ?? padrao;
    try {
      const v = localStorage.getItem(chave);
      return v === null ? (memoria.get(chave) ?? padrao) : JSON.parse(v);
    } catch (_) {
      return memoria.get(chave) ?? padrao;
    }
  }
  function salvar(chave, valor) {
    memoria.set(chave, valor);
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      pendentes.delete(chave);
      return true;
    } catch (_) {
      pendentes.add(chave);
      SIAB.notice(
        "O armazenamento está indisponível ou cheio. Exporte seus registros antes de fechar.",
      );
      return false;
    }
  }
  return { ler, salvar };
})();
