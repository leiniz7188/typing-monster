@echo off
chcp 65001 >nul
rem ============================================================
rem  typing-monster - start local server and open browser
rem  Close this black window = stop the server (progress is saved).
rem ============================================================
cd /d "%~dp0"
start "" http://127.0.0.1:8321
echo Starting typing-monster... browser will open shortly.
echo Close this window to stop the server.
echo.
python -m http.server 8321 --bind 127.0.0.1
if errorlevel 1 (
  py -3 -m http.server 8321 --bind 127.0.0.1
)
pause
