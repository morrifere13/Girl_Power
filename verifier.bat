@echo off
title Verification Girl Power
color 0A

echo ============================================
echo   VERIFICATION COMPLETE - Girl Power
echo ============================================
echo.

:MENU
echo Que voulez-vous faire?
echo.
echo 1. Verifier si les serveurs tournent
echo 2. Lancer le Backend
echo 3. Lancer le Frontend
echo 4. Lancer les DEUX (Backend + Frontend)
echo 5. Reinstaller les dependances
echo 6. Quitter
echo.
set /p choix="Votre choix (1-6): "

if "%choix%"=="1" goto VERIF
if "%choix%"=="2" goto BACKEND
if "%choix%"=="3" goto FRONTEND
if "%choix%"=="4" goto BOTH
if "%choix%"=="5" goto INSTALL
if "%choix%"=="6" goto END
goto MENU

:VERIF
cls
echo ============================================
echo   VERIFICATION DES SERVEURS
echo ============================================
echo.
echo Test Backend (port 5000)...
curl -s http://localhost:5000/api/health 2>nul
if %errorlevel% equ 0 (
    echo [OK] Backend est ACTIF
) else (
    echo [X] Backend est INACTIF
)
echo.
echo Test Frontend (port 3000)...
curl -s http://localhost:3000 2>nul
if %errorlevel% equ 0 (
    echo [OK] Frontend est ACTIF
) else (
    echo [X] Frontend est INACTIF
)
echo.
pause
goto MENU

:BACKEND
cls
echo ============================================
echo   LANCEMENT DU BACKEND
echo ============================================
echo.
cd backend
echo Demarrage du serveur backend...
echo.
npm start
pause
goto END

:FRONTEND
cls
echo ============================================
echo   LANCEMENT DU FRONTEND
echo ============================================
echo.
cd frontend
echo Demarrage du serveur frontend...
echo.
npm run dev
pause
goto END

:BOTH
cls
echo ============================================
echo   LANCEMENT DES DEUX SERVEURS
echo ============================================
echo.
echo Demarrage du Backend...
start "Girl Power Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul
echo.
echo Demarrage du Frontend...
start "Girl Power Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Les deux serveurs sont en cours de demarrage!
echo Ouvrez http://localhost:3000 dans votre navigateur
echo.
pause
goto END

:INSTALL
cls
echo ============================================
echo   REINSTALLATION DES DEPENDANCES
echo ============================================
echo.
echo Installation Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR lors de l'installation backend!
    pause
    goto MENU
)
cd ..
echo.
echo Installation Frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR lors de l'installation frontend!
    pause
    goto MENU
)
cd ..
echo.
echo Installation terminee avec succes!
echo.
pause
goto MENU

:END
echo.
echo Au revoir!
exit
