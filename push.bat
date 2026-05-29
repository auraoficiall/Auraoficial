@echo off
git add -A
git commit --allow-empty -m "update"
git push origin main
echo Listo! Vercel actualiza en 1 minuto.
timeout /t 3
