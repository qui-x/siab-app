"use strict";
/* Conta-gotas dinâmico: segurar o botão goteja sem parar.
   Mouse ou toque: pressionar e segurar. Teclado: Enter adiciona 1 gota;
   manter Espaço pressionado goteja continuamente. */
SIAB.contaGotas = {
  // opcoes.gotejar() devolve false quando não cabe mais gota.
  // opcoes.inicio() roda uma vez no começo de cada sequência (para o Desfazer).
  ligar(botao, opcoes) {
    let timer = null,
      contagem = 0,
      ativo = false,
      cliqueDoToque = false;
    const pingar = () => {
      if (opcoes.gotejar() === false) {
        parar();
        return;
      }
      contagem++;
      // Depois de 8 gotas seguidas o ritmo acelera um pouco.
      if (contagem === 8) {
        clearInterval(timer);
        timer = setInterval(pingar, 140);
      }
    };
    const comecar = () => {
      if (ativo || botao.disabled) return;
      ativo = true;
      contagem = 0;
      opcoes.inicio?.();
      pingar();
      if (ativo) timer = setInterval(pingar, 260);
    };
    function parar() {
      if (!ativo) return;
      ativo = false;
      clearInterval(timer);
      timer = null;
      opcoes.fim?.(contagem);
    }
    botao.addEventListener("pointerdown", (evento) => {
      if (evento.button !== 0) return;
      evento.preventDefault();
      // O navegador ainda vai gerar um "click" para este toque: ele será ignorado.
      cliqueDoToque = true;
      botao.focus();
      botao.setPointerCapture?.(evento.pointerId);
      comecar();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) =>
      botao.addEventListener(tipo, () => {
        parar();
        // O "click" do toque chega logo depois de soltar; se não chegar, a marca some.
        setTimeout(() => {
          cliqueDoToque = false;
        }, 400);
      }),
    );
    botao.addEventListener("contextmenu", (evento) => evento.preventDefault());
    // Clique vindo do teclado (Enter) ou de tecnologia assistiva. O clique que
    // o navegador gera depois de um toque ou do mouse é ignorado: a gota já caiu.
    botao.addEventListener("click", (evento) => {
      // Alguns cliques de toque têm detail = 0 e chegam após a marca expirar.
      // pointerType os distingue de Enter e da ativação por tecnologia assistiva.
      if (cliqueDoToque || evento.detail > 0 || evento.pointerType) {
        cliqueDoToque = false;
        return;
      }
      opcoes.inicio?.();
      if (opcoes.gotejar() !== false) opcoes.fim?.(1);
    });
    botao.addEventListener("keydown", (evento) => {
      cliqueDoToque = false;
      if (evento.key === " " || evento.key === "Spacebar") {
        evento.preventDefault();
        if (!evento.repeat) comecar();
      }
    });
    botao.addEventListener("keyup", (evento) => {
      if (evento.key === " " || evento.key === "Spacebar") {
        evento.preventDefault();
        parar();
      }
    });
    botao.addEventListener("blur", parar);
    return { parar };
  },
};
