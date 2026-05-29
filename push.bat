@echo off
git add -A
git commit --allow-empty -m "update %date% %time%"
git push https://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@github.com/auraoficiall/Auraoficial.git main
echo.
echo Listo! Vercel actualiza en 1 minuto.
timeout /t 3
