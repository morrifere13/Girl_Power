@echo off
echo ============================================
echo   Girl Power - Installation Automatique
echo ============================================
echo.

echo [1/3] Installation des dependances du backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation backend echouee
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Installation des dependances du frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation frontend echouee
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Verification de la configuration...
if not exist backend\.env (
    echo ATTENTION: Le fichier .env n'existe pas dans backend/
    echo Assurez-vous de le configurer avant de lancer l'application.
)

echo.
echo ============================================
echo   Installation terminee avec succes!
echo ============================================
echo.
echo Prochaines etapes:
echo 1. Configurez MySQL et importez backend/database.sql
echo 2. Editez backend/.env avec vos parametres MySQL
echo 3. Lancez start.bat pour demarrer l'application
echo.
pause
