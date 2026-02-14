@echo off
title Girl Power - Lancement Complet
color 0A

echo ========================================
echo   GIRL POWER - Lancement des Serveurs
echo ========================================
echo.
echo Demarrage du Backend et Frontend...
echo.

REM Lancer le backend dans une nouvelle fenêtre
start "Girl Power - Backend (Port 5000)" cmd /k "cd backend && npm start"

REM Attendre 3 secondes
timeout /t 3 /nobreak > nul

REM Lancer le frontend dans une nouvelle fenêtre
start "Girl Power - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Les serveurs sont en cours de lancement!
echo ========================================
echo.
echo Deux fenetres vont s'ouvrir:
echo   1. Backend  - Port 5000
echo   2. Frontend - Port 3000
echo.
echo Attendez quelques secondes puis ouvrez:
echo   http://localhost:3000
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause > nul

REM Ouvrir le navigateur
start http://localhost:3000

echo.
echo Application lancee!
echo.
