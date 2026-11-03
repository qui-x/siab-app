"use strict";
/* Formato curto (v2) dos links de atividade: "2.<base64url>".
   Empacota a configuração em bits, sem cifra (a chave do formato v1 já viajava
   dentro do link e não dava sigilo). Os campos são identificados por tabelas fixas
   de crescimento apenas por acréscimo; o item do catálogo é identificado por um
   hash de 32 bits do seu id. Um CRC-16 detecta link cortado ou digitado errado.
   paraToken() só devolve um link quando a ida e a volta reproduzem exatamente a
   configuração; qualquer coisa fora do formato volta ao v1 (mais longo, completo). */
SIAB.atividadeV2 = (() => {
  const TIPOS = ["roteiro", "missao", "montagem"];
  const MODOS = [null, "referencia", "local"];
  const VISTAS = [
    null, "particulas", "especies", "equacao", "proton", "ph", "temperatura",
    "condutividade", "grafico", "derivada", "distribuicao", "historico", "tabela",
  ];
  const INSTRUMENTOS = [
    "indicador", "fita", "phmetro", "condutividade", "temperatura", "particulas",
    "equacoes", "graficos", "especies", "proton", "grafico", "derivada",
    "distribuicao", "historico", "tabela",
  ];
  const PERMISSOES = [
    "measurements.indicator", "measurements.phStrip", "measurements.phMeter",
    "measurements.conductivity", "measurements.temperature",
    "representations.particles", "representations.species",
    "representations.equations", "representations.protonTransfer",
    "analysis.graph", "analysis.derivative", "analysis.distribution",
    "analysis.history", "analysis.table",
    "bench.changeInitialSolution", "bench.changeTitrant", "bench.changeGlassware",
    "bench.changeInitialVolume", "bench.changeConcentration", "bench.changeIndicator",
    "bench.changeTemperature", "bench.changePreparation",
    "vessels.add", "vessels.remove", "vessels.rename", "vessels.changeContent",
    "vessels.changeGlassware", "vessels.changeVolume",
  ];
  const IDENTIFICACAO = ["nome", "turma", "data", "professor", "grupo"];

  const catalogo = (tipo) =>
    tipo === "roteiro" ? SIAB.experimentos : tipo === "missao" ? SIAB.missoes : SIAB.montagens;

  function hash32(texto) {
    let h = 0x811c9dc5;
    for (const b of new TextEncoder().encode(texto)) {
      h ^= b;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  function crc16(bytes) {
    let crc = 0xffff;
    for (const b of bytes) {
      crc ^= b << 8;
      for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc;
  }
  const paraBase64 = (a) =>
    btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const deBase64 = (s) =>
    Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

  function escritor() {
    const bits = [];
    const api = {
      put(valor, n) {
        for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
      },
      texto(t) {
        const b = new TextEncoder().encode(t);
        if (b.length > 255) throw new Error("texto longo");
        api.put(b.length, 8);
        for (const x of b) api.put(x, 8);
      },
      bytes() {
        while (bits.length % 8) bits.push(0);
        const saida = new Uint8Array(bits.length / 8);
        bits.forEach((b, i) => { saida[i >> 3] |= b << (7 - (i & 7)); });
        return saida;
      },
    };
    return api;
  }
  function leitor(bytes) {
    let pos = 0;
    const api = {
      get(n) {
        let v = 0;
        for (let i = 0; i < n; i++) {
          if (pos >= bytes.length * 8) throw new Error("fim");
          v = (v * 2) + ((bytes[pos >> 3] >> (7 - (pos & 7))) & 1);
          pos++;
        }
        return v;
      },
      texto() {
        const n = api.get(8), b = new Uint8Array(n);
        for (let i = 0; i < n; i++) b[i] = api.get(8);
        return new TextDecoder("utf-8", { fatal: true }).decode(b);
      },
    };
    return api;
  }

  function canonico(c) {
    const limpo = {};
    for (const k of Object.keys(c).sort()) {
      if (k === "id" || c[k] === null || c[k] === undefined) continue;
      limpo[k] = k === "instrumentos" ? [...c[k]].sort() : c[k];
    }
    return JSON.stringify(limpo, (_, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
        : v);
  }

  function escreverResto(w, c, entry) {
    const decimos = Math.round(c.temperatura * 10);
    if (decimos / 10 === c.temperatura && decimos >= 0 && decimos <= 1000) {
      w.put(1, 1);
      w.put(decimos, 10);
    } else {
      w.put(0, 1);
      const dv = new DataView(new ArrayBuffer(8));
      dv.setFloat64(0, c.temperatura);
      w.put(dv.getUint32(0), 32);
      w.put(dv.getUint32(4), 32);
    }
    const modo = MODOS.indexOf(c.temperaturaModo == null ? null : c.temperaturaModo);
    const vista = VISTAS.indexOf(c.initialView == null ? null : c.initialView);
    if (modo < 0 || vista < 0) throw new Error("modo ou vista fora do formato");
    w.put(modo, 2);
    w.put(vista, 4);
    let mascara = 0;
    for (const i of c.instrumentos) {
      const idx = INSTRUMENTOS.indexOf(i);
      if (idx < 0) throw new Error("instrumento fora da tabela");
      mascara |= 1 << idx;
    }
    w.put(mascara, 15);
    if (c.permissions) {
      w.put(1, 1);
      for (const caminho of PERMISSOES) {
        const [g, k] = caminho.split(".");
        w.put(c.permissions[g] && c.permissions[g][k] === true ? 1 : 0, 1);
      }
    } else w.put(0, 1);
    if (c.titulo && c.titulo !== entry.titulo) {
      w.put(1, 1);
      w.texto(c.titulo);
    } else w.put(0, 1);
    const ident = c.identificacao || {};
    for (const k of IDENTIFICACAO) {
      const v = String(ident[k] || "");
      if (v) { w.put(1, 1); w.texto(v); } else w.put(0, 1);
    }
  }

  function lerResto(r, entry) {
    let temperatura;
    if (r.get(1)) temperatura = r.get(10) / 10;
    else {
      const dv = new DataView(new ArrayBuffer(8));
      dv.setUint32(0, r.get(32));
      dv.setUint32(4, r.get(32));
      temperatura = dv.getFloat64(0);
    }
    const temperaturaModo = MODOS[r.get(2)];
    const initialView = VISTAS[r.get(4)];
    const mascara = r.get(15);
    const instrumentos = INSTRUMENTOS.filter((_, i) => (mascara >> i) & 1);
    let permissions;
    if (r.get(1)) {
      permissions = {};
      for (const caminho of PERMISSOES) {
        const [g, k] = caminho.split(".");
        (permissions[g] = permissions[g] || {})[k] = r.get(1) === 1;
      }
    }
    const titulo = r.get(1) ? r.texto() : entry.titulo;
    const identificacao = {};
    for (const k of IDENTIFICACAO) identificacao[k] = r.get(1) ? r.texto() : "";
    return { temperatura, temperaturaModo, initialView, instrumentos, permissions, titulo, identificacao };
  }

  function montar(schema, tipo, navegacao, relatorio, entry, x) {
    const c = {
      schema, tipo, item: entry.id, titulo: x.titulo,
      modulo: entry.modulo || (entry.bancada && entry.bancada.nivel) || entry.nivel || "explorar",
      temperatura: x.temperatura, instrumentos: x.instrumentos, navegacao, identificacao: x.identificacao,
    };
    // Mesmo formato que o professor gera (campos vazios como null)
    if (x.temperaturaModo) c.temperaturaModo = x.temperaturaModo;
    if (x.permissions) c.permissions = x.permissions;
    c.initialView = x.initialView || null;
    c.relatorio = relatorio || null;
    return c;
  }

  function empacotar(c) {
    const tipo = TIPOS.indexOf(c.tipo);
    const lista = catalogo(c.tipo) || [];
    const entry = lista.find((x) => x.id === c.item);
    const h = entry ? hash32(entry.id) : -1;
    if (tipo < 0 || !entry || ![1, 2].includes(c.schema)) throw new Error("fora do formato");
    if (lista.filter((x) => hash32(x.id) === h).length !== 1) throw new Error("hash repetido");
    const w = escritor();
    w.put(c.schema === 2 ? 1 : 0, 1);
    w.put(tipo, 2);
    w.put(c.navegacao === "restrita" ? 1 : 0, 1);
    const rel = [null, "digital", "impresso"].indexOf(c.relatorio == null ? null : c.relatorio);
    if (rel < 0) throw new Error("relatório fora do formato");
    w.put(rel, 2);
    w.put(h, 32);
    escreverResto(w, c, entry);
    const corpo = w.bytes();
    const crc = crc16(corpo);
    const tudo = new Uint8Array(corpo.length + 2);
    tudo.set(corpo);
    tudo[corpo.length] = crc >> 8;
    tudo[corpo.length + 1] = crc & 255;
    return "2." + paraBase64(tudo);
  }

  function bytesValidos(token) {
    if (typeof token !== "string" || !/^2\.[A-Za-z0-9_-]{12,}$/.test(token) || token.length > 2000)
      throw new Error("Link de atividade inválido ou incompleto.");
    const tudo = deBase64(token.slice(2));
    const corpo = tudo.slice(0, -2);
    if (tudo.length < 8 || crc16(corpo) !== ((tudo[tudo.length - 2] << 8) | tudo[tudo.length - 1]))
      throw new Error("Link de atividade inválido ou incompleto.");
    return corpo;
  }
  const valido = (token) => {
    try { bytesValidos(token); return true; } catch (_) { return false; }
  };

  function ler(token) {
    const r = leitor(bytesValidos(token));
    const schema = r.get(1) ? 2 : 1;
    const tipo = TIPOS[r.get(2)];
    if (!tipo) throw new Error("Link de atividade inválido.");
    const navegacao = r.get(1) ? "restrita" : "livre";
    const relatorio = [null, "digital", "impresso"][r.get(2)];
    const h = r.get(32);
    const entry = (catalogo(tipo) || []).find((x) => hash32(x.id) === h);
    if (!entry) throw new Error("Atividade incompatível com este catálogo.");
    return montar(schema, tipo, navegacao, relatorio, entry, lerResto(r, entry));
  }

  // Devolve o link curto, ou null se esta configuração precisar do formato v1.
  function paraToken(config) {
    try {
      const token = empacotar(config);
      return canonico(ler(token)) === canonico(config) ? token : null;
    } catch (_) {
      return null;
    }
  }

  // ---- Link por nome: <nome>[~<ajustes>] -------------------------------------
  // roteiro: "tres-indicadores"; missão: "missao-<id>"; montagem: "montagem-<id>".
  // Sem "~ajustes" vale a configuração padrão (navegação livre, todos os recursos).
  const PREFIXOS = { roteiro: "", missao: "missao-", montagem: "montagem-" };
  const NOME_OK = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/; // ids do catálogo, com maiúsculas e minúsculas

  function acharPorNome(nome) {
    for (const tipo of ["montagem", "missao"]) {
      const pre = PREFIXOS[tipo];
      if (nome.startsWith(pre)) {
        const entry = (catalogo(tipo) || []).find((x) => x.id === nome.slice(pre.length));
        if (entry) return { tipo, entry };
      }
    }
    const entry = (catalogo("roteiro") || []).find((x) => x.id === nome);
    return entry ? { tipo: "roteiro", entry } : null;
  }
  function padrao(tipo, entry) {
    return {
      schema: 2, tipo, item: entry.id, titulo: entry.titulo,
      modulo: entry.modulo || (entry.bancada && entry.bancada.nivel) || entry.nivel || "explorar",
      temperatura: 25, temperaturaModo: "referencia", instrumentos: INSTRUMENTOS.slice(),
      navegacao: "livre",
      identificacao: { nome: "", turma: "", data: "", professor: "", grupo: "" },
      initialView: null, relatorio: null,
    };
  }
  function bytesNome(nome, corpo) {
    const b = new TextEncoder().encode(nome);
    const t = new Uint8Array(b.length + corpo.length);
    t.set(b);
    t.set(corpo, b.length);
    return t;
  }

  function lerNome(ref) {
    if (typeof ref !== "string" || ref.length > 2000) throw new Error("Link de atividade inválido.");
    const corte = ref.indexOf("~");
    const nome = corte < 0 ? ref : ref.slice(0, corte);
    const achado = NOME_OK.test(nome) ? acharPorNome(nome) : null;
    if (!achado) throw new Error("Atividade não encontrada neste catálogo.");
    if (corte < 0) return padrao(achado.tipo, achado.entry);
    const sufixo = ref.slice(corte + 1);
    if (!/^[A-Za-z0-9_-]{8,}$/.test(sufixo)) throw new Error("Link de atividade inválido ou incompleto.");
    const tudo = deBase64(sufixo);
    const corpo = tudo.slice(0, -2);
    if (crc16(bytesNome(nome, corpo)) !== ((tudo[tudo.length - 2] << 8) | tudo[tudo.length - 1]))
      throw new Error("Link de atividade inválido ou incompleto.");
    const r = leitor(corpo);
    const schema = r.get(1) ? 2 : 1;
    const navegacao = r.get(1) ? "restrita" : "livre";
    const relatorio = [null, "digital", "impresso"][r.get(2)];
    return montar(schema, achado.tipo, navegacao, relatorio, achado.entry, lerResto(r, achado.entry));
  }
  const validoNome = (ref) => {
    try { lerNome(ref); return true; } catch (_) { return false; }
  };

  function paraNome(config) {
    try {
      const nome = PREFIXOS[config.tipo] + config.item;
      const achado = acharPorNome(nome);
      if (!achado || achado.tipo !== config.tipo || achado.entry.id !== config.item) return null;
      let ref = nome;
      if (canonico(padrao(achado.tipo, achado.entry)) !== canonico(config)) {
        const w = escritor();
        w.put(config.schema === 2 ? 1 : 0, 1);
        w.put(config.navegacao === "restrita" ? 1 : 0, 1);
        const rel = [null, "digital", "impresso"].indexOf(config.relatorio == null ? null : config.relatorio);
        if (rel < 0) return null;
        w.put(rel, 2);
        escreverResto(w, config, achado.entry);
        const corpo = w.bytes();
        const crc = crc16(bytesNome(nome, corpo));
        const tudo = new Uint8Array(corpo.length + 2);
        tudo.set(corpo);
        tudo[corpo.length] = crc >> 8;
        tudo[corpo.length + 1] = crc & 255;
        ref = nome + "~" + paraBase64(tudo);
      }
      return canonico(lerNome(ref)) === canonico(config) ? ref : null;
    } catch (_) {
      return null;
    }
  }

  return { paraToken, ler, valido, paraNome, lerNome, validoNome };
})();
