@echo off
echo ============================================
echo   Girl Power - Demarrage de l'application
echo ============================================
echo.
echo Demarrage du backend (port 5000)...
echo Demarrage du frontend (port 3000)...
echo.
echo Attendez que les deux serveurs soient demarres.
echo L'application sera accessible sur: http://localhost:3000
echo.
echo Pour arreter l'application, fermez cette fenetre ou appuyez sur Ctrl+C
echo.
echo ============================================
echo.

start "Girl Power Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul
start "Girl Power Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Les serveurs sont en cours de demarrage...
echo Ouvrez http://localhost:3000 dans votre navigateur
echo.
pause
