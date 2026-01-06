@echo off
echo 🔧 Corrigindo erro do Rollup no Windows...
echo.

echo 📁 Removendo node_modules...
rmdir /s /q node_modules 2>nul

echo 📄 Removendo package-lock.json...
del package-lock.json 2>nul

echo 🧹 Limpando cache do npm...
npm cache clean --force

echo 📦 Reinstalando dependências...
npm install

echo.
echo ✅ Correção concluída! Tente executar 'npm run dev' novamente.
echo.
pause