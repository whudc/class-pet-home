@echo off
chcp 65001 >nul
echo ========================================
echo 班级宠物园 - 开发服务器
echo ========================================
echo.
echo 正在启动开发服务器，请稍候...
echo.
echo 服务器启动后，请在浏览器访问：http://localhost:5173
echo.
cd /d "%~dp0"
npm run dev
pause
