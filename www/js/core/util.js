"use strict";
/* Utilidades compartilhadas: seleção de elementos, formatação em português,
   escape de HTML, avisos na tela e armazenamento local seguro. */
SIAB.$ = (id) => document.getElementById(id);

SIAB.format = (value, digits = 2) =>
  Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

SIAB.escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

// Letras sem acento e minúsculas: permite buscar "limao" e achar "Limão".
SIAB.normalizar = (text) =>
  String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");

// pH com ≈ e uma casa para amostras do cotidiano (estimativas).
SIAB.phFormat = (result) =>
  `${result.approximate ? "≈ " : ""}${SIAB.format(result.pH, result.approximate ? 1 : 2)}`;

// Mensagem curta visível (toast) e anúncio para leitores de tela.
SIAB.notice = (() => {
  let timer = null;
  return (message, { contexto = "" } = {}) => {
    const toast = SIAB.$("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.contexto = contexto;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      toast.hidden = true;
    }, 3600);
  };
})();
SIAB.announce = (message) => {
  const box = SIAB.$("announcer");
  if (!box) return;
  box.textContent = "";
  // Um pequeno atraso garante que a mesma frase seja lida de novo.
  setTimeout(() => {
    box.textContent = message;
  }, 30);
};

// localStorage pode falhar (janela privada, bloqueio): nunca quebra a página.
SIAB.armazenamento = {
  ler(chave, padrao) {
    try {
      const texto = localStorage.getItem(chave);
      return texto ? JSON.parse(texto) : padrao;
    } catch (erro) {
      return padrao;
    }
  },
  gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      return false;
    }
  },
};

// Baixa um texto como arquivo (CSV do caderno e do histórico).
// Campo de CSV: vai entre aspas só quando tem ; aspas ou quebra de linha.
SIAB.csvCampo = (valor) => {
  const texto = String(valor ?? "");
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

SIAB.baixarArquivo = (nome, conteudo, tipo = "text/csv;charset=utf-8") => {
  const blob = new Blob(["﻿" + conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Embaralha uma cópia de uma lista (Fisher-Yates).
SIAB.embaralhar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

SIAB.dataHora = (data = new Date()) =>
  data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Notação científica em português: 1,8 × 10⁻⁵.
SIAB.cientifico = (valor, digitos = 2) => {
  if (!(valor > 0)) return "0";
  const expoente = Math.floor(Math.log10(valor));
  const mantissa = valor / 10 ** expoente;
  if (expoente >= -2 && expoente <= 2)
    return SIAB.format(valor, Math.max(0, digitos - expoente));
  const SUP = {
    "-": "⁻",
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
  };
  const potencia = String(expoente).replace(/[-\d]/g, (c) => SUP[c]);
  return `${SIAB.format(mantissa, digitos - 1)} × 10${potencia}`;
};
