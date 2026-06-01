@echo off
chcp 65001 > nul
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║       Menú Saludable — Subir a Hostinger         ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Este script va a:
echo  1. Conectar tu cuenta de GitHub
echo  2. Crear el repositorio automaticamente
echo  3. Subir el codigo
echo  4. Darte instrucciones para Hostinger
echo.
pause

set GH=C:\Users\aleja\AppData\Local\Temp\gh_cli\bin\gh.exe
set REPO_NAME=menu-saludable-familiar
set PROJECT_DIR=C:\Users\aleja\Downloads\Menu_Saludable

:: ── Paso 1: Login GitHub ─────────────────────────────────────
echo.
echo  [1/4] Conectando con GitHub...
echo  - Se abrira tu navegador
echo  - Inicia sesion en GitHub
echo  - Ingresa el codigo que aparece aqui
echo.
%GH% auth login --web --git-protocol https
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: No se pudo conectar con GitHub.
    echo  Asegurate de tener internet y vuelve a intentarlo.
    pause
    exit /b 1
)

:: ── Paso 2: Inicializar git si no existe ──────────────────────
cd /d "%PROJECT_DIR%"
if not exist ".git" (
    git init
    git branch -M main
)

:: ── Paso 3: Crear repositorio y subir ─────────────────────────
echo.
echo  [2/4] Creando repositorio en GitHub...
%GH% repo create %REPO_NAME% --public --source="%PROJECT_DIR%" --remote=origin --push
if %ERRORLEVEL% neq 0 (
    echo.
    echo  El repo puede ya existir. Haciendo push directo...
    git add -A
    git commit -m "update menu saludable app"
    git remote remove origin 2>nul
    for /f "tokens=*" %%u in ('%GH% api user --jq .login') do set GITHUB_USER=%%u
    git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
    git branch -M main
    git push -u origin main
)

:: ── Paso 4: Obtener URL ────────────────────────────────────────
echo.
echo  [3/4] Obteniendo URL del repositorio...
for /f "tokens=*" %%u in ('%GH% api user --jq .login') do set GITHUB_USER=%%u
set REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
echo  ✅ Codigo subido a: %REPO_URL%

:: ── Paso 5: Instrucciones Hostinger ───────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║              ULTIMO PASO — HOSTINGER                         ║
echo  ║              (igual que hiciste con ingles y libros)         ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ║  1. Abre: hpanel.hostinger.com                               ║
echo  ║  2. Clic en "Sitios web" - izquierda                         ║
echo  ║  3. Clic en "+ Añadir sitio web"                             ║
echo  ║  4. Selecciona "Node.js"                                     ║
echo  ║  5. Subdominio: "menu" (quedara menu.hannierco.com)          ║
echo  ║  6. En el panel del sitio → Git → conecta tu repo:           ║
echo  ║     %REPO_URL%
echo  ║  7. Rama: main                                               ║
echo  ║  8. Comando de inicio: node server.js                        ║
echo  ║  9. Espera 2 min → visita menu.hannierco.com                 ║
echo  ║                                                              ║
echo  ║  En el cel: abre menu.hannierco.com en Chrome                ║
echo  ║  → 3 puntos → "Agregar a pantalla de inicio" ✅              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  Abriendo Hostinger en tu navegador...
start "" "https://hpanel.hostinger.com/websites"
echo.
echo  Y abriendo tu repositorio de GitHub...
start "" "%REPO_URL%"
echo.
pause
