package io.github.quix.siab;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintDocumentAdapter;
import android.print.PrintJob;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Abre a tela de impressão do Android (imprimir ou "Salvar como PDF") para a página atual. */
@CapacitorPlugin(name = "SIABPrint")
public class PrintPlugin extends Plugin {

    @PluginMethod
    public void print(final PluginCall call) {
        final String titulo = call.getString("title", "SIAB");
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adaptador = webView.createPrintDocumentAdapter(titulo);
                final PrintJob job = pm.print(titulo, adaptador, null);
                final Handler handler = new Handler(Looper.getMainLooper());
                // Resolve quando o trabalho termina, é cancelado ou falha.
                handler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        if (job.isCompleted() || job.isCancelled() || job.isFailed()) {
                            call.resolve();
                        } else {
                            handler.postDelayed(this, 500);
                        }
                    }
                }, 500);
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            }
        });
    }
}
