@echo off
chcp 65001 >nul
rem ============================================================
rem  打字小怪兽 - 一键启动
rem  双击本文件：起本地服务 + 自动打开浏览器
rem  关闭黑色窗口 = 停止服务（存档不受影响）
rem ============================================================
cd /d D:\claude-code\my-claude-project\typing-monster
start "" http://127.0.0.1:8321
echo 打字小怪兽启动中... 浏览器即将打开
echo 关闭本窗口即可停止服务
echo.
"C:\Users\chenm\.workbuddy\binaries\python\versions\3.13.12\python.exe" -m http.server 8321 --bind 127.0.0.1
pause
