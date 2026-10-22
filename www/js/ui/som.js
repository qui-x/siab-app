"use strict";
/* Sonificação e vibração opcionais (desligadas por padrão).
   O tom sobe com o pH: pH 0 ≈ 220 Hz, pH 14 ≈ 880 Hz (duas oitavas).
   Ajuda estudantes cegos a acompanhar uma titulação. */
SIAB.som = (() => {
  const CHAVE = "siab_som_v1";
  const prefs = Object.assign(
    { som: false, vibrar: false },
    SIAB.armazenamento.ler(CHAVE, {}),
  );
  let contexto = null;

  function definir(chave, valor) {
    prefs[chave] = Boolean(valor);
    SIAB.armazenamento.gravar(CHAVE, prefs);
  }

  function tocar(pH) {
    if (!prefs.som) return;
    try {
      contexto =
        contexto || new (window.AudioContext || window.webkitAudioContext)();
      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();
      oscilador.type = "sine";
      oscilador.frequency.value =
        220 * 2 ** (Math.max(0, Math.min(14, pH)) / 7);
      volume.gain.setValueAtTime(0.001, contexto.currentTime);
      volume.gain.exponentialRampToValueAtTime(
        0.18,
        contexto.currentTime + 0.02,
      );
      volume.gain.exponentialRampToValueAtTime(
        0.001,
        contexto.currentTime + 0.22,
      );
      oscilador.connect(volume).connect(contexto.destination);
      oscilador.start();
      oscilador.stop(contexto.currentTime + 0.24);
    } catch (erro) {
      /* sem áudio disponível */
    }
  }

  function vibrar() {
    if (prefs.vibrar && navigator.vibrate) navigator.vibrate([60, 40, 60]);
  }

  return { prefs, definir, tocar, vibrar };
})();
