@echo off
title DELTASTORE - Repuestos de Moto Juigalpa
color 0C
echo ==========================================================
echo       MOTO REPUESTOS DELTASTORE - JUIGALPA, NICARAGUA
echo ==========================================================
echo [*] Conectando con MySQL deltastore_db...
echo [*] Abriendo Tienda Online y Panel CRM...
timeout /t 2 >nul
start http://localhost:3005
start http://localhost:3005/crm
cd /d "C:\Users\waska\Desktop\DeltaStore"
node server.js
pause
