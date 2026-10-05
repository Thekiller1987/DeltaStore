@echo off
title DELTASTORE - LANZADOR MAESTRO
color 0A
echo ========================================================
echo   INICIANDO FLOTA COMPLETA DELTASTORE (WEB + CRM)
echo ========================================================
start "DeltaStore Web (3005)" "C:\Users\waska\Desktop\DeltaStore\INICIAR_DELTASTORE_WEB.bat"
timeout /t 2 /nobreak >nul
start "DeltaStore CRM (3006)" "C:\Users\waska\Desktop\DeltaStore\INICIAR_DELTASTORE_CRM.bat"
echo ========================================================
echo   AMBOS SERVICIOS HAN SIDO LANZADOS EXITOSAMENTE:
echo   - Tienda Web: http://localhost:3005
echo   - CRM Ventas: http://localhost:3006
echo ========================================================
pause
