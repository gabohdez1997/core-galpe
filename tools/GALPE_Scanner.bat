@echo off
TITLE GALPE PC Scanner
SET SCRIPT_PATH=%~dp0get_pc_info.vbs

echo ============================================================
echo  GALPE - ESCANER DE SISTEMA (MODO COMPATIBILIDAD)
echo ============================================================
echo.
echo Obteniendo datos... esto puede tardar unos segundos.
echo.

cscript.exe //nologo "%SCRIPT_PATH%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Hubo un error al ejecutar el escaner.
    echo Intenta ejecutar este archivo .BAT como Administrador.
    pause
)
pause
