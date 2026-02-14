@echo off
REM Script ultra-simple pour lancer l'application

echo [33m========================================[0m
echo [32m   Girl Power 2026 - Demarrage[0m
echo [33m========================================[0m
echo.

cd backend
start "Backend Girl Power" cmd /k npm start

cd ..\frontend
start "Frontend Girl Power" cmd /k npm run dev

echo [36mServeurs en cours de demarrage...[0m
echo [36mBackend: http://localhost:5000[0m
echo [36mFrontend: http://localhost:3000 ou 3001[0m
echo.
timeout /t 8 /nobreak > nul
start http://localhost:3001
