@echo off
chcp 65001 >nul
rem ============================================================
rem  打字小怪兽 - iPad / 平板启动（同一 WiFi 内可访问）
rem  双击本文件：起服务并打印 iPad 能打开的地址
rem  关闭黑色窗口 = 停止服务（存档不受影响）
rem ============================================================
cd /d D:\claude-code\my-claude-project\typing-monster
"C:\Users\chenm\.workbuddy\binaries\python\versions\3.13.12\python.exe" serve.py
pause
