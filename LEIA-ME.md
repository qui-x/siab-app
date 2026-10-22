# SIAB – empacotamento (.exe portátil + .apk)

1. Coloque TODOS os arquivos do site (index.html, assets/, js, css...) dentro da pasta `www/`.
   (Se o site estiver no seu repositório qui-x/acidobase, copie o conteúdo dele para `www/`.)
2. Coloque um `icon.png` (256x256 ou maior) na raiz.
3. Suba esta pasta para um repositório no GitHub e abra a aba Actions > "Build EXE e APK" > Run workflow.
4. Baixe os artefatos: SIAB-portatil.exe e app-debug.apk.

Local (Windows): `npm install && npm run build:exe`  → dist/SIAB-portatil.exe
Local (com Android SDK + JDK 17): `npm install && npx cap add android && npm run build:apk`
Teste rápido: `npm install && npm start`
