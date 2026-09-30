@echo off
color 0B
echo ===================================================
echo       VELKOMMEN TIL SINCITY AKTIE RADAR V2
echo ===================================================
echo.
echo Starter serveren...
start cmd /k "npm run dev"

echo Starter baggrunds-notifikationer (Ntfy Daemon)...
start cmd /k "npm run daemon"

echo.
echo Venter lidt for at sikre, at serveren er oppe...
timeout /t 3 /nobreak > nul

echo.
echo Aabner Sincity Radar i din standard browser...
start http://localhost:5173/

echo.
echo Alt koerer nu! Du kan lukke dette vindue (men lad de to sorte terminal-vinduer koere i baggrunden).
pause
