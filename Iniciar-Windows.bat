@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo O Node.js nao esta instalado neste computador.
  echo Baixe e instale em https://nodejs.org/ e depois rode este arquivo de novo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando o que falta ^(so na primeira vez, pode demorar alguns minutos^)...
  call npm install
  if errorlevel 1 (
    echo Ocorreu um erro ao instalar. Confira a mensagem acima.
    pause
    exit /b 1
  )
)

if not exist .env (
  copy .env.example .env >nul
)

if not exist dev.db (
  echo Preparando o banco de dados local ^(so na primeira vez^)...
  call npx prisma migrate deploy
)

start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

echo.
echo Abrindo o Ciclo Montessori em http://localhost:3000
echo NAO FECHE esta janela enquanto estiver usando o app.
echo Para encerrar, feche esta janela ou aperte Ctrl+C.
echo.
call npm run dev
pause
