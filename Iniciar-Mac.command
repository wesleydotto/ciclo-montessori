#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "O Node.js não está instalado neste computador."
  echo "Baixe e instale em https://nodejs.org/ e depois rode este arquivo de novo."
  read -p "Pressione Enter para fechar..." _
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Instalando o que falta (só na primeira vez, pode demorar alguns minutos)..."
  npm install
  if [ $? -ne 0 ]; then
    echo "Ocorreu um erro ao instalar. Confira a mensagem acima."
    read -p "Pressione Enter para fechar..." _
    exit 1
  fi
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -f dev.db ]; then
  echo "Preparando o banco de dados local (só na primeira vez)..."
  npx prisma migrate deploy
fi

echo ""
echo "Abrindo o Ciclo Montessori em http://localhost:3000"
echo "NÃO FECHE esta janela enquanto estiver usando o app."
echo "Para encerrar, feche esta janela ou aperte Ctrl+C."
echo ""

(sleep 3 && open http://localhost:3000) &
npm run dev
