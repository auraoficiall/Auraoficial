@echo off
echo Subiendo cambios a GitHub...
git add .
git commit -m "update"
git push https://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@github.com/auraoficiall/Auraoficial.git main
echo.
echo Listo! Netlify se actualiza en 1 minuto.
pause
