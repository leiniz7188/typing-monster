@echo off
chcp 65001 >nul
rem ============================================================
rem  typing-monster - LAN start (for iPad / tablet on same WiFi)
rem  Prints the URL to open on your tablet.
rem ============================================================
cd /d "%~dp0"
python serve.py
if errorlevel 1 (
  py -3 serve.py
)
pause
