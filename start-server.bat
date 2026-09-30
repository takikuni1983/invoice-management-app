@echo off
chcp 65001 >nul
rem 本番モードで起動（スマホ・外出先から使うとき用。dev より表示が速い）
cd /d "%~dp0"
call npx prisma migrate deploy
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error
start http://localhost:4000
npm run start
goto :eof
:error
echo 起動に失敗しました。上のメッセージを確認してください。
pause
