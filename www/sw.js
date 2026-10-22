/* Service worker do SIAB: guarda os arquivos do app para funcionar sem internet.
   Ao publicar uma versão nova, mude VERSAO (identificador do cache; uma revisão pode
   manter SIAB.version): o navegador baixa tudo de novo, a versão nova assume e o app
   avisa "Recarregar". A lista ARQUIVOS precisa conter todo arquivo usado pela
   página. */
// 1.0.0 com a correção da bancada mobile. O "+20261012" só renova o cache de
// quem abriu a publicação 1.0.0 anterior (SIAB.version continua 1.0.0).
const VERSAO = "siab-1.0.0+20261012";
// Projetos do mesmo usuario.github.io compartilham a origem. Cada publicação
// precisa de seu próprio cache; atualizar uma cópia não deve apagar outra.
const BASE = new URL(self.registration.scope);
const INICIO = new URL("index.html", BASE).href;
const PREFIXO_CACHE = `siab@${BASE.href}::`;
const NOME_CACHE = PREFIXO_CACHE + VERSAO;
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/siab-icone.svg",
  "./assets/icones/apple-touch-icon.png",
  "./vendor/dialog-polyfill/dialog-polyfill.css",
  "./css/stylesiab.css",
  "./css/mobile-study.css",
  "./js/core/compatibilidade.js",
  "./a11y.js",
  "./css/investigacao.css",
  "./css/workspace.css",
  "./css/manual.css",
  "./css/mobile-controls.css",
  "./css/refinements.css",
  "./vendor/dialog-polyfill/dialog-polyfill.js",
  "./js/core/namespace.js",
  "./js/core/util.js",
  "./js/ui/icons.js",
  "./js/data/catalogo.js",
  "./js/data/cotidiano.js",
  "./js/data/sais.js",
  "./js/data/ambiente-saude.js",
  "./js/data/reagentes.js",
  "./js/data/amostras.js",
  "./js/data/funcoes.js",
  "./js/simulation/quimica.js",
  "./js/simulation/condutividade.js",
  "./js/core/estado.js",
  "./js/ui/abertura.js",
  "./js/core/loja.js",
  "./js/core/persistencia.js",
  "./js/core/migracoes.js",
  "./js/core/progresso.js",
  "./js/core/roteador.js",
  "./js/data/missoes.js",
  "./js/data/temas.js",
  "./js/data/montagens.js",
  "./js/data/experimentos.js",
  "./js/data/manual.js",
  "./js/core/activity-context.js",
  "./js/simulation/motor-missoes.js",
  "./js/ui/tubo.js",
  "./js/ui/regua-ph.js",
  "./js/ui/grafico.js",
  "./js/ui/lupa.js",
  "./js/ui/condutimetro.js",
  "./js/ui/equacao.js",
  "./js/ui/som.js",
  "./js/ui/conta-gotas.js",
  "./js/ui/seletores.js",
  "./js/ui/prateleira.js",
  "./js/ui/modulos.js",
  "./js/ui/layout-bancada.js",
  "./js/simulation/instrumentos.js",
  "./js/ui/render.js",
  "./js/simulation/medicoes.js",
  "./js/ui/ver-investigacao.js",
  "./js/ui/gaveta.js",
  "./js/ui/workspace.js",
  "./js/ui/trilho.js",
  "./js/ui/tour.js",
  "./js/ui/segredo.js",
  "./js/ui/impressao.js",
  "./js/ui/selecao-tubos.js",
  "./js/telas/bancada.js",
  "./js/telas/laboratorio.js",
  "./js/telas/missao.js",
  "./js/telas/inicio.js",
  "./js/telas/aprender.js",
  "./js/telas/roteiros.js",
  "./js/telas/relatorios.js",
  "./js/core/atividades.js",
  "./js/telas/professor.js",
  "./js/telas/caderno.js",
  "./js/telas/manual.js",
  "./js/a11y/preferencias.js",
  "./js/init/pwa.js",
  "./js/ui/activity-ui.js",
  "./js/init/integracao.js",
  "./js/init/app.js",
  "./js/ui/mobile-study.js",
  "./assets/icones/icone-192.png",
  "./assets/icones/icone-512.png",
  "./assets/icones/icone-maskable-512.png",
];

// cache: 'reload' busca cada arquivo no servidor, sem usar o cache do navegador.
// Sem isso, uma versão nova podia guardar arquivos antigos misturados aos novos.
// skipWaiting: a versão nova assume logo; a página avisa para recarregar.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(NOME_CACHE)
      .then((cache) =>
        cache.addAll(
          ARQUIVOS.map((url) => new Request(url, { cache: "reload" })),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

// Remove somente versões antigas desta publicação. Caches legados sem escopo
// são preservados: podem pertencer a outra cópia do SIAB no mesmo domínio.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter(
              (chave) =>
                chave.startsWith(PREFIXO_CACHE) && chave !== NOME_CACHE,
            )
            .map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Primeiro o cache; se não houver, a rede (e guarda a resposta para depois).
// A página pode ter parâmetros de acessibilidade (?theme=…): ignoreSearch.
self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);
  if (
    pedido.method !== "GET" ||
    url.origin !== BASE.origin ||
    !url.pathname.startsWith(BASE.pathname)
  )
    return;
  const navegacao = pedido.mode === "navigate";
  // As rotas do app usam #/. Outros documentos/subpastas seguem para a rede.
  if (
    navegacao &&
    url.pathname !== BASE.pathname &&
    url.pathname !== new URL(INICIO).pathname
  )
    return;
  evento.respondWith(
    caches
      .open(NOME_CACHE)
      .then(async (cache) => {
        const guardado = await cache.match(navegacao ? INICIO : pedido, {
          ignoreSearch: true,
        });
        if (guardado) return guardado;
        try {
          const resposta = await fetch(pedido);
          if (resposta.ok) {
            // Falta de espaço para cache não impede a resposta online.
            try {
              await cache.put(pedido, resposta.clone());
            } catch (erro) {
              /* cache indisponível */
            }
          }
          return resposta;
        } catch (erro) {
          return (navegacao && (await cache.match(INICIO))) || Response.error();
        }
      })
      .catch(() => fetch(pedido)),
  );
});
