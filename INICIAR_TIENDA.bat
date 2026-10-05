@echo off
title DeltaStore Tienda Web (Puerto 3000) - Juigalpa
color 0A
echo ====================================================
echo  INICIANDO DELTASTORE (TIENDA WEB E-COMMERCE)
echo  Estilo Amazon con Asistente IA Local (Ollama)
echo  Puerto: 3000
echo ====================================================
cd /d "%~dp0"
node server.js
pause
