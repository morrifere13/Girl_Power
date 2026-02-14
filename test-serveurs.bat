@echo off
echo ============================================
echo   TEST DES SERVEURS - Girl Power
echo ============================================
echo.

echo [1/3] Verification des dossiers...
if exist backend\package.json (
    echo    Backend: OK
) else (
    echo    Backend: MANQUANT
)

if exist frontend\package.json (
    echo    Frontend: OK
) else (
    echo    Frontend: MANQUANT
)

echo.
echo [2/3] Test Backend (port 5000)...
curl -s http://localhost:5000/api/health 2>nul
if %errorlevel% equ 0 (
    echo    Backend: ACTIF
) else (
    echo    Backend: INACTIF ou NON LANCE
    echo.
    echo    SOLUTION: Lancez dans un terminal:
    echo    cd backend
    echo    npm start
)

echo.
echo [3/3] Test Frontend (port 3000)...
curl -s http://localhost:3000 2>nul
if %errorlevel% equ 0 (
    echo    Frontend: ACTIF
) else (
    echo    Frontend: INACTIF ou NON LANCE
    echo.
    echo    SOLUTION: Lancez dans un terminal:
    echo    cd frontend
    echo    npm run dev
)

echo.
echo ============================================
echo   INSTRUCTIONS:
echo ============================================
echo.
echo Si Backend INACTIF:
echo   Terminal 1: cd backend ^&^& npm start
echo.
echo Si Frontend INACTIF:
echo   Terminal 2: cd frontend ^&^& npm run dev
echo.
echo Puis ouvrez: http://localhost:3000
echo.
pause
