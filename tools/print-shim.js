/* Android (Capacitor): o WebView ignora window.print(). Este arquivo liga o window.print()
   ao plugin nativo SIABPrint e mantém os eventos beforeprint/afterprint que o SIAB usa. */
(function () {
  var cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  var nativo = cap.registerPlugin('SIABPrint');
  var ocupado = false;
  window.print = function () {
    if (ocupado) return;
    ocupado = true;
    window.dispatchEvent(new Event('beforeprint'));
    setTimeout(function () {
      nativo.print({ title: document.title || 'SIAB' })
        .catch(function () {})
        .then(function () {
          ocupado = false;
          window.dispatchEvent(new Event('afterprint'));
        });
    }, 200);
  };
})();
