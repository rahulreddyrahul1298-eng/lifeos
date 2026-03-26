@echo off
echo ====================================
echo    LifeOS - Setup Script
echo ====================================
echo.

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Generating Prisma client...
call npx prisma generate

echo.
echo [3/3] Creating database...
call npx prisma db push

echo.
echo ====================================
echo    Setup complete!
echo    Run: npm run dev
echo    Open: http://localhost:3000
echo ====================================
pause
