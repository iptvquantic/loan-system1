#!/bin/bash
echo "🚀 Iniciando LoanSystem..."
sudo service postgresql start
cd "/mnt/c/Users/Guilherme/Desktop/APP AGIOTA/backend"
nohup npm run dev > /tmp/backend.log 2>&1 &
echo "✅ Backend iniciado"
sleep 2
cd "/mnt/c/Users/Guilherme/Desktop/APP AGIOTA/frontend"
npm run dev
