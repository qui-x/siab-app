const { app, BaseWindow, WebContentsView, protocol, net, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const BAR_H = 32;

// Esquema próprio: faz caminhos como "/assets/..." e localStorage funcionarem offline.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, allowServiceWorkers: true } }
]);

let win, bar, content;

// Links siab://atividade/<código>: chegam por argumento de linha de comando (Windows/Linux)
// ou pelo evento open-url (macOS). Só esse esquema é aceito; quem valida o conteúdo é o SIAB.
const PROTOCOLO = 'siab';
let linkPendente = null;
const linkDe = (argv) =>
  (argv || []).find((a) => typeof a === 'string' && a.toLowerCase().startsWith(PROTOCOLO + '://')) || null;
function entregarLink(url) {
  if (!url) return;
  linkPendente = url;
  if (!content || content.webContents.isLoading()) return; // entrega ao terminar de carregar
  content.webContents
    .executeJavaScript('window.SIABAbrirLink && window.SIABAbrirLink(' + JSON.stringify(url) + ')')
    .then(() => { linkPendente = null; })
    .catch(() => {});
}
app.on('open-url', (e, url) => { e.preventDefault(); entregarLink(url); });

function layout() {
  if (!win) return;
  const { width, height } = win.getContentBounds();
  const full = win.isFullScreen();
  const h = full ? 0 : BAR_H;
  bar.setVisible(!full);
  bar.setBounds({ x: 0, y: 0, width, height: h });
  content.setBounds({ x: 0, y: h, width, height: Math.max(0, height - h) });
}

function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BaseWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 480,
    frame: false, backgroundColor: '#0c1520', title: 'SIAB'
  });

  bar = new WebContentsView({
    webPreferences: { preload: path.join(__dirname, 'preload-titlebar.js'), contextIsolation: true, sandbox: true }
  });
  content = new WebContentsView({ webPreferences: { contextIsolation: true, sandbox: true } });
  win.contentView.addChildView(content);
  win.contentView.addChildView(bar);

  bar.webContents.loadFile(path.join(__dirname, 'shell', 'titlebar.html'));
  content.webContents.loadURL('app://siab/index.html');
  content.webContents.on('did-finish-load', () => setTimeout(() => entregarLink(linkPendente), 500));

  // Links externos (http/https) abrem no navegador do sistema; o app nunca sai de si.
  const abrirFora = (url) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); };
  content.webContents.setWindowOpenHandler(({ url }) => { abrirFora(url); return { action: 'deny' }; });
  content.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://siab')) { e.preventDefault(); abrirFora(url); }
  });

  // F11 alterna tela cheia; Ctrl+Q sai.
  content.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.control && input.key.toLowerCase() === 'q') app.quit();
  });

  for (const ev of ['resize', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(ev, layout);
  layout();
  content.webContents.focus();
}

ipcMain.on('janela', (_e, acao) => {
  if (!win) return;
  if (acao === 'min') win.minimize();
  else if (acao === 'max') win.isMaximized() ? win.unmaximize() : win.maximize();
  else if (acao === 'close') app.quit();
});

// Uma única janela: abrir o programa de novo apenas traz a janela existente para a frente.
const unicaInstancia = app.requestSingleInstanceLock();
if (!unicaInstancia) app.quit();
else app.on('second-instance', (_e, argv) => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
  entregarLink(linkDe(argv));
});

linkPendente = linkDe(process.argv);

if (unicaInstancia) app.whenReady().then(() => {
  // Versão instalada (não portátil, não AppImage): o Windows passa a abrir siab:// neste programa.
  if (app.isPackaged && !process.env.PORTABLE_EXECUTABLE_FILE && !process.env.APPIMAGE) {
    try { app.setAsDefaultProtocolClient(PROTOCOLO); } catch (_) { /* opcional */ }
  }
  const root = path.join(__dirname, 'www');
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const file = path.normalize(path.join(root, p));
    if (!file.startsWith(root)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
