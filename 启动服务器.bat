@echo off
chcp 65001 >nul
echo ========================================
echo 班级宠物园 - 本地服务器
echo ========================================
echo.
echo 正在启动服务器，请稍候...
echo.
cd /d "%~dp0"
npm run preview -- --host 0.0.0.0 --port 4173
pause
