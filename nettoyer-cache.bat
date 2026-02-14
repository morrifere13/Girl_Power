@echo off
echo ========================================
echo   Nettoyage du cache et relancement
echo ========================================
echo.

cd /d "%~dp0girl-power-app\frontend"

echo Arret du serveur frontend...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul

echo.
echo Suppression du cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache Vite supprime
) else (
    echo Pas de cache a supprimer
)

echo.
echo Relancement du serveur frontend...
start "Frontend Vite" cmd /k "npm run dev"

echo.
echo ========================================
echo   Cache nettoye et serveur relance
echo ========================================
echo.
echo Ouvrez votre navigateur et faites:
echo   - Windows: Ctrl + Shift + R
echo   - Mac: Cmd + Shift + R
echo.
pause
